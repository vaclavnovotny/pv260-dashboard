---
name: terminal-pv260
description: Use when user asks to open terminal for pv260-dashboard, navigate to the dashboard directory, or start working on the pv260-dashboard project.
---

# terminal-pv260

Opens a terminal window navigated to the PV260 dashboard project directory.

## Action

Run this command (uses the current working directory — repo root):

```bash
powershell.exe -Command "Start-Process wt.exe -ArgumentList \"-d $(pwd -W)\""
```

`pwd -W` returns the Windows-style absolute path of the current directory (e.g. `C:\Users\...\pv260-dashboard`).
