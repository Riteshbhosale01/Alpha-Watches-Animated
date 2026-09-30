/**
 * ALPHA WATCHES — enquiry statistics + safe sheet reset helpers
 *
 * ADD THIS TO THE SAME Google Apps Script PROJECT that currently receives
 * enquiry POST submissions. Keep your existing doPost(e) function unchanged.
 *
 * The public GET endpoint returns aggregate statistics only.
 * It never returns names, email addresses or enquiry messages.
 *
 * The reset function is NOT exposed as a public URL. It is available through
 * a Google Sheets custom menu so only someone with edit access to the sheet
 * can run it.
 */

const SHEET_NAME = 'Enquiries';

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';
  if (action !== 'stats') {
    return json_({ok:false, error:'Use ?action=stats'});
  }

  const sheet = getEnquirySheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return json_({ok:true,total:0,today:0,last7Days:0,points:[]});
  }

  const headers = values[0].map(String);
  const rows = values.slice(1);

  const timestampIndex = findHeaderIndex_(headers, [
    'Timestamp','timestamp','Submitted At','submitted_at','Date','date','Time'
  ]);
  const tsIndex = timestampIndex >= 0 ? timestampIndex : 0;

  const timeZone = Session.getScriptTimeZone() || 'Asia/Kolkata';
  const now = new Date();
  const todayKey = Utilities.formatDate(now, timeZone, 'yyyy-MM-dd');
  const daily = {};
  let today = 0;
  let last7Days = 0;
  let total = 0;

  rows.forEach(row => {
    const raw = row[tsIndex];
    const date = parseDate_(raw);
    if (!date) return;

    total++;
    const key = Utilities.formatDate(date, timeZone, 'yyyy-MM-dd');
    daily[key] = (daily[key] || 0) + 1;

    const diff = Math.floor((startOfDay_(now,timeZone) - startOfDay_(date,timeZone)) / 86400000);
    if (key === todayKey) today++;
    if (diff >= 0 && diff < 7) last7Days++;
  });

  const points = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = Utilities.formatDate(d, timeZone, 'yyyy-MM-dd');
    points.push({date:key,count:daily[key] || 0});
  }

  return json_({ok:true,total,today,last7Days,points});
}

/** Adds a safe reset command to the Google Sheets Extensions menu. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ALPHA ADMIN')
    .addItem('Reset enquiry data', 'resetEnquiries')
    .addToUi();
}

/**
 * Clears enquiry values from row 2 downward and preserves formatting.
 * The header row, colors, borders, widths, filters and conditional formatting
 * are left intact because this uses clearContent(), not deleteRows().
 */
function resetEnquiries() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getEnquirySheet_();
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn < 1) {
    ui.alert('ALPHA Enquiries', 'There is no enquiry data to reset.', ui.ButtonSet.OK);
    return;
  }

  const confirmation = ui.alert(
    'Reset enquiry data?',
    'This will clear all enquiry values from row 2 downward but keep the header and all sheet formatting. This cannot be undone.',
    ui.ButtonSet.YES_NO
  );

  if (confirmation !== ui.Button.YES) return;

  sheet.getRange(2, 1, lastRow - 1, lastColumn).clearContent();

  ui.alert(
    'ALPHA Enquiries',
    'Enquiry data has been cleared. Formatting, colors, borders and the header row were preserved.',
    ui.ButtonSet.OK
  );
}

function getEnquirySheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found`);
  return sheet;
}

function findHeaderIndex_(headers, names) {
  const lower = headers.map(h => h.trim().toLowerCase());
  for (const name of names) {
    const idx = lower.indexOf(name.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseDate_(raw) {
  if (Object.prototype.toString.call(raw) === '[object Date]' && !isNaN(raw.getTime())) {
    return raw;
  }
  if (raw === null || raw === '') return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay_(date, timeZone) {
  const key = Utilities.formatDate(date, timeZone, 'yyyy/MM/dd');
  return new Date(key + ' 00:00:00');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
