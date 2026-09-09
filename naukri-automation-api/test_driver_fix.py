import sys
import os
import time

from scraper_logic import ScraperEngine
from application_logic import ApplicationEngine

def test():
    print("--- TEST 1: ScraperEngine Driver Setup ---")
    scraper = ScraperEngine()
    scraper.setup_driver()
    print("Scraper driver setup successful!")
    if scraper.driver:
        scraper.driver.quit()
        scraper.driver = None
    print("Scraper driver quit successfully.")

    print("\n--- TEST 2: Rapid ApplicationEngine Driver Setup (Back to Back) ---")
    app_engine = ApplicationEngine()
    app_engine._setup_driver()
    print("Application driver setup successful!")
    if app_engine.driver:
        app_engine._quit_driver()
    print("Application driver quit successfully.")

    print("\nSUCCESS: Both Scraper and Applicator drivers initialized and quit cleanly without Permission errors!")

if __name__ == "__main__":
    test()
