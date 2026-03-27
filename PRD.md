# Centric-Ops — Product Requirements Document (PRD)
> **Source of Truth:** Consolidated from `Code.js` and `Index.html`.
> **Last Updated:** 2026-03-23

## 1. Mission & Vision
Centric-Ops is an operational hub for **Centric Fiber field technicians**. It digitizes the daily field workflow—from viewing appointments and logging fiber installation data (light levels, splice counts) to generating provisioning QR codes and submitting End-of-Day (EOD) reports.

## 2. Core Functional Modules
1.  **Work Tracker (Primary Action):** Technicians log specific installation data (Light Level, Distance, Tube/Port colors, Splice Count, Serial Number). 
    - Generates a pre-filled **Google Form URL** (via `FORM_ID`) for extended data capture.
    - Appends data to the local `4_Work_Tracker` sheet.
2.  **Appointment Management:** Real-time view of scheduled appointments (Local sheet `2_Appointments`). Allows technicians to update status (Logged, Done, etc.).
3.  **Provisioning Tool:** Calculates VLAN/Port/Fiber configurations and generates a provisioning **QR Code** using `QuickChart.io`.
4.  **Community Directory:** Managed via `MASTER_COMM_ID`. Includes geocoding (Nominatim) for field navigation and map views (Leaflet).
5.  **End-of-Day (EOD) Reporting:** A summary report sent via **Gmail** to supervisors, including lead/partner hours and mileage.
6.  **Identity & Security:** PIN-based auth against the `ROSTER_ID` master sheet. Technicians can update their own PINs.

## 3. User Personas
- **Field Technician (Lead):** Primary user. Logs work, manages the day's flow.
- **Partner Technician:** Logged in EOD reports.
- **Ops Supervisor:** Receives EOD reports and monitors community data.

## 4. Technical Architecture
- **Environment:** Google Apps Script (GAS) Web App.
- **Frontend:** Single-page application (SPA) in `Index.html`.
- **UI Design:** "Executive Glass Design System" (Glassmorphism). Uses Bootstrap 5, Leaflet, Chart.js, and Tom Select.
- **Backend:** Google Sheets as a relational database.
- **Identity:** `userId` is the employee name or short-name from the Roster.

## 5. Data Model (The Source of Truth)

### Local Spreadsheet Sheets
| Sheet | Core Columns |
| :--- | :--- |
| **2_Appointments** | `ID`, `Customer Name`, `Address`, `Status`, `User`, `Community`, `Job Type` |
| **3_History** | `Timestamp`, `Tech ID`, `Account ID`, `Address`, `Community`, `Type` |
| **4_Work_Tracker** | `Timestamp`, `Tech ID`, `Community`, `Address`, `Light Level`, `Distance`, `Splice Count`, `Serial`, `Form URL` |
| **5_Identity_Log** | `Timestamp`, `Old Identity`, `New Identity` |
| **6_Feedback** | `Timestamp`, `Tech ID`, `Feedback` |

### Master Sheet Dependencies (External)
- **MASTER_COMM_ID:** `1XXEECHPjlBAdSGO33U5OhwGbZAZLZkfZLK0roY_9XTE` (Communities, Markets, Types).
- **ROSTER_ID:** `1mIY12ikYUpyH1Pe8qpjzVBHoicsErTA1gxbW4ioQpqA` (Employee list, PINs, Roles, Emails).

## 6. Business Logic & Rules
- **Work Tracker Workflow:** Data is logged to the local sheet FIRST, then a Form URL is generated for the technician to complete the "Official" record.
- **Provisioning Logic:** Built into `calculateProvisioning` (Index.html).
- **History Cutoff:** The history view pre-loads data from the last **48 hours** for performance.
- **Geocoding:** Uses OpenStreetMap Nominatim API for community coordinate resolution.

## 7. Success Metrics
- **Log Rate:** 100% of field appointments result in a Work Tracker entry.
- **EOD Accuracy:** Reports reflect actual field hours and community stops.
- **Provisioning Speed:** Technicians use the QR generator instead of manual data entry.

---

## Roadmap / Next Actions
1.  [x] Consolidate PRD.md (Completed)
2.  [x] Initialize AGENT_LOG.md (Completed)
3.  [x] Create CLAUDE.md for Trinity Orchestration.
4.  [x] Refactor Index.html to externalize CSS/JS (Modular Architecture).
5.  [ ] Implement deep search for history across the entire history sheet.
6.  [ ] Enhance "Desktop Command Center" with live metrics dashboard.
