#!/usr/bin/env python3
"""
Python version of the CSV conversion script.
Converts new-schema CSVs to the legacy CSV format expected by the frontend.
"""

import argparse
import pandas as pd
import os


def convert_new_to_legacy(drivers_csv, race_csv=None, output_csv=None):
    """Convert new schema CSV to legacy format."""

    # Read the new schema CSV
    df = pd.read_csv(drivers_csv)

    # Create legacy format DataFrame
    legacy_df = pd.DataFrame()

    # Map new schema columns to legacy columns
    column_mapping = {
        'driver_name': 'Piloto',
        'team_name': 'Equipa',
        'grid_position': 'Grid',
        'fp_longrun_pace_s': 'LongRunPace',
        'qualy_gap_ms': 'QualiGap',
        'straightline_index': 'TopSpeed',
        'cornering_index': 'CorneringIndex',
        'pit_crew_mean_s': 'PitStopAvg',
        'dnf_rate': 'TaxaAbandono',
        'speed_trap_kph': 'SpeedTrap'
    }

    # Apply column mapping
    for new_col, legacy_col in column_mapping.items():
        if new_col in df.columns:
            legacy_df[legacy_col] = df[new_col]

    # Add default values for required columns that might not exist
    # in new schema
    legacy_df['Pontuação Total'] = 0
    legacy_df['Confiança'] = 5
    legacy_df['Momentum'] = 0
    legacy_df['Pressão'] = 3
    legacy_df['Estado Emocional'] = 4
    legacy_df['Setup'] = 3.5
    legacy_df['Motor'] = 3
    legacy_df['Aero'] = 3.5
    legacy_df['Pneus'] = 3
    legacy_df['Combustível'] = 3
    legacy_df['Fiabilidade'] = 3
    legacy_df['Rumores'] = 0
    legacy_df['Conflitos'] = 0
    legacy_df['Ultimas5'] = ''
    legacy_df['QualiMédia'] = 0.0
    legacy_df['Clima'] = 0
    legacy_df['SafetyCar'] = 0
    legacy_df['Notas'] = (
        f'Converted from new schema - '
        f'{df.get("driver_name", "Unknown")}'
    )
    legacy_df['TrackFit_Aero'] = 0.0
    legacy_df['TrackFit_Power'] = 0.0
    legacy_df['Deg'] = 0.4
    legacy_df['Upgrades'] = 'Impacto Upgrades=1. Converted from new schema'

    # Add weather data if race CSV is provided
    if race_csv and os.path.exists(race_csv):
        try:
            race_df = pd.read_csv(race_csv)
            if not race_df.empty:
                # Add weather data to all rows
                rain_prob = (
                    race_df.get('rain_prob', [0]).iloc[0]
                    if 'rain_prob' in race_df.columns else 0
                )
                legacy_df['rain_prob'] = rain_prob

                sc_prob = (
                    race_df.get('sc_prob', [0]).iloc[0]
                    if 'sc_prob' in race_df.columns else 0
                )
                legacy_df['sc_prob'] = sc_prob
        except Exception as e:
            print(f"Warning: Could not read race data: {e}")

    # Reorder columns to match expected legacy format
    expected_columns = [
        'Piloto', 'Equipa', 'Pontuação Total', 'Confiança', 'Momentum',
        'Pressão', 'Estado Emocional', 'Setup', 'Motor', 'Aero', 'Pneus',
        'Combustível', 'Fiabilidade', 'Rumores', 'Conflitos', 'Ultimas5',
        'QualiMédia', 'TaxaAbandono', 'Clima', 'SafetyCar', 'Notas',
        'Grid', 'LongRunPace', 'TopSpeed', 'TrackFit_Aero',
        'TrackFit_Power', 'PitStopAvg', 'Deg', 'Upgrades'
    ]

    # Keep only expected columns
    final_columns = [
        col for col in expected_columns
        if col in legacy_df.columns
    ]
    legacy_df = legacy_df[final_columns]

    # Save to output file
    legacy_df.to_csv(output_csv, index=False, encoding='utf-8-sig')
    print(f"✅ Converted {len(legacy_df)} drivers to legacy format")
    print(f"✅ Saved to: {output_csv}")
    print(f"✅ Columns: {list(legacy_df.columns)}")

    return legacy_df


def main():
    parser = argparse.ArgumentParser(
        description='Convert new schema CSV to legacy format'
    )
    parser.add_argument(
        '--drivers', required=True,
        help='Path to new schema drivers CSV'
    )
    parser.add_argument(
        '--race', help='Path to race features CSV (optional)'
    )
    parser.add_argument(
        '--out', required=True,
        help='Output path for legacy format CSV'
    )

    args = parser.parse_args()

    if not os.path.exists(args.drivers):
        print(f"❌ Error: Drivers CSV not found: {args.drivers}")
        return

    convert_new_to_legacy(args.drivers, args.race, args.out)


if __name__ == '__main__':
    main()
