import sys
import unittest
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
ETL_DIR = PROJECT_ROOT / "f1-predictor-full" / "etl"
if str(ETL_DIR) not in sys.path:
    sys.path.insert(0, str(ETL_DIR))

from etl import compute_rain_probability


class TestComputeRainProbability(unittest.TestCase):
    def test_without_race_name_column_uses_numeric_fallback(self) -> None:
        base = pd.DataFrame({"driverId": [1]})
        weather_df = pd.DataFrame(
            {
                "chance_value": [70],
                "conditions": ["cloudy"],
            }
        )
        scraper_tables = {"weather": weather_df}
        race_record = pd.Series({"name": "Sample GP"})

        result = compute_rain_probability(base.copy(), scraper_tables, race_record)

        self.assertIn("rain_prob", result.columns)
        self.assertAlmostEqual(result.loc[0, "rain_prob"], 0.7)


if __name__ == "__main__":
    unittest.main()
