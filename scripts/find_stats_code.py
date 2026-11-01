import glob, re

print("=== SEARCHING STATS IN JS ===")
for f in glob.glob("js/*.js"):
    with open(f, "r", encoding="utf-8", errors="ignore") as fp:
        lines = fp.readlines()
    for idx, line in enumerate(lines):
        if any(term in line.lower() for term in ["tab-stat", "renderstat", "page-stat", "winrate", "totalpips", "signals-history"]):
            print(f"{f}:{idx+1} -> {line.strip()[:100]}")
