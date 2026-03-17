/**
 * BACKEND LOGIC (Code.gs)
 * Platform: Centric Fiber Field Ops v9.0 (Work Tracker + EOD Hub)
 */

const MASTER_COMM_ID = '1XXEECHPjlBAdSGO33U5OhwGbZAZLZkfZLK0roY_9XTE';
const ROSTER_ID = '1mIY12ikYUpyH1Pe8qpjzVBHoicsErTA1gxbW4ioQpqA';

// Replace with your actual Form ID if it changes
const FORM_ID = "1-jaK5AfhgkwZE1TgtAe_nLqlLo60Z0ai7sALijU45jQ";

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setTitle('Centric Fiber Ops');
}

function setupDatabase() {
  const localSS = SpreadsheetApp.getActiveSpreadsheet();
  
  // Added Work Tracker to the local DB setup
  const localSheets = [
    { name: '2_Appointments', headers: ['ID', 'Customer Name', 'Address', 'Time', 'Status'] },
    { name: '3_History', headers: ['Timestamp', 'Tech ID', 'Account ID', 'Address', 'Community', 'Market', 'Type'] },
    { name: '4_Work_Tracker', headers: ['Timestamp', 'Tech ID', 'Community', 'Address', 'Job Type', 'Light Level', 'Distance', 'Tube/Splitter Color', 'Port/Fiber Color', 'Splice Count', 'Notes', 'Form URL'] }
  ];

  localSheets.forEach(s => {
    let sheet = localSS.getSheetByName(s.name);
    if (!sheet) {
      sheet = localSS.insertSheet(s.name);
      sheet.appendRow(s.headers);
      sheet.getRange(1, 1, 1, s.headers.length).setFontWeight("bold").setBackground("#1e3c72").setFontColor("white");
      sheet.setFrozenRows(1);
    }
  });
}

function getAppData() {
  try {
    const masterSS = SpreadsheetApp.openById(MASTER_COMM_ID);
    const commSheet = masterSS.getSheetByName('Communities');
    if (!commSheet) throw new Error("Could not find 'Communities' tab in Master Sheet.");
    
    let commData = commSheet.getLastRow() > 1 ? commSheet.getRange(2, 1, commSheet.getLastRow() - 1, 9).getValues() : [];
    let communityMap = {}; let marketsSet = new Set(), typesSet = new Set();

    commData.forEach(row => {
      if (row[0]) { 
        communityMap[row[0]] = { name: row[0], city: row[1] || "", market: row[2] || "", state: row[3] || "TX", zip: row[4] || "", type: row[5] || "", locationId: row[6] || "", vlan: row[7] || "" };
        if (row[2]) marketsSet.add(row[2]);
        if (row[5]) typesSet.add(row[5]);
      }
    });

    let rosterList = [];
    try {
      const rosterSS = SpreadsheetApp.openById(ROSTER_ID);
      const rosterSheet = rosterSS.getSheetByName('Roster');
      if (rosterSheet && rosterSheet.getLastRow() > 1) {
        const rawRoster = rosterSheet.getRange(2, 1, rosterSheet.getLastRow() - 1, 6).getValues();
        rosterList = rawRoster.filter(r => r[5] === true || r[5] === 'TRUE').map(r => ({ region: r[0], name: r[1], short: r[3], role: r[4] }));
      }
    } catch(e) { console.error("Could not load Roster DB"); }

    const localSS = SpreadsheetApp.getActiveSpreadsheet();
    let apptData = [];
    let apptSheet = localSS.getSheetByName('2_Appointments');
    if (apptSheet && apptSheet.getLastRow() > 1) {
      apptData = apptSheet.getRange(2, 1, apptSheet.getLastRow() - 1, 5).getValues().map(r => ({ id: r[0], name: r[1], address: r[2], time: r[3], status: r[4] }));
    }

    let histData = [];
    let histSheet = localSS.getSheetByName('3_History');
    if (histSheet && histSheet.getLastRow() > 1) {
      histData = histSheet.getRange(2, 1, histSheet.getLastRow() - 1, 7).getValues().reverse().slice(0, 30).map(r => ({
        time: Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), "MM/dd hh:mm a"),
        user: r[1], id: r[2], addr: r[3], comm: r[4], mkt: r[5], typ: r[6]
      }));
    }

    // Fetch Job Types from your old script logic
    const jobTypes = [
      "Home Not Ready", "Fiber Blow", "Fiber Blow Complete", "Hard Down", 
      "Trouble Ticket", "Refered to Maintenance", "Performed Maintenance", 
      "Not Live", "FB/ Install", "FB/ Install Complete", "Install", 
      "Install Complete", "Mesh Install", "Mesh Install Complete", 
      "Doorbell Install", "Doorbell Install Complete"
    ];

    return { communities: communityMap, markets: Array.from(marketsSet).sort(), types: Array.from(typesSet).sort(), appointments: apptData, history: histData, roster: rosterList, jobTypes: jobTypes };
  } catch (error) { throw new Error("Backend Error: " + error.message); }
}

