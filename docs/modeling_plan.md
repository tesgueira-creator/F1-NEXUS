Goal: Move from subjective weights to a calibrated, data-driven pipeline that outputs realistic probabilities (win, podium, points, finishing position distribution).

Data sources (public, programmatic)
- FastF1: official timing, telemetry, tyre usage, weather and session results. http://docs.fastf1.dev/
- OpenF1: real-time and historical timing/telemetry JSON/CSV. https://openf1.org/
- Ergast-compatible APIs: historical results via Jolpica F1. https://github.com/jolpica/jolpica-f1
- Meteostat: historical weather/climatology and station data. https://dev.meteostat.net/python/
- Open‑Meteo: race‑week forecasts (no key). https://open-meteo.com/en/docs
- Wikipedia/official: track metadata (length, laps, altitude). https://en.wikipedia.org/wiki/List_of_Formula_One_circuits
- Pirelli press: track characteristics, pit loss context, compound selection.

Feature engineering summary
- Track/event: pit_lane_loss_s, overtake_index, sc/vsc likelihood, tyre_stress, asphalt_grip/roughness, drs_zones, altitude.
- Driver/team: dynamic latent ratings for quali and race (state-space Elo/Bayesian Bradley–Terry), rolling DNF, pit crew stats.
- Session: grid_position after penalties, qualy gaps, long-run pace (FP telemetry), straightline vs cornering indices, expected strategy.
- Weather: race-clock aligned forecast; derive wet risk and adjust degradation/accident hazards.

Model stack
- Latent ability models (ratings)
  - Qualifying: Bradley–Terry/Elo variant with car+driver decomposition and track-type effects (fast/slow, abrasive, altitude).
  - Race pace: hierarchical Bayesian regression of stint pace vs features (compound, age, fuel correction, track, weather), with team/driver random effects.
- Discrete outcome models (probabilities)
  - Gradient-boosted trees (XGBoost/LightGBM/CatBoost) for ordinal finishing buckets and head-to-heads using engineered features.
  - Calibrate with isotonic regression or Platt scaling (optimize Brier/log-loss).
- Reliability/incident models
  - Survival/hazard for retirements: baseline + modifiers (rain, track risk, driver/team reliability).
  - Safety Car/VSC: Poisson with track/time covariates; sample neutralizations in simulation.

Race simulation (Monte Carlo)
- Inputs per simulation: grid, pace distributions (driver/team), pit_lane_loss_s, tyre deg priors, sc/vsc processes, weather path.
- Strategy: heuristic optimizer picks pit laps minimizing race time under sampled conditions (1/2/3-stops). Enforce compound rules.
- Overtake logic: pass probability per lap = f(pace delta, overtake_index, DRS effect). Blocked cars lose time; SC bunching modeled.
- Output per run: finishing order, pit counts, DNFs. Aggregate 10k–50k runs to probability distributions.

Backtesting & calibration
- Train on seasons 2018–2023, validate on 2024; test prospective in 2025.
- Metrics: Brier score, log-loss, calibration curves (reliability diagrams), top‑k hit rate, CRPS for expected position.
- Apply calibration layer per market/outcome (isotonic). Monitor drift.

Deliverables to integrate
- CSVs per docs/prediction_data_schema.md.
- ETL scripts: fetch FastF1/Ergast/Jolpica, compute features, export CSV.
- Modeling notebook/scripts: fit ratings, train GBMs, persist calibrators.
- Simulation engine: consumes CSV + model artifacts; outputs `probs_*.csv` used by app.

Migration from current CSV
- Replace subjective columns (Confiança, Rumores, Conflitos, Estado Emocional) with objective features.
- Map existing: Grid → grid_position; LongRunPace → fp_longrun_pace_s; TopSpeed → straightline_index; PitStopAvg → pit_crew_mean_s; Deg → tyre_deg_*.
- Add missing: qualy_gap_ms, pit_lane_loss_s, sc_prob/vsc_prob, overtake_index, expected_pit_stops.

Implementation sequence
1) Build race_features.csv and circuits.csv (static + derived).
2) Extract session_driver.csv from FastF1 telemetry and qualy.
3) Compute team_form.csv, driver_form.csv rolling metrics.
4) Forecast weather and align to race clock.
5) Train/calibrate models, export artifacts.
6) Run Monte Carlo; export probs for UI.

