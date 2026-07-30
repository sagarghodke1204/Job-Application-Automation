import asyncio
import sys
import os
from starlette.concurrency import run_in_threadpool

sys.path.append(os.getcwd())
from scraper_logic import ScraperEngine

def sync_setup():
    print("Testing inside threadpool")
    scraper = ScraperEngine()
    scraper.setup_driver()
    if scraper.driver:
        scraper.driver.quit()
    print("Done")

async def main():
    print("Starting")
    await run_in_threadpool(sync_setup)
    print("Finished")

if __name__ == '__main__':
    asyncio.run(main())