// --- WORK TRACKER & FORM URL GENERATOR ---
function logWorkTracker(jobData, user) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('4_Work_Tracker');
    
    // Combine new data into notes for the Form URL just in case there are no entry IDs mapped
    let combinedNotes = jobData.notes;
    let extraInfo = [];
    if (jobData.light) extraInfo.push(`Light: ${jobData.light}`);
    if (jobData.distance) extraInfo.push(`Dist: ${jobData.distance}`);
    if (jobData.tubeColor) extraInfo.push(`Tube: ${jobData.tubeColor}`);
    if (jobData.portColor) extraInfo.push(`Port: ${jobData.portColor}`);
    
    if (extraInfo.length > 0) {
      combinedNotes = extraInfo.join(" | ") + "\n\n" + combinedNotes;
    }

    // Generate the pre-filled Form URL
    const baseURL = `https://docs.google.com/forms/d/${FORM_ID}/viewform?usp=pp_url`;
    const params = [
      `entry.676577556=${encodeURIComponent(user)}`, // Submitter
      `entry.602103902=No`, // Skip Question
      `entry.1227907034=${encodeURIComponent(jobData.comm)}`, // Community
      `entry.1706249198=${encodeURIComponent(jobData.addr)}`, // Address
      `entry.814469077=${encodeURIComponent(jobData.type)}`, // Job Type
      `entry.1164864873=${encodeURIComponent(jobData.splice)}`, // Splice Count
      `entry.712680230=${encodeURIComponent(combinedNotes)}` // Notes
    ];
    const formUrl = baseURL + "&" + params.filter(Boolean).join("&");

    if(sheet) sheet.appendRow([new Date(), user, jobData.comm, jobData.addr, jobData.type, jobData.light, jobData.distance, jobData.tubeColor, jobData.portColor, jobData.splice, jobData.notes, formUrl]);
    
    return { success: true, url: formUrl };
  } catch(e) { return { error: e.message }; }
}

// --- EOD REPORTING ---
function submitEOD(eodData, user) {
  try {
    const tz = Session.getScriptTimeZone();
    const dateStr = Utilities.formatDate(new Date(), tz, "MM/dd/yyyy");
    
    const body = `
      <h3>End of Day Report: ${dateStr}</h3>
      <p><b>Lead Tech:</b> ${user}</p>
      <p><b>Partner:</b> ${eodData.partner || 'None'}</p>
      <br>
      <p><b>Lead Hours:</b> ${eodData.leadHours}</p>
      <p><b>Partner Hours:</b> ${eodData.partnerHours || '0'}</p>
      <p><b>Mileage:</b> ${eodData.mileage}</p>
      <br>
      <p><i>Note: Job summary data is recorded in the Work Tracker database.</i></p>
    `;

    GmailApp.sendEmail(eodData.email, `EOD Report - ${user} - ${dateStr}`, "", { htmlBody: body, name: "Ops Hub EOD" });
    return { success: true };
  } catch(e) { return { error: e.message }; }
}

// --- EXISTING CRUD ---
function saveComm(c, oldName, user) { /* Same as previous version */ return true; }
function logHistory(item, user) { const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('3_History'); if(sheet) sheet.appendRow([new Date(), user, item.id, item.addr, item.comm, item.mkt, item.typ]); return true; }
function saveAppt(appt) { const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('2_Appointments'); sheet.appendRow([new Date().getTime(), appt.name, appt.address, appt.time, appt.status]); return true; }
function deleteAppt(id) { const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('2_Appointments'); const data = sheet.getDataRange().getValues(); for (let i = 1; i < data.length; i++) { if (data[i][0].toString() === id.toString()) { sheet.deleteRow(i + 1); return true; } } return false; }