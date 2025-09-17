#!/usr/bin/env python3
import argparse
import os
import math
import statistics as stats
import pandas as pd
import logging
import time
import urllib3
import ssl
import certifi

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def configure_ssl_for_fastf1(insecure=False, ca_bundle: str|None=None, proxy: str|None=None):
    """Configure SSL/proxy for FastF1 and underlying requests.
    - insecure=True: disable verification (temporary workaround).
    - ca_bundle=path: use custom CA pem for verification (preferred).
    - proxy='http://host:port' or 'https://host:port': route traffic via proxy.
    """
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry

    # Proxies
    proxies = None
    if proxy:
        proxies = { 'http': proxy, 'https': proxy }
        os.environ['HTTP_PROXY'] = proxy
        os.environ['HTTPS_PROXY'] = proxy
        logger.info(f"Using proxy {proxy}")

    # Verification
    verify_opt: bool|str
    if insecure:
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        verify_opt = False
        logger.warning("SSL verification disabled (insecure) — use only in trusted environments")
    elif ca_bundle:
        if not os.path.exists(ca_bundle):
            raise FileNotFoundError(f"CA bundle not found: {ca_bundle}")
        os.environ['REQUESTS_CA_BUNDLE'] = ca_bundle
        os.environ['SSL_CERT_FILE'] = ca_bundle
        verify_opt = ca_bundle
        logger.info(f"Using custom CA bundle: {ca_bundle}")
    else:
        verify_opt = True
        logger.info("Using system/certifi trust store")

    # Shared session with retries
    session = requests.Session()
    session.verify = verify_opt
    if proxies:
        session.proxies.update(proxies)
    retry_strategy = Retry(total=3, status_forcelist=[429,500,502,503,504], allowed_methods=["HEAD","GET","OPTIONS"], backoff_factor=0.5)
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    # Monkeypatch requests.Session.request to default verify/proxies when not supplied
    orig_request = requests.sessions.Session.request
    def _patched_request(self, method, url, **kwargs):
        kwargs.setdefault('verify', verify_opt)
        if proxies:
            kwargs.setdefault('proxies', proxies)
        return orig_request(self, method, url, **kwargs)
    requests.sessions.Session.request = _patched_request
    logger.info("Patched requests.Session.request with default verify/proxies")

    # Patch FastF1 request paths
    fastf1, _ = try_import_fastf1()
    if not fastf1:
        return
    try:
        if hasattr(fastf1, 'req') and hasattr(fastf1.req, 'requests_get'):
            def patched_requests_get(url, **kwargs):
                kwargs.setdefault('verify', verify_opt)
                if proxies:
                    kwargs.setdefault('proxies', proxies)
                return session.get(url, **kwargs)
            fastf1.req.requests_get = patched_requests_get
            logger.info("Patched fastf1.req.requests_get")
        if hasattr(fastf1.req, 'Cache') and hasattr(fastf1.req.Cache, 'requests_get'):
            def patched_cache_get(url, **kwargs):
                kwargs.setdefault('verify', verify_opt)
                if proxies:
                    kwargs.setdefault('proxies', proxies)
                return session.get(url, **kwargs)
            fastf1.req.Cache.requests_get = patched_cache_get
            logger.info("Patched fastf1.req.Cache.requests_get")
        if hasattr(fastf1.req, '_CACHE_SESSION'):
            try:
                fastf1.req._CACHE_SESSION.verify = verify_opt
                if proxies:
                    fastf1.req._CACHE_SESSION.proxies.update(proxies)
            except Exception:
                pass
            logger.info("Patched fastf1.req._CACHE_SESSION")
    except Exception as e:
        logger.warning(f"Could not fully configure FastF1 requests: {e}")

def retry_with_backoff(func, max_retries=3, base_delay=2, *args, **kwargs):
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

def try_import_fastf1():
    try:
        import fastf1
        from fastf1.core import Laps
        return fastf1, Laps
    except Exception as e:
        print("FastF1 not available:", e)
        return None, None

def enable_cache(path:str):
    fastf1, _ = try_import_fastf1()
    if fastf1 is None:
        return
    os.makedirs(path, exist_ok=True)
    fastf1.Cache.enable_cache(path)

