import subprocess

ps_code = 'Get-Process | Select-Object Id, ProcessName, MainWindowTitle'
res = subprocess.run(['powershell', '-Command', ps_code], capture_output=True, text=True)
for line in res.stdout.splitlines():
    lower = line.lower()
    if any(k in lower for k in ['terminal', 'metatrader', 'python', 'amaterasu', 'cmd', 'powershell', 'node']):
        print(line)
