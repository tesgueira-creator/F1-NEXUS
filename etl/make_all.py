#!/usr/bin/env python3
"""
F1 ETL Orchestra - Execute all ETL pipelines in sequence with validation.

This script orchestrates both FastF1 and Open-Meteo ETLs with centralized 
configuration, cross-validation, and robust error handling.
"""

import argparse
import sys
import os
import subprocess
import yaml
import logging
import pandas as pd
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('f1-etl-orchestra')

def load_config(config_path="etl/circuits.yaml"):
    """Load circuit configuration from YAML file."""
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        logger.error(f"Configuration file not found: {config_path}")
        sys.exit(1)
    except yaml.YAMLError as e:
        logger.error(f"Error parsing YAML configuration: {e}")
        sys.exit(1)

def validate_args(args, config):
    """Validate command line arguments against configuration."""
    # Validate circuit
    if args.circuit not in config['circuits']:
        available = ', '.join(config['circuits'].keys())
        logger.error(f"Circuit '{args.circuit}' not found. Available: {available}")
        return False
        
    # Validate season/round combination if specified
    if args.season and args.round:
        season_config = config.get('seasons', {}).get(args.season)
        if season_config and args.round in season_config.get('rounds', {}):
            logger.info(f"Using predefined configuration for {args.season} round {args.round}")
    
    return True

