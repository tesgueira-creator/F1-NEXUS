Use the converter to keep the UI unchanged while adopting the new schema.

Convert new → legacy CSV
- Drivers: docs/samples/session_driver_monza_2025.csv
- Race: docs/samples/race_features_monza_2025.csv

Command
- node scripts/convert_new_to_legacy.js --drivers docs/samples/session_driver_monza_2025.csv --race docs/samples/race_features_monza_2025.csv --out monza_legacy.csv

Then upload `monza_legacy.csv` in the app as usual.

Notes
- The script reads the legacy header from `f1_monza2025_sample_upload.csv` to preserve exact column names/encoding.
- Subjective fields are filled with neutral defaults; Grid/Pace/DNF/SC and basic track fit are mapped from the new schema.
- You can customize mapping inside `scripts/convert_new_to_legacy.js` if needed.

