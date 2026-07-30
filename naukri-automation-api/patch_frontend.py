import re
import os

filepath = r'c:\Users\ASUS\Desktop\Naukri AutoMation FullStack\Naukri Frontend\naukri-frontend\src\NaukriScraperPage.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    fc = f.read()

# 1. State Additions
state_target = '''    const [loading, setLoading] = useState(false);
    const [apiMessage, setApiMessage] = useState({ type: '', text: '' });
    const wsRef = useRef(null);'''

state_replacement = '''    const [loading, setLoading] = useState(false);
    const [apiMessage, setApiMessage] = useState({ type: '', text: '' });
    const wsRef = useRef(null);
    
    // Auto Apply & Pause States
    const [autoApplyCountdown, setAutoApplyCountdown] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const countdownRef = useRef(null);
    const pendingAutoApplyRef = useRef(false); // Ref for WS closure'''

fc = fc.replace(state_target, state_replacement)

# 2. Pause and Countdown Functions
func_target = '''    // Save to localStorage whenever formData changes
    useEffect(() => {
        localStorage.setItem('naukriFormData', JSON.stringify(formData));
    }, [formData]);'''

func_replacement = '''    // Save to localStorage whenever formData changes
    useEffect(() => {
        localStorage.setItem('naukriFormData', JSON.stringify(formData));
    }, [formData]);

    const togglePause = async () => {
        if (!formData.username) return;
        const endpoint = isPaused ? `/resume_task/${formData.username}` : `/pause_task/${formData.username}`;
        try {
            await axios.post(BACKEND_URL + endpoint);
            setIsPaused(!isPaused);
            logMessage(`Task ${isPaused ? 'Resumed' : 'Paused'} by user.`);
        } catch (error) {
            logMessage(`[ERROR] Failed to toggle pause state.`, true);
        }
    };

    // Countdown Effect
    useEffect(() => {
        if (autoApplyCountdown === null) return;
        
        if (autoApplyCountdown > 0) {
            countdownRef.current = setTimeout(() => {
                setAutoApplyCountdown(prev => prev - 1);
            }, 1000);
        } else if (autoApplyCountdown === 0) {
            setAutoApplyCountdown(null);
            pendingAutoApplyRef.current = false;
            handleJobTrigger('/start_apply', 'Apply Only Job (Auto)');
        }
        
        return () => clearTimeout(countdownRef.current);
    }, [autoApplyCountdown]);'''

fc = fc.replace(func_target, func_replacement)

# 3. Handle Job Trigger Logic
trigger_target = '''    const handleJobTrigger = async (endpoint, buttonLabel) => {
        if (!formData.username || !formData.password) {'''

trigger_replacement = '''    const handleJobTrigger = async (endpoint, buttonLabel) => {
        if (endpoint === '/run_full_automation') {
            pendingAutoApplyRef.current = true;
            endpoint = '/start_scrape';
        } else if (endpoint === '/start_apply') {
            setAutoApplyCountdown(null);
            pendingAutoApplyRef.current = false;
        } else {
            pendingAutoApplyRef.current = false;
        }

        if (!formData.username || !formData.password) {'''

fc = fc.replace(trigger_target, trigger_replacement)

# 4. Update checkTaskStatus
status_target = '''                if (loading === false) {
                    setLoading(response.data.status);
                }'''

status_replacement = '''                if (loading === false) {
                    setLoading(response.data.status);
                }
                setIsPaused(response.data.is_paused);'''

fc = fc.replace(status_target, status_replacement)

# 5. WS OnMessage
ws_target = '''                    if (data.action === 'scrape_complete') {
                        setLog(prev => [`[${timestamp}] [SUCCESS] Scraping Done. You can now start the Application process.`, ...prev].slice(0, 100));
                    } else if (data.action === 'apply_complete') {
                        setLog(prev => [`[${timestamp}] [SUCCESS] Application process finished.`, ...prev].slice(0, 100));
                    }'''

ws_replacement = '''                    if (data.action === 'scrape_complete') {
                        if (pendingAutoApplyRef.current) {
                            setLog(prev => [`[${timestamp}] [SUCCESS] Scraping Done. Auto-applying in 30 seconds...`, ...prev].slice(0, 100));
                            setAutoApplyCountdown(30);
                        } else {
                            setLoading(false);
                            setLog(prev => [`[${timestamp}] [SUCCESS] Scraping Done. You can now start the Application process.`, ...prev].slice(0, 100));
                        }
                    } else if (data.action === 'apply_complete') {
                        setLoading(false);
                        pendingAutoApplyRef.current = false;
                        setLog(prev => [`[${timestamp}] [SUCCESS] Application process finished.`, ...prev].slice(0, 100));
                    }'''

fc = fc.replace(ws_target, ws_replacement)

# 6. UI Updates
ui_target = '''                            <div className="space-y-4">
                                <ActionButton
                                    onClick={() => handleJobTrigger('/start_scrape', 'Scrape Only Job')}'''

ui_replacement = '''                            {autoApplyCountdown !== null && (
                                <div className="mb-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-center animate-pulse shadow-sm">
                                    <p className="text-indigo-800 font-bold text-lg">Auto-Applying in {autoApplyCountdown}s...</p>
                                    <p className="text-xs text-indigo-600 mt-1">Click "Start Application Only" to apply instantly</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <ActionButton
                                    onClick={() => handleJobTrigger('/start_scrape', 'Scrape Only Job')}'''

fc = fc.replace(ui_target, ui_replacement)

ui_btn_target = '''                                />
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">'''

ui_btn_replacement = '''                                />
                            </div>

                            {loading && (
                                <div className="mt-4 pt-4 border-t border-blue-50">
                                    <button
                                        onClick={togglePause}
                                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                                            isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                    >
                                        {isPaused ? '▶ Resume Process' : '⏸ Pause Process'}
                                    </button>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-gray-100">'''

fc = fc.replace(ui_btn_target, ui_btn_replacement)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(fc)

print("Patched frontend successfully")
