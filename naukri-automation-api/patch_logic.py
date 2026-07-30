import re

# PATCH SCRAPER_LOGIC.PY
with open('scraper_logic.py', 'r') as f:
    sc = f.read()

sc = sc.replace('def __init__(self, log_callback=None):', 'def __init__(self, log_callback=None, pause_check=None):\n        self.pause_check = pause_check')

# Insert self.pause_check() before processing each card
old_card_loop = '''for card in cards:
                        try:
                            date_text = card.find_element(By.CSS_SELECTOR, ".job-post-day").text'''
new_card_loop = '''for card in cards:
                        if self.pause_check: self.pause_check()
                        try:
                            date_text = card.find_element(By.CSS_SELECTOR, ".job-post-day").text'''
sc = sc.replace(old_card_loop, new_card_loop)

# Also inside pagination loop
old_page_loop = '''for page_num in range(1, 11): 
                    self.log(f"  [Page {page_num}] scanning...")'''
new_page_loop = '''for page_num in range(1, 11): 
                    if self.pause_check: self.pause_check()
                    self.log(f"  [Page {page_num}] scanning...")'''
sc = sc.replace(old_page_loop, new_page_loop)

with open('scraper_logic.py', 'w') as f:
    f.write(sc)


# PATCH APPLICATION_LOGIC.PY
with open('application_logic.py', 'r') as f:
    ac = f.read()

ac = ac.replace('def __init__(self, log_callback=None):', 'def __init__(self, log_callback=None, pause_check=None):\n        self.pause_check = pause_check')

# Insert self.pause_check() inside jobs loop
old_job_loop = '''for job in jobs:
                job_id = job['id']; link = job.get('Apply_Link', '')'''
new_job_loop = '''for job in jobs:
                if self.pause_check: self.pause_check()
                job_id = job['id']; link = job.get('Apply_Link', '')'''
ac = ac.replace(old_job_loop, new_job_loop)

with open('application_logic.py', 'w') as f:
    f.write(ac)

print("Patched logic files successfully")
