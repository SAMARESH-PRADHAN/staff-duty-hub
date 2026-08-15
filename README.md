# Staff & Duty Hub

Project Summary

Build a fully responsive, frontend-only React web app (no real backend — use localStorage for all data persistence) for a railway coaching depot's Staff & Duty Management System. This demo covers the HR Manager side in full detail, plus a basic login/role gate for a second role, Roster Manager, whose pages should just show an "Under Development" placeholder screen after login.

Use a clean, professional, modern dashboard aesthetic — navy/deep-blue sidebar, white content area, soft card shadows, rounded corners, colored summary cards, and clear data tables. Use charts (pie, bar, line) wherever a summary/analytics view is useful. Every button, modal, filter, form, and action in this spec must be fully functional against localStorage — no dead buttons, no placeholder alerts unless explicitly noted (e.g., "Under Development").

Seed the app with realistic demo data on first load (see "Demo Data" section) so every screen looks populated and real immediately.

1. Authentication / Login Page

Centered login card on a branded background (depot name: "SBC Coaching Depot — Staff & Duty Management").

Fields, in order:

Role — dropdown with two options: HR Manager, Roster Manager.

Username field.

Password field (masked, with show/hide toggle).

Login button.

Validate against a small hardcoded/localStorage-seeded credentials list (e.g., hr / hr123 for HR Manager, roster / roster123 for Roster Manager). Show inline error on wrong credentials.

On success:

If role = HR Manager → route to HR Dashboard with full sidebar (5 modules below).

If role = Roster Manager → route to a simple page with a big "Roster Manager module is under development" message, a matching sidebar shell (disabled/greyed items), and a Logout button.

Persist session in localStorage so refresh keeps the user logged in; include a Logout button in the top navbar on every page that clears session and returns to login.

2. App Shell (HR Manager)

Left sidebar (collapsible on mobile into a hamburger drawer), navy background, with depot logo/name at top, and 5 nav items with icons:

Dashboard

Designation & Batch Management

Employees

Retirement Forecast

Transfer, Promotion & Early Retirement

DAR & Rewards (Note: that's 6 items — "Designation & Batch Management" and "DAR & Rewards" are separate from the core 4, matching the user's 5-module description where DAR & Rewards is the password-protected 6th/5th item; include all 6 as listed.)

Top navbar: page title, HR Manager's name/avatar, notification bell (optional), Logout button.

Every module page should include, near the top-right of the page:

A filter bar relevant to that page (see per-page specs).

"Download Excel" and "Download PDF" buttons that export the currently filtered table/data (use a client-side library like xlsx/sheetjs for Excel export and jspdf + jspdf-autotable for PDF export — both work fully client-side, no backend needed).

3. Module 1 — Dashboard

A visually rich analytics landing page:

Summary cards (colored, icon-based) across the top:

Total Employees on Roll

Retiring in Next 12 Months

Employees with DAR Record (count only — never reveal details here)

Employees with Reward Record

Total Batches / Total Designations

Pending "data needs cleanup" count (e.g., missing HRMS-ID or Aadhaar)

Charts:

Pie chart: Headcount by Designation.

Bar chart: Headcount by Batch.

Bar/line chart: Retirements per year for next 5 years.

Donut chart: Gender distribution.

Recent Activity feed: last 10 actions (employee added, promoted, transferred, DAR added, etc.) pulled from an activity log stored in localStorage.

Fully responsive — cards stack on mobile, charts resize.

4. Module 2 — Designation & Batch Management

Two tabs or side-by-side panels: Designations and Batches.

Each panel is a simple CRUD table:

Table columns: Name, No. of Employees currently in it (computed), Actions (Edit / Delete).

"+ Add Designation" / "+ Add Batch" button opens a modal with a Name field and Save.

Edit opens the same modal pre-filled.

Delete asks for confirmation; prevent deletion (show a toast/error) if any employee currently uses that designation/batch, since this list feeds the dropdowns on the Employees form.

Seed with realistic designations (Sr.Tech, Tech-I, Tech-II, Tech-III, Helper, Supervisor, Ministerial, Miscellaneous) and batches (e.g., Batch A–Batch J, Rajdhani Batch, VB Batch, General Pool, Sick Line/IOH).

5. Module 3 — Employees

5.1 Employees List (table view)

Filter bar: Age range, Designation, Batch, Gender, Status (Active/Transferred/Retired), Search by name/token/HRMS-ID.

"+ Add Employee" button (top right) opens the Add Employee form (below).

