
import sys
import os
try:
    from scraper_logic import ScraperEngine
    print("Imported ScraperEngine successfully.")
except ImportError:
    # Add current directory to path if needed
    sys.path.append(os.getcwd())
    from scraper_logic import ScraperEngine
    print("Imported ScraperEngine after path adjustment.")

def test():
    print("Testing ScraperEngine setup_driver...")
    try:
        scraper = ScraperEngine()
        scraper.setup_driver()
        print("Driver setup successful!")
        if scraper.driver:
            scraper.driver.quit()
            print("Driver quit successful.")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test()
