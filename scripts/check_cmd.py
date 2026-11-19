import subprocess

ps_code = 'Get-CimInstance Win32_Process -Filter "name = \'cmd.exe\'" | Select-Object ProcessId, CommandLine'
res = subprocess.run(['powershell', '-Command', ps_code], capture_output=True, text=True)
print(res.stdout)
