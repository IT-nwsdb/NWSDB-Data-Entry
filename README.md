# Project Data Entry Website (HTML + JS + CSS + Bootstrap)

This is a simple **no-backend** website to enter project data without using the Excel file.

## How to run
### Option A (quick)
Open `index.html` in a browser (Chrome/Edge).

### Option B (recommended)
Run a small local server (so everything behaves consistently):

**Windows (PowerShell)**
```powershell
cd <this-folder>
python -m http.server 8000
```

Then open:
http://localhost:8000

## How it works
- Choose a sheet: **Proposed Projects**, **Under Feasibility**, or **Rechargable**
- Use **Add Row** to insert a new row
- Edit the cells like a spreadsheet
- Click **Save** to store data in the browser (localStorage)

## Notes
- This does NOT sync between computers/users (because there is no backend).
- If you need multi-user access, add a backend database (Firebase / Supabase / Google Sheets API / server + MySQL, etc.).
