#!/usr/bin/env python3
"""
PV260 student textarea parser.

Single mode  — reads raw textarea text from stdin, outputs one parsed JSON object:
    echo "<textarea>" | python parse.py

Batch mode   — reads a JSON array of {studentName, textareaValue} from stdin,
               outputs the full results array:
    echo '[{"studentName":"...", "textareaValue":"..."}]' | python parse.py

Auto-detected: if stdin starts with '[', batch mode is assumed.
"""

import json
import re
import sys


def parse_textarea(text: str) -> dict:
    lines = text.splitlines()
    team_name = ""
    repo = ""
    increments = []
    current_version = None
    current_points = 0.0

    def flush():
        nonlocal current_version, current_points
        if current_version is not None:
            increments.append({"name": current_version, "points": round(current_points, 4)})
            current_version = None
            current_points = 0.0

    for line in lines:
        s = line.strip()

        m = re.match(r"^team:\s*(.+)$", s, re.IGNORECASE)
        if m:
            team_name = m.group(1).strip()
            continue

        m = re.match(r"^repo:\s*(.+)$", s, re.IGNORECASE)
        if m:
            repo = m.group(1).strip()
            continue

        # "Extra points: *N"  or  "Extra points:" (value on next line)
        m = re.match(r"^Extra points:\s*(?:\*(\d+\.?\d*))?$", s, re.IGNORECASE)
        if m:
            flush()
            if m.group(1) is not None:
                increments.append({"name": "Extra points", "points": float(m.group(1))})
            else:
                current_version = "Extra points"
                current_points = 0.0
            continue

        # Vn version header
        m = re.match(r"^(V\d+)\s*$", s)
        if m:
            flush()
            current_version = m.group(1)
            current_points = 0.0
            continue

        if current_version is not None:
            for pts in re.findall(r"\*(\d+\.?\d*)", s):
                current_points += float(pts)

    flush()

    extra = next((i["points"] for i in increments if i["name"] == "Extra points"), None)
    version_increments = [i for i in increments if i["name"] != "Extra points"]

    # Assign extraPoints to each increment: last version gets the extra value, rest get 0.0
    for i, inc in enumerate(version_increments):
        is_last = (i == len(version_increments) - 1)
        inc["extraPoints"] = (extra if extra is not None else 0.0) if is_last else 0.0

    return {"teamName": team_name, "repo": repo, "increments": version_increments}


def main():
    raw = sys.stdin.read()

    if raw.lstrip().startswith("["):
        # Batch mode: [{studentName, textareaValue}, ...]
        students = json.loads(raw)
        results = []
        for item in students:
            parsed = parse_textarea(item["textareaValue"])
            results.append({
                "studentName": item["studentName"],
                "teamName": parsed["teamName"],
                "repo": parsed["repo"],
                "increments": parsed["increments"],
            })
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        # Single mode: raw textarea text
        result = parse_textarea(raw)
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