def estimate_longrun_pace(laps_df: pd.DataFrame) -> float:
    df = laps_df.copy()
    if df.empty:
        return float('nan')
    
    # Filter out pit laps - check for different column names depending on FastF1 version
    pit_columns = []
    if 'PitOutLap' in df.columns:
        pit_columns.append('PitOutLap')
    if 'PitInLap' in df.columns:
        pit_columns.append('PitInLap')
    if 'IsPersonalBest' in df.columns:
        # Alternative: filter out laps that are not representative
        df = df[df['IsPersonalBest'] == False]
    elif pit_columns:
        # Use pit lap columns if available
        pit_filter = ~df[pit_columns[0]]
        for col in pit_columns[1:]:
            pit_filter &= ~df[col]
        df = df[pit_filter]
    
    df = df[df['LapTime'].notna()]
    if df.empty:
        return float('nan')
    s = df['LapTime'].dt.total_seconds()
    s = s[(s > s.quantile(0.1)) & (s < s.quantile(0.9))]
    if s.empty:
        return float('nan')
    return round(float(s.median()), 3)

def _resolve_session(fastf1, season:int, event:str|None, rnd:int|None, session_name:str):
    last_err = None
    if event:
        try:
            return fastf1.get_session(season, event, session_name)
        except Exception as e:
            last_err = e
    if rnd is not None:
        try:
            return fastf1.get_session(season, rnd, session_name)
        except Exception as e:
            last_err = e
    raise last_err or RuntimeError("Could not resolve session by event or round")

def _z(values: list[float]):
    vals = [v for v in values if isinstance(v, (int,float)) and v==v]
    if len(vals) < 2:
        return {i: float('nan') for i,_ in enumerate(values)}
    mu = stats.mean(vals)
    sd = stats.pstdev(vals) or 1.0
    return {i: (v - mu)/sd if (isinstance(v,(int,float)) and v==v) else float('nan') for i,v in enumerate(values)}

