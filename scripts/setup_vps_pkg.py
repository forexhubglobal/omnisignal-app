import os, shutil

base_pkg = r'C:\Users\US\Desktop\AMATERASU_VPS_PACKAGE'

folders = [
    ('Master1_Cent', 'bridge_config_acc1.json', 'title BRIDGE MASTER 1 (CENT #5100154135)\ncolor 0A'),
    ('Master2_Cent', 'bridge_config_acc2.json', 'title BRIDGE MASTER 2 (CENT #5100207348)\ncolor 0E'),
    ('Master3_Standard', 'bridge_config_acc3.json', 'title BRIDGE MASTER 3 (STANDARD #5100209626)\ncolor 0B')
]

for name, cfg_src, header in folders:
    target_dir = os.path.join(base_pkg, name)
    os.makedirs(target_dir, exist_ok=True)
    shutil.copy2(os.path.join(base_pkg, 'amaterasu_mt5_bridge.py'), target_dir)
    shutil.copy2(os.path.join(base_pkg, cfg_src), os.path.join(target_dir, 'bridge_config.json'))
    bat_content = f"@echo off\n{header}\ncd /d \"%~dp0\"\npython amaterasu_mt5_bridge.py\npause\n"
    with open(os.path.join(target_dir, 'run.bat'), 'w', encoding='utf-8') as f:
        f.write(bat_content)

print('Folders created successfully!')