Import button: upload a .xlsx/.csv and map/append rows into localStorage employee list (simple parser using xlsx/papaparse; show a preview + "Confirm Import" step).

Export → Excel and PDF buttons for the filtered table.

Table columns: Photo (thumbnail), Name, Token No., HRMS-ID, Designation, Batch, Age, Status, Action column with two buttons:

Edit (pencil icon) → opens the same form pre-filled, editable.

Details (eye/info icon) → opens the Employee Details page/modal.

A small red dot/badge on the row (near the photo or name) if that employee has any DAR record — purely a visual signal, no text, matching the client's "wordless yellow band" concept but shown as a red mark in the table per this spec. This mark must never appear in Excel/PDF exports.

5.2 Add / Edit Employee Form

Fields, in this order, in a clean multi-section form (use sectioned cards or a stepper — "Basic Details", "Contact", "Identity", "Service", "Qualification & Documents"):

Employee Photo (upload, with preview, stored as base64 in localStorage for the demo).

Full Name

Gender (dropdown: Male / Female / Other)

Token Number

HRMS-ID (6-character key)

Batch (dropdown, sourced from Module 2 batches)

Designation (dropdown, sourced from Module 2 designations)

Phone Number

Emergency Contact Number

Address (textarea)

Aadhaar Number — must validate exactly 12 digits, numeric only, inline validation error otherwise.

PAN Number — validate standard PAN format (5 letters, 4 digits, 1 letter).

PF Number

Date of Birth (date picker)

Date of Appointment (date picker)

Qualification

Documents: repeatable field group — for each document: a "Document Name" text input, then a file upload below it. A "+ Add Another Document" button lets HR attach multiple named documents (e.g., "Aadhaar Card", "10th Certificate", "Appointment Letter").

Save and Cancel buttons. On Save: validate required fields, auto-generate a unique employee ID, store to localStorage, log an activity entry, show success toast, return to Employees list.

5.3 Employee Details Page/Modal

A beautifully laid-out read-only profile:

Left: large photo, Name, Token No., HRMS-ID, current Designation & Batch, Status badge.

Auto-calculated Retirement Date, shown prominently (amber highlight). Calculation rule (FR 56):

Retirement is the last day of the month in which the employee turns 60, except if the Date of Birth is the 1st of a month, in which case retirement is the last day of the previous month.

Example the client gave: DOB 01-May-1990 → retires 30-Apr-2050. DOB 03-May-1990 → retires 31-May-2050.

Implement this precisely as a utility function and reuse it everywhere retirement date is shown.

Contact & Address, Identity numbers (Aadhaar/PAN masked by default with an "eye" icon to reveal — log the reveal action to the activity feed), PF number, Qualification.

Documents section: list of uploaded documents by name, each clickable/downloadable (demo: opens the stored base64/file in a new tab).

Designation History / Promotion Timeline: a nice vertical/horizontal timeline component showing: Joining Designation (with date) → each Promotion (designation + date) → Current Designation. Pulled from the same history log used in Module 5.

DAR / Reward indicator: if this employee has DAR or Reward records, show a small badge/tag here too (no details — details only inside the password-protected module), e.g., "⚠ Disciplinary record on file" / "🏅 Reward on file" as plain text tags, without exposing specifics.

Close/Back button.

6. Module 4 — Retirement Forecast

Date range filter at top (From date / To date pickers) plus quick presets (Next 3 months / Next 6 months / Next 1 year / Next 5 years).

Optional secondary filters: Designation, Batch.

Table, sorted by nearest retirement date first, columns: Employee Name, Token No., Designation, Batch, DOB, Date of Joining, Retirement Date, Months Remaining.

Toggle view: Flat list vs Grouped by Designation (accordion/collapsible groups with sub-totals).

Highlight rows retiring within 3 months in a distinct color (e.g., light red) as "urgent."

Excel/PDF export of the filtered forecast.

7. Module 5 — Transfer, Promotion & Early Retirement

Action buttons at top: "+ New Promotion", "+ New Transfer", "+ Record Early Retirement" — each opens a modal:

Promotion modal: Select Employee (searchable dropdown) → shows current designation (read-only) → New Designation (dropdown) → Effective Date → Remarks → Save. On save, push an entry into that employee's promotion history array (with old designation, new designation, date, and who recorded it) and update their current designation.

Transfer modal: Select Employee → From Batch/Depot (read-only) → New Batch or "Transferred Out of Depot" toggle → Effective Date → Remarks → Save. If "Transferred Out," mark the employee Status = Transferred but keep the record fully visible in Employees list (never delete/hide it) — this matches the client's requirement that transferred-out staff stay visible with a closed record.

