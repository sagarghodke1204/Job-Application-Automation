import os
import socket
from urllib.parse import urlparse
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"DATABASE_URL: {DATABASE_URL}")

try:
    url = urlparse(DATABASE_URL)
    hostname = url.hostname
    print(f"Hostname: {hostname}")
    
    # Test 1: gethostbyname
    try:
        ip = socket.gethostbyname(hostname)
        print(f"gethostbyname: {ip}")
    except Exception as e:
        print(f"gethostbyname failed: {e}")

    # Test 2: getaddrinfo
    try:
        info = socket.getaddrinfo(hostname, 5432, family=socket.AF_INET, proto=socket.IPPROTO_TCP)
        print(f"getaddrinfo (AF_INET): {info}")
    except Exception as e:
        print(f"getaddrinfo failed: {e}")

    # Test 3: Connect
    print("Attempting connection...")
    try:
        conn = psycopg2.connect(DATABASE_URL, sslmode='prefer')
        print("Standard Connect: SUCCESS")
        conn.close()
    except Exception as e:
        print(f"Standard Connect FAILED: {e}")

except Exception as e:
    print(f"General Error: {e}")
