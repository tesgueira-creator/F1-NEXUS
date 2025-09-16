"""ETL pipeline for transforming Formula 1 datasets into the app schema.

This module exposes a command line interface as well as several helper
functions that can be imported by other scripts or notebooks.  The pipeline
loads raw data from the open ``formula1-datasets`` repository (or any dataset
with the same schema), optionally enriches the information with scraper output
containing weekend specific metrics, computes the features required by the
application and saves the final CSV file following the layout described in
``public/templates/new_schema_blank.csv``.

Example
-------
>>> python etl.py \
...     --datasets ./formula1-datasets-master \
...     --scraper-output ./scraper_output \
...     --out ./build
"""
from __future__ import annotations

import argparse
import logging
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Mapping, Optional

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------
LOGGER = logging.getLogger("f1_etl")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
OUTPUT_COLUMNS: list[str] = [
    "driver_name",
    "team_name",
    "grid_position",
    "qualy_gap_ms",
    "fp_longrun_pace_s",
    "straightline_index",
    "cornering_index",
    "pit_crew_mean_s",
    "dnf_rate",
    "sc_prob",
    "rain_prob",
    "speed_trap_kph",
]

CORE_TABLES: Mapping[str, str] = {
    "drivers": "drivers.csv",
    "constructors": "constructors.csv",
    "races": "races.csv",
    "results": "results.csv",
    "qualifying": "qualifying.csv",
    "lap_times": "lap_times.csv",
    "pit_stops": "pit_stops.csv",
    "status": "status.csv",
}

SCRAPER_FILES: Mapping[str, Iterable[str]] = {
    "longrun": (
        "fp_longrun.csv",
        "free_practice_longrun.csv",
        "fp_longrun_pace.csv",
        "long_run_pace.csv",
    ),
    "weather": (
        "weather.csv",
        "weather_forecast.csv",
        "rain_forecast.csv",
        "rain_probability.csv",
    ),
    "safety_car": (
        "safety_car.csv",
        "safety_car_probabilities.csv",
        "sc_probability.csv",
    ),
    "speed_trap": (
        "speed_trap.csv",
        "speed_trap_top_speeds.csv",
    ),
}


@dataclass
class ETLConfig:
    """Configuration parameters for the ETL pipeline."""

    datasets_dir: Path
    scraper_output_dir: Optional[Path]
    output_dir: Path
    output_filename: Optional[str]
    race_year: Optional[int]
    race_round: Optional[int]
    race_name: Optional[str]
    history_window: int = 5


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------
def _read_csv_if_exists(path: Path) -> Optional[pd.DataFrame]:
    """Read a CSV file returning ``None`` when the path does not exist."""

    if not path.exists():
        LOGGER.warning("CSV file not found: %s", path)
        return None

    LOGGER.info("Loading %s", path)
    return pd.read_csv(path)


def load_core_tables(datasets_dir: Path) -> Dict[str, pd.DataFrame]:
    """Load the core Formula 1 tables required for the transformation."""

    tables: Dict[str, pd.DataFrame] = {}
    for name, filename in CORE_TABLES.items():
        table = _read_csv_if_exists(datasets_dir / filename)
        if table is not None:
            tables[name] = table
        else:
            LOGGER.warning("Skipping table '%s' because %s is missing", name, filename)

    mandatory = {"races", "results", "drivers", "constructors"}
    missing = mandatory.difference(tables)
    if missing:
        raise FileNotFoundError(
            "Missing required dataset files: " + ", ".join(sorted(missing))
        )

    return tables


def load_scraper_tables(scraper_dir: Optional[Path]) -> Dict[str, pd.DataFrame]:
    """Load optional scraper output tables if they exist."""

    tables: Dict[str, pd.DataFrame] = {}
    if scraper_dir is None:
        LOGGER.info("Scraper output directory not provided - continuing without enrichments")
        return tables

    for name, candidates in SCRAPER_FILES.items():
        for candidate in candidates:
            path = scraper_dir / candidate
            if path.exists():
                LOGGER.info("Loading scraper table %s from %s", name, path)
                tables[name] = pd.read_csv(path)
                break
        else:
            LOGGER.info("No scraper table found for '%s' (checked %s)", name, ", ".join(candidates))

    return tables