Early Retirement modal: Select Employee → Effective Date → Reason → Save. Sets Status = Retired (Early) and overrides the calculated retirement date with this actual date, while still storing the original FR-56 calculated date for reference.

History table below, filterable by Type (Promotion/Transfer/Early Retirement), Month/Year, Batch, Designation — showing all such events with employee name, type, from → to, date, and remarks.

Monthly summary widget: small bar chart "Promotions vs Transfers vs Early Retirements per month" for the last 12 months.

Note callout: promotions/transfers are never destructive — the full history per employee (kept for at least 7 years, viewable anytime) is always retained and visible from the Employee Details page timeline.

Excel/PDF export of the filtered history table.

8. Module 6 — DAR & Rewards (Password Protected)

Clicking this sidebar item first shows a password prompt modal (separate module password, e.g., dar123 for the demo) before rendering anything else. Wrong password shows an error and does not reveal any content. Successful entry should be logged to the activity feed as "DAR module accessed."

Once unlocked, show:

Employee selector (searchable dropdown) at top.

"+ Add DAR Record" and "+ Add Reward Record" buttons, each opening a modal:

DAR modal fields: Employee (pre-filled if selected), Type of Action (dropdown: Warning / Censure / Withholding of Increment / Reduction in Rank / Removal / Other — reflecting Indian Railway D&AR categories), Date, Description/Grounds, Reference/Order No., Recorded By.

Reward modal fields: Employee, Type of Reward (dropdown: Appreciation Letter / Cash Award / Medal / Other), Date, Description, Reference No., Recorded By.

Records table for the selected employee (or all, if none selected) showing all DAR and Reward entries with date, type, description, recorded-by, and an Edit button.

This is the only place full DAR/Reward details are ever shown; everywhere else in the app only a small badge/dot indicator appears (as described in Modules 3 and Employee Details).

Excel/PDF export available here too (still requires the module to be unlocked in-session to export).

Add a session timeout simulation: after 10 minutes of inactivity on this page, auto re-lock and require the password again.

9. Cross-cutting Requirements

State/persistence: use localStorage as the single source of truth; wrap access in a small storage.js utility (get/set/update helpers) so it's easy to swap for a real API later.

Activity Log: every create/edit/delete/promotion/transfer/DAR/reward/reveal-Aadhaar/DAR-unlock action appends a timestamped entry { actor, action, target, timestamp } to a localStorage activity log, used by the Dashboard's recent activity feed.

Responsive design: sidebar collapses to a drawer below ~768px; tables become horizontally scrollable or convert to stacked cards on mobile; forms go single-column on mobile; charts resize fluidly.

Consistent design system: define and reuse a small set of Tailwind-based tokens — navy (#0F2547 or similar) for sidebar/primary, white/light-grey content background, one accent color for primary actions, amber for retirement/urgent highlights, red for DAR indicators, green for rewards, soft shadows and 8–12px rounded corners throughout.

Toasts for every successful action (save, delete, export, import, unlock, etc.) and clear inline validation errors for every form.

Every button must work: no alert("coming soon") anywhere except the Roster Manager placeholder page, which explicitly should say "Under Development."

10. Demo Data to Seed on First Load

Seed localStorage with:

2 login accounts (HR Manager, Roster Manager) as above, and a DAR module password.

8 designations, 10 batches (including "Rajdhani Batch," "VB Batch," "General Pool," "Sick Line/IOH").

25–30 demo employees with varied ages (including a few due to retire within the next 3–12 months to populate the Retirement Forecast nicely), varied designations/batches/genders, realistic Indian names, placeholder avatar photos, valid-format dummy Aadhaar/PAN numbers, 1–2 sample documents each, and 2–3 with a promotion/transfer history entry.

4–5 sample DAR records and 4–5 sample Reward records spread across a handful of employees (so the red-dot indicators show up in the Employees table).

10–15 sample activity log entries with varied recent timestamps for the Dashboard feed.

11. Tech Notes for Lovable

React + Tailwind CSS.

Charting: recharts.

Excel export/import: xlsx (SheetJS).

PDF export: jspdf + jspdf-autotable.

Icons: lucide-react.

Routing: react-router-dom, with a simple auth guard reading session from localStorage.

Keep all business logic (retirement calc, history tracking, filters) in small utility files so it reads cleanly and is easy to extend later toward a real backend.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/293e7a99-ccd0-4e56-a989-aaaa0f0e4225).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
