from database_setup import get_job_summary
import json
from datetime import date

# Mock email - I'll use the one from the logs if possible, or just check the function logic
email = "ghodkesagar9696@gmail.com"

try:
    stats = get_job_summary(email, 7)
    
    # Helper to serialize dates
    def json_serial(obj):
        if isinstance(obj, (date,)):
            return obj.isoformat()
        raise TypeError ("Type %s not serializable" % type(obj))

    print(json.dumps(stats, default=json_serial, indent=2))
except Exception as e:
    print(f"Error: {e}")
