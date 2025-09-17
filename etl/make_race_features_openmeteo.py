#!/usr/bin/env python3
import argparse
import datetime as dt
import requests
from datetime import datetime, timezone
import pandas as pd
import time
import logging
import urllib3
import ssl
import certifi

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def configure_ssl_context(verify_ssl=True):
    """Configure SSL context with proper certificate handling."""
    if not verify_ssl:
        # Disable SSL warnings when verification is disabled
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        logger.warning("SSL verification disabled - use only in trusted environments")
        return False
    
    # Try to use system certificates first, then fallback to certifi
    try:
        # Test SSL connection with system certificates
        ssl_context = ssl.create_default_context()
        return True
    except Exception as e:
        logger.warning(f"System SSL context failed: {e}")
        try:
            # Fallback to certifi certificates
            ssl_context = ssl.create_default_context(cafile=certifi.where())
            logger.info("Using certifi certificate bundle")
            return True
        except Exception as e:
            logger.error(f"SSL configuration failed: {e}")
            return False

def retry_with_backoff(func, max_retries=3, base_delay=1, *args, **kwargs):
    """Execute function with exponential backoff retry logic."""
    for attempt in range(max_retries + 1):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            if attempt == max_retries:
                logger.error(f"Final retry failed for {func.__name__}: {e}")
                raise
            
            delay = base_delay * (2 ** attempt)
            logger.warning(f"Attempt {attempt + 1} failed for {func.__name__}: {e}. Retrying in {delay}s...")
            time.sleep(delay)

def fetch_openmeteo(lat, lon, date_local, verify=True):
    """Fetch weather data with improved SSL handling and retry logic."""
    def _fetch_api():
        start = dt.datetime.strptime(date_local, '%Y-%m-%d')
        today = datetime.now(timezone.utc).date()
        
        # Determine API endpoint and parameters
        if start.date() <= today:
            params = {
                'latitude': lat,
                'longitude': lon,
                'hourly': 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability',
                'start_date': start.strftime('%Y-%m-%d'),
                'end_date': start.strftime('%Y-%m-%d'),
                'timezone': 'auto'
            }
            url = 'https://archive-api.open-meteo.com/v1/archive'
        else:
            params = {
                'latitude': lat,
                'longitude': lon,
                'hourly': 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability',
                'forecast_days': 7,
                'timezone': 'auto'
            }
            url = 'https://api.open-meteo.com/v1/forecast'
        
        logger.info(f"Fetching weather data from {url} for {lat},{lon} on {date_local}")
        
        # Create session with proper SSL configuration
        session = requests.Session()
        
        if verify:
            # Try multiple SSL configurations
            for attempt, ssl_config in enumerate([
                {'verify': True},  # System certificates
                {'verify': certifi.where()},  # Certifi bundle
                {'verify': True, 'cert': None}  # Default with no client cert
            ], 1):
                try:
                    logger.debug(f"SSL attempt {attempt}: {ssl_config}")
                    response = session.get(url, params=params, timeout=30, **ssl_config)
                    response.raise_for_status()
                    logger.info("✅ Open-Meteo API request successful")
                    return response.json()
                except requests.exceptions.SSLError as e:
                    logger.warning(f"SSL attempt {attempt} failed: {e}")
                    if attempt == 3:  # Last attempt
                        logger.error("All SSL configurations failed, falling back to insecure")
                        raise
                except Exception as e:
                    logger.error(f"Request failed: {e}")
                    raise
        else:
            # Insecure mode
            logger.warning("Using insecure SSL mode")
            response = session.get(url, params=params, timeout=30, verify=False)
            response.raise_for_status()
            logger.info("✅ Open-Meteo API request successful (insecure)")
            return response.json()
    
    return retry_with_backoff(_fetch_api, max_retries=3, base_delay=2)

