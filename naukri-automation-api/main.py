# ==============================================================================
# File: main.py
# Description: FastAPI with JWT Auth, Data Persistence, and WebSocket Logs.
#              UPDATED: Full Frontend Compatibility (WS, Endpoints, Models).
# ==============================================================================
import os
import threading
import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List

from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Auth Libs
from passlib.context import CryptContext
from jose import JWTError, jwt

# Import logic
from scraper_logic import ScraperEngine, parse_user_experience_input 
from application_logic import ApplicationEngine 
from database_setup import (
    write_jobs_to_db, init_db, upsert_user_config, get_user_config, 
    get_job_summary, create_website_user, get_website_user
)

load_dotenv()

# --- CONFIG ---
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_change_this") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 3650 

MAX_CONCURRENT_USERS = 2 
server_semaphore = threading.Semaphore(MAX_CONCURRENT_USERS)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

app = FastAPI(title="Naukri Automation API")

try: init_db() 
except Exception as e: print(f"Startup Warning: {e}")

# CORS Configuration
origins_env = os.getenv("ALLOWED_ORIGINS", "")
if origins_env:
    origins = [origin.strip() for origin in origins_env.split(",")]
else:
    origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"],
)

# --- WEBSOCKET MANAGER ---

class ConnectionManager:
    def __init__(self):
        # Map username -> List of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        if username not in self.active_connections:
            self.active_connections[username] = []
        self.active_connections[username].append(websocket)

    def disconnect(self, websocket: WebSocket, username: str):
        if username in self.active_connections:
            if websocket in self.active_connections[username]:
                self.active_connections[username].remove(websocket)
            if not self.active_connections[username]:
                del self.active_connections[username]

    async def broadcast(self, message: str, target_username: str = None):
        # If target_username is provided, send ONLY to that user
        if target_username:
            if target_username in self.active_connections:
                for connection in self.active_connections[target_username]:
                    try:
                        await connection.send_text(message)
                    except:
                        pass
        else:
            # Broadcast to ALL (system-wide announcements, if any)
            # For privacy, we generally avoid this for logs
            for username, connections in self.active_connections.items():
                for connection in connections:
                    try:
                        await connection.send_text(message)
                    except:
                        pass

manager = ConnectionManager()