def _to_datetime(series: pd.Series) -> pd.Series:
    """Safely parse a series containing ISO like dates or date-times."""

    cleaned = series.replace({"\\N": None, "": None})
    return pd.to_datetime(cleaned, errors="coerce", utc=True)


def select_target_race(
    races: pd.DataFrame,
    *,
    year: Optional[int] = None,
    round_number: Optional[int] = None,
    name: Optional[str] = None,
) -> pd.Series:
    """Return the race record that should be used for the feature set."""

    race_table = races.copy()
    race_table["date"] = _to_datetime(race_table["date"])
    if "time" in race_table.columns:
        time_component = race_table["time"].replace({"\\N": None, "": None})
        race_table["event_dt"] = pd.to_datetime(
            race_table["date"].dt.strftime("%Y-%m-%d") + " " + time_component.fillna("00:00:00"),
            errors="coerce",
            utc=True,
        )
    else:
        race_table["event_dt"] = race_table["date"]

    filters = []
    if year is not None:
        filters.append(race_table["year"] == year)
    if round_number is not None:
        filters.append(race_table["round"] == round_number)
    if name is not None:
        pattern = re.escape(name.strip())
        filters.append(race_table["name"].str.contains(pattern, case=False, na=False))

    if filters:
        mask = np.logical_and.reduce(filters)
        filtered = race_table.loc[mask]
        if filtered.empty:
            raise ValueError("No race matched the provided filters")
    else:
        filtered = race_table

    filtered = filtered.sort_values("event_dt")
    if filtered.empty:
        raise ValueError("No races available in the dataset")

    return filtered.iloc[-1]


def _normalise_name(value: str) -> str:
    """Create a canonical representation of a driver name for comparisons."""

    return re.sub(r"[^a-z]", "", str(value).lower())


def _parse_time_to_ms(value: object) -> float:
    """Convert lap/qualifying times to milliseconds."""

    if value is None or (isinstance(value, float) and math.isnan(value)):
        return math.nan

    text = str(value).strip()
    if not text or text == "\\N":
        return math.nan

    try:
        # Support formats like M:SS.mmm or SS.mmm
        parts = text.split(":")
        seconds = 0.0
        for part in parts:
            seconds = seconds * 60 + float(part)
        return seconds * 1000.0
    except ValueError:
        LOGGER.debug("Could not parse time value '%s'", text)
        return math.nan


def build_driver_base(
    tables: Mapping[str, pd.DataFrame],
    race_id: int,
) -> pd.DataFrame:
    """Return the driver level dataframe for the chosen race.

    The ``tables`` mapping must contain the ``"results"``, ``"drivers"`` and
    ``"constructors"`` tables.
    """

    results = tables.get("results")
    if results is None:
        raise ValueError("Required table 'results' is missing when building driver base")

    drivers = tables.get("drivers")
    if drivers is None:
        raise ValueError("Required table 'drivers' is missing when building driver base")

    constructors = tables.get("constructors")
    if constructors is None:
        raise ValueError(
            "Required table 'constructors' is missing when building driver base"
        )

    race_results = results.loc[results["raceId"] == race_id].copy()
    if race_results.empty:
        raise ValueError(f"No race results available for raceId={race_id}")

    driver_names = drivers.assign(
        driver_name=(drivers["forename"].str.strip() + " " + drivers["surname"].str.strip()).str.strip()
    )[["driverId", "driver_name"]]
    constructor_names = constructors.rename(columns={"name": "team_name"})[
        ["constructorId", "team_name"]
    ]

    base = race_results.merge(driver_names, on="driverId", how="left").merge(
        constructor_names, on="constructorId", how="left"
    )

    base["grid_position"] = pd.to_numeric(base["grid"], errors="coerce")
    base.loc[base["grid_position"] <= 0, "grid_position"] = math.nan

    base = base[["driverId", "constructorId", "driver_name", "team_name", "grid_position"]].copy()
    return base


