# ==============================================================================
# File: scraper_logic.py
# Description: FULL ScraperEngine using UNDETECTED-CHROMEDRIVER.
#              UPDATED: Strict Freshness (Max 1 Day) + Stealth Mode + Full Parsing.
# ==============================================================================
import time
import random
import re
import json
import os
from datetime import datetime
from difflib import SequenceMatcher
from typing import Dict, Any, List

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import SessionNotCreatedException
from webdriver_manager.chrome import ChromeDriverManager
from chrome_utils import get_driver_path, get_chrome_major_version, create_stealth_driver, kill_zombie_chromedriver_processes

# ---------------------------
# Helper utilities
# ---------------------------
def sanitize_text_for_csv(s: str) -> str:
    if s is None: return ""
    out = " ".join(str(s).split())
    out = out.replace(",", ";") 
    return out.strip()

EXCLUDED_KEYWORDS = [
    "tele caller",
    "voice process",
    "inside sales executive",
    "billing assistant and cashier",
    "international non voice process - up to 38k ctc",
    "walk-in drive freshers - mba-hr - 25/26 passout",
    "bpo team lead - immediate",
    "we're hiring customer associate us healthcare process (voice/chat)",
    "csr - international voice - bangalore /pune /mumbai - night shifts !!!",
    "human resource executive intern",
    "customer support executive officer",
    "area sales executive",
    "hr executive",
    "bpo team lead / telesales executive",
    "customer care executive",
    "sales",
    "sales officer",
    "sales executive",
    "service executive",
    "digital  marketing",
    "international voice"
]

def is_excluded_role(title: str) -> bool:
    if not title: return False
    title_lower = " ".join(title.lower().split())
    
    # 1. First check if it matches the excluded roles EXACTLY
    for kw in EXCLUDED_KEYWORDS:
        kw_clean = " ".join(kw.lower().split())
        if title_lower == kw_clean:
            return True
            
    # 2. After that, check if any excluded keyword is present inside the title
    for kw in EXCLUDED_KEYWORDS:
        kw_clean = " ".join(kw.lower().split())
        # Use regex word boundaries that work with non-alphanumeric edges
        pattern = r'(?<![a-z0-9])' + re.escape(kw_clean) + r'(?![a-z0-9])'
        if re.search(pattern, title_lower):
            return True
            
    return False

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()

def compute_tech_score(text: str, tech_keywords: list, fallback_roles: list = None) -> float:
    txt = (text or "").lower()
    cleaned_keywords = [k.strip().lower() for k in (tech_keywords or []) if k.strip()]
    if not cleaned_keywords and fallback_roles:
        for r in fallback_roles:
            for part in re.split(r"[,/\s]+", r):
                p = part.strip().lower()
                if len(p) >= 3 and p not in cleaned_keywords:
                    cleaned_keywords.append(p)
    if not cleaned_keywords: return 0.0
    matches = set()
    for k in cleaned_keywords:
        if k in txt: matches.add(k)
    denom = len(cleaned_keywords) if cleaned_keywords else 1
    score = (len(matches) / denom) * 100.0
    return round(score, 2)

def months_to_years(m: float) -> float:
    return round(m / 12.0, 2)

def parse_user_experience_input(raw: str) -> dict:
    if not raw or not raw.strip(): return {}
    parts = re.split(r"[,\n;]+", raw)
    out = {}
    level_map = {"beginner": 0.5, "junior": 0.75, "intermediate": 1.5, "mid": 1.5, "senior": 3.0, "expert": 4.0, "lead": 5.0}
    for p in parts:
        p = p.strip()
        if not p: continue
        m = re.search(r"^([A-Za-z0-9\.\+\#\-\s]+?)\s*[\(\[]?\s*([0-9]+(?:\.[0-9]+)?)\s*(y|yr|yrs|years|m|mo|mos|months)?\s*[\)\]]?\s*$", p, flags=re.IGNORECASE)
        if m:
            skill = m.group(1).strip(); num = float(m.group(2)); unit = (m.group(3) or "").lower(); years = num
            if unit and unit.startswith("m"): years = months_to_years(num)
            out[skill] = round(years, 2); continue
        m2 = re.search(r"^([A-Za-z0-9\.\+\#\-\s]+?)\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*(y|yr|yrs|years|m|mo|mos|months)?\s*$", p, flags=re.IGNORECASE)
        if m2:
            skill = m2.group(1).strip(); num = float(m2.group(2)); unit = (m2.group(3) or "").lower(); years = num
            if unit and unit.startswith("m"): years = months_to_years(num)
            out[skill] = round(years, 2); continue
        m3 = re.search(r"^([A-Za-z0-9\.\+\#\-\s]+?)\s+(beginner|junior|intermediate|mid|senior|expert|lead)\b", p, flags=re.IGNORECASE)
        if m3:
            skill = m3.group(1).strip(); lvl = m3.group(2).lower(); out[skill] = level_map.get(lvl, 1.0); continue
        m4 = re.search(r"^([A-Za-z0-9\.\+\#\-\s]+?)\s+([0-9]+(?:\.[0-9]+)?)\s*$", p)
        if m4:
            skill = m4.group(1).strip(); years = float(m4.group(2)); out[skill] = round(years, 2); continue
    normalized = {}
    for k, v in out.items(): normalized[k.strip()] = v
    return normalized

