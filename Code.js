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
    { name: '2_Appointments', headers: ['ID', 'Customer Name', 'Address', 'Time', 'Status', 'User', 'Community', 'Job Type', 'Unit'] },
    { name: '3_History', headers: ['Timestamp', 'Tech ID', 'Account ID', 'Address', 'Community', 'Market', 'Type'] },
    { name: '4_Work_Tracker', headers: ['Timestamp', 'Tech ID', 'Community', 'Address', 'Job Type', 'Light Level', 'Distance', 'Tube/Splitter Color', 'Port/Fiber Color', 'Splice Count', 'Serial Number', 'Notes', 'Form URL'] },
    { name: '5_Identity_Log', headers: ['Timestamp', 'Old Identity', 'New Identity'] },
    { name: '6_Feedback', headers: ['Timestamp', 'Tech ID', 'Feedback'] }
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

function getAppData(user) {
  try {
    const masterSS = SpreadsheetApp.openById(MASTER_COMM_ID);
    const commSheet = masterSS.getSheetByName('Communities');
    if (!commSheet) throw new Error("Could not find 'Communities' tab in Master Sheet.");
    
    let commData = commSheet.getLastRow() > 1 ? commSheet.getRange(2, 1, commSheet.getLastRow() - 1, 10).getValues() : [];
    let communityMap = {}; let marketsSet = new Set(), typesSet = new Set();

    commData.forEach(row => {
      if (row[0]) { 
        communityMap[row[0]] = { name: row[0], city: row[1] || "", market: row[2] || "", state: row[3] || "TX", zip: row[4] || "", type: row[5] || "", locationId: row[6] || "", vlan: row[7] || "", lat: row[8] || "", lng: row[9] || "" };
        if (row[2]) marketsSet.add(row[2]);
        if (row[5]) typesSet.add(row[5]);
      }
    });

    let rosterList = [];
    try {
      const rosterSS = SpreadsheetApp.openById(ROSTER_ID);
      const rosterSheet = rosterSS.getSheetByName('Roster');
      if (rosterSheet && rosterSheet.getLastRow() > 1) {
        const lastCol = rosterSheet.getLastColumn();
        const rawRoster = rosterSheet.getRange(1, 1, rosterSheet.getLastRow(), lastCol).getValues();
        const headers = rawRoster[0].map(h => String(h).trim().toLowerCase());

        const idx = {
          region: headers.indexOf('sub_region'),
          name: headers.indexOf('employee_name'),
          short: headers.indexOf('person_short'),
          role: headers.indexOf('role'),
          active: headers.indexOf('active'),
          email: headers.indexOf('email'),
          phone: headers.indexOf('phone'),
          manager: headers.indexOf('manager_name'),
          password: headers.indexOf('pin') !== -1 ? headers.indexOf('pin') : headers.indexOf('password')
        };

        rosterList = rawRoster.slice(1)
          .filter(r => idx.name !== -1 && r[idx.name] && String(r[idx.name]).trim() !== '' && idx.active !== -1 && ['true', 'active', 'yes'].includes(String(r[idx.active]).trim().toLowerCase()))
          .map(r => ({ 
            region: idx.region !== -1 ? r[idx.region] : '', 
            name: idx.name !== -1 ? r[idx.name] : '', 
            short: idx.short !== -1 ? r[idx.short] : '', 
            role: idx.role !== -1 ? r[idx.role] : '', 
            active: idx.active !== -1 ? r[idx.active] : '', 
            email: idx.email !== -1 ? r[idx.email] : '', 
            phone: idx.phone !== -1 ? r[idx.phone] : '', 
            manager: idx.manager !== -1 ? r[idx.manager] : '',
            password: idx.password !== -1 ? String(r[idx.password]) : ''
          }));
      }
    } catch(e) { 
      // Inject the error directly into the UI so it doesn't fail silently
      rosterList = [{ region: "Error", name: "⚠️ Data Error: " + e.message, short: "Error", role: "System" }];
    }

    const localSS = SpreadsheetApp.getActiveSpreadsheet();
    let apptData = [];
    let apptSheet = localSS.getSheetByName('2_Appointments');
    if (apptSheet && apptSheet.getLastRow() > 1) {
      let lastCol = apptSheet.getLastColumn();
      let cols = Math.max(lastCol, 9);
      apptData = apptSheet.getRange(2, 1, apptSheet.getLastRow() - 1, cols).getValues()
        .map(r => ({ id: r[0], name: r[1], address: r[2], time: r[3], status: r[4], user: r[5]||'', comm: r[6]||'', jobType: r[7]||'', unit: r[8]||'' }));
    }

    let histData = []; 
    try {
      let histSheet = localSS.getSheetByName('4_Work_Tracker');
      if (histSheet && histSheet.getLastRow() > 1) {
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
        const rawData = histSheet.getRange(2, 1, histSheet.getLastRow() - 1, 5).getValues();
        const reversed = rawData.reverse();
        for (let i = 0; i < reversed.length; i++) {
          let rowDate = new Date(reversed[i][0]);
          if (rowDate >= cutoff) {
            histData.push({ time: Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "MM/dd hh:mm a"), user: reversed[i][1], comm: reversed[i][2], addr: reversed[i][3], typ: reversed[i][4] });
          } else {
            break; // Stop querying since rows are chronological
          }
        }
      }
    } catch(e) { console.error("History preload error:", e); }

    // Fetch Job Types from your old script logic
    const jobTypes = [
      "Home Not Ready", "Fiber Blow", "Hard Down", 
      "Trouble Ticket", "Refered to Maintenance", "Performed Maintenance", 
      "Not Live", "Fiber Blow + Install", "Install", 
      "Mesh Install", "Doorbell Install"
    ];

    let feedbackData = [];
    try {
      let fbSheet = localSS.getSheetByName('6_Feedback');
      if (fbSheet && fbSheet.getLastRow() > 1) {
        const rawFb = fbSheet.getRange(2, 1, fbSheet.getLastRow() - 1, 3).getValues();
        feedbackData = rawFb.reverse().slice(0, 50).map(r => ({
          time: Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), "MM/dd hh:mm a"),
          user: r[1], text: r[2],
          timestamp: new Date(r[0]).getTime()
        }));
      }
    } catch(e) { console.error("Feedback preload error:", e); }

    return { communities: communityMap, markets: Array.from(marketsSet).sort(), types: Array.from(typesSet).sort(), appointments: apptData, history: histData, roster: rosterList, jobTypes: jobTypes, feedback: feedbackData };
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
    if (jobData.serial) extraInfo.push(`Serial: ${jobData.serial}`);
    
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

    if(sheet) sheet.appendRow([new Date(), user, jobData.comm, jobData.addr, jobData.type, jobData.light, jobData.distance, jobData.tubeColor, jobData.portColor, jobData.splice, jobData.serial, jobData.notes, formUrl]);
    
    if (jobData.apptId) {
      updateApptStatus(jobData.apptId, 'Logged');
    }
    
    return { success: true, url: formUrl };
  } catch(e) { return { error: e.message }; }
}