def compute_qualifying_gap(
    base: pd.DataFrame,
    tables: Mapping[str, pd.DataFrame],
    race_id: int,
) -> pd.DataFrame:
    """Compute qualifying gaps relative to pole for drivers in ``base``.

    The ``tables`` mapping may provide the optional ``"qualifying"`` table.
    When it is missing or lacks data for the selected race, the
    ``qualy_gap_ms`` column is filled with ``NaN``.
    """

    qualifying = tables.get("qualifying")
    if qualifying is None:
        base["qualy_gap_ms"] = math.nan
        return base

    race_qualy = qualifying.loc[qualifying["raceId"] == race_id].copy()
    if race_qualy.empty:
        base["qualy_gap_ms"] = math.nan
        return base

    for session in ["q1", "q2", "q3"]:
        if session in race_qualy:
            race_qualy[session] = race_qualy[session].apply(_parse_time_to_ms)
    session_cols = [c for c in ["q1", "q2", "q3"] if c in race_qualy]

    if not session_cols:
        base["qualy_gap_ms"] = math.nan
        return base

    race_qualy["best_ms"] = race_qualy[session_cols].min(axis=1, skipna=True)
    pole_time = race_qualy["best_ms"].min(skipna=True)

    if math.isnan(pole_time):
        base["qualy_gap_ms"] = math.nan
        return base

    race_qualy["qualy_gap_ms"] = race_qualy["best_ms"] - pole_time

    base = base.merge(
        race_qualy[["driverId", "qualy_gap_ms"]],
        on="driverId",
        how="left",
    )
    return base


def compute_fp_longrun_pace(
    base: pd.DataFrame,
    tables: Mapping[str, pd.DataFrame],
    scraper_tables: Mapping[str, pd.DataFrame],
    race_id: int,
) -> pd.DataFrame:
    """Compute FP long-run pace combining telemetry and scraper sources.

    The ``tables`` mapping may include the optional ``"lap_times"`` table. The
    ``scraper_tables`` mapping may also provide a ``"longrun"`` table whose
    contents override the computed pace when matching driver names are found.
    """

    lap_times = tables.get("lap_times")
    fp_metric = pd.Series(dtype=float)

    if lap_times is not None and "milliseconds" in lap_times:
        race_laps = lap_times.loc[lap_times["raceId"] == race_id]
        if not race_laps.empty:
            fp_metric = race_laps.groupby("driverId")["milliseconds"].mean() / 1000.0

    if "longrun" in scraper_tables:
        longrun_df = scraper_tables["longrun"].copy()
        candidate_driver_cols = [
            c
            for c in longrun_df.columns
            if any(keyword in c.lower() for keyword in ("driver", "name", "pilot"))
        ]
        pace_col = None
        for column in longrun_df.columns:
            lowered = column.lower()
            if any(keyword in lowered for keyword in ("pace", "average", "long")):
                pace_col = column
                break
        if pace_col is None:
            numeric_cols = [
                c for c in longrun_df.columns if pd.api.types.is_numeric_dtype(longrun_df[c])
            ]
            if numeric_cols:
                pace_col = numeric_cols[0]

        if candidate_driver_cols and pace_col:
            name_col = candidate_driver_cols[0]
            longrun_df = longrun_df[[name_col, pace_col]].copy()
            longrun_df.columns = ["driver_label", "pace"]
            longrun_df["driver_label"] = longrun_df["driver_label"].astype(str)
            longrun_df["pace"] = pd.to_numeric(longrun_df["pace"], errors="coerce")
            longrun_df = longrun_df.dropna(subset=["pace"])

            lookup = {
                _normalise_name(name): pace for name, pace in longrun_df.to_numpy()
            }
            overrides = []
            for driver_id, driver_name in base[["driverId", "driver_name"]].to_numpy():
                key = _normalise_name(driver_name)
                if key in lookup:
                    overrides.append((driver_id, lookup[key]))
            if overrides:
                override_series = pd.Series({driver_id: pace for driver_id, pace in overrides})
                fp_metric = fp_metric.combine_first(override_series)

    base = base.merge(
        fp_metric.rename("fp_longrun_pace_s"),
        how="left",
        left_on="driverId",
        right_index=True,
    )
    return base


