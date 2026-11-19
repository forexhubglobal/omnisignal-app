import subprocess

try:
    ps_cmd = 'Get-CimInstance Win32_Process -Filter "name=\'python.exe\'" | Select-Object ProcessId, CommandLine'
    # To avoid pipe error in our tool, call powershell directly from python subprocess:
    res = subprocess.run(['powershell', '-Command', ps_cmd], capture_output=True, text=True)
    for line in res.stdout.splitlines():
        if 'amaterasu' in line.lower() or 'python' in line.lower():
            print(line.strip())
except Exception as e:
    print('Error:', e)
