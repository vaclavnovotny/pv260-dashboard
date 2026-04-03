---
name: pv260-collect
description: Use when collecting PV260 student evaluation data from IS MUNI (is.muni.cz) into structured JSON — requires Playwright MCP for browser automation
---

# PV260 Collect

## Overview

Automates extraction of per-student evaluation textarea content from IS MUNI and parses it into structured JSON. Requires the Playwright MCP for browser control.

## Prerequisites: Playwright MCP Setup

If Playwright MCP tools (`browser_navigate`, `browser_click`, etc.) are not available, set them up first:

**Step 1:** Add to `~/.claude/.mcp.json` (create if it doesn't exist):
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--incognito"]
    }
  }
}
```

The `--incognito` flag ensures the browser always opens a fresh anonymous session with no cached IS MUNI cookies.

**Step 2:** Restart Claude Code. Verify by checking that `browser_navigate` is available as a tool.

---

## Runtime Inputs

Do **not** ask for UČO or password — if login is required, the user will type credentials directly into the browser window.

**Ask the user which seminar group to export before starting.** Based on their answer, use the corresponding URL:

| Group | URL |
|---|---|
| YSoft1 | `https://is.muni.cz/auth/ucitel/blok_edit?fakulta=1433;obdobi=10044;nbloku=PV260%20Seminar%20Assignments;predmet=1714938;masedleomezsk=878795` |
| YSoft2 | `https://is.muni.cz/auth/ucitel/blok_edit?fakulta=1433;obdobi=10044;nbloku=PV260%20Seminar%20Assignments;predmet=1714938;masedleomezsk=878793` |

---

## Automation Steps

Follow these steps using Playwright MCP tools:

1. **Navigate** to the chosen group's URL using `browser_navigate`
2. **Check if login is required**: after navigation, check the page URL/title. If already on the evaluation page (title contains "Úprava obsahu poznámkového bloku"), skip to step 4. IS MUNI may already be authenticated via the browser session.
3. **Login if needed**: Tell the user: *"Please log in to IS MUNI in the browser window that opened, then let me know when you're done."* Wait for the user to confirm, then verify the page title before continuing.
4. **Extract all student data in one JS call** using `browser_evaluate` with this exact script (save result to a file using the `filename` parameter):

```javascript
() => {
  const table = document.querySelector('table.data1.tab_scroll_sipka') || document.getElementById('tab_9j7q');
  const rows = table.querySelectorAll('tr');
  const results = [];
  let currentStudent = '';
  let studentSeen = new Set();

  for (const row of rows) {
    const cells = row.querySelectorAll('td, th');
    // Student info rows have exactly 9 cells; name is in cell index 3 (Jméno column)
    if (cells.length === 9 && cells[3]?.innerText?.trim() && cells[3].tagName === 'TD') {
      currentStudent = cells[3].innerText.trim();
    }
    // Each student has 2 textarea rows — only take the first one
    const ta = row.querySelector('textarea');
    if (ta && currentStudent && !studentSeen.has(currentStudent)) {
      studentSeen.add(currentStudent);
      results.push({ studentName: currentStudent, textareaValue: ta.value });
    }
  }
  return results;
}
```

Save the result to `./pv260-raw.json` using the `filename` parameter of `browser_evaluate`. This writes to the current working directory (repo root).

5. **Run the parser** in batch mode, using the selected group name (e.g. `YSoft1` or `YSoft2`) in the output filename:
```bash
PYTHONIOENCODING=utf-8 python ~/.claude/skills/pv260-collect/parse.py < ./pv260-raw.json > pv260-points-{group}.json
```
Replace `{group}` with the actual group name, e.g. `pv260-points-YSoft1.json`.

6. **Close the browser** using `browser_close`.

7. **Output** is written to `pv260-points-{group}.json` (e.g. `pv260-points-YSoft1.json`) in the current working directory.

### Page structure notes (as of 2026-04)
- The student table has class `data1 tab_scroll_sipka` (the `id` attribute changes per session — use `querySelector` on the class instead of `getElementById`)
- Student info rows have 9 cells: Poř, učo, Foto, **Jméno** (index 3), Obor, Seminář, Pozn, Uk, Hodnocení
- Each student is followed by sub-rows containing textareas; there are **2 textarea rows per student** with identical content — deduplicate via a `Set` of seen names
- The snapshot of this page is too large to return directly — always use `browser_evaluate` for data extraction, not `browser_snapshot`

---

## Textarea Format & Parsing Rules

### Input format example:
```
team: bar
repo: DeepLens_YSoft_1_Project2
V2
Implementation:*6.5
-0.5 some note about deduction
- another note
Review:*2
V3
Implementation:  *6.5
Review:  *2
Extra points: *2
```

### Extraction rules:

| Field | Rule |
|---|---|
| `teamName` | Line matching `team:\s*(.+)` — capture group |
| `repo` | Line matching `repo:\s*(.+)` — capture group |
| `studentName` | From IS MUNI page (NOT from textarea) |
| Increment name | Line matching `^V\d+\s*$` → e.g. "V2", "V3" |
| Increment points | Sum all `\*<float>` values within that V block (Implementation + Review combined) |
| Extra points | Line matching `Extra points:\s*\*(\d+\.?\d*)` → `{name: "Extra points", points: N}` |

**Important:** Ignore `-0.5`-style deduction notes in the text. Use only values prefixed with `*`.

---

## Output Schema

```json
[
  {
    "studentName": "string — from IS MUNI page",
    "teamName": "string — from team: line",
    "repo": "string — from repo: line",
    "increments": [
      { "name": "V2", "points": 8.5, "extraPoints": 0.0 },
      { "name": "V3", "points": 8.5, "extraPoints": 2.0 }
    ]
  }
]
```

`extraPoints` on the last increment holds the "Extra points:" value; all other increments get `0.0`.

Write final output to `pv260-points-{group}.json` (e.g. `pv260-points-YSoft1.json`) in the current directory.

---

## Parser Script

`~/.claude/skills/pv260-collect/parse.py` — auto-detects mode from stdin:

**Single student** (raw textarea text → parsed object):
```bash
echo "<textarea text>" | PYTHONIOENCODING=utf-8 python ~/.claude/skills/pv260-collect/parse.py
```

**Batch** (JSON array of `{studentName, textareaValue}` → full results array):
```bash
echo '[{"studentName":"...", "textareaValue":"..."}]' | PYTHONIOENCODING=utf-8 python ~/.claude/skills/pv260-collect/parse.py > pv260-results.json
```

`PYTHONIOENCODING=utf-8` is required on Windows for Czech characters.

---

## Common Issues

| Problem | Fix |
|---|---|
| IS MUNI redirects to SSO login | Tell the user to log in directly in the browser window; never ask for credentials in chat |
| Page already authenticated | Skip login entirely — IS MUNI session persists in the Playwright browser |
| `browser_snapshot` result too large | Never use snapshot for this page; always extract via `browser_evaluate` |
| Textarea value is empty via DOM | Use `browser_evaluate` to read `.value` directly, not `.textContent` |
| Duplicate entries per student | Expected — each student has 2 textarea rows; use `studentSeen` Set to deduplicate |
| Student name shows "Blok: PV260..." | Wrong row selected — only use rows with exactly 9 cells, and cell index 3 |
| `parse.py` not found | Ensure the skill directory exists: `~/.claude/skills/pv260-collect/` |