// --- SECURITY LOGGING ---
function logIdentityChange(oldName, newName) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('5_Identity_Log');
    if (sheet) sheet.appendRow([new Date(), oldName || "Unknown", newName]);
  } catch (e) { console.error(e); }
}

// --- IDENTITY PIN MANAGEMENT ---
function updateUserPin(userIdentifier, pin) {
  try {
    const rosterSS = SpreadsheetApp.openById(ROSTER_ID);
    const rosterSheet = rosterSS.getSheetByName('Roster');
    if (!rosterSheet) throw new Error("Roster sheet not found.");
    
    const lastCol = rosterSheet.getLastColumn();
    const lastRow = rosterSheet.getLastRow();
    if (lastRow < 2) throw new Error("Roster is empty.");
    
    const headers = rosterSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim().toLowerCase());
    const nameIdx = headers.indexOf('employee_name');
    const shortIdx = headers.indexOf('person_short');
    
    let pinIdx = headers.indexOf('pin') !== -1 ? headers.indexOf('pin') : headers.indexOf('password');
    
    if (nameIdx === -1) throw new Error("Could not find Employee_Name column in Roster.");
    
    if (pinIdx === -1) {
      pinIdx = lastCol;
      rosterSheet.getRange(1, pinIdx + 1).setValue('PIN');
    }
    
    const data = rosterSheet.getRange(2, 1, lastRow - 1, Math.max(lastCol, pinIdx + 1)).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const rName = data[i][nameIdx];
      const rShort = shortIdx !== -1 ? data[i][shortIdx] : '';
      
      if (String(rName) === String(userIdentifier) || String(rShort) === String(userIdentifier)) {
        rosterSheet.getRange(i + 2, pinIdx + 1).setValue("'" + pin);
        return { success: true };
      }
    }
    throw new Error("User not found in Roster.");
  } catch (e) { throw new Error(e.message); }
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

    GmailApp.sendEmail(eodData.email, `EOD Report - ${user} - ${dateStr}`, "", { 
      htmlBody: body, 
      name: "Jacob's EOD Bot",
      replyTo: eodData.techEmail || "ops-team@centricfiber.com"
    });
    return { success: true };
  } catch(e) { return { error: e.message }; }
}