def validate_weather_data(json_data):
    """Validate weather API response data."""
    if not json_data:
        raise ValueError("Empty weather response")
    
    if 'hourly' not in json_data:
        raise ValueError("Missing 'hourly' section in weather data")
    
    required_fields = ['precipitation_probability', 'time']
    for field in required_fields:
        if field not in json_data['hourly']:
            logger.warning(f"Missing {field} in weather data")
    
    logger.info("Weather data validation passed")

def rain_prob_at(json_data, hour_local:int):
    try:
        prob = json_data['hourly']['precipitation_probability']
        time = json_data['hourly']['time']
        # pick exact hour if available else closest
        idx = min(range(len(time)), key=lambda i: abs(int(time[i][-5:-3]) - hour_local))
        return float(prob[idx])/100.0
    except Exception:
        return float('nan')

def main(args):
    out = {
        'race_id': args.race_id,
        'season': args.season,
        'round': args.round,
        'circuit_id': args.circuit_id,
        'circuit_name': args.circuit_name,
        'country': args.country,
        'date_local': args.race_date,
        'start_time_local': args.start_time,
        'timezone': args.timezone,
        'laps': args.laps,
        'track_length_km': args.track_length_km,
        'altitude_m': args.altitude_m,
        'drs_zones': args.drs_zones,
        'overtake_index': args.overtake_index,
        'pit_lane_loss_s': args.pit_lane_loss_s,
        'sc_prob': args.sc_prob,
        'vsc_prob': args.vsc_prob,
        'sc_avg_count': args.sc_avg_count,
        'retire_prob': args.retire_prob,
        'tyre_stress': args.tyre_stress,
        'asphalt_grip': args.asphalt_grip,
        'asphalt_roughness': args.asphalt_roughness,
        'track_temp_typical_c': '',
        'wind_typical_kph': '',
        'rain_prob': ''
    }
    try:
        logger.info(f"Starting weather data fetch for {args.race_id}")
        js = fetch_openmeteo(args.lat, args.lon, args.race_date, verify=not args.insecure)
        validate_weather_data(js)
        rp = rain_prob_at(js, int(args.start_time.split(':')[0]))
        out['rain_prob'] = round(rp, 3) if rp==rp else ''
        logger.info(f"Weather data successfully processed. Rain probability: {out['rain_prob']}")
    except Exception as e:
        logger.error(f'Weather fetch failed for {args.race_id}: {e}')
        out['rain_prob'] = ''  # Fallback to empty value
    pd.DataFrame([out]).to_csv(args.out, index=False)
    print(f"Wrote {args.out}")

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--race-id', dest='race_id', required=True)
    ap.add_argument('--season', type=int, required=True)
    ap.add_argument('--round', type=int, required=True)
    ap.add_argument('--circuit-id', dest='circuit_id', required=True)
    ap.add_argument('--circuit-name', dest='circuit_name', required=True)
    ap.add_argument('--country', required=True)
    ap.add_argument('--race-date', dest='race_date', required=True)
    ap.add_argument('--start-time', dest='start_time', required=True)
    ap.add_argument('--timezone', default='Europe/Rome')
    ap.add_argument('--laps', type=int, required=True)
    ap.add_argument('--track-length-km', type=float, required=True)
    ap.add_argument('--altitude-m', type=int, default=0)
    ap.add_argument('--drs-zones', type=int, default=2)
    ap.add_argument('--overtake-index', type=float, default=0.5)
    ap.add_argument('--pit-lane-loss-s', type=float, default=20.0)
    ap.add_argument('--sc-prob', type=float, default=0.3)
    ap.add_argument('--vsc-prob', type=float, default=0.2)
    ap.add_argument('--sc-avg-count', type=float, default=1.0)
    ap.add_argument('--retire-prob', type=float, default=0.08)
    ap.add_argument('--tyre-stress', type=int, default=3)
    ap.add_argument('--asphalt-grip', type=int, default=3)
    ap.add_argument('--asphalt-roughness', type=int, default=2)
    ap.add_argument('--lat', type=float, required=True)
    ap.add_argument('--lon', type=float, required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--insecure', action='store_true', help='Disable TLS verification (only if you trust your network)')
    args = ap.parse_args()
    main(args)
