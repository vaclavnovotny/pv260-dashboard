---
name: pv260-upload
description: Use when uploading a pv260-points-{group}.json file to the PV260 dashboard at http://localhost:3001/upload — selects or creates the course, then uploads the JSON for a seminar group
---

# PV260 Upload

## Overview

Automates uploading a `pv260-points-{group}.json` file to the local PV260 dashboard. Navigates to the upload page, selects (or creates) the correct course, then submits the file. Uses Playwright MCP (all tools are pre-approved, no permission prompts required).

The backend must be running on port 3001. If it's not, ask the user to start it first.

---

## Runtime Inputs

Ask the user for:
1. **Seminar group** — e.g. `YSoft1` or `YSoft2`
2. **Course name** — if unspecified, navigate first, read the dropdown, and present options before asking
3. **File path** — e.g. `C:\users\ganz\pv260-points-YSoft2.json`

---

## Automation Steps (exact sequence that works)

### 1. Ensure the app is running

Before navigating, check if the app is up:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/courses
```

If the result is NOT `200`, start it with Docker Compose from the project root:

```bash
cd /c/Users/ganz/Documents/PV260/github/pv260-dashboard && docker compose up -d
```

Wait a few seconds, then verify it's up before proceeding.

### 2. Navigate

```
mcp__playwright__browser_navigate → http://localhost:3001/upload
```

### 2. Wait for courses to load, then read them

The course list is fetched async — the dropdown may show only "— select —" immediately after navigation. Wait for it:

```javascript
// browser_evaluate:
() => {
  const opts = Array.from(document.querySelector('.course-selector select').options).map(o => o.text);
  return opts.length > 1 ? opts : null; // null = not ready yet
}
```

If it returns `null`, wait ~500ms and retry (use `browser_wait_for` or just call again).

### 3a. If course exists — select it via JS (React won't detect a plain value assignment)

```javascript
// browser_evaluate:
() => {
  const sel = document.querySelector('.course-selector select');
  const opt = Array.from(sel.options).find(o => o.text === 'COURSE_NAME');
  if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event('change', { bubbles: true })); return true; }
  return false;
}
```

### 3b. If course does NOT exist — create it via the input field

1. Take `browser_snapshot` to get refs
2. `browser_click` the `input[placeholder="New course name"]` (ref from snapshot)
3. `browser_type` the course name into that input
4. `browser_click` the "Add course" button (ref from snapshot)
5. The new course is auto-selected — verify with another `browser_evaluate` reading the selected option

### 4. Open the file chooser and upload

```
browser_click → ref for the "Choose File" button (Results JSON section, NOT the Export/Import one)
```

This opens the file chooser. Then immediately:

```
mcp__playwright__browser_file_upload → paths: ["C:\\Users\\ganz\\Documents\\PV260\\github\\pv260-dashboard\\pv260-points-{group}.json"]
```

Use the absolute Windows path to the file (wherever it was produced — no need to copy it first).

### 5. Click Upload

Take a `browser_snapshot` to get the ref for the Upload `button[type="submit"]`, then:

```
browser_click → Upload button ref
```

### 6. Verify success

```javascript
// browser_evaluate:
() => document.querySelector('.alert-success')?.innerText || document.querySelector('.alert-error')?.innerText || 'no message yet'
```

Report the result to the user (e.g. *"Uploaded 20 team-increment scores."*).

### 7. Set max points per increment

Read max points from the repo:

```bash
cat /c/Users/ganz/Documents/PV260/github/pv260-dashboard/max-points.json
```

For each increment in that file (e.g. `V2: 9`, `V3: 11`):

1. Take `browser_snapshot` to get current refs for the "Set Max Points" section
2. In the **Increment** dropdown (combobox labelled "Increment"), select the increment by label (e.g. "V2")
3. Clear and fill the **Max points** spinbutton with the value
4. Click the **Save** button
5. Verify no error appears before moving to the next increment

The course is already selected from step 3 — the increment dropdown reflects that course's increments.

**Note:** The increment dropdown only shows increments that exist for the selected course (populated after the upload in step 6). If an increment from `max-points.json` is not in the dropdown, skip it silently.

### 8. Close

```
mcp__playwright__browser_close
```

---

## UI Element Reference

| Element | Selector / Note |
|---|---|
| Course `<select>` | `.course-selector select` |
| New course name input | `input[placeholder="New course name"]` |
| Add course button | `button` text "Add course" |
| File input (Results JSON) | First `input[type="file"]` on the page — use snapshot ref, NOT the Export/Import one |
| Upload button | `button[type="submit"]` — use snapshot ref |
| Success message | `.alert-success` |
| Error message | `.alert-error` |
| Increment dropdown | combobox labelled "Increment" — use snapshot ref |
| Max points input | spinbutton labelled "Max points" — use snapshot ref |
| Save (max points) | button "Save" — use snapshot ref |
| Max points config | `max-points.json` in repo root |

---

## Common Issues

| Problem | Fix |
|---|---|
| Page not loading | Run `curl -s http://localhost:3001/api/courses` — if not 200, start with `docker compose up -d` from the project root |
| Course dropdown shows only "— select —" | Courses are still loading — wait and re-read before deciding the course doesn't exist |
| Course dropdown empty after wait | First use — create the course via the "New course name" input |
| Upload button stays disabled | Course not selected or file not set |
| Wrong file input triggered | There are two file inputs (Results JSON + Export/Import) — use snapshot ref from the Upload Results form |
| Error: "Unrecognised format" | Wrong file — must be `pv260-points-{group}.json` produced by pv260-collect |
| App on different port | Dev mode: try `http://localhost:5173/upload` |
