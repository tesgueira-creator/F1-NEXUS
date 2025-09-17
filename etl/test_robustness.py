#!/usr/bin/env python3
"""
Test script to validate ETL improvements with real data from past seasons.
"""

import subprocess
import sys
import os
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_monza_2024():
    """Test ETL pipeline with Monza 2024 data."""
    logger.info("Testing ETL pipeline with Monza 2024 data")
    
    cmd = [
        sys.executable, "etl/make_all.py",
        "--circuit", "monza",
        "--season", "2024", 
        "--round", "16",
        "--output", "build/test"
    ]
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=600)
        logger.info("✅ Monza 2024 test passed")
        logger.info(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Monza 2024 test failed: {e}")
        if e.stderr:
            logger.error(e.stderr)
        return False
    except subprocess.TimeoutExpired:
        logger.error("❌ Test timed out after 10 minutes")
        return False

def test_legacy_conversion():
    """Test conversion from new schema to legacy format."""
    logger.info("Testing legacy CSV conversion")
    
    cmd = [
        "node", "scripts/convert_new_to_legacy.js",
        "--drivers", "build/test/session_driver.csv",
        "--race", "build/test/race_features.csv", 
        "--out", "build/test/legacy_test.csv"
    ]
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=30)
        logger.info("✅ Legacy conversion test passed")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Legacy conversion failed: {e}")
        if e.stderr:
            logger.error(e.stderr)
        return False

def test_silverstone_2024():
    """Test with different circuit (Silverstone)."""
    logger.info("Testing with Silverstone 2024 data")
    
    cmd = [
        sys.executable, "etl/make_all.py",
        "--circuit", "silverstone",
        "--date", "2024-07-07",
        "--season", "2024",
        "--round", "10",  
        "--output", "build/test_silverstone"
    ]
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=600)
        logger.info("✅ Silverstone 2024 test passed")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Silverstone 2024 test failed: {e}")
        return False

def main():
    """Run all tests."""
    logger.info("🧪 Starting ETL robustness tests")
    
    # Create test output directory
    os.makedirs("build/test", exist_ok=True)
    os.makedirs("build/test_silverstone", exist_ok=True)
    
    tests = [
        ("Monza 2024 ETL", test_monza_2024),
        ("Legacy conversion", test_legacy_conversion),
        ("Silverstone 2024 ETL", test_silverstone_2024)
    ]
    
    results = []
    for test_name, test_func in tests:
        logger.info(f"Running: {test_name}")
        success = test_func()
        results.append((test_name, success))
        
        if not success:
            logger.error(f"Test failed: {test_name}")
    
    # Summary
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    logger.info(f"\n{'='*50}")
    logger.info(f"Test Results: {passed}/{total} passed")
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"  {status} - {test_name}")
    
    if passed == total:
        logger.info("🎉 All tests passed! ETL robustness implementations are working correctly.")
        return 0
    else:
        logger.error("❌ Some tests failed. Please check the logs above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