def compute_speed_metrics(
    base: pd.DataFrame,
    tables: Mapping[str, pd.DataFrame],
    race_id: int,
) -> pd.DataFrame:
    """Compute speed trap and cornering indices for each driver.

    The ``tables`` mapping must contain the ``"results"`` table and may include
    the optional ``"lap_times"`` table.
    """

    results = tables.get("results")
    if results is None:
        raise ValueError("Required table 'results' is missing when computing speed metrics")

    race_results = results.loc[results["raceId"] == race_id].copy()

    if "fastestLapSpeed" in race_results:
        race_results["fastestLapSpeed"] = pd.to_numeric(
            race_results["fastestLapSpeed"], errors="coerce"
        )
        speed_series = race_results.set_index("driverId")["fastestLapSpeed"]
    else:
        speed_series = pd.Series(dtype=float)

    base = base.merge(
        speed_series.rename("speed_trap_kph"),
        on="driverId",
        how="left",
    )

    if "speed_trap_kph" in base:
        speeds = base["speed_trap_kph"].copy()
        if speeds.notna().any():
            min_speed = speeds.min(skipna=True)
            max_speed = speeds.max(skipna=True)
            if math.isclose(min_speed, max_speed, rel_tol=1e-9) or max_speed == min_speed:
                base["straightline_index"] = 50.0
            else:
                base["straightline_index"] = (
                    (speeds - min_speed) / (max_speed - min_speed)
                ) * 100.0
        else:
            base["straightline_index"] = math.nan
    else:
        base["straightline_index"] = math.nan

    lap_times = tables.get("lap_times")
    if lap_times is not None and "milliseconds" in lap_times:
        race_laps = lap_times.loc[lap_times["raceId"] == race_id]
        if not race_laps.empty:
            avg_ms = race_laps.groupby("driverId")["milliseconds"].mean()
            avg_seconds = avg_ms / 1000.0
            min_avg = avg_seconds.min(skipna=True)
            max_avg = avg_seconds.max(skipna=True)
            if math.isclose(min_avg, max_avg, rel_tol=1e-9) or max_avg == min_avg:
                corner = pd.Series(50.0, index=avg_seconds.index)
            else:
                corner = (max_avg - avg_seconds) / (max_avg - min_avg) * 100.0
            base = base.merge(
                corner.rename("cornering_index"),
                on="driverId",
                how="left",
            )
        else:
            base["cornering_index"] = math.nan
    else:
        base["cornering_index"] = math.nan

    return base


def compute_pit_metrics(
    base: pd.DataFrame,
    tables: Mapping[str, pd.DataFrame],
    race_id: int,
) -> pd.DataFrame:
    """Compute pit stop statistics for each driver.

    The ``tables`` mapping may provide the optional ``"pit_stops"`` table.
    When it is unavailable the ``pit_crew_mean_s`` column is filled with
    ``NaN``.
    """

    pit_stops = tables.get("pit_stops")
    if pit_stops is None:
        base["pit_crew_mean_s"] = math.nan
        return base

    race_pits = pit_stops.loc[pit_stops["raceId"] == race_id].copy()
    if race_pits.empty:
        base["pit_crew_mean_s"] = math.nan
        return base

    if "milliseconds" in race_pits:
        race_pits["pit_seconds"] = pd.to_numeric(race_pits["milliseconds"], errors="coerce") / 1000.0
    elif "duration" in race_pits:
        race_pits["pit_seconds"] = race_pits["duration"].apply(_parse_time_to_ms) / 1000.0
    else:
        numeric_cols = [
            c for c in race_pits.columns if pd.api.types.is_numeric_dtype(race_pits[c])
        ]
        if numeric_cols:
            race_pits["pit_seconds"] = race_pits[numeric_cols[0]]
        else:
            base["pit_crew_mean_s"] = math.nan
            return base

    pit_means = race_pits.groupby("driverId")["pit_seconds"].mean()
    base = base.merge(
        pit_means.rename("pit_crew_mean_s"),
        on="driverId",
        how="left",
    )
    return base


