
import os
import sys
import subprocess
import re
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

_cached_version = None

def get_chrome_version():
    """
    Detects the installed Google Chrome version.
    Supports Linux (Docker) and Windows.
    """
    global _cached_version
    if _cached_version:
        return _cached_version
        
    version = None
    system_platform = sys.platform

    if system_platform == "linux" or system_platform == "linux2":
        # Check specific locations mainly for Docker/Linux environments
        check_commands = [
            ["google-chrome", "--version"],
            ["google-chrome-stable", "--version"],
            ["chromium", "--version"],
            ["chromium-browser", "--version"]
        ]
        
        for cmd in check_commands:
            try:
                output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, timeout=5).decode('utf-8')
                # Extract version like "144.0.7559.59"
                match = re.search(r"(\d+\.\d+\.\d+\.\d+)", output)
                if match:
                    version = match.group(1)
                    break
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue
                
    elif system_platform == "win32":
        # Windows: Check Registry
        try:
            # Try getting version from registry
            cmd = 'reg query "HKEY_CURRENT_USER\\Software\\Google\\Chrome\\BLBeacon" /v version'
            output = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, timeout=5).decode('utf-8')
            match = re.search(r"version\s+REG_SZ\s+(\d+\.\d+\.\d+\.\d+)", output)
            if match:
                version = match.group(1)
        except Exception:
            pass

    _cached_version = version
    return version

def get_driver_path():
    """
    Returns the path to the ChromeDriver executable.
    Prioritizes the pre-installed driver in Docker (via env var).
    Falls back to detecting Chrome version and installing via WebDriverManager (local dev).
    """
    # 1. Check for pre-installed driver (Docker / CI)
    env_driver_path = os.environ.get("CHROMEDRIVER_PATH")
    if env_driver_path and os.path.exists(env_driver_path):
        print(f"[INFO] Using pre-installed ChromeDriver at: {env_driver_path}")
        return env_driver_path

    detected_version = get_chrome_version()
    
    if detected_version:
        print(f"[INFO] Detected Chrome Version: {detected_version}")
        try:
            return ChromeDriverManager(driver_version=detected_version).install()
        except Exception as e:
            print(f"[WARNING] Could not install specific driver version {detected_version}: {e}")
            major_version = detected_version.split('.')[0]
            print(f"[INFO] Falling back to major ChromeDriver version {major_version}...")
            try:
                return ChromeDriverManager(driver_version=major_version).install()
            except Exception as e2:
                print(f"[WARNING] Major version fallback failed: {e2}")
                return ChromeDriverManager().install()
    else:
        print("[WARNING] Could not detect Chrome version. Installing latest ChromeDriver...")
        return ChromeDriverManager().install()

def get_chrome_major_version():
    """Returns the major version of Chrome as an integer, or None if detection fails."""
    version = get_chrome_version()
    if version:
        try:
            return int(version.split('.')[0])
        except Exception:
            return None
    return None
