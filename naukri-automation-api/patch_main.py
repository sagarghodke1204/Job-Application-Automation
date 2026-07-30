import re
import os

with open('main.py', 'r') as f:
    content = f.read()

injection = '''# --- GLOBAL STATE ---
active_tasks: Dict[str, str] = {}
pause_events: Dict[str, threading.Event] = {}

def get_pause_event(username: str) -> threading.Event:
    if username not in pause_events:
        event = threading.Event()
        event.set() # Set means NOT PAUSED (running)
        pause_events[username] = event
    return pause_events[username]

def check_pause(username: str, log_cb=None):
    event = get_pause_event(username)
    was_paused = False
    while not event.is_set():
        if not was_paused:
            if log_cb: log_cb({"type": "log", "message": "[SYSTEM] Task Paused. Waiting for resume..."})
            was_paused = True
        import time
        time.sleep(1)
    if was_paused and log_cb:
        log_cb({"type": "log", "message": "[SYSTEM] Task Resumed."})
'''
content = content.replace('# --- GLOBAL STATE ---\nactive_tasks: Dict[str, str] = {}', injection)

content = content.replace('local_scraper = ScraperEngine(log_callback=log_cb)', 'local_scraper = ScraperEngine(log_callback=log_cb, pause_check=lambda: check_pause(username, log_cb))')

content = content.replace('app_engine = ApplicationEngine(log_callback=log_cb)', 'app_engine = ApplicationEngine(log_callback=log_cb, pause_check=lambda: check_pause(username, log_cb))')

old_status = '''@app.get("/task_status/{username}")
async def get_task_status(username: str):
    status_msg = active_tasks.get(username, "Idle")
    return {"username": username, "status": status_msg, "is_running": status_msg != "Idle"}'''

new_status = '''@app.get("/task_status/{username}")
async def get_task_status(username: str):
    status_msg = active_tasks.get(username, "Idle")
    is_paused = False
    if username in pause_events and not pause_events[username].is_set():
        is_paused = True
    return {"username": username, "status": status_msg, "is_running": status_msg != "Idle", "is_paused": is_paused}

@app.post("/pause_task/{username}")
async def pause_task(username: str):
    get_pause_event(username).clear()
    return {"status": "paused"}

@app.post("/resume_task/{username}")
async def resume_task(username: str):
    get_pause_event(username).set()
    return {"status": "resumed"}
'''
content = content.replace(old_status, new_status)

with open('main.py', 'w') as f:
    f.write(content)
print('Patched main.py successfully')
