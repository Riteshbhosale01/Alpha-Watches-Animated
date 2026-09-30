ALPHA ENQUIRY DASHBOARD + SAFE RESET

The current website ALREADY contains enquiries.html, which is the enquiry graph page.
It uses Chart.js and shows:
- Total enquiries
- Today's enquiries
- Rolling 7-day total
- 14 / 30 / 90 day graph range
- Automatic refresh every 20 seconds
- Demo data fallback when the stats API is unavailable

The v7 package keeps that dashboard and adds a safe Google Sheets reset tool.

GOOGLE APPS SCRIPT SETUP
1. Open the SAME Google Apps Script project currently receiving Alpha enquiries.
2. Keep your existing doPost(e) function unchanged.
3. Replace/merge the included GoogleAppsScript_stats_doGet.gs with that project.
4. Set SHEET_NAME near the top to the exact tab containing enquiries. Default: Enquiries.
5. Deploy/redeploy the Web App so the new doGet endpoint is active.
6. Ensure the Web App is accessible by the public website.
7. enquiries.html already points at the current /exec endpoint. Change API_URL there only if you deploy a new URL.

SAFE DATA RESET
After adding the script, open the Google Sheet and refresh/reopen it. You will get:
ALPHA ADMIN -> Reset enquiry data

The command asks for confirmation, then runs clearContent() on row 2 through the last used row.
It does NOT delete rows, so the following are preserved:
- Header row
- Colors
- Fonts
- Borders
- Column widths
- Filters / sheet structure
- Conditional formatting

IMPORTANT
This reset command is not exposed as a public webpage button. That would be unsafe because anyone could potentially clear the enquiry database. Only a user with edit access to the Google Sheet can run the custom menu command.

After a reset, the public graph will naturally return to zero once its 20-second refresh runs.
