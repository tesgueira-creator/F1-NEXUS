# F1-NEXUS

F1 NEXUS is a data-assisted race preparation toolkit.  The web
application consumes curated driver sheets which combine manual scouting
insights with objective metrics derived from historical Formula 1 race
and weather data.

## Derived metrics

The ETL pipeline in `f1-predictor-full/etl/etl.py` now computes the
following indicators automatically:

- **straightline_index** – relative strength on high-speed sections based
  on median fastest-lap trap speeds.
- **cornering_index** – pace advantage on low-speed circuits calculated
  from the gap to the fastest lap at those events.
- **sc_prob** – probability of a safety-car-inducing incident at a given
  circuit derived from historic retirement causes.
- **rain_prob** – chance of measurable rain during the race window using
  Meteostat weather observations.

See `f1-predictor-full/etl/README.txt` for detailed usage instructions
and output artefacts.

## Running the ETL

```
cd f1-predictor-full/etl
pip install -r requirements.txt
python etl.py --datasets /path/to/formula1-datasets --out ../../build
```

The script writes `driver_metrics.csv`, `circuit_metrics.csv`,
`latest_race_dataset.csv` and a `weather_cache.json` cache into the
chosen output directory.  The updated
`public/templates/new_schema_blank.csv` template highlights which fields
are auto-populated by the pipeline.

## Front-end

The Next.js front-end lives under `f1-predictor-full/` and consumes the
prepared data to power scenario simulations.

