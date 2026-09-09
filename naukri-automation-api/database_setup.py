# ==============================================================================
# File: database_setup.py
# Description: Handles PostgreSQL DB. 
#              FIXED: Maps lowercase Postgres columns to TitleCase for the App.
# ==============================================================================
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

import socket

def get_db_connection():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set.")
    try:
        # Hack to force IPv4 resolution for Supabase/Remote DBs in Docker
        # because Docker sometimes prefers unreachable IPv6 addresses.
        # ONLY apply this when running in Docker to avoid breaking local SSL verification.
        if os.getenv("RUNNING_IN_DOCKER") == "true":
            try:
                from urllib.parse import urlparse
                import socket
                
                url = urlparse(DATABASE_URL)
                hostname = url.hostname
                ipv4_ip = None

                # Method 1: Try simple gethostbyname (usually returns IPv4)
                try:
                    ipv4_ip = socket.gethostbyname(hostname)
                    print(f"[DB Info] Resolved {hostname} to {ipv4_ip} via gethostbyname")
                except Exception as e_simple:
                    print(f"[DB Info] gethostbyname failed: {e_simple}")

                # Method 2: Fallback to getaddrinfo if Method 1 failed
                if not ipv4_ip and hostname:
                    info = socket.getaddrinfo(hostname, url.port or 5432, family=socket.AF_INET, proto=socket.IPPROTO_TCP)
                    if info:
                        ipv4_ip = info[0][4][0]
                        print(f"[DB Info] Resolved {hostname} to {ipv4_ip} via getaddrinfo")

                if ipv4_ip:
                    # Rewrite the URL with the IP address
                    final_db_url = DATABASE_URL.replace(hostname, ipv4_ip)
                    print(f"[DB Info] Connecting to {ipv4_ip}...")
                    conn = psycopg2.connect(final_db_url, sslmode='prefer')
                    return conn
                else:
                    print(f"[DB Warning] Could not resolve {hostname} to IPv4. Using default.")

            except Exception as e:
                print(f"[DB Warning] IPv4 resolution hack failed: {e}. Falling back to default URL.")

        # Default connection (Local execution & Fallback)
        conn = psycopg2.connect(DATABASE_URL, sslmode='prefer')
        return conn
    except Exception as e:
        print(f"[DB Error] Could not connect to PostgreSQL: {e}")
        raise

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # 1. Scraped Jobs Table (UPDATED SCHEMA)
    # We removed "UNIQUE" from Apply_Link and added a composite constraint at the end.
    c.execute("""
        CREATE TABLE IF NOT EXISTS scraped_jobs (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL, 
            timestamp TIMESTAMP DEFAULT NOW(),
            Role TEXT,
            Title TEXT,
            Company TEXT,
            Posted TEXT,
            Apply_Link TEXT, 
            Description TEXT,
            Tech_Keywords TEXT,
            JD_Extracted_Experience TEXT,
            User_Experience TEXT,
            Resolved_Experience TEXT,
            tech_match_score REAL,
            kept_by_filter TEXT,
            Notice_Period TEXT,
            Current_CTC TEXT,
            Expected_CTC TEXT,
            LinkedIn TEXT,
            Face_to_Face TEXT,
            applied_status TEXT DEFAULT 'PENDING', 
            applied_timestamp TIMESTAMP,
            application_notes TEXT,
            
            -- THE FIX: Unique constraint on PAIR (username + link)
            UNIQUE (username, Apply_Link)
        )
    """)
    
    # 2. Automation Config Table
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            naukri_password TEXT,
            scrape_config JSONB,
            resume_data JSONB,
            last_active TIMESTAMP DEFAULT NOW()
        )
    """)

    # 3. Website Auth Table
    c.execute("""
        CREATE TABLE IF NOT EXISTS website_users (
            email TEXT PRIMARY KEY,
            username TEXT,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    
    # MIGRATION: Ensure username column exists
    try:
        c.execute("ALTER TABLE website_users ADD COLUMN IF NOT EXISTS username TEXT")
    except Exception as e:
        print(f"[DB Migration Info] {e}")

    conn.commit()
    c.close()
    conn.close()

# --- WEBSITE AUTH FUNCTIONS ---

def create_website_user(email: str, username: str, password_hash: str):
    conn = get_db_connection()
    c = conn.cursor()
    try:
        c.execute("INSERT INTO website_users (email, username, password_hash) VALUES (%s, %s, %s)", (email, username, password_hash))
        conn.commit()
        return True
    except psycopg2.IntegrityError:
        conn.rollback()
        return False 
    finally:
        c.close(); conn.close()

def get_website_user(email: str) -> Optional[Dict]:
    conn = get_db_connection()
    c = conn.cursor(cursor_factory=RealDictCursor)
    c.execute("SELECT * FROM website_users WHERE email = %s", (email,))
    user = c.fetchone()
    c.close(); conn.close()
    return dict(user) if user else None

# --- BOT CONFIG FUNCTIONS ---

def upsert_user_config(email: str, password: str, scrape_config: Dict, resume_data: Dict):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        INSERT INTO users (email, naukri_password, scrape_config, resume_data, last_active)
        VALUES (%s, %s, %s, %s, NOW())
        ON CONFLICT (email) 
        DO UPDATE SET 
            naukri_password = EXCLUDED.naukri_password,
            scrape_config = EXCLUDED.scrape_config,
            resume_data = EXCLUDED.resume_data,
            last_active = NOW()
    """, (email, password, json.dumps(scrape_config), json.dumps(resume_data)))
    conn.commit(); c.close(); conn.close()

def get_user_config(email: str) -> Optional[Dict]:
    conn = get_db_connection()
    c = conn.cursor(cursor_factory=RealDictCursor)
    c.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = c.fetchone()
    c.close(); conn.close()
    
    if user:
        return {
            "username": user['email'],
            "naukri_password": user['naukri_password'], 
            "scrape_config": user['scrape_config'] if isinstance(user['scrape_config'], dict) else json.loads(user['scrape_config']),
            "resume_data": user['resume_data'] if isinstance(user['resume_data'], dict) else json.loads(user['resume_data'])
        }
    return None

def get_job_summary(email: str, days: int = 7) -> Dict[str, Any]:
    conn = get_db_connection()
    c = conn.cursor(cursor_factory=RealDictCursor)
    
    # 1. Overview Counts
    c.execute("""
        SELECT 
            COUNT(*) as total_scraped,
            COUNT(*) FILTER (WHERE applied_status = 'APPLIED') as total_applied,
            COUNT(*) FILTER (WHERE applied_status = 'PENDING') as total_pending,
            COUNT(*) FILTER (WHERE kept_by_filter = 'no') as total_rejected
        FROM scraped_jobs
        WHERE username = %s
    """, (email,))
    overview = c.fetchone() or {}

    # 2. Daily Trends (Last 7 Days)
    c.execute("""
        SELECT 
            DATE(timestamp) as date,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE applied_status = 'APPLIED') as applied,
            COUNT(*) FILTER (WHERE kept_by_filter = 'no') as rejected,
            COUNT(*) FILTER (WHERE applied_status = 'PENDING') as pending
        FROM scraped_jobs
        WHERE username = %s 
        AND timestamp >= NOW() - INTERVAL '%s days'
        GROUP BY date
        ORDER BY date ASC
    """, (email, days))
    daily_trends = c.fetchall()

    # 3. Status Distribution (By Application Notes)
    c.execute("""
        SELECT application_notes, COUNT(*) as count
        FROM scraped_jobs
        WHERE username = %s AND application_notes IS NOT NULL
        GROUP BY application_notes
    """, (email,))
    distribution = c.fetchall()

    # 4. Daily Breakdown (New for Bar Chart)
    c.execute("""
        SELECT 
            DATE(timestamp) as date,
            application_notes,
            COUNT(*) as count
        FROM scraped_jobs
        WHERE username = %s 
        AND timestamp >= NOW() - INTERVAL '%s days'
        GROUP BY date, application_notes
        ORDER BY date ASC
    """, (email, days))
    daily_breakdown = c.fetchall()

    c.close(); conn.close()
    
    return {
        "overview": dict(overview),
        "daily_stats": [dict(row) for row in daily_trends], # Renamed from daily_trends to match frontend
        "distribution": [dict(row) for row in distribution],
        "daily_breakdown": [dict(row) for row in daily_breakdown]
    }

# --- JOB WRITING ---

def write_jobs_to_db(jobs: List[Dict[str, Any]], username: str):
    if not jobs: return
    try: init_db()
    except: pass

    conn = get_db_connection()
    c = conn.cursor()
    
    fields = [
        "username", "Role", "Title", "Company", "Posted", "Apply_Link", "Description", 
        "Tech_Keywords", "JD_Extracted_Experience", "User_Experience", 
        "Resolved_Experience", "tech_match_score", "kept_by_filter",
        "Notice_Period", "Current_CTC", "Expected_CTC", "LinkedIn", "Face_to_Face"
    ]
    placeholders = ', '.join(['%s' for _ in fields])
    
    for job in jobs:
        base_values = [
            username, 
            job.get("Role"), job.get("Title"), job.get("Company"), 
            job.get("Posted"), job.get("Apply_Link"), job.get("Description"), 
            job.get("Tech_Keywords"), job.get("JD_Extracted_Experience"), 
            job.get("User_Experience"), job.get("Resolved_Experience"), 
            job.get("tech_match_score"), job.get("kept_by_filter"),
            job.get("Notice_Period"), job.get("Current_CTC"), job.get("Expected_CTC"), 
            job.get("LinkedIn"), job.get("Face_to_Face")
        ]
        try:
            # THE FIX: Updated Conflict Target to (username, Apply_Link)
            c.execute(f"""
                INSERT INTO scraped_jobs (timestamp, {', '.join(fields)})
                VALUES (NOW(), {placeholders})
                ON CONFLICT (username, Apply_Link) DO NOTHING
            """, tuple(base_values))
        except Exception as e:
            print(f"[DB Write Error] {e}")

    conn.commit()
    c.close()
    conn.close()

# --- CRITICAL FIX HERE: MAPPING KEYS ---
def get_pending_jobs(username: str) -> List[Dict[str, Any]]:
    # Enforce user's smart filter criteria on pending jobs stored in DB
    try:
        user_cfg = get_user_config(username)
        if user_cfg and user_cfg.get('scrape_config'):
            sc = user_cfg['scrape_config']
            apply_tf = sc.get('apply_tech_filter', False)
            apply_ms = sc.get('apply_min_score', True)
            min_score = float(sc.get('min_score', 0))
            if (apply_tf or apply_ms or min_score > 0) and min_score > 0:
                conn_sync = get_db_connection()
                c_sync = conn_sync.cursor()
                c_sync.execute("""
                    UPDATE scraped_jobs 
                    SET kept_by_filter = 'no' 
                    WHERE username = %s 
                      AND applied_status = 'PENDING' 
                      AND (tech_match_score < %s OR tech_match_score IS NULL)
                """, (username, min_score))
                conn_sync.commit()
                c_sync.close(); conn_sync.close()
    except Exception as e:
        print(f"[Smart Filter Sync Warning] {e}")

    conn = get_db_connection()
    c = conn.cursor(cursor_factory=RealDictCursor) 
    c.execute("SELECT * FROM scraped_jobs WHERE applied_status = 'PENDING' AND (kept_by_filter = 'yes' OR kept_by_filter IS NULL) AND username = %s ORDER BY timestamp DESC, id DESC", (username,))
    jobs = c.fetchall()
    c.close(); conn.close()
    
    clean_jobs = []
    for row in jobs:
        # MAP LOWERCASE POSTGRES KEYS TO TITLECASE APP KEYS
        j = {
            "id": row.get('id'), 
            "Role": row.get('role'), 
            "Title": row.get('title'),
            "Company": row.get('company'), 
            "Posted": row.get('posted'),
            "Apply_Link": row.get('apply_link'), # This fixes the 'External Link' error
            "Description": row.get('description'),
            "Tech_Keywords": row.get('tech_keywords'),
            "JD_Extracted_Experience": row.get('jd_extracted_experience'),
            "User_Experience": row.get('user_experience'),
            "Resolved_Experience": row.get('resolved_experience'),
            "tech_match_score": row.get('tech_match_score'),
            "kept_by_filter": row.get('kept_by_filter'),
            "Notice_Period": row.get('notice_period'),
            "Current_CTC": row.get('current_ctc'),
            "Expected_CTC": row.get('expected_ctc'),
            "LinkedIn": row.get('linkedin'),
            "Face_to_Face": row.get('face_to_face'),
            "applied_status": row.get('applied_status'),
            "timestamp": row.get('timestamp').isoformat() if row.get('timestamp') else None
        }
        
        # Parse JSON fields safely
        for key in ['JD_Extracted_Experience', 'Resolved_Experience', 'User_Experience']:
            try: j[key] = json.loads(j.get(key) or '{}')
            except: j[key] = {}
            
        clean_jobs.append(j)
        
    return clean_jobs

def update_job_status(job_id: int, status: str, notes: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("UPDATE scraped_jobs SET applied_status = %s, applied_timestamp = NOW(), application_notes = %s WHERE id = %s", (status, notes, job_id))
    conn.commit(); c.close(); conn.close()

def get_external_jobs(username: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor(cursor_factory=RealDictCursor)
    c.execute("SELECT id, title, company, apply_link, posted, timestamp FROM scraped_jobs WHERE applied_status = 'EXTERNAL' AND username = %s ORDER BY timestamp DESC, id DESC", (username,))
    jobs = c.fetchall()
    c.close(); conn.close()
    
    clean_jobs = []
    for row in jobs:
        clean_jobs.append({
            "id": row.get('id'),
            "Title": row.get('title'),
            "Company": row.get('company'),
            "Apply_Link": row.get('apply_link'),
            "Posted": row.get('posted'),
            "timestamp": row.get('timestamp').isoformat() if row.get('timestamp') else None
        })
    return clean_jobs

def get_walkin_jobs(username: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor(cursor_factory=RealDictCursor)
    c.execute("SELECT id, title, company, apply_link, posted, timestamp FROM scraped_jobs WHERE applied_status = 'WALK-IN' AND username = %s ORDER BY timestamp DESC, id DESC", (username,))
    jobs = c.fetchall()
    c.close(); conn.close()
    
    clean_jobs = []
    for row in jobs:
        clean_jobs.append({
            "id": row.get('id'),
            "Title": row.get('title'),
            "Company": row.get('company'),
            "Apply_Link": row.get('apply_link'),
            "Posted": row.get('posted'),
            "timestamp": row.get('timestamp').isoformat() if row.get('timestamp') else None
        })
    return clean_jobs

def get_all_scraped_jobs(username: str, limit: int = 100, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor(cursor_factory=RealDictCursor)
    
    query = "SELECT * FROM scraped_jobs WHERE username = %s"
    params = [username]
    
    if status_filter and status_filter.upper() != 'ALL':
        sf = status_filter.upper()
        if sf == 'FILTERED_OUT':
            query += " AND kept_by_filter = 'no'"
        elif sf == 'PENDING':
            query += " AND applied_status = 'PENDING' AND (kept_by_filter = 'yes' OR kept_by_filter IS NULL)"
        else:
            query += " AND applied_status = %s"
            params.append(sf)
            
    query += " ORDER BY timestamp DESC, id DESC LIMIT %s"
    params.append(limit)
    
    c.execute(query, tuple(params))
    jobs = c.fetchall()
    c.close(); conn.close()
    
    clean_jobs = []
    for row in jobs:
        j = {
            "id": row.get('id'),
            "Role": row.get('role'),
            "Title": row.get('title'),
            "Company": row.get('company'),
            "Posted": row.get('posted'),
            "Apply_Link": row.get('apply_link'),
            "Description": row.get('description'),
            "Tech_Keywords": row.get('tech_keywords'),
            "tech_match_score": row.get('tech_match_score'),
            "kept_by_filter": row.get('kept_by_filter'),
            "applied_status": row.get('applied_status'),
            "applied_timestamp": row.get('applied_timestamp').isoformat() if row.get('applied_timestamp') else None,
            "application_notes": row.get('application_notes'),
            "timestamp": row.get('timestamp').isoformat() if row.get('timestamp') else None
        }
        clean_jobs.append(j)
        
    return clean_jobs

