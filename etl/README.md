ETL: Build objective CSVs from public sources

Components
- make_session_driver_fastf1.py: Per-driver session features (grid, qualy gap, long-run pace, indices, pit crew stats).
- make_race_features_openmeteo.py: Race-level features (SC/VSC priors placeholder, pit lane loss input, weather forecast/climatology via Open‑Meteo/Meteostat).
- jolpica_helper.py: Utilities to query an Ergast-compatible API (Jolpica F1) for results/grids when FastF1 is not available.

Setup
- Python 3.10+
- pip install -r requirements.txt
- FastF1 cache is required for speed: by default uses ./fastf1_cache

Outputs
- session_driver.csv (see docs/prediction_data_schema.md)
- race_features.csv (see docs/prediction_data_schema.md)

Quick start
- python etl/make_session_driver_fastf1.py --season 2025 --event Italy --session FP2 --out build/session_driver.csv
- python etl/make_race_features_openmeteo.py --season 2025 --event Italy --race-date 2025-09-07 --lat 45.615 --lon 9.281 --out build/race_features.csv

Note
- Some fields (overtake_index, sc_prob, vsc_prob, pit_lane_loss_s) may need manual seed values per track until we add robust historical computation.

LLM overlay workflow (consistent CSV via ChatGPT)
- Crie o JSON subjetivo com o prompt em `docs/llm_prompt.md` e as regras em `docs/llm_guidelines.md`.
- Valide e integre com o baseline:
  - python scripts/validate_overlay.py --baseline build/session_driver.csv --overlay overlays/monza_overlay.json --last-overlay overlays/prev.json --alpha 0.2 --out build/legacy_final.csv
- Faça upload de `build/legacy_final.csv` na app (compatível com o UI atual).

One‑shot pipeline
- python scripts/make_all.py \
  --season 2024 --event Monza --session FP2 \
  --race-id 2024_monza_race --circuit-id monza --circuit-name Monza --country Italy \
  --race-date 2024-09-01 --start-time 15:00 --laps 53 --track-length-km 5.793 --lat 45.615 --lon 9.281 \
  --overlay overlays/monza_overlay.example.json \
  --ca-bundle C:\\certs\\corp-root.pem --proxy http://proxy.corp.local:8080

Se não existir overlay, o script gera um template (`build/overlay_template.json`).

Corporate SSL/Proxy (recommended secure setup)
- Export corporate root/proxy CA to a PEM file, e.g. C:\certs\corp-root.pem
- Set env vars in your shell before running scripts:
  - PowerShell:
    - $env:REQUESTS_CA_BUNDLE="C:\certs\corp-root.pem"
    - $env:SSL_CERT_FILE="C:\certs\corp-root.pem"
  - If your org requires a proxy:
    - $env:HTTPS_PROXY="http://proxy.corp.local:8080"
    - $env:HTTP_PROXY="http://proxy.corp.local:8080"
- Or pass per-script options:
  - make_session_driver_fastf1.py: --ca-bundle C:\certs\corp-root.pem --proxy http://proxy.corp.local:8080
  - make_race_features_openmeteo.py: --ca-bundle C:\certs\corp-root.pem --proxy http://proxy.corp.local:8080

Temporary workaround (not recommended): add --insecure to disable TLS verification if you trust your network.

Connectivity test
- python - << 'PY'
import os, requests
print('CA:', os.environ.get('REQUESTS_CA_BUNDLE'))
print('Proxy:', os.environ.get('HTTPS_PROXY'))
print('GitHub raw:', requests.get('https://raw.githubusercontent.com', timeout=10).status_code)
print('Open-Meteo:', requests.get('https://api.open-meteo.com/v1/forecast', params={'latitude':0,'longitude':0,'hourly':'temperature_2m'}, timeout=10).status_code)
PY
