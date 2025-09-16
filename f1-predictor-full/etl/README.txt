Formula 1 ETL pipeline
=======================

This folder contains a standalone ETL script that transforms the raw open
Formula 1 datasets into the schema consumed by the F1 Nexus application.  The
pipeline ingests the canonical CSV files from the `formula1-datasets` project
(or any dataset that exposes the same schema), combines them with optional
scraper output and exports a driver-level CSV following the column order
defined in `../public/templates/new_schema_blank.csv`.

Prerequisites
-------------
* Python 3.9 or newer
* The required Python dependencies installed with:
  ```bash
  pip install -r requirements.txt
  ```
* A checkout of the raw datasets (for example the `formula1-datasets` GitHub
  repository) and, optionally, a folder containing scraper metrics such as free
  practice long run pace or weather forecasts.

Usage
-----
1. Ensure the raw CSV files (`drivers.csv`, `constructors.csv`, `races.csv`,
   `results.csv`, etc.) are available inside a directory, e.g.
   `./formula1-datasets-master`.
2. Execute the ETL script from this folder:
   ```bash
   python etl.py \
       --datasets ./formula1-datasets-master \
       --scraper-output ./scraper_output \  # optional
       --out ./build
   ```
3. The script writes a CSV file inside the output directory (default
   `./build`).  The file name defaults to `<year>_<grand-prix-name>.csv` but can
   be overridden with `--out-file my_file.csv`.

Command line options
--------------------
Run `python etl.py --help` to see all available flags.  The most important
options are:

* `--datasets`: Path to the folder containing the core Formula 1 CSV files
  (required).
* `--scraper-output`: Optional folder holding event specific metrics, such as
  weather forecasts or manually curated speed-trap figures.  When omitted the
  pipeline falls back to values derived from the historical data.
* `--year`, `--round` and `--race`: Use these filters to select the race that
  should be exported.  If no filter is provided the script automatically picks
  the most recent race in the dataset.
* `--history-window`: Number of past races used when computing rolling metrics
  such as DNF rate or safety car probability.

Output
------
The generated CSV will contain the following columns for each driver that took
part in the selected grand prix:

```
driver_name,team_name,grid_position,qualy_gap_ms,fp_longrun_pace_s,
straightline_index,cornering_index,pit_crew_mean_s,dnf_rate,sc_prob,
rain_prob,speed_trap_kph
```

The resulting file can be copied directly into the application's data folder.