// --- EXISTING CRUD ---
function saveComm(c, oldName, user) {
  try {
    const masterSS = SpreadsheetApp.openById(MASTER_COMM_ID);
    const commSheet = masterSS.getSheetByName('Communities');
    if (!commSheet) return { error: "Communities sheet not found" };

    const searchName = (oldName && oldName !== c.name) ? oldName : c.name;
    const data = commSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(searchName).toLowerCase()) {
        commSheet.getRange(i + 1, 1, 1, 8).setValues([[c.name, c.city, c.market, c.state || 'TX', c.zip, c.type, c.locationId, c.vlan]]);
        return { success: true };
      }
    }

    // New community — append row
    commSheet.appendRow([c.name, c.city, c.market, c.state || 'TX', c.zip, c.type, c.locationId, c.vlan]);
    return { success: true };
  } catch(e) {
    console.error("saveComm error:", e);
    return { error: e.message };
  }
}

function getHistoryData() {
  const localSS = SpreadsheetApp.getActiveSpreadsheet();
  let histData = [];
  let histSheet = localSS.getSheetByName('4_Work_Tracker');
  if (histSheet && histSheet.getLastRow() > 1) {
    histData = histSheet.getRange(2, 1, histSheet.getLastRow() - 1, 5).getValues().reverse().slice(0, 250).map(r => ({
      time: Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), "MM/dd hh:mm a"),
      user: r[1], comm: r[2], addr: r[3], typ: r[4]
    }));
  }
  return histData;
}

function searchHistoryDB(term) {
  const localSS = SpreadsheetApp.getActiveSpreadsheet();
  let histData = [];
  let histSheet = localSS.getSheetByName('4_Work_Tracker');
  if (histSheet && histSheet.getLastRow() > 1) {
    const rawData = histSheet.getRange(2, 1, histSheet.getLastRow() - 1, 5).getValues();
    const t = term.toLowerCase();
    for (let i = rawData.length - 1; i >= 0; i--) {
       const r = rawData[i];
       if (String(r[2]).toLowerCase().includes(t) || String(r[3]).toLowerCase().includes(t) || String(r[4]).toLowerCase().includes(t)) {
          histData.push({ time: Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), "MM/dd hh:mm a"), user: r[1], comm: r[2], addr: r[3], typ: r[4] });
       }
       if (histData.length >= 50) break; // Limit deep search matches
    }
  }
  return histData;
}

function saveAppt(appt, user) { 
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('2_Appointments'); 
  const id = appt.id || new Date().getTime(); 
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === id.toString()) {
      sheet.getRange(i + 1, 1, 1, 9).setValues([[id, appt.name, appt.address, appt.time, appt.status, user || "Unknown", appt.comm || "", appt.jobType || "", appt.unit || ""]]);
      return true;
    }
  }
  sheet.appendRow([id, appt.name, appt.address, appt.time, appt.status, user || "Unknown", appt.comm || "", appt.jobType || "", appt.unit || ""]); 
  return true; 
}

function updateApptStatus(id, status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('2_Appointments');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === id.toString()) {
      sheet.getRange(i + 1, 5).setValue(status);
      return true;
    }
  }
  return false;
}

function deleteAppt(id) { const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('2_Appointments'); const data = sheet.getDataRange().getValues(); for (let i = 1; i < data.length; i++) { if (data[i][0].toString() === id.toString()) { sheet.deleteRow(i + 1); return true; } } return false; }

// --- FEEDBACK BACKLOG ---
function submitFeedback(text, user) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('6_Feedback');
    if (sheet) sheet.appendRow([new Date(), user || "Unknown", text]);

    try {
      const ownerEmail = Session.getEffectiveUser().getEmail(); // Identifies you as script owner
      GmailApp.sendEmail(ownerEmail, `Centric Ops App Feedback from ${user || "Unknown"}`, `User: ${user || "Unknown"}\n\nFeedback:\n${text}`);
    } catch(emailErr) { console.error("Email notification failed", emailErr); }

    return { success: true };
  } catch(e) { return { error: e.message }; }
}

// --- COMMUNITY GEOCODING ---
function saveCommunityCoordinates(commName, lat, lng) {
  try {
    const masterSS = SpreadsheetApp.openById(MASTER_COMM_ID);
    const commSheet = masterSS.getSheetByName('Communities');
    if (!commSheet) return { error: "Communities sheet not found" };
    
    // Ensure header rows exist for Lat/Lng
    const headerRow = commSheet.getRange(1, 1, 1, 10).getValues()[0];
    if (headerRow[8] !== 'Latitude') commSheet.getRange(1, 9).setValue('Latitude');
    if (headerRow[9] !== 'Longitude') commSheet.getRange(1, 10).setValue('Longitude');

    const data = commSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(commName).toLowerCase()) {
        commSheet.getRange(i + 1, 9).setValue(lat);
        commSheet.getRange(i + 1, 10).setValue(lng);
        return { success: true };
      }
    }
    return { error: "Community not found" };
  } catch(e) { return { error: e.message }; }
}

// --- RUN THIS ONCE FROM THE EDITOR TO FORCE GMAIL PERMISSIONS ---
function forceAuthorize() {
  GmailApp.getInboxUnreadCount();
}

/**
 * Helper function to include partial HTML files.
 */
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}