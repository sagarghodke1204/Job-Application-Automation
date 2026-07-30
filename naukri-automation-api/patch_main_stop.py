import re

with open('main.py', 'r') as f:
    content = f.read()

# 1. Add stop_events
global_state = '''# --- GLOBAL STATE ---
active_tasks: Dict[str, str] = {}
pause_events: Dict[str, threading.Event] = {}'''

new_global_state = '''# --- GLOBAL STATE ---
active_tasks: Dict[str, str] = {}
pause_events: Dict[str, threading.Event] = {}
stop_events: Dict[str, threading.Event] = {}

def get_stop_event(username: str) -> threading.Event:
    if username not in stop_events:
        stop_events[username] = threading.Event()
    return stop_events[username]'''

content = content.replace(global_state, new_global_state)

# 2. Update check_pause to raise Exception if stop_event is set
old_check_pause = '''def check_pause(username: str, log_cb=None):
    event = get_pause_event(username)
    was_paused = False
    while not event.is_set():'''

new_check_pause = '''def check_pause(username: str, log_cb=None):
    stop_event = get_stop_event(username)
    if stop_event.is_set():
        raise Exception("USER_STOPPED")
        
    event = get_pause_event(username)
    was_paused = False
    while not event.is_set():
        if stop_event.is_set():
            raise Exception("USER_STOPPED")'''

content = content.replace(old_check_pause, new_check_pause)

# 3. Add stop_task endpoint
old_endpoints = '''@app.post("/resume_task/{username}")
async def resume_task(username: str):
    get_pause_event(username).set()
    return {"status": "resumed"}'''

new_endpoints = '''@app.post("/resume_task/{username}")
async def resume_task(username: str):
    get_pause_event(username).set()
    return {"status": "resumed"}

@app.post("/stop_task/{username}")
async def stop_task(username: str):
    get_stop_event(username).set()
    # Also resume the pause event so the thread isn't stuck waiting to be resumed before dying
    get_pause_event(username).set()
    return {"status": "stopped"}'''

content = content.replace(old_endpoints, new_endpoints)

# 4. Clear stop_event when a new task starts
# In run_scrape_task
old_run_scrape = '''    active_tasks[username] = "Queued for Scraping"
    log_cb(f"[{timestamp}] Scrape Request queued for {username}...")'''

new_run_scrape = '''    get_stop_event(username).clear()
    get_pause_event(username).set()
    active_tasks[username] = "Queued for Scraping"
    log_cb(f"[{timestamp}] Scrape Request queued for {username}...")'''

content = content.replace(old_run_scrape, new_run_scrape)

# In run_apply_task
old_run_apply = '''    active_tasks[username] = "Queued for Application"
    log_cb(f"[{timestamp}] Apply Request queued for {username}...")'''

new_run_apply = '''    get_stop_event(username).clear()
    get_pause_event(username).set()
    active_tasks[username] = "Queued for Application"
    log_cb(f"[{timestamp}] Apply Request queued for {username}...")'''

content = content.replace(old_run_apply, new_run_apply)

with open('main.py', 'w') as f:
    f.write(content)

print("Patched main.py successfully")
