Purpose: Define objective, model-ready CSVs for realistic race predictions. Fields are measurable or computable from public data (no subjective “confidence/rumors”).

Datasets overview
- race_features.csv: one row per race with track, event, and environment features.
- session_driver.csv: per-driver session features (grid, quali gaps, long-run pace).
- team_form.csv: team-level rolling performance and operations metrics.
- driver_form.csv: driver-level rolling performance and reliability metrics.
- weather_forecast.csv: race-time forecast aligned to local event time.

race_features.csv (per race)
- race_id: stable key (e.g., 2025_monza_race)
- season: integer, e.g., 2025
- round: integer FIA round number
- circuit_id: key matching track table (e.g., monza)
- circuit_name: human-readable
- country: ISO or name
- date_local: YYYY-MM-DD
- start_time_local: HH:MM
- timezone: IANA tz
- laps: official race laps
- track_length_km: official lap length
- altitude_m: track elevation (approx. Wikipedia)
- drs_zones: count of DRS zones
- overtake_index: empirical passing difficulty index (derived from historic overtakes per opportunity)
- pit_lane_loss_s: pit entry→exit delta at Vmax (Pirelli preview/derived)
- sc_prob: probability of at least one Safety Car (historical)
- vsc_prob: probability of at least one VSC (historical)
- sc_avg_count: expected neutralizations per race (historical)
- retire_prob: baseline mechanical/accident retirement probability
- tyre_stress: ordinal [1–5] (Pirelli preview-derived)
- asphalt_grip: ordinal [1–5]
- asphalt_roughness: ordinal [1–5]
- track_temp_typical_c: climatology median at race hour
- wind_typical_kph: climatology median

session_driver.csv (per driver for the event)
- race_id: join key
- driver_id: canonical code
- driver_name: human-readable
- team_id: canonical team code
- team_name: human-readable
- grid_position: integer (after penalties)
- qualy_position: integer
- qualy_best_ms: best lap ms (Q1/Q2/Q3 best)
- qualy_gap_ms: gap to pole ms
- fp_longrun_pace_s: estimated long-run lap time at representative fuel (from FP telemetry or GP practice analysis)
- straightline_index: z-score of trap/top speed vs field (track-corrected)
- cornering_index: z-score of sector/corner deltas vs field
- starting_tyre: one of [S,M,H] when known, else NA
- grid_penalty: integer positions (>=0)
- pit_crew_mean_s: team pit stop mean (season-to-date)
- pit_crew_sd_s: pit stop stddev
- expected_pit_stops: model prior [1–4]
- expected_stint_lengths: JSON like [12,22,19]

team_form.csv (rolling)
- team_id: key
- season: int
- aero_eff_index: rolling track-corrected cornering performance
- power_eff_index: rolling straightline performance
- tyre_deg_soft/medium/hard: estimated deg in s/lap for each compound
- strategy_aggressiveness: ordinal [-1 conservative, 0 neutral, +1 aggressive]
- pit_stop_mean_s: season-to-date mean
- pit_stop_sd_s: season-to-date stddev
- reliability_rate: 1 - DNF rate season-to-date

driver_form.csv (rolling)
- driver_id: key
- season: int
- rating_quali: latent rating (Elo/Bradley–Terry) for quali pace
- rating_race: latent rating for race pace
- form_points_3r/5r: rolling points sums
- start_finish_gain: avg positions gained/lost (last N races)
- dnf_rate: rolling DNF probability
- penalty_points: FIA license points (optional)

weather_forecast.csv (race-clock aligned)
- race_id: join key
- t0_offset_min: minutes since lights out (0, 10, 20, …)
- air_temp_c: forecast
- track_temp_c: forecast (or modeled from air + sun/wind)
- humidity_pct: forecast
- wind_speed_kph: forecast
- wind_dir_deg: forecast
- rain_prob: [0–1]

Notes
- All quantities are unit-consistent; “index/z-score” are standardized vs event field.
- Use NA instead of empty strings; numeric missing as blank or NA.
- Keep keys lowercase snake_case for stability across seasons.

Suggested lookup tables (optional)
- circuits.csv: id, name, country, coords (lat/lon), altitude, drs_zones.
- tyres.csv: compound, degradation priors by track class.