@app.websocket("/ws/logs/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await manager.connect(websocket, username)
    try:
        while True:
            await websocket.receive_text() # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, username)

def make_log_callback(loop, target_username: str):
    def callback(message):
        # Handle structured data
        if isinstance(message, dict):
            json_msg = json.dumps(message)
            print(f"[WS][{target_username}] {json_msg}") 
            try:
                asyncio.run_coroutine_threadsafe(manager.broadcast(json_msg, target_username), loop)
            except: pass
        else:
            # Handle legacy string logs
            print(f"[{target_username}] {message}") 
            try:
                payload = json.dumps({"type": "log", "message": str(message)})
                asyncio.run_coroutine_threadsafe(manager.broadcast(payload, target_username), loop)
            except: pass
    return callback

# --- MODELS ---

class WebsiteAuth(BaseModel):
    email: str
    password: str
    username: Optional[str] = None # Added for registration

class CommonAnswers(BaseModel):
    notice_period: Optional[str] = "2 Months"
    current_ctc: Optional[str] = "400000"
    expected_ctc: Optional[str] = "600000"
    linkedin: Optional[str] = ""
    face_to_face: Optional[str] = "Yes"

class ScrapeRequest(BaseModel):
    username: str  
    password: str  
    continue_session: Optional[bool] = False # Added for frontend compatibility
    location: str
    experience: int
    roles: List[str]
    tech_keywords: List[str]
    apply_tech_filter: bool
    apply_min_score: Optional[bool] = True # Added for frontend compatibility
    min_score: float = Field(..., ge=0, le=100)
    user_exp_raw: str
    include_user_experience: bool
    include_common_answers: bool
    common_answers: CommonAnswers
    total_exp_years: Optional[str] = "3"
    postal_code: Optional[str] = "412207" 


# --- AUTH UTILS ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(status_code=401, detail="Invalid credentials")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- AUTH ENDPOINTS ---

@app.post("/auth/register")
async def register(auth: WebsiteAuth):
    if get_website_user(auth.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Ensure username is provided for registration
    if not auth.username:
         raise HTTPException(status_code=400, detail="Username is required for registration")

    hashed = get_password_hash(auth.password)
    if create_website_user(auth.email, auth.username, hashed):
        return {"status": "success", "message": "User registered successfully"}
    else:
        raise HTTPException(status_code=500, detail="Database error during registration")

@app.post("/auth/login")
async def login(auth: WebsiteAuth):
    user = get_website_user(auth.email)
    if not user or not verify_password(auth.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": auth.email})
    
    # Return stored username or fallback to email part
    display_name = user.get('username') or auth.email
    
    return {"access_token": access_token, "token_type": "bearer", "username": display_name}

@app.get("/user/profile")
async def get_profile(current_user: str = Depends(get_current_user)):
    user_data = get_user_config(current_user)
    if not user_data:
        return {
            "has_data": False, "username": current_user, 
            "naukri_password": "", "scrape_config": {}, "resume_data": {}
        }
    return {
        "has_data": True, "username": user_data['username'],
        "naukri_password": user_data['naukri_password'],
        "scrape_config": user_data['scrape_config'],
        "resume_data": user_data['resume_data']
    }

# --- GLOBAL STATE ---
active_tasks: Dict[str, str] = {}

# --- AUTOMATION TASKS ---

def run_scrape_task(request_data: ScrapeRequest, loop):
    username = request_data.username
    timestamp = datetime.now().strftime('%H:%M:%S')
    log_cb = make_log_callback(loop, username)
    
    active_tasks[username] = "Queued for Scraping"
    log_cb(f"[{timestamp}] Scrape Request queued for {username}...")
    
    try:
        with server_semaphore:
            active_tasks[username] = "Scraping in Progress"
            log_cb(f"[{datetime.now().strftime('%H:%M:%S')}] >>> SLOT ACQUIRED for Scrape")
            local_scraper = ScraperEngine(log_callback=log_cb) 
            try:
                parsed_user_exp = parse_user_experience_input(request_data.user_exp_raw)
                common_ans = request_data.common_answers.model_dump() if request_data.include_common_answers else None
                local_scraper.execute_search(
                    roles_list=request_data.roles, location=request_data.location,
                    experience=request_data.experience, tech_keywords=request_data.tech_keywords,
                    apply_tech_filter=request_data.apply_tech_filter, min_score=request_data.min_score,
                    user_experience_dict=parsed_user_exp, include_user_experience=request_data.include_user_experience,
                    common_answers=common_ans, include_common_answers=request_data.include_common_answers,
                    db_writer=write_jobs_to_db, username=request_data.username 
                )
            except Exception as e: log_cb(f"CRITICAL SCRAPE ERROR: {e}")
            finally: 
                if local_scraper.driver: 
                    try: local_scraper.driver.quit()
                    except: pass
                log_cb(f"[{datetime.now().strftime('%H:%M:%S')}] <<< SLOT RELEASED")
                # Send explicit completion event for frontend stats refresh
                log_cb({"action": "scrape_complete", "status": "done", "message": "Scraping session finished."})
    finally:
        if username in active_tasks and active_tasks[username].startswith("Scraping"):
            del active_tasks[username]

def run_apply_task(username: str, password: str, resume_data: Dict, loop):
    log_cb = make_log_callback(loop, username)
    timestamp = datetime.now().strftime('%H:%M:%S')
    
    active_tasks[username] = "Queued for Application"
    log_cb(f"[{timestamp}] Apply Request queued for {username}...")
    
    try:
        with server_semaphore:
            active_tasks[username] = "Application in Progress"
            log_cb(f"[{datetime.now().strftime('%H:%M:%S')}] >>> SLOT ACQUIRED for Apply")
            try:
                app_engine = ApplicationEngine(log_callback=log_cb)
                app_engine.run_application_job(username, password, resume_data, username)
            except Exception as e: log_cb(f"CRITICAL APPLY ERROR: {e}")
            finally: 
                log_cb(f"[{datetime.now().strftime('%H:%M:%S')}] <<< SLOT RELEASED")
                # Send explicit completion event
                log_cb({"action": "apply_complete", "status": "done", "message": "Application session finished."})
    finally:
        if username in active_tasks and active_tasks[username].startswith("Application"):
            del active_tasks[username]

def run_full_automation_task(request_data: ScrapeRequest, loop):
    # 1. Run Scrape
    run_scrape_task(request_data, loop)
    
    # 2. Run Apply
    resume_data = {
        "CURRENT_LOCATION": request_data.location, "POSTAL_CODE": request_data.postal_code,
        "LINKEDIN": request_data.common_answers.linkedin, "TOTAL_EXP_YEARS": request_data.total_exp_years,
        "NOTICE_PERIOD": request_data.common_answers.notice_period, "CURRENT_CTC": request_data.common_answers.current_ctc,
        "EXPECTED_CTC": request_data.common_answers.expected_ctc
    }
    run_apply_task(request_data.username, request_data.password, resume_data, loop)

@app.post("/start_scrape")
async def start_scrape(request: ScrapeRequest, background_tasks: BackgroundTasks):
    try:
        scrape_config_dict = request.model_dump(include={'location', 'experience', 'roles', 'tech_keywords', 'apply_tech_filter', 'min_score', 'user_exp_raw'})
        resume_data_dict = {
            "CURRENT_LOCATION": request.location, "POSTAL_CODE": request.postal_code,
            "LINKEDIN": request.common_answers.linkedin, "TOTAL_EXP_YEARS": request.total_exp_years,
            "NOTICE_PERIOD": request.common_answers.notice_period, "CURRENT_CTC": request.common_answers.current_ctc,
            "EXPECTED_CTC": request.common_answers.expected_ctc
        }
        upsert_user_config(request.username, request.password, scrape_config_dict, resume_data_dict)
    except: pass
    
    loop = asyncio.get_running_loop()
    background_tasks.add_task(run_scrape_task, request, loop)
    return {"status": f"Scraping queued for {request.username}"}

@app.post("/start_apply")
async def start_apply(request: ScrapeRequest, background_tasks: BackgroundTasks):
    resume_data = {
        "CURRENT_LOCATION": request.location, "POSTAL_CODE": request.postal_code,
        "LINKEDIN": request.common_answers.linkedin, "TOTAL_EXP_YEARS": request.total_exp_years,
        "NOTICE_PERIOD": request.common_answers.notice_period, "CURRENT_CTC": request.common_answers.current_ctc,
        "EXPECTED_CTC": request.common_answers.expected_ctc
    }
    loop = asyncio.get_running_loop()
    background_tasks.add_task(run_apply_task, request.username, request.password, resume_data, loop)
    return {"status": f"Application queued for {request.username}"}

@app.post("/run_full_automation")
async def run_full_automation(request: ScrapeRequest, background_tasks: BackgroundTasks):
    try:
        scrape_config_dict = request.model_dump(include={'location', 'experience', 'roles', 'tech_keywords', 'apply_tech_filter', 'min_score', 'user_exp_raw'})
        resume_data_dict = {
            "CURRENT_LOCATION": request.location, "POSTAL_CODE": request.postal_code,
            "LINKEDIN": request.common_answers.linkedin, "TOTAL_EXP_YEARS": request.total_exp_years,
            "NOTICE_PERIOD": request.common_answers.notice_period, "CURRENT_CTC": request.common_answers.current_ctc,
            "EXPECTED_CTC": request.common_answers.expected_ctc
        }
        upsert_user_config(request.username, request.password, scrape_config_dict, resume_data_dict)
    except: pass
    
    loop = asyncio.get_running_loop()
    background_tasks.add_task(run_full_automation_task, request, loop)
    return {"status": f"Full automation queued for {request.username}"}

@app.get("/task_status/{username}")
async def get_task_status(username: str):
    status_msg = active_tasks.get(username, "Idle")
    return {"username": username, "status": status_msg, "is_running": status_msg != "Idle"}

@app.get("/dashboard_stats/{email}")
async def dashboard_stats(email: str, days: int = 7):
    stats = get_job_summary(email, days)
    return {"email": email, "stats": stats}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
