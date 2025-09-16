#!/usr/bin/env python3
"""ETL pipeline for preparing driver and circuit metrics.

This script processes historical Formula 1 race results alongside
weather observations in order to derive the metrics required by the
front-end application.  It focuses on four derived metrics:

* ``straightline_index`` – strength on high-speed sections based on
  fastest-lap trap speeds.
* ``cornering_index`` – pace on low-speed, high-downforce circuits.
* ``sc_prob`` – safety car likelihood derived from historical incidents
  at a circuit.
* ``rain_prob`` – probability of rain during the race window based on
  Meteostat weather observations.

The pipeline expects the ``formula1-datasets`` (or the equivalent
``f1db`` dump) to be available locally.  Only a subset of the CSV files
is required: ``races``, ``results``, ``drivers``, ``constructors``,
``qualifying``, ``pit_stops``, ``circuits`` and ``status``.  Weather data
is downloaded on demand via the ``meteostat`` package and cached for
future runs.
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Optional

import numpy as np
import pandas as pd

try:  # pragma: no cover - optional dependency guard
    from meteostat import Daily, Point

    HAVE_METEOSTAT = True
except Exception:  # pragma: no cover - fallback when meteostat is missing
    HAVE_METEOSTAT = False

LOGGER = logging.getLogger("etl")
DEFAULT_MIN_YEAR = 2018
INCIDENT_KEYWORDS = (
    "accident",
    "collision",
    "crash",
    "spin",
    "spun",
    "contact",
    "damage",
    "debris",
)


def _find_dataset_file(root: Path, filename: str) -> Path:
    """Locate a CSV file within a dataset directory tree."""

    matches = sorted(root.rglob(filename))
    if not matches:
        raise FileNotFoundError(f"Could not locate '{filename}' under {root}")
    if len(matches) > 1:
        LOGGER.debug("Multiple matches for %s, using %s", filename, matches[0])
    return matches[0]


def _clean_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series.replace({"\\N": np.nan}), errors="coerce")


def parse_lap_time(value: object) -> float:
    """Convert an F1 lap time string (e.g. ``1:23.456``) to seconds."""

    if value is None or (isinstance(value, float) and math.isnan(value)):
        return math.nan
    text = str(value).strip()
    if not text or text == "\\N":
        return math.nan
    parts = text.split(":")
    try:
        numbers = [float(part) for part in parts]
    except ValueError:
        return math.nan
    if len(numbers) == 3:
        hours, minutes, seconds = numbers
        return hours * 3600 + minutes * 60 + seconds
    if len(numbers) == 2:
        minutes, seconds = numbers
        return minutes * 60 + seconds
    if len(numbers) == 1:
        return numbers[0]
    return math.nan


@dataclass
class DataBundle:
    races: pd.DataFrame
    results: pd.DataFrame
    drivers: pd.DataFrame
    constructors: pd.DataFrame
    status: pd.DataFrame
    circuits: pd.DataFrame
    qualifying: pd.DataFrame
    pit_stops: pd.DataFrame


def load_datasets(dataset_dir: Path) -> DataBundle:
    LOGGER.info("Loading raw datasets from %s", dataset_dir)
    races = pd.read_csv(_find_dataset_file(dataset_dir, "races.csv"))
    results = pd.read_csv(_find_dataset_file(dataset_dir, "results.csv"))
    drivers = pd.read_csv(_find_dataset_file(dataset_dir, "drivers.csv"))
    constructors = pd.read_csv(_find_dataset_file(dataset_dir, "constructors.csv"))
    status = pd.read_csv(_find_dataset_file(dataset_dir, "status.csv"))
    circuits = pd.read_csv(_find_dataset_file(dataset_dir, "circuits.csv"))
    qualifying = pd.read_csv(_find_dataset_file(dataset_dir, "qualifying.csv"))
    pit_stops = pd.read_csv(_find_dataset_file(dataset_dir, "pit_stops.csv"))

    races["date"] = pd.to_datetime(races["date"], errors="coerce")
    races = races.dropna(subset=["date"]).copy()
    races["year"] = races["year"].astype(int)

    results["fastestLapSpeed"] = _clean_numeric(results.get("fastestLapSpeed", np.nan))
    results["fastestLapTimeSeconds"] = results.get("fastestLapTime", np.nan).apply(parse_lap_time)
    results["milliseconds"] = _clean_numeric(results.get("milliseconds", np.nan))
    results["statusId"] = _clean_numeric(results.get("statusId", np.nan)).astype("Int64")
    results["raceId"] = results["raceId"].astype(int)
    results["driverId"] = results["driverId"].astype(int)

    qualifying["raceId"] = qualifying["raceId"].astype(int)
    qualifying["driverId"] = qualifying["driverId"].astype(int)
    for column in ("q1", "q2", "q3"):
        qualifying[column + "Seconds"] = qualifying.get(column, np.nan).apply(parse_lap_time)
    qualifying["best_qualy_seconds"] = qualifying[["q1Seconds", "q2Seconds", "q3Seconds"]].min(axis=1, skipna=True)

    pit_stops["milliseconds"] = _clean_numeric(pit_stops.get("milliseconds", np.nan))
    pit_stops["constructorId"] = _clean_numeric(pit_stops.get("constructorId", np.nan)).astype("Int64")

    return DataBundle(
        races=races,
        results=results,
        drivers=drivers,
        constructors=constructors,
        status=status,
        circuits=circuits,
        qualifying=qualifying,
        pit_stops=pit_stops,
    )


def compute_straightline_index(results: pd.DataFrame) -> pd.DataFrame:
    """Compute the straight-line performance index for each driver."""

    speeds = results.dropna(subset=["fastestLapSpeed"])[["driverId", "fastestLapSpeed"]]
    if speeds.empty:
        return pd.DataFrame(columns=["driverId", "straightline_index", "speed_trap_kph"])

    driver_speed = speeds.groupby("driverId")["fastestLapSpeed"].median()
    z_scores = (driver_speed - driver_speed.mean()) / driver_speed.std(ddof=0)
    if z_scores.isna().all():
        z_scores = pd.Series(0.0, index=driver_speed.index)
    scaled = (z_scores - z_scores.min())
    range_ = scaled.max()
    if not math.isfinite(range_) or range_ == 0:
        normalized = pd.Series(50.0, index=driver_speed.index)
    else:
        normalized = (scaled / range_) * 100
    metrics = pd.DataFrame(
        {
            "driverId": driver_speed.index,
            "straightline_index": normalized.round(3),
            "speed_trap_kph": driver_speed.round(3),
        }
    )
    return metrics


def compute_cornering_index(results: pd.DataFrame) -> pd.DataFrame:
    """Measure performance relative to the field on low-speed circuits."""

    required = results.dropna(subset=["fastestLapSpeed", "fastestLapTimeSeconds"])
    if required.empty:
        return pd.DataFrame(columns=["driverId", "cornering_index", "low_speed_delta_s"])

    race_speed = required.groupby("raceId")["fastestLapSpeed"].median()
    if race_speed.empty:
        return pd.DataFrame(columns=["driverId", "cornering_index", "low_speed_delta_s"])

    threshold = race_speed.quantile(0.35)
    low_speed_races = race_speed[race_speed <= threshold].index
    if len(low_speed_races) < 5:
        low_speed_races = race_speed.nsmallest(min(5, len(race_speed))).index

    subset = required[required["raceId"].isin(low_speed_races)].copy()
    if subset.empty:
        return pd.DataFrame(columns=["driverId", "cornering_index", "low_speed_delta_s"])

    subset["delta"] = subset["fastestLapTimeSeconds"] - subset.groupby("raceId")["fastestLapTimeSeconds"].transform("min")
    driver_delta = subset.groupby("driverId")["delta"].median()

    max_delta = driver_delta.max()
    min_delta = driver_delta.min()
    range_ = max_delta - min_delta
    if not math.isfinite(range_) or range_ == 0:
        scores = pd.Series(50.0, index=driver_delta.index)
    else:
        scores = (max_delta - driver_delta) / range_ * 100
    metrics = pd.DataFrame(
        {
            "driverId": driver_delta.index,
            "cornering_index": scores.round(3),
            "low_speed_delta_s": driver_delta.round(3),
        }
    )
    return metrics


def compute_safety_car_probability(results: pd.DataFrame, races: pd.DataFrame, status: pd.DataFrame) -> pd.DataFrame:
    """Estimate safety car probability per circuit based on incident history."""

    status = status.copy()
    status["status"] = status["status"].astype(str)
    incident_mask = status["status"].str.contains("|".join(INCIDENT_KEYWORDS), case=False, na=False)
    incident_status_ids = set(status.loc[incident_mask, "statusId"].astype(int))

    merged = results.merge(races[["raceId", "circuitId"]], on="raceId", how="left")
    merged["had_incident"] = merged["statusId"].isin(incident_status_ids)
    race_incidents = merged.groupby(["raceId", "circuitId"])["had_incident"].any().reset_index()

    circuit_probs = (
        race_incidents.groupby("circuitId")["had_incident"].agg(["mean", "count"]).reset_index()
    )
    circuit_probs = circuit_probs.rename(columns={"mean": "sc_prob", "count": "incident_samples"})
    circuit_probs["sc_prob"] = circuit_probs["sc_prob"].round(3)
    return circuit_probs


def _load_weather_cache(cache_path: Path) -> Dict[int, Optional[bool]]:
    if not cache_path.exists():
        return {}
    try:
        with cache_path.open("r", encoding="utf8") as fh:
            data = json.load(fh)
        return {int(key): (None if value is None else bool(value)) for key, value in data.items()}
    except Exception as exc:  # pragma: no cover - defensive
        LOGGER.warning("Failed to read weather cache %s: %s", cache_path, exc)
        return {}


def _write_weather_cache(cache_path: Path, cache: Dict[int, Optional[bool]]) -> None:
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    serializable = {str(key): value for key, value in cache.items()}
    with cache_path.open("w", encoding="utf8") as fh:
        json.dump(serializable, fh, indent=2, sort_keys=True)


def compute_rain_probability(
    races: pd.DataFrame,
    circuits: pd.DataFrame,
    cache_path: Path,
    min_year: int,
) -> pd.DataFrame:
    """Compute rain probability per circuit using Meteostat daily rainfall."""

    if not HAVE_METEOSTAT:
        LOGGER.warning("Meteostat is not available, skipping rain probability computation")
        return pd.DataFrame(columns=["circuitId", "rain_prob", "rain_samples"])

    cache = _load_weather_cache(cache_path)
    observations = []
    lookup = circuits.set_index("circuitId")
    filtered = races[races["year"] >= min_year]

    for race in filtered.itertuples():
        race_id = int(race.raceId)
        circuit_id = int(race.circuitId)
        cached = cache.get(race_id)
        if cached is not None:
            observations.append({"raceId": race_id, "circuitId": circuit_id, "had_rain": cached})
            continue

        if circuit_id not in lookup.index:
            cache[race_id] = None
            continue

        circuit = lookup.loc[circuit_id]
        lat = circuit.get("lat") if isinstance(circuit, pd.Series) else circuit["lat"]
        lon = circuit.get("lng") if isinstance(circuit, pd.Series) else circuit["lng"]
        alt = circuit.get("alt") if isinstance(circuit, pd.Series) else circuit.get("alt")

        lat = float(lat) if pd.notna(lat) else None
        lon = float(lon) if pd.notna(lon) else None
        altitude = float(alt) if pd.notna(alt) else None
        if lat is None or lon is None:
            cache[race_id] = None
            continue
        point = Point(lat, lon, altitude)
        start = pd.Timestamp(race.date).normalize()
        end = start + pd.Timedelta(days=1)
        try:
            weather = Daily(point, start, end).fetch()
        except Exception as exc:  # pragma: no cover - network/remote error handling
            LOGGER.warning("Weather lookup failed for race %s: %s", race_id, exc)
            cache[race_id] = None
            continue
        had_rain = bool(weather.get("prcp", pd.Series(dtype=float)).fillna(0).gt(0).any())
        cache[race_id] = had_rain
        observations.append({"raceId": race_id, "circuitId": circuit_id, "had_rain": had_rain})

    _write_weather_cache(cache_path, cache)

    if not observations:
        return pd.DataFrame(columns=["circuitId", "rain_prob", "rain_samples"])

    df = pd.DataFrame(observations)
    df = df.dropna(subset=["had_rain"])
    if df.empty:
        return pd.DataFrame(columns=["circuitId", "rain_prob", "rain_samples"])
    grouped = df.groupby("circuitId")["had_rain"].agg(["mean", "count"]).reset_index()
    grouped = grouped.rename(columns={"mean": "rain_prob", "count": "rain_samples"})
    grouped["rain_prob"] = grouped["rain_prob"].round(3)
    return grouped


def compute_driver_dnf_rate(results: pd.DataFrame, status: pd.DataFrame) -> pd.DataFrame:
    status = status.copy()
    status["finished"] = status["status"].astype(str).str.contains("finished", case=False, na=False)
    merged = results.merge(status[["statusId", "finished"]], on="statusId", how="left")
    grouped = merged.groupby("driverId")["finished"].mean()
    dnf_rate = 1 - grouped.fillna(0)
    return dnf_rate.reset_index(name="dnf_rate")


def compute_team_pit_stop_times(pit_stops: pd.DataFrame) -> pd.DataFrame:
    valid = pit_stops.dropna(subset=["milliseconds", "constructorId"])
    if valid.empty:
        return pd.DataFrame(columns=["constructorId", "pit_crew_mean_s"])
    grouped = valid.groupby("constructorId")["milliseconds"].mean() / 1000.0
    return grouped.reset_index(name="pit_crew_mean_s")


def merge_driver_metadata(
    driver_metrics: pd.DataFrame,
    data: DataBundle,
    min_year: int,
) -> pd.DataFrame:
    races = data.races[data.races["year"] >= min_year]
    results = data.results[data.results["raceId"].isin(races["raceId"])]
    latest_results = (
        results.merge(races[["raceId", "date"]], on="raceId", how="left")
        .sort_values("date")
        .dropna(subset=["date"])
        .groupby("driverId")
        .tail(1)
    )
    constructor_lookup = data.constructors.set_index("constructorId")["name"].to_dict()

    drivers = data.drivers.copy()
    drivers["driver_name"] = drivers["forename"].str.strip() + " " + drivers["surname"].str.strip()

    merged = driver_metrics.merge(drivers[["driverId", "driver_name", "code"]], on="driverId", how="left")
    merged = merged.merge(
        latest_results[["driverId", "constructorId"]], on="driverId", how="left"
    )
    merged["team_name"] = merged["constructorId"].map(constructor_lookup)
    return merged


def build_latest_race_dataset(
    data: DataBundle,
    driver_metrics: pd.DataFrame,
    circuit_metrics: pd.DataFrame,
    min_year: int,
) -> pd.DataFrame:
    races = data.races[data.races["year"] >= min_year]
    latest_race = races.sort_values("date").tail(1)
    if latest_race.empty:
        return pd.DataFrame(columns=[])
    latest = latest_race.iloc[0]
    race_id = int(latest.raceId)
    circuit_id = int(latest.circuitId)

    race_results = data.results[data.results["raceId"] == race_id].copy()
    race_results = race_results.merge(driver_metrics, on="driverId", how="left")

    # Qualifying gaps
    qualy = data.qualifying[data.qualifying["raceId"] == race_id][
        ["driverId", "best_qualy_seconds"]
    ].copy()
    if not qualy.empty:
        pole = qualy["best_qualy_seconds"].min()
        qualy["qualy_gap_ms"] = (qualy["best_qualy_seconds"] - pole) * 1000.0
    race_results = race_results.merge(qualy[["driverId", "qualy_gap_ms"]], on="driverId", how="left")

    # Pit crew times by constructor
    pit_times = compute_team_pit_stop_times(data.pit_stops)
    race_results = race_results.merge(pit_times, on="constructorId", how="left")

    # DNF rate
    dnf = compute_driver_dnf_rate(data.results, data.status)
    race_results = race_results.merge(dnf, on="driverId", how="left")

    drivers = data.drivers.copy()
    drivers["driver_name"] = drivers["forename"].str.strip() + " " + drivers["surname"].str.strip()
    constructors = data.constructors.rename(columns={"name": "team_name"})

    race_results = race_results.merge(drivers[["driverId", "driver_name"]], on="driverId", how="left")
    race_results = race_results.merge(constructors[["constructorId", "team_name"]], on="constructorId", how="left")

    circuit_metrics = circuit_metrics.set_index("circuitId") if not circuit_metrics.empty else pd.DataFrame()
    sc_prob = circuit_metrics.at[circuit_id, "sc_prob"] if circuit_id in circuit_metrics.index else np.nan
    rain_prob = circuit_metrics.at[circuit_id, "rain_prob"] if "rain_prob" in circuit_metrics.columns and circuit_id in circuit_metrics.index else np.nan

    race_results["sc_prob"] = sc_prob
    race_results["rain_prob"] = rain_prob

    race_results.rename(columns={"grid": "grid_position"}, inplace=True)
    race_results["grid_position"] = pd.to_numeric(race_results["grid_position"], errors="coerce")
    if "qualy_gap_ms" in race_results.columns:
        race_results["qualy_gap_ms"] = race_results["qualy_gap_ms"].round(3)
    if "dnf_rate" in race_results.columns:
        race_results["dnf_rate"] = race_results["dnf_rate"].round(3)
    if "pit_crew_mean_s" in race_results.columns:
        race_results["pit_crew_mean_s"] = race_results["pit_crew_mean_s"].round(3)
    race_results = race_results[
        [
            "driver_name",
            "team_name",
            "grid_position",
            "qualy_gap_ms",
            "fastestLapTimeSeconds",
            "straightline_index",
            "cornering_index",
            "pit_crew_mean_s",
            "dnf_rate",
            "sc_prob",
            "rain_prob",
            "speed_trap_kph",
        ]
    ]
    race_results.rename(columns={"fastestLapTimeSeconds": "fp_longrun_pace_s"}, inplace=True)
    if "fp_longrun_pace_s" in race_results.columns:
        race_results["fp_longrun_pace_s"] = race_results["fp_longrun_pace_s"].round(3)
    return race_results


def run_etl(
    dataset_dir: Path,
    output_dir: Path,
    min_year: int,
    skip_weather: bool,
) -> Dict[str, object]:
    output_dir.mkdir(parents=True, exist_ok=True)
    data = load_datasets(dataset_dir)

    driver_speed = compute_straightline_index(data.results)
    driver_cornering = compute_cornering_index(data.results)
    driver_metrics = driver_speed.merge(driver_cornering, on="driverId", how="outer")

    driver_metrics = merge_driver_metadata(driver_metrics, data, min_year)
    preferred_order = [
        "driverId",
        "driver_name",
        "team_name",
        "code",
        "straightline_index",
        "cornering_index",
        "speed_trap_kph",
        "low_speed_delta_s",
        "constructorId",
    ]
    driver_metrics = driver_metrics[[col for col in preferred_order if col in driver_metrics.columns] + [
        col for col in driver_metrics.columns if col not in preferred_order
    ]]

    circuit_sc = compute_safety_car_probability(data.results, data.races, data.status)
    if skip_weather:
        circuit_rain = pd.DataFrame(columns=["circuitId", "rain_prob", "rain_samples"])
    else:
        cache_path = output_dir / "weather_cache.json"
        circuit_rain = compute_rain_probability(data.races, data.circuits, cache_path, min_year)

    circuit_metrics = circuit_sc.merge(circuit_rain, on="circuitId", how="outer")

    latest_dataset = build_latest_race_dataset(data, driver_metrics, circuit_metrics, min_year)

    driver_metrics_path = output_dir / "driver_metrics.csv"
    circuit_metrics_path = output_dir / "circuit_metrics.csv"
    latest_dataset_path = output_dir / "latest_race_dataset.csv"

    driver_metrics.to_csv(driver_metrics_path, index=False)
    circuit_metrics.to_csv(circuit_metrics_path, index=False)
    latest_dataset.to_csv(latest_dataset_path, index=False)

    summary = {
        "driver_metrics_path": str(driver_metrics_path),
        "circuit_metrics_path": str(circuit_metrics_path),
        "latest_dataset_path": str(latest_dataset_path),
        "drivers": int(driver_metrics.shape[0]),
        "circuits": int(circuit_metrics.shape[0]),
        "latest_race_rows": int(latest_dataset.shape[0]),
    }

    with (output_dir / "metrics_summary.json").open("w", encoding="utf8") as fh:
        json.dump(summary, fh, indent=2, sort_keys=True)

    return summary


def parse_args(argv: Optional[Iterable[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate derived F1 metrics")
    parser.add_argument("--datasets", type=Path, required=True, help="Path to the Formula 1 datasets root directory")
    parser.add_argument("--out", type=Path, required=True, help="Directory where derived datasets will be written")
    parser.add_argument("--min-year", type=int, default=DEFAULT_MIN_YEAR, help="Only consider races from this season onwards")
    parser.add_argument("--skip-weather", action="store_true", help="Do not fetch weather data (rain_prob will be NaN)")
    parser.add_argument("--log-level", default="INFO", help="Logging level (INFO, DEBUG, ...)")
    return parser.parse_args(argv)


def main(argv: Optional[Iterable[str]] = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=args.log_level.upper(), format="%(levelname)s %(name)s: %(message)s")
    try:
        summary = run_etl(args.datasets, args.out, args.min_year, args.skip_weather)
    except FileNotFoundError as exc:
        LOGGER.error("Missing dataset: %s", exc)
        return 1
    except Exception as exc:  # pragma: no cover - catch-all for CLI usage
        LOGGER.exception("ETL failed: %s", exc)
        return 2
    LOGGER.info("ETL complete: %s", summary)
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    sys.exit(main())