def extract_experience_from_jd(description: str, tech_keywords: list) -> dict:
    if not description: return {}
    desc = description.lower(); jd_exp = {}
    num_pattern = re.compile(r"(\d+(?:\.\d+)?)(?:\+|-?\d*(?:\.\d+)?)?\s*(years|yrs|yr|y|months|mos|mo|m)\b")
    matches = []
    for m in num_pattern.finditer(desc):
        raw_num = float(m.group(1)); unit = m.group(2); years_val = raw_num
        if unit and unit.startswith("m"): years_val = months_to_years(raw_num)
        matches.append((m.start(), m.end(), years_val))
    
    for kw in tech_keywords:
        k = kw.strip().lower()
        if not k: continue
        for m_kw in re.finditer(re.escape(k), desc):
            kw_start, kw_end = m_kw.start(), m_kw.end(); nearest = None; nearest_dist = None
            for (s, e, years_val) in matches:
                if (s >= kw_start - 80 and s <= kw_end + 80) or (kw_start >= s - 80 and kw_start <= e + 80):
                    dist = min(abs(s - kw_end), abs(kw_start - e), abs((s+e)//2 - (kw_start+kw_end)//2))
                    if (nearest is None) or (dist < nearest_dist): nearest = years_val; nearest_dist = dist
            if nearest is not None:
                existing = jd_exp.get(k)
                if existing is None or nearest > existing: jd_exp[k] = round(nearest, 2)
    
    range_pattern = re.compile(r"(\d{1,2})\s*-\s*(\d{1,2})\s*(?:years|yrs|yr)\s+(?:of\s+)?(?:experience\s+)?(?:in|with)?\s+([A-Za-z0-9\.\+\#\-\s]+)", flags=re.IGNORECASE)
    for m in range_pattern.finditer(description):
        low = float(m.group(1)); high = float(m.group(2)); skill = m.group(3).strip().lower(); avg = round((low + high) / 2.0, 2)
        for kw in tech_keywords:
            if kw.strip().lower() in skill:
                existing = jd_exp.get(kw.strip().lower())
                if existing is None or avg > existing: jd_exp[kw.strip().lower()] = avg
    
    final = {}
    for kw in tech_keywords:
        k_clean = kw.strip(); 
        if not k_clean: continue
        k_lower = k_clean.lower()
        if k_lower in jd_exp: final[k_clean] = jd_exp[k_lower]
    return final

def resolve_experience(user_exp: dict, jd_exp: dict) -> dict:
    out = {}
    if user_exp:
        for s, yrs in user_exp.items(): out[s] = float(yrs)
    for s, yrs in (jd_exp or {}).items():
        s_lower = s.lower(); found_in_user = False
        for uk in out.keys():
            if uk.lower() == s_lower: found_in_user = True; break
        if not found_in_user: out[s] = float(yrs)
    return out

# ---------------------------
# Scraper Engine (Stealth + Full Logic)
# ---------------------------

# --- MEMORY OPTIMIZATION SWITCH (Set to False to Undo) ---
ENABLE_LOW_MEMORY_MODE = True

class ScraperEngine:
    def __init__(self, log_callback=None, pause_check=None):
        self.pause_check = pause_check
        self.driver = None
        self.log_callback = log_callback if log_callback else print
        self.processed_signatures = set()
        self.processed_links = set()
        if not os.path.exists("debug_logs"): os.makedirs("debug_logs")

    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        if isinstance(message, dict):
            self.log_callback(message)
        else:
            self.log_callback(f"[{timestamp}] {message}")

    def _save_evidence(self, name_suffix):
        try:
            timestamp = datetime.now().strftime("%H%M%S")
            filename = f"debug_logs/scrape_fail_{name_suffix}_{timestamp}.png"
            self.driver.save_screenshot(filename)
            self.log(f"    [DEBUG] Screenshot saved: {filename}")
        except: pass

    def setup_driver(self):
        if self.driver: return
        self.log("Initializing Scraper Browser (Stealth Headless)...")
        options = uc.ChromeOptions()
        options.add_argument("--disable-popup-blocking")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        
        # Enhanced Memory & Process Optimization Flags
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-infobars")
        options.add_argument("--disable-gpu-shader-disk-cache")
        options.add_argument("--disable-software-rasterizer")
        options.add_argument("--mute-audio")
        options.add_argument("--log-level=3")
        options.add_argument("--disk-cache-size=1")
        options.add_argument("--media-cache-size=1")
        
        if ENABLE_LOW_MEMORY_MODE:
            options.add_argument("--blink-settings=imagesEnabled=false")
            options.add_argument("--renderer-process-limit=2")
            self.log("Scraper Low Memory Mode ENABLED.")
        
        try:
            self.driver = create_stealth_driver(options=options, headless=True, max_retries=3, log_fn=self.log)
            self.log("Browser Ready.")
        except SessionNotCreatedException as e:
            self.log(f"[CRITICAL] SessionNotCreatedException: {e}")
            raise e
        except Exception as e:
            self.log(f"[CRITICAL] Driver setup failed: {e}")
            raise e

    def random_delay(self, min_sec=1.5, max_sec=3.5):
        time.sleep(random.uniform(min_sec, max_sec))

    # --- STRICT FRESHNESS LOGIC ---
    def check_freshness(self, date_text):
        txt = (date_text or "").strip().lower()
        # 1. Accept "Just Now", "Today", "Few Hours Ago"
        if any(x in txt for x in ["just now", "today", "hour", "minute", "second"]): 
            return True
            
        # 2. Accept exactly "1 Day Ago"
        if "1 day" in txt and "1 day ago" in txt: 
            return True
            
        # 3. Reject everything else (2 days, 3 days, etc.)
        return False

    def get_full_description(self, url):
        if not url: return "N/A"
        original = self.driver.current_window_handle
        jd = "N/A"
        try:
            self.driver.execute_script(f"window.open('{url}', '_blank');")
            time.sleep(1.2)
            self.driver.switch_to.window(self.driver.window_handles[-1])
            try:
                el = self.driver.find_element(By.CSS_SELECTOR, ".styles_job-desc-container__txIkk")
                jd = el.text.strip()
            except: 
                try: jd = self.driver.find_element(By.TAG_NAME, "body").text[:3000]
                except: pass
        except: pass
        finally:
            if len(self.driver.window_handles) > 1:
                try: self.driver.close()
                except: pass
            self.driver.switch_to.window(original)
        return jd

    def execute_search(self, roles_list, location, experience, tech_keywords, apply_tech_filter, min_score,
                       apply_min_score=True, user_experience_dict=None, include_user_experience=False,
                       common_answers=None, include_common_answers=False,
                       db_writer=None, username: str = None): 
        
        self.setup_driver()
        all_jobs = []
        wait = WebDriverWait(self.driver, 20)
        tech_keywords_clean = [k.strip() for k in (tech_keywords or []) if k.strip()]

        for role in roles_list:
            role = role.strip()
            if not role: continue
            
            # Google Warmup
            self.log(f"=== Warming up before searching {role} ===")
            try: self.driver.get("https://www.google.com"); time.sleep(2)
            except: pass

            self.log(f"=== Navigating to Naukri for: {role} ===")
            self.driver.get("https://www.naukri.com/")
            
            time.sleep(3)
            if "Access Denied" in self.driver.title:
                self.log("    [ALERT] Cloudflare Block Detected. Refreshing...")
                self.driver.delete_all_cookies()
                time.sleep(5); self.driver.refresh(); time.sleep(5)
                if "Access Denied" in self.driver.title:
                    self.log("    [CRITICAL] Still blocked. Skipping."); continue

            try:
                # 1. Search
                try:
                    search_bar = wait.until(EC.visibility_of_element_located(
                        (By.XPATH, "//input[@placeholder='Enter skills / designations / companies']")))
                    search_bar.clear(); search_bar.send_keys(role)
                except:
                    self.log(f"    [ERROR] Search bar missing."); continue

                try:
                    self.driver.find_element(By.ID, "expereinceDD").click()
                    self.random_delay(0.5, 1.0)
                    self.driver.find_element(By.XPATH, f"//li[@index='{experience}']").click()
                except: pass

                loc_el = self.driver.find_element(By.XPATH, "//input[@placeholder='Enter location']")
                loc_el.clear(); loc_el.send_keys(location)
                
                self.driver.find_element(By.CLASS_NAME, "qsbSubmit").click()
                self.random_delay(3, 5)

                try:
                    self.log("    [INFO] Attempting to apply 'Date' sort filter...")
                    wait.until(EC.element_to_be_clickable((By.ID, "filter-sort"))).click()
                    wait.until(EC.element_to_be_clickable((By.XPATH, "//li[@title='Date']"))).click()
                    time.sleep(2)
                    self.log("    [INFO] 'Date' sort filter applied successfully.")
                except Exception as e:
                    self.log(f"    [WARNING] Failed to apply 'Date' sort filter: {e}")

                # 2. Pagination
                for page_num in range(1, 11): 
                    if self.pause_check: self.pause_check()
                    self.log(f"  [Page {page_num}] scanning...")
                    try: cards = self.driver.find_elements(By.CLASS_NAME, "srp-jobtuple-wrapper")
                    except: cards = []

                    if not cards: break
                    fresh_count = 0; consecutive_old = 0
                    
                    for card in cards:
                        if self.pause_check: self.pause_check()
                        try:
                            date_text = card.find_element(By.CSS_SELECTOR, ".job-post-day").text
                            
                            # --- STRICT CHECK ---
                            if not self.check_freshness(date_text):
                                consecutive_old += 1
                                # If we see 3 old jobs in a row, STOP scanning this role completely
                                if consecutive_old >= 3: break
                                continue
                            consecutive_old = 0

                            title_node = card.find_element(By.CSS_SELECTOR, "a.title")
                            raw_link = title_node.get_attribute("href")
                            job_title = title_node.text.strip()
                            company = card.find_element(By.CSS_SELECTOR, "a.comp-name").text.strip()

                            if not raw_link or raw_link in self.processed_links: continue

                            # Skip if job title matches any excluded roles/keywords
                            if is_excluded_role(job_title):
                                self.log(f"    [FILTERED] Excluded role matched: {job_title[:40]}...")
                                self.processed_links.add(raw_link)
                                continue
                            
                            
                            self.log(f"    -> Found: {job_title[:40]}... ({date_text})")
                            full_desc = self.get_full_description(raw_link)
                            full_text = f"{job_title}\n{company}\n{full_desc}".strip()
                            sanitized_desc = sanitize_text_for_csv(full_desc)

                            # --- FULL PARSING LOGIC ---
                            tech_score = compute_tech_score(full_text, tech_keywords_clean, fallback_roles=roles_list)
                            jd_extracted = extract_experience_from_jd(full_desc, tech_keywords_clean) if tech_keywords_clean else {}
                            user_exp = parse_user_experience_input(user_experience_dict) if isinstance(user_experience_dict, str) else (user_experience_dict or {})
                            resolved = resolve_experience(user_exp if include_user_experience else {}, jd_extracted)

                            should_filter = bool(apply_tech_filter or apply_min_score or float(min_score) > 0)
                            kept_by_filter = "yes"
                            if should_filter and tech_score < float(min_score):
                                kept_by_filter = "no"
                            
                            signature = f"{company}||{job_title}"
                            if signature in self.processed_signatures: continue
                            
                            entry = {
                                "Role": role, "Title": sanitize_text_for_csv(job_title), "Company": sanitize_text_for_csv(company),
                                "Posted": sanitize_text_for_csv(date_text), "Apply_Link": raw_link, "Description": sanitized_desc,
                                "Tech_Keywords": ";".join(tech_keywords_clean),
                                "JD_Extracted_Experience": json.dumps(jd_extracted, ensure_ascii=False),
                                "User_Experience": json.dumps(user_exp if include_user_experience else {}, ensure_ascii=False),
                                "Resolved_Experience": json.dumps(resolved, ensure_ascii=False),
                                "tech_match_score": tech_score, "kept_by_filter": kept_by_filter
                            }
                            if include_common_answers and common_answers:
                                entry.update({"Notice_Period": common_answers.get("notice_period"), "Current_CTC": common_answers.get("current_ctc")})

                            all_jobs.append(entry)
                            self.processed_signatures.add(signature)
                            self.processed_links.add(raw_link)

                            if kept_by_filter == "yes":
                                fresh_count += 1
                                # Emit Progress Event
                                self.log({
                                    "type": "progress",
                                    "action": "scrape",
                                    "count": len([j for j in all_jobs if j.get("kept_by_filter") == "yes"]),
                                    "username": username or "unknown",
                                    "message": f"Scraped & Kept: {job_title[:20]}..."
                                })
                            else:
                                self.log(f"    [FILTERED OUT] {job_title[:35]}... ({tech_score}% match < {min_score}% min score)")
                        except: continue
                    
                    self.log(f"  [Page {page_num}] fresh jobs: {fresh_count}")
                    if consecutive_old >= 3: 
                        self.log("  [Stop] Old jobs detected. Moving to next role.")
                        break
                    
                    try: 
                        self.driver.find_element(By.XPATH, "//a[.//span[contains(text(), 'Next')]]").click()
                        self.random_delay(2, 4)
                    except: break
            except Exception: continue

        if db_writer and all_jobs and username:
            self.log(f"Attempting to write {len(all_jobs)} jobs for user {username} to the database...")
            db_writer(all_jobs, username) 
        
        try:
            if self.driver:
                self.driver.quit()
        except: pass
        self.driver = None
        kill_zombie_chromedriver_processes()
