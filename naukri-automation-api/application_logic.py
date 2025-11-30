# ==============================================================================
# File: application_logic.py
# Description: Application Engine (Stealth Headless).
#              UPDATED: VISUAL AUDIT MODE. Screenshots every step.
# ==============================================================================
import time
import json
import os
import re
import random
from datetime import datetime
from urllib.parse import urlparse
from typing import Dict, Any, List

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, ElementClickInterceptedException

from database_setup import get_pending_jobs, update_job_status

try:
    import openai
except ImportError:
    openai = None

OPENAI_API_KEY = "" 
AI_MODEL = "gemini-2.5-flash"
client = None
if OPENAI_API_KEY and openai:
    try: client = openai.OpenAI(api_key=OPENAI_API_KEY)
    except: pass

class ApplicationEngine:
    def __init__(self, log_callback=None):
        self.log_callback = log_callback if log_callback else print
        self.driver = None
        self.resume_data: Dict[str, str] = {} 
        self.wait: WebDriverWait = None
        self.applied_count = 0
        if not os.path.exists("debug_logs"): os.makedirs("debug_logs")

    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        if isinstance(message, dict):
            self.log_callback(message)
        else:
            self.log_callback(f"[{timestamp}] {message}")

    def _save_debug_evidence(self, job_id, step_name):
        """Saves a screenshot with a clear name for auditing."""
        timestamp = datetime.now().strftime("%H%M%S")
        filename = f"debug_logs/job_{job_id}_{step_name}_{timestamp}.png"
        try: 
            self.driver.save_screenshot(filename)
            self.log(f"      [EVIDENCE] Saved: {filename}")
        except: pass

    def _setup_driver(self):
        if self.driver: return
        self.log(">>> Initializing App Browser (Stealth Headless)...")
        options = uc.ChromeOptions()
        options.add_argument("--disable-popup-blocking")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        try:
            self.driver = uc.Chrome(options=options, headless=True, use_subprocess=True)
            self.driver.set_page_load_timeout(60) 
            self.wait = WebDriverWait(self.driver, 20)
            self.log(">>> Browser Ready.")
        except Exception as e:
            self.log(f"[CRITICAL] Driver setup failed: {e}")
            raise

    def _login_to_naukri(self, email, password):
        self._setup_driver()
        try: self.driver.get("https://www.google.com"); time.sleep(2)
        except: pass

        self.log(">>> Navigating to Login Page...")
        self.driver.get("https://login.naukri.com/nLogin/Login.php")
        time.sleep(3)
        
        if "Access Denied" in self.driver.title:
            self.driver.delete_all_cookies()
            time.sleep(5); self.driver.refresh(); time.sleep(5)

        try:
            user_field = self.wait.until(EC.visibility_of_element_located((By.ID, "usernameField")))
            user_field.clear()
            for char in email: user_field.send_keys(char); time.sleep(random.uniform(0.05, 0.15)) 
            pass_field = self.driver.find_element(By.ID, "passwordField")
            pass_field.clear()
            for char in password: pass_field.send_keys(char); time.sleep(random.uniform(0.05, 0.15))
            
            self.driver.find_element(By.XPATH, "//button[text()='Login']").click()
            self.log(">>> Login Clicked. Waiting...")
            time.sleep(5)
            
            if "login" in self.driver.current_url.lower():
                raise Exception("Login Failed (Stuck on login page)")

            self.log(">>> Login Successful.")
        except Exception as e:
            self.log(f">>> Login Process Error: {e}")
            self._quit_driver()
            raise

    # --- SMART ANSWER LOGIC ---
    def _get_ai_answer(self, question: str, context: Dict) -> str:
        q_lower = question.lower()
        if "year" in q_lower or "exp" in q_lower or "months" in q_lower:
            return str(context.get("TOTAL_EXP_YEARS", "1")).strip()
        if "ctc" in q_lower:
            if "current" in q_lower: return str(context.get("CURRENT_CTC", "0"))
            return str(context.get("EXPECTED_CTC", "0"))
        if "notice" in q_lower: return str(context.get("NOTICE_PERIOD", "1 Month"))
        if "location" in q_lower or "city" in q_lower: return str(context.get("CURRENT_LOCATION", "India"))

        if not client: return "Yes"
        prompt = f"You are a candidate. Profile: {json.dumps(context)}. Question: '{question}'. Rules: 1. Reply with ONLY the value (e.g. 'Yes', '3', 'Pune'). 2. No sentences. Answer:"
        try:
            resp = client.chat.completions.create(model=AI_MODEL, messages=[{"role": "user", "content": prompt}], max_tokens=10)
            return re.sub(r'^["\']|["\']$', '', resp.choices[0].message.content.strip())
        except: return "Yes"

    def _click_save(self):
        try:
            btn = self.driver.find_element(By.CSS_SELECTOR, ".sendMsg")
            self.driver.execute_script("arguments[0].click();", btn)
            return True
        except:
            try:
                btn = self.driver.find_element(By.XPATH, "//button[text()='Save' or text()='Submit']")
                self.driver.execute_script("arguments[0].click();", btn)
                return True
            except: return False

    def _handle_chatbot_interaction(self, job_id):
        self.log(f"    [Bot] Interaction STARTING...")
        ai_ctx = self.resume_data.copy()
        
        # 1. Capture "Chatbot Opened" evidence
        
        last_q = ""
        for attempt in range(15):
            body_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
            
            # --- SUCCESS CHECK ---
            if "successfully applied" in body_text or "thankyou for your responses" in body_text:
                self.log(f"    [Bot] Success message detected.")
                return True
            
            if not self.driver.find_elements(By.CLASS_NAME, "chatbot_Drawer"):
                self.log(f"    [Bot] Drawer closed unexpectedly.")
                break

            try:
                msgs = self.driver.find_elements(By.CSS_SELECTOR, ".botItem .botMsg span")
                if not msgs: time.sleep(1); continue
                q_text = msgs[-1].text.strip()
                if q_text == last_q: time.sleep(1); continue
                last_q = q_text
                
                self.log(f"      [Bot Q]: {q_text[:60]}...")
                action_taken = False

                # Text Input
                try:
                    inp = self.driver.find_element(By.CSS_SELECTOR, "div.textArea[contenteditable='true']")
                    if inp.is_displayed():
                        ans = self._get_ai_answer(q_text, ai_ctx)
                        self.log(f"      [Action] Typing: {ans}")
                        inp.click(); inp.send_keys(ans); action_taken = True
                except: pass

                # Radio Input
                if not action_taken:
                    try:
                        rads = self.driver.find_elements(By.CSS_SELECTOR, ".singleselect-radiobutton")
                        if rads and rads[0].is_displayed():
                            labels = rads[0].find_elements(By.TAG_NAME, "label")
                            choice = labels[0]
                            self.log(f"      [Action] Radio: '{choice.text}'")
                            try: choice.find_element(By.XPATH, "./preceding-sibling::input").click()
                            except: choice.click()
                            action_taken = True
                    except: pass

                if action_taken:
                    self._click_save()
                    time.sleep(1.0)
                else:
                    time.sleep(1.5)

            except Exception as e:
                self.log(f"      [Bot Error]: {e}"); time.sleep(1)

        return True 

    def _process_popup_logic(self, job_id):
        if self.driver.find_elements(By.CLASS_NAME, "chatbot_Drawer"): 
            return self._handle_chatbot_interaction(job_id)
        return False
        
    def _quit_driver(self):
        try: 
            if self.driver: self.driver.quit()
        except: pass
        self.driver = None

    def run_application_job(self, email: str, password: str, resume_data: Dict[str, str], username: str):
        self.resume_data = resume_data
        try:
            self.log(f"Starting application run for {email}")
            jobs = get_pending_jobs(username) 
            if not jobs: self.log("No new jobs found."); return
            
            self._login_to_naukri(email, password)
            main_window = self.driver.current_window_handle
            
            for job in jobs:
                job_id = job['id']; link = job.get('Apply_Link', '')
                self.log(f"[{job_id}] {job.get('Title','Job')[:50]}")
                
                if "naukri.com" not in urlparse(link).netloc:
                    update_job_status(job_id, 'EXTERNAL', "External")
                    self.log("    [SKIP] External Link")
                    continue

                try:
                    self.driver.execute_script(f"window.open('{link}', '_blank');")
                    self.wait.until(EC.number_of_windows_to_be(2))
                    self.driver.switch_to.window(self.driver.window_handles[-1])
                    
                    try:
                        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
                        time.sleep(1.5)
                    except: pass 

                    # 1. ALREADY APPLIED CHECK
                    is_applied = False
                    if self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Already applied')]") or \
                       self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Applied')]") or \
                       self.driver.find_elements(By.XPATH, "//div[contains(@class, 'applied')]"):
                        is_applied = True
                    
                    if not is_applied:
                        try:
                            # Double check button text
                            btn = self.driver.find_element(By.ID, "apply-button")
                            if "Applied" in btn.text: is_applied = True
                        except: pass

                    if is_applied:
                        update_job_status(job_id, 'APPLIED', 'Already applied')
                        time.sleep(1.0)
                        self.log("    [INFO] Already Applied.")

                        time.sleep(1.0)

                        self.driver.close()
                        self.driver.switch_to.window(main_window)
                        continue

                    # 2. COMPANY SITE
                    if self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Apply on Company Website')]") or \
                       self.driver.find_elements(By.ID, "company-site-button"):
                        update_job_status(job_id, 'EXTERNAL', "Company Website")
                        self.log("    [SKIP] Redirects to Company Website.")
                        self.driver.close(); self.driver.switch_to.window(main_window); continue

                    # 3. WALK-IN
                    if self.driver.find_elements(By.XPATH, "//button[contains(text(), 'I am interested')]") or \
                       self.driver.find_elements(By.ID, "Walk-In-button"):
                        update_job_status(job_id, 'WALK-IN', "WalkIn Drive")
                        
                        self.log("    [SKIP] Walk-in Drive.")
                        self.driver.close(); self.driver.switch_to.window(main_window); continue

                    # 4. APPLY
                    try:
                        selectors = [
                            "//button[@id='apply-button']",
                            "//button[contains(@class, 'styles_apply-button')]",
                            "//button[normalize-space()='Apply']",
                            "//div[@class='apply-button-container']//button"
                        ]

                        btn = None
                        for s in selectors:
                            try:
                                btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, s)))
                                break
                            except:
                                pass

                        if btn:
                            # Before click evidence

                            # Click apply
                            self.driver.execute_script("arguments[0].click();", btn)
                            self.log("    -> Clicked Apply... Verifying.")

                            # After click evidence

                            time.sleep(1.5)

                            # A. Check Chatbot
                            if self._process_popup_logic(job_id):
                                update_job_status(job_id, 'APPLIED', 'AI Chatbot success.')
                                self.log("    -> Chatbot Completed.")
                                self.applied_count += 1
                                self.log({
                                    "type": "progress",
                                    "action": "apply",
                                    "count": self.applied_count,
                                    "username": username,
                                    "message": f"Applied: {job.get('Title','Job')[:20]}..."
                                })

                            # B. Check if button changed to Applied
                            elif self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Applied')]"):
                                update_job_status(job_id, 'APPLIED', 'Direct apply.')
                                self.log("    -> Direct Apply Success.")
                                self.applied_count += 1
                                self.log({
                                    "type": "progress",
                                    "action": "apply",
                                    "count": self.applied_count,
                                    "username": username,
                                    "message": f"Applied: {job.get('Title','Job')[:20]}..."
                                })

                            # C. Nothing changed → check login or unverified
                            else:
                                if self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Login to apply')]"):
                                    self.log("[FAIL] Session invalid (Login to Apply).")
                                else:
                                    time.sleep(1.0)
                                    self._save_debug_evidence(job_id, "2_Errormsg_btn")
                                    update_job_status(job_id, 'APPLIED', 'Direct apply (Unverified).')
                                    self.applied_count += 1
                                    self.log({
                                        "type": "progress",
                                        "action": "apply",
                                        "count": self.applied_count,
                                        "username": username,
                                        "message": f"Applied: {job.get('Title','Job')[:20]}..."
                                    })

                        else:
                            # No button found at all
                            if self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Login to apply')]"):
                                self.log("[FAIL] Session invalid (Login to Apply).")
                            else:
                                update_job_status(job_id, 'FAILED', 'Button missing')
                                self.log("    [FAIL] Apply Button Missing.")

                    except TimeoutException:
                        self.log("    [FAIL] Timeout.")
                        update_job_status(job_id, 'FAILED', 'Timeout')


                except Exception as e:
                    self.log(f"    [CRITICAL APPLY ERROR] {str(e)}")
                    self._save_debug_evidence(job_id, "CRITICAL_ERROR")
                    update_job_status(job_id, 'ERROR', str(e)[:100])
                finally:
                    if len(self.driver.window_handles) > 1: self.driver.close()
                    self.driver.switch_to.window(main_window)
                    time.sleep(random.uniform(1.5, 3.0)) 
            
            self.log({
                "type": "progress",
                "action": "apply_complete",
                "count": self.applied_count,
                "username": username
            })
        finally:
            self._quit_driver()
