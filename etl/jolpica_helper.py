#!/usr/bin/env python3
import requests

BASE = "https://api.jolpi.ca/f1"  # Ergast-compatible

def get_grid_positions(season:int, round_num:int):
    url = f"{BASE}/{season}/{round_num}/qualifying.json"
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    js = r.json()
    try:
        races = js['MRData']['RaceTable']['Races']
        if not races:
            return {}
        qual = races[0]['QualifyingResults']
        out = {}
        for q in qual:
            code = q['Driver'].get('code') or q['Driver'].get('driverId')
            out[code.upper()] = int(q['position'])
        return out
    except Exception:
        return {}

if __name__ == '__main__':
    print(get_grid_positions(2024, 14))