def run_etl_command(cmd, description):
    """Execute ETL command with error handling."""
    logger.info(f"Starting: {description}")
    logger.debug(f"Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        logger.info(f"Completed: {description}")
        if result.stdout:
            logger.debug(f"Output: {result.stdout.strip()}")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed: {description}")
        logger.error(f"Error code: {e.returncode}")
        if e.stderr:
            logger.error(f"Error output: {e.stderr.strip()}")
        return False
        
    except subprocess.TimeoutExpired:
        logger.error(f"Timeout: {description} took longer than 5 minutes")
        return False

def cross_validate_outputs(driver_file, race_file):
    """Validate consistency between generated CSVs."""
    logger.info("Performing cross-validation between generated files")
    
    try:
        # Load both files
        drivers_df = pd.read_csv(driver_file)
        race_df = pd.read_csv(race_file)
        
        # Basic checks
        if drivers_df.empty:
            logger.error("Driver file is empty")
            return False
            
        if race_df.empty:
            logger.error("Race features file is empty")
            return False
            
        # Check driver count is reasonable
        driver_count = len(drivers_df)
        if driver_count < 10 or driver_count > 25:
            logger.warning(f"Unusual driver count: {driver_count}")
            
        # Check for required columns
        required_driver_cols = ['driver_id', 'driver_name', 'team_name']
        missing_cols = [col for col in required_driver_cols if col not in drivers_df.columns]
        if missing_cols:
            logger.error(f"Missing required driver columns: {missing_cols}")
            return False
            
        required_race_cols = ['race_id', 'circuit_id', 'date_local']
        missing_race_cols = [col for col in required_race_cols if col not in race_df.columns]
        if missing_race_cols:
            logger.error(f"Missing required race columns: {missing_race_cols}")
            return False
            
        logger.info(f"Cross-validation passed: {driver_count} drivers, race data complete")
        return True
        
    except Exception as e:
        logger.error(f"Cross-validation failed: {e}")
        return False

def build_commands(args, config):
    """Build ETL commands based on arguments and configuration."""
    circuit_config = config['circuits'][args.circuit]
    defaults = config['defaults']
    
    # Determine race date
    race_date = args.date
    if not race_date and args.season and args.round:
        season_rounds = config.get('seasons', {}).get(args.season, {}).get('rounds', {})
        if args.round in season_rounds:
            race_date = season_rounds[args.round]['date']
            
    if not race_date:
        logger.error("Race date must be specified via --date or season/round configuration")
        return None, None
        
    # Build race_id
    race_id = f"{args.season}_{args.circuit}_race" if args.season else f"{args.circuit}_race"
    
    # Session driver command
    driver_cmd = [
        sys.executable, "etl/make_session_driver_fastf1.py",
        "--season", str(args.season or 2024),
        "--session", args.session or defaults['session'],
        "--cache", args.cache or defaults['cache_dir'],
        "--out", f"{args.output or defaults['output_dir']}/session_driver.csv"
    ]
    
    if args.event:
        driver_cmd.extend(["--event", args.event])
    elif args.round:
        driver_cmd.extend(["--round", str(args.round)])
    else:
        driver_cmd.extend(["--event", circuit_config['name'].split()[0]])  # Use first word as event name
    
    # Race features command
    race_cmd = [
        sys.executable, "etl/make_race_features_openmeteo.py",
        "--race-id", race_id,
        "--season", str(args.season or 2024),
        "--round", str(args.round or 1),
        "--circuit-id", args.circuit,
        "--circuit-name", circuit_config['name'],
        "--country", circuit_config['country'],
        "--race-date", race_date,
        "--start-time", args.start_time or defaults['start_time'],
        "--timezone", circuit_config['timezone'],
        "--laps", str(circuit_config['laps']),
        "--track-length-km", str(circuit_config['track_length_km']),
        "--lat", str(circuit_config['lat']),
        "--lon", str(circuit_config['lon']),
        "--altitude-m", str(circuit_config['altitude_m']),
        "--drs-zones", str(circuit_config['drs_zones']),
        "--overtake-index", str(circuit_config['overtake_index']),
        "--pit-lane-loss-s", str(circuit_config['pit_lane_loss_s']),
        "--sc-prob", str(circuit_config['sc_prob']),
        "--vsc-prob", str(circuit_config['vsc_prob']),
        "--sc-avg-count", str(circuit_config['sc_avg_count']),
        "--retire-prob", str(circuit_config['retire_prob']),
        "--tyre-stress", str(circuit_config['tyre_stress']),
        "--asphalt-grip", str(circuit_config['asphalt_grip']),
        "--asphalt-roughness", str(circuit_config['asphalt_roughness']),
        "--out", f"{args.output or defaults['output_dir']}/race_features.csv"
    ]
    
    if args.insecure:
        race_cmd.append("--insecure")
        
    return driver_cmd, race_cmd

def main():
    parser = argparse.ArgumentParser(
        description="F1 ETL Orchestra - Execute all ETL pipelines",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate data for Monza 2024 (using configuration)
  python etl/make_all.py --circuit monza --season 2024 --round 16
  
  # Generate data with custom date and session
  python etl/make_all.py --circuit silverstone --date 2024-07-07 --session Qualifying
  
  # Generate with custom event name (FastF1)
  python etl/make_all.py --circuit spa --event Belgium --season 2024
        """
    )
    
    # Required arguments
    parser.add_argument('--circuit', required=True, help='Circuit ID from configuration')
    
    # Optional identification
    parser.add_argument('--season', type=int, help='F1 season year')
    parser.add_argument('--round', type=int, help='F1 round number')
    parser.add_argument('--event', help='Event name for FastF1 (alternative to round)')
    parser.add_argument('--date', help='Race date (YYYY-MM-DD)')
    
    # ETL options
    parser.add_argument('--session', help='FastF1 session name (default: FP2)')
    parser.add_argument('--start-time', help='Race start time (default: 15:00)')
    parser.add_argument('--cache', help='FastF1 cache directory')
    parser.add_argument('--output', help='Output directory for CSVs')
    parser.add_argument('--insecure', action='store_true', help='Disable SSL verification')
    
    # Control options
    parser.add_argument('--skip-drivers', action='store_true', help='Skip session_driver ETL')
    parser.add_argument('--skip-race', action='store_true', help='Skip race_features ETL')
    parser.add_argument('--skip-validation', action='store_true', help='Skip cross-validation')
    parser.add_argument('--config', default='etl/circuits.yaml', help='Configuration file path')
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    
    # Validate arguments
    if not validate_args(args, config):
        sys.exit(1)
        
    # Build commands
    driver_cmd, race_cmd = build_commands(args, config)
    if not driver_cmd or not race_cmd:
        sys.exit(1)
        
    # Execute ETL pipelines
    success = True
    output_dir = args.output or config['defaults']['output_dir']
    os.makedirs(output_dir, exist_ok=True)
    
    if not args.skip_drivers:
        success &= run_etl_command(driver_cmd, "Session driver data extraction (FastF1)")
        
    if not args.skip_race and success:
        success &= run_etl_command(race_cmd, "Race features extraction (Open-Meteo)")
        
    # Cross-validation
    if not args.skip_validation and success:
        driver_file = f"{output_dir}/session_driver.csv"
        race_file = f"{output_dir}/race_features.csv"
        success &= cross_validate_outputs(driver_file, race_file)
        
    # Summary
    if success:
        logger.info("🎉 ETL pipeline completed successfully!")
        logger.info(f"Output files: {output_dir}/session_driver.csv, {output_dir}/race_features.csv")
        if not args.skip_validation:
            logger.info("Use tools/converter.html or scripts/convert_new_to_legacy.js to generate legacy CSV for the UI")
    else:
        logger.error("❌ ETL pipeline failed!")
        sys.exit(1)

if __name__ == '__main__':
    main()
