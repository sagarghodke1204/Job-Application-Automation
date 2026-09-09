import os
import sys
import time
import shutil
import tempfile
import subprocess
import re
from webdriver_manager.chrome import ChromeDriverManager

_cached_version = None

def kill_zombie_chromedriver_processes():
    """
    Terminates any orphaned background chromedriver.exe processes on Windows.
    This releases Windows file locks on chromedriver executables.
    """
    if sys.platform == "win32":
        try:
            creation_flags = getattr(subprocess, 'CREATE_NO_WINDOW', 0x08000000)
            subprocess.run(
                ["taskkill", "/F", "/IM", "chromedriver.exe", "/T"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=creation_flags
            )
        except Exception as e:
            print(f"[WARNING] Process cleanup warning: {e}")

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

    if system_platform in ["linux", "linux2"]:
        check_commands = [
            ["google-chrome", "--version"],
            ["google-chrome-stable", "--version"],
            ["chromium", "--version"],
            ["chromium-browser", "--version"]
        ]
        
        for cmd in check_commands:
            try:
                output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, timeout=5).decode('utf-8')
                match = re.search(r"(\d+\.\d+\.\d+\.\d+)", output)
                if match:
                    version = match.group(1)
                    break
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue
                
    elif system_platform == "win32":
        try:
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

def create_stealth_driver(options=None, headless=True, max_retries=3, log_fn=print):
    """
    Centralized, resilient driver creator using undetected_chromedriver.
    Handles zombie process cleanup, permission fallback copies, and retries.
    """
    import undetected_chromedriver as uc
    
    driver_path = get_driver_path()
    major_version = get_chrome_major_version()
    
    if options is None:
        options = uc.ChromeOptions()
        
    for attempt in range(1, max_retries + 1):
        try:
            # Pre-flight cleanup before opening driver
            kill_zombie_chromedriver_processes()
            time.sleep(0.5)
            
            log_fn(f"[DEBUG] Initializing uc.Chrome (Attempt {attempt}/{max_retries})...")
            
            kwargs = {
                "options": options,
                "headless": headless,
                "use_subprocess": True,
                "driver_executable_path": driver_path
            }
            if major_version:
                kwargs["version_main"] = major_version

            driver = uc.Chrome(**kwargs)
            return driver

        except PermissionError as pe:
            log_fn(f"[WARNING] PermissionError on attempt {attempt}: {pe}")
            kill_zombie_chromedriver_processes()
            time.sleep(1.0)

            # Isolated fallback copy if .wdm path is locked
            if attempt == max_retries:
                try:
                    temp_dir = os.path.join(tempfile.gettempdir(), "naukri_chromedriver_isolated")
                    os.makedirs(temp_dir, exist_ok=True)
                    fallback_driver_path = os.path.join(temp_dir, "chromedriver.exe")
                    log_fn(f"[INFO] Copying driver to isolated path: {fallback_driver_path}")
                    shutil.copy2(driver_path, fallback_driver_path)
                    kwargs["driver_executable_path"] = fallback_driver_path
                    return uc.Chrome(**kwargs)
                except Exception as fe:
                    log_fn(f"[CRITICAL] Fallback driver creation failed: {fe}")
                    raise pe
        except Exception as e:
            log_fn(f"[WARNING] Driver creation attempt {attempt} failed: {e}")
            kill_zombie_chromedriver_processes()
            time.sleep(1.0)
            if attempt == max_retries:
                raise e