def validate_session_data(session, laps):
    """Validate FastF1 session and laps data."""
    if session is None:
        raise ValueError("Session object is None")
    
    if laps.empty:
        raise ValueError("No lap data available")
    
    # Check for essential columns
    required_cols = ['Driver', 'LapTime']
    missing_cols = [col for col in required_cols if col not in laps.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    
    driver_count = len(laps['Driver'].unique())
    if driver_count == 0:
        raise ValueError("No drivers found in lap data")
    
    logger.info(f"Session validation passed: {driver_count} drivers, {len(laps)} laps")
    return True

def make(args):
    """Main function with improved SSL handling."""
    fastf1, Laps = try_import_fastf1()
    if fastf1 is None:
        raise SystemExit("Install FastF1: pip install -r etl/requirements.txt")
    
    # Configure SSL settings
    configure_ssl_for_fastf1(getattr(args, 'insecure', False), getattr(args, 'ca_bundle', None), getattr(args, 'proxy', None))
    enable_cache(args.cache)
    
    logger.info(f"Starting session data extraction for {args.season} {args.event or args.round} {args.session}")
    
    # Use retry logic for session resolution and loading
    def _load_session():
        session = _resolve_session(fastf1, args.season, args.event, args.round, args.session)
        session.load(telemetry=False, weather=False)
        return session
    
    try:
        session = retry_with_backoff(_load_session, max_retries=3, base_delay=3)
        # Fix for FastF1 API change: pick_drivers() now requires identifiers
        laps: pd.DataFrame = session.laps.copy()
        logger.info(f"✅ FastF1 data extraction successful - loaded {len(laps)} laps")
        
    except Exception as e:
        logger.error(f"❌ FastF1 data extraction failed: {e}")
        logger.info("Consider using --insecure flag if SSL errors persist")
        raise
    # best quali gap approximation if session is Qualifying
    qualy_best = None
    if args.session.lower().startswith('q'):
        laps_ = laps[laps['LapTime'].notna()].copy()
        laps_['sec'] = laps_['LapTime'].dt.total_seconds()
        if not laps_.empty:
            p_min = laps_.groupby('Driver')['sec'].min()
            pole = p_min.min()
            qualy_best = (p_min - pole)
    # compute long-run pace from FP sessions
    longrun = {}
    for drv, drv_laps in laps.groupby('Driver'):
        longrun[drv] = estimate_longrun_pace(drv_laps)
    # grid positions not known from FP; try classification order from session results
    grid_map = {}
    if hasattr(session, 'results') and session.results is not None:
        for _, row in session.results.iterrows():
            if pd.notna(row.get('Abbreviation')):
                grid_pos = row.get('GridPosition')
                if pd.notna(grid_pos) and grid_pos != '':
                    try:
                        grid_map[row['Abbreviation']] = int(float(grid_pos))
                    except (ValueError, TypeError):
                        grid_map[row['Abbreviation']] = 0
                else:
                    grid_map[row['Abbreviation']] = 0
    # Straightline index: use best available speed metric per driver, convert to z-score
    speed_cols = [c for c in ['SpeedST','SpeedFL','SpeedI1','SpeedI2','SpeedI3'] if c in laps.columns]
    speed_best = {}
    if speed_cols:
        agg = laps[['Driver'] + speed_cols].groupby('Driver').max(numeric_only=True)
        for drv, row in agg.iterrows():
            vals = [row[c] for c in speed_cols if pd.notna(row[c])]
            speed_best[drv] = max(vals) if vals else float('nan')
        # z-score across field
        order = sorted(speed_best.keys())
        zmap = _z([speed_best[d] for d in order])
        speed_best = {order[i]: zmap[i] for i in range(len(order))}
    # build output rows
    rows = []
    for drv in sorted(laps['Driver'].unique()):
        dr_name = session.get_driver(drv)['FullName'] if hasattr(session, 'get_driver') else drv
        team_name = None
        try:
            team_name = laps[laps['Driver']==drv]['Team'].mode().iloc[0]
        except Exception:
            team_name = ''
        row = {
            'driver_id': drv.lower(),
            'driver_name': dr_name,
            'team_id': (team_name or '').lower().replace(' ','_'),
            'team_name': team_name or '',
            'grid_position': grid_map.get(drv, 0),
            'qualy_position': 0,
            'qualy_gap_ms': None if qualy_best is None or drv not in qualy_best else int(round(1000*qualy_best[drv])),
            'fp_longrun_pace_s': longrun.get(drv, float('nan')),
            'straightline_index': float('nan'),
            'cornering_index': float('nan'),
            'pit_crew_mean_s': float('nan'),
            'dnf_rate': float('nan')
        }
        if drv in speed_best and pd.notna(speed_best[drv]):
            row['straightline_index'] = float(speed_best[drv])
        # cornering proxy: inverse z of best lap time (smaller = better -> positive index)
        try:
            drv_best = laps[(laps['Driver']==drv) & laps['LapTime'].notna()]['LapTime'].dt.total_seconds().min()
        except Exception:
            drv_best = float('nan')
        # compute z across drivers
        # gather once per loop end; here we just store raw and normalize later
        row['__best_lap_sec'] = drv_best
        rows.append(row)
    out = pd.DataFrame(rows)
    # finalize cornering_index as -z(best lap) to make faster laps -> higher index
    if '__best_lap_sec' in out.columns:
        vals = out['__best_lap_sec'].tolist()
        zmap = _z(vals)
        out['cornering_index'] = [-zmap[i] if zmap[i]==zmap[i] else float('nan') for i in range(len(vals))]
        out = out.drop(columns=['__best_lap_sec'])
    
    # Final data validation
    if out.empty:
        raise ValueError("No driver data generated")
    
    # Check for reasonable ranges
    pace_vals = out['fp_longrun_pace_s'].dropna()
    if not pace_vals.empty:
        if pace_vals.min() < 60 or pace_vals.max() > 200:
            logger.warning(f"Unusual lap times detected: {pace_vals.min():.1f}s - {pace_vals.max():.1f}s")
    
    logger.info(f"Final validation: {len(out)} drivers processed successfully")
    out.to_csv(args.out, index=False)
    logger.info(f"Wrote {args.out} ({len(out)} drivers)")

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--season', type=int, required=True)
    ap.add_argument('--event', type=str, help='e.g., Italy or Monza')
    ap.add_argument('--round', type=int, help='F1 round number (alternative to --event)')
    ap.add_argument('--session', type=str, default='FP2')
    ap.add_argument('--cache', type=str, default='./fastf1_cache')
    ap.add_argument('--out', type=str, required=True)
    ap.add_argument('--insecure', action='store_true', help='Disable SSL verification (temporary workaround)')
    ap.add_argument('--ca-bundle', dest='ca_bundle', help='Path to corporate/root CA PEM to trust')
    ap.add_argument('--proxy', help='HTTP(S) proxy URL, e.g. http://proxy.corp.local:8080')
    args = ap.parse_args()
    make(args)
