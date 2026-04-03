---
name: pv260-update
description: Use when refreshing PV260 dashboard data for all seminar groups — collects evaluation data from IS MUNI and uploads it to the dashboard in one workflow
---

# PV260 Update

## Overview

Full end-to-end refresh of the PV260 dashboard. Collects data for both seminar groups from IS MUNI, then uploads both to the dashboard.

**Requires:** pv260-collect and pv260-upload skills, Playwright MCP, backend running on port 3001.

---

## Sequence

Run in this order — collect both groups first, then upload both:

### Phase 1 — Collect YSoft1

Invoke **pv260-collect** for group `YSoft1`.
Output: `pv260-points-YSoft1.json` in the current working directory.

### Phase 2 — Collect YSoft2

Invoke **pv260-collect** for group `YSoft2`.
Output: `pv260-points-YSoft2.json` in the current working directory.

### Phase 3 — Upload YSoft1

Invoke **pv260-upload** with:
- Group: `YSoft1`
- File: `pv260-points-YSoft1.json` (from Phase 1)
- Course: `PV260 YSoft 1`

### Phase 4 — Upload YSoft2

Invoke **pv260-upload** with:
- Group: `YSoft2`
- File: `pv260-points-YSoft2.json` (from Phase 2)
- Course: `PV260 YSoft 2`

---

## Notes

- Login to IS MUNI is required once during Phase 1. The Playwright browser session stays open between phases so you are already authenticated for Phase 2.
- If IS MUNI session expires between phases, the user will need to log in again.
- Report results after each upload (e.g. "YSoft1: Uploaded 18 scores. YSoft2: Uploaded 20 scores.").
