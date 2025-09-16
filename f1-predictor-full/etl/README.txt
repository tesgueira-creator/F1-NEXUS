ETL pipeline
============

This folder contains the data preparation utilities which transform raw
results and weather data into the metrics consumed by the web
application.  The workflow now derives four metrics automatically:

* **straightline_index** – relative strength in speed-trap limited
  sections using median fastest-lap speeds.
* **cornering_index** – performance delta on low-speed, high-downforce
  circuits based on the gap to the event fastest lap.
* **sc_prob** – per-circuit probability of an incident severe enough to
  trigger a safety car, inferred from historic retirement causes.
* **rain_prob** – probability of measurable rain on race day obtained via
  the `meteostat` weather archive.

Usage
-----

```
python etl.py --datasets /path/to/formula1-datasets --out ./build
```

Optional flags:

* `--min-year` limits the seasons considered (default: 2018).
* `--skip-weather` skips Meteostat requests and leaves `rain_prob`
  unpopulated.
* `--log-level` controls verbosity (e.g. `DEBUG`).

The script emits three CSV files in the output directory:

* `driver_metrics.csv` – driver level aggregates including straightline
  and cornering indices.
* `circuit_metrics.csv` – safety car and rain probabilities per circuit
  together with sample counts.
* `latest_race_dataset.csv` – convenience extract for the most recent
  race combining manual inputs with the derived metrics.

A persistent `weather_cache.json` file is also written next to the
outputs to avoid repeated Meteostat downloads for past races.

Prerequisites
-------------

Install the Python dependencies with:

```
pip install -r requirements.txt
```

The datasets directory should contain the CSV exports from the `formula1`
open data repositories (for example the `f1db` dump).  At minimum the
following files are required: `races.csv`, `results.csv`, `drivers.csv`,
`constructors.csv`, `qualifying.csv`, `pit_stops.csv`, `circuits.csv`
and `status.csv`.