def _flag_dnf(results: pd.DataFrame, tables: Mapping[str, pd.DataFrame]) -> pd.Series:
    """Return a boolean series indicating whether each result is a DNF.

    The ``tables`` mapping may provide the optional ``"status"`` table used to
    map ``statusId`` values. When it is missing, textual status fields in the
    ``results`` dataframe are inspected instead.
    """

    status_df = tables.get("status")
    if status_df is not None and "statusId" in results:
        safe_status = status_df["status"].astype(str)
        finished_mask = safe_status.str.contains("Finished", case=False) | safe_status.str.contains(
            "Lap", case=False
        )
        finished_ids = set(status_df.loc[finished_mask, "statusId"].tolist())
        dnf_flag = ~results["statusId"].isin(finished_ids)
    else:
        position_text = results.get("positionText", pd.Series([], dtype=str)).astype(str)
        dnf_flag = position_text.str.upper().isin({"R", "D", "E", "F", "W", "DNF"})
    return dnf_flag


def compute_dnf_and_sc_metrics(
    base: pd.DataFrame,
    tables: Mapping[str, pd.DataFrame],
    race_id: int,
    history_window: int,
) -> pd.DataFrame:
    """Compute DNF rates per driver and recent safety car probability.

    The ``tables`` mapping must include the ``"results"`` and ``"races"``
    tables required to calculate the historical metrics.
    """

    results = tables.get("results")
    if results is None:
        raise ValueError(
            "Required table 'results' is missing when computing DNF and safety car metrics"
        )
    results = results.copy()

    races = tables.get("races")
    if races is None:
        raise ValueError(
            "Required table 'races' is missing when computing DNF and safety car metrics"
        )
    races = races[["raceId", "year", "round"]].copy()

    results = results.merge(races, on="raceId", how="left")
    results["dnf_flag"] = _flag_dnf(results, tables)

    race_info = races.loc[races["raceId"] == race_id]
    if race_info.empty:
        base["dnf_rate"] = math.nan
        base["sc_prob"] = math.nan
        return base

    target_year = int(race_info.iloc[0]["year"])
    target_round = int(race_info.iloc[0]["round"])

    history = results.loc[(results["year"] == target_year) & (results["round"] <= target_round)].copy()
    history = history.sort_values(["driverId", "round"], ascending=[True, False])

    window = max(1, history_window)
    dnf_rates = {}
    for driver_id, group in history.groupby("driverId", sort=False):
        recent = group.head(window)
        if recent.empty:
            dnf_rates[driver_id] = math.nan
        else:
            dnf_rates[driver_id] = recent["dnf_flag"].mean()

    base = base.merge(
        pd.Series(dnf_rates, name="dnf_rate"),
        left_on="driverId",
        right_index=True,
        how="left",
    )

    race_history = (
        results.loc[results["year"] == target_year]
        .groupby(["raceId", "round"], as_index=False)["dnf_flag"]
        .any()
        .sort_values("round", ascending=False)
    )
    recent_races = race_history.head(window)
    if recent_races.empty:
        sc_prob = math.nan
    else:
        sc_prob = recent_races["dnf_flag"].mean()
    base["sc_prob"] = sc_prob

    return base


def compute_rain_probability(
    base: pd.DataFrame,
    scraper_tables: Mapping[str, pd.DataFrame],
    race_record: pd.Series,
) -> pd.DataFrame:
    """Estimate the probability of rain during the race weekend.

    The ``scraper_tables`` mapping may provide the optional ``"weather"``
    table, which is searched for columns describing rain probabilities.
    """

    weather_df = scraper_tables.get("weather")
    rain_probability: Optional[float] = None

    if weather_df is not None:
        weather_df = weather_df.copy()
        candidate_name_cols = [
            c
            for c in weather_df.columns
            if any(keyword in c.lower() for keyword in ("race", "grand", "event", "gp"))
        ]
        if candidate_name_cols:
            name_col = candidate_name_cols[0]
            weather_df[name_col] = weather_df[name_col].astype(str)
            race_name = str(race_record.get("name", "")).lower()
            if race_name:
                matches = weather_df[weather_df[name_col].str.lower().str.contains(race_name)]
            else:
                matches = weather_df
        else:
            matches = weather_df

        if not matches.empty:
            prob_col = None
            for column in matches.columns:
                lowered = column.lower()
                if any(keyword in lowered for keyword in ("rain", "precip", "prob")):
                    prob_col = column
                    break
            if prob_col is None:
                numeric_cols = [
                    c
                    for c in matches.columns
                    if pd.api.types.is_numeric_dtype(matches[c]) and c != name_col
                ]
                if numeric_cols:
                    prob_col = numeric_cols[0]

            if prob_col is not None:
                rain_probability = pd.to_numeric(matches.iloc[0][prob_col], errors="coerce")
                if pd.notna(rain_probability):
                    if rain_probability > 1:
                        rain_probability = rain_probability / 100.0
                    rain_probability = max(0.0, min(float(rain_probability), 1.0))

    base["rain_prob"] = rain_probability if rain_probability is not None else math.nan
    return base


