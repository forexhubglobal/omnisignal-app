import subprocess

ps_code = '(Get-CimInstance Win32_Process -Filter "ProcessId = 3756").CommandLine'
res = subprocess.run(['powershell', '-Command', ps_code], capture_output=True, text=True)
print('Process 3756 CommandLine:')
print(res.stdout)
