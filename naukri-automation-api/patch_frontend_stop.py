import re

filepath = r'c:\Users\ASUS\Desktop\Naukri AutoMation FullStack\Naukri Frontend\naukri-frontend\src\NaukriScraperPage.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    fc = f.read()

# 1. Update ActionButton to not be disabled when loading (except itself perhaps)
# Wait, if we just remove disabled={loading} it will be clickable. But we still want some visual distinction or just let handleJobTrigger handle it.
# Actually, the buttons were disabled={loading}. Let's remove disabled={loading}.
fc = fc.replace('disabled={loading}', '')

# 2. Add stopTask function
stop_func = '''    const stopTask = async () => {
        if (!formData.username) return;
        try {
            await axios.post(`${BACKEND_URL}/stop_task/${formData.username}`);
            setLoading(false);
            setIsPaused(false);
            setAutoApplyCountdown(null);
            pendingAutoApplyRef.current = false;
            logMessage(`[SYSTEM] Task forcibly stopped by user.`);
            setApiMessage({ type: 'error', text: 'Process stopped.' });
        } catch (error) {
            logMessage(`[ERROR] Failed to stop task.`, true);
        }
    };'''

fc = fc.replace('    // Countdown Effect', stop_func + '\n\n    // Countdown Effect')

# 3. Update handleJobTrigger to show confirmation if loading
trigger_old = '''    const handleJobTrigger = async (endpoint, buttonLabel) => {
        if (endpoint === '/run_full_automation') {'''

trigger_new = '''    const handleJobTrigger = async (endpoint, buttonLabel) => {
        if (loading) {
            const confirmStop = window.confirm(`A task (${loading}) is currently running. Do you want to stop it and start "${buttonLabel}" instead?`);
            if (!confirmStop) return;
            
            // Stop current task
            await stopTask();
            // Give backend a moment to clean up resources
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        if (endpoint === '/run_full_automation') {'''

fc = fc.replace(trigger_old, trigger_new)

# 4. Add Stop button to UI
ui_old = '''                                <div className="mt-4 pt-4 border-t border-blue-50">
                                    <button
                                        onClick={togglePause}
                                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                                            isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                    >
                                        {isPaused ? '▶ Resume Process' : '⏸ Pause Process'}
                                    </button>
                                </div>'''

ui_new = '''                                <div className="mt-4 pt-4 border-t border-blue-50 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={togglePause}
                                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                                            isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'
                                        }`}
                                    >
                                        {isPaused ? '▶ Resume' : '⏸ Pause'}
                                    </button>
                                    <button
                                        onClick={stopTask}
                                        className="w-full py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg transition-all duration-300 hover:-translate-y-1"
                                    >
                                        🛑 Stop
                                    </button>
                                </div>'''

fc = fc.replace(ui_old, ui_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(fc)

print("Patched frontend with stop logic successfully")