def finalise_dataset(base: pd.DataFrame) -> pd.DataFrame:
    dataset = base.copy()
    dataset = dataset[[c for c in OUTPUT_COLUMNS if c in dataset.columns]]

    missing_cols = [c for c in OUTPUT_COLUMNS if c not in dataset.columns]
    for column in missing_cols:
        dataset[column] = math.nan

    dataset = dataset[OUTPUT_COLUMNS]
    return dataset


def save_dataset(dataset: pd.DataFrame, output_dir: Path, filename: Optional[str], race: pd.Series) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)

    if filename:
        output_path = output_dir / filename
    else:
        year = race.get("year", "unknown")
        name = str(race.get("name", "race")).lower().replace(" ", "-")
        output_path = output_dir / f"{year}_{name}.csv"

    dataset.to_csv(output_path, index=False)
    LOGGER.info("Saved dataset to %s", output_path)
    return output_path


def run_etl(config: ETLConfig) -> Path:
    tables = load_core_tables(config.datasets_dir)
    scraper_tables = load_scraper_tables(config.scraper_output_dir)

    races_table = tables.get("races")
    if races_table is None:
        raise ValueError("Required table 'races' is missing when selecting the target race")

    race_record = select_target_race(
        races_table,
        year=config.race_year,
        round_number=config.race_round,
        name=config.race_name,
    )
    race_id = int(race_record["raceId"])
    LOGGER.info(
        "Preparing dataset for race %s (%s - round %s)",
        race_record.get("name"),
        race_record.get("year"),
        race_record.get("round"),
    )

    base = build_driver_base(tables, race_id)
    base = compute_qualifying_gap(base, tables, race_id)
    base = compute_fp_longrun_pace(base, tables, scraper_tables, race_id)
    base = compute_speed_metrics(base, tables, race_id)
    base = compute_pit_metrics(base, tables, race_id)
    base = compute_dnf_and_sc_metrics(base, tables, race_id, config.history_window)
    base = compute_rain_probability(base, scraper_tables, race_record)

    dataset = finalise_dataset(base)
    return save_dataset(dataset, config.output_dir, config.output_filename, race_record)


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Formula 1 ETL pipeline")
    parser.add_argument("--datasets", type=Path, required=True, help="Path to the core datasets directory")
    parser.add_argument(
        "--scraper-output",
        type=Path,
        default=None,
        help="Directory containing optional scraper metrics (long run pace, weather, etc.)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("./build"),
        help="Directory where the generated CSV will be stored",
    )
    parser.add_argument(
        "--out-file",
        type=str,
        default=None,
        help="Optional filename for the generated CSV (defaults to <year>_<race>.csv)",
    )
    parser.add_argument("--year", type=int, default=None, help="Limit the dataset to a specific year")
    parser.add_argument(
        "--round",
        dest="round_",
        type=int,
        default=None,
        help="Limit the dataset to a specific round within the selected year",
    )
    parser.add_argument(
        "--race",
        type=str,
        default=None,
        help="Filter races by (partial) name. When omitted the latest race is used.",
    )
    parser.add_argument(
        "--history-window",
        type=int,
        default=5,
        help="Number of recent races used to compute rolling statistics",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Logging verbosity",
    )
    return parser


def main(argv: Optional[Iterable[str]] = None) -> Path:
    parser = build_argument_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)

    logging.basicConfig(level=getattr(logging, args.log_level.upper()))

    config = ETLConfig(
        datasets_dir=args.datasets,
        scraper_output_dir=args.scraper_output,
        output_dir=args.out,
        output_filename=args.out_file,
        race_year=args.year,
        race_round=args.round_,
        race_name=args.race,
        history_window=args.history_window,
    )

    return run_etl(config)


if __name__ == "__main__":
    main()
