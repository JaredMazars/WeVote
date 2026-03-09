# WeVote — Testing Guide

## Prerequisites

| Requirement | Details |
|---|---|
| Frontend | `npm run dev` → http://localhost:5173 |
| Backend | `npm run dev` (in `/backend`) → http://localhost:3001 |
| Demo mode (no backend) | Use `demo@wevote.com` / `demo123` |

---

## Roles

| Role | Can Vote? | Notes |
|---|---|---|
| `user` | ❌ No | Newly registered — pending admin approval |
| `voter` | ✅ Yes | Promoted by admin after review |
| `admin` | ✅ Yes (own votes) | Manages the platform |
| `auditor` | ❌ No | Read-only audit access |
| `super_admin` | ✅ Yes (own votes) | Full platform control |

> **Key flow:** user registers → admin reviews → admin clicks **✔ Approve** in Users tab → role becomes `voter` → user can now vote.

---

## Test Accounts

> All accounts verified working against the live backend. Password reset script: `node backend/fix-demo-passwords.js`

| Role | Email | Password | Name |
|---|---|---|---|
| Super Admin | `superadmin@forvismazars.com` | `Demo@123` | Super Administrator |
| Admin | `admin@forvismazars.com` | `Demo@123` | John Administrator |
| Auditor | `auditor@forvismazars.com` | `Demo@123` | Sarah Auditor |
| Voter | `employee@forvismazars.com` | `Demo@123` | Michael Employee |
| User (pending) | `user@forvismazars.com` | `Demo@123` | Jane User |
| Proxy Holder | `proxy.holder@forvismazars.com` | `Demo@123` | Robert Proxy |
| Test Voter 1 | `voter1@forvismazars.com` | `Demo@123` | Emily Voter |
| Test Voter 2 | `voter2@forvismazars.com` | `Demo@123` | David Smith |
| Demo (no backend) | `demo@wevote.com` | `demo123` | Demo User |

---

## 1 — Authentication

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 1.1 | Go to `http://localhost:5173` | Redirects to `/login` | |
| 1.2 | Login as voter (`employee@forvismazars.com` / `Demo@123`) | Redirects to `/home` | |
| 1.3 | Logout, login as `admin@forvismazars.com` | Redirects to `/home` | |
| 1.4 | Logout, login as `auditor@forvismazars.com` | Redirects to `/home` | |
| 1.5 | Logout, login as `superadmin@forvismazars.com` | Redirects to `/home` | |
| 1.6 | Try wrong password | Error message shown | |
| 1.7 | Click "Forgot Password", enter email, submit | Success / reset email message | |
| 1.8 | While logged in as `voter`, navigate to `/admin` | Redirected to `/unauthorized` | |
| 1.9 | While logged in as `voter`, navigate to `/auditor` | Redirected to `/unauthorized` | |
| 1.10 | While logged in as `auditor`, navigate to `/admin` | Redirected to `/unauthorized` | |

---

## 2 — User Registration

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 2.1 | Go to `/employee-register` (logged out) | Registration form displays | |
| 2.2 | Fill in all fields, submit | Success message — account created with role `user` (IsActive=0, pending approval) | |
| 2.3 | Try submitting with missing required fields | Validation errors shown | |
| 2.4 | Check registrant's inbox immediately after submit | **"Registration Received"** acknowledgment email arrives — confirms application is under review, states no action needed, explains credentials will follow upon approval | |
| 2.5 | Attempt to login with registered email before admin approves | Login fails — account inactive, appropriate error displayed | |

---

## 3 — Home & Navigation

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 3.1 | Login as `voter`, go to `/home` | Feature tiles and CTA visible | |
| 3.2 | `VotingStatusBar` at top of home | Shows session name or "No active session" | |
| 3.3 | Click "Start Voting" CTA | Navigates to `/voting` | |
| 3.4 | Header visible — profile, notifications, logout links work | Nav successfully routes to each page | |
| 3.5 | `LiveSupportWidget` floating button visible | Present on every page | |

---

## 4 — Voting Selection

> **Prerequisite:** Voters cannot access voting pages unless a session is active. You must log in as `admin` and start a session before running sections 4–6 and 10.

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 4.0 | Login as `admin@forvismazars.com`, navigate to `/admin` → Session Controls → click **Start Session** | Session status → `active`; logout and proceed as voter | |
| 4.1 | Login as `voter` (`employee@forvismazars.com`), navigate to `/voting` | Two tiles: Nominee Voting, Resolution Voting | |
| 4.2 | End / cancel the session in admin, then navigate to `/voting` as voter | `AGMClosedModal` appears — re-start session before continuing | |
| 4.3 | Click "Nominee Voting" tile | Navigates to `/voting/candidates` | |
| 4.4 | Click "Resolution Voting" tile | Navigates to `/voting/resolutions` | |

---

## 5 — Candidate (Nominee) Voting

> **Prerequisite:** Session must be active (Section 4.0). Uses two voter accounts:
> - **Good Standing voter** — `employee@forvismazars.com` (`IsGoodStanding = 1`)
> - **Non-Good Standing voter** — any voter whose good standing has been revoked (see Section 18.9 to revoke)

### 5A — Good Standing Voter

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 5.1 | Login as `voter` (`employee@forvismazars.com`), navigate to `/voting/candidates` | Candidate cards load | |
| 5.2 | Click a candidate card | Card highlights / selected state | |
| 5.3 | Click another candidate | Selection moves to new candidate | |
| 5.4 | Click "Submit Vote" | Confirmation modal appears | |
| 5.5 | Confirm submission | Success modal with blockchain hash — vote accepted, `flagged: false` | |
| 5.6 | Note the Vote ID shown | — | |
| 5.7 | Click "View My Receipt" button | Navigates to `/vote-receipt/:id` | |
| 5.8 | Try to vote again after voting | Blocked — "Already voted" message | |
| 5.9 | Open voting page when session is locked/outside times | `VotingLockedModal` shows with real start/end times | |

### 5B — Non-Good Standing Voter

> Setup: In `/admin` Users tab, click the **✔ Good Standing** badge on a voter to toggle it to **✖ Not in Standing** (see 18.9). Then test with that account.

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 5.10 | Login as the non-good-standing voter, navigate to `/voting/candidates` | Page loads — no pre-access block | |
| 5.11 | Select a candidate and confirm submission | Vote IS submitted — response `flagged: true` — warning message shown to voter | |
| 5.12 | Check `/admin` → Audit tab | Entry: `VOTE_CAST_NOT_GOOD_STANDING` logged | |
| 5.13 | Check `/admin` → Votes tab | Vote record exists (cast, not rejected) | |
| 5.14 | Login as `admin`, click the **✖ Not in Standing** badge for this voter | Badge returns to **✔ Good Standing** — `IsGoodStanding = 1` | |
| 5.15 | Same voter votes again (after session/vote reset) | Vote accepted normally — `flagged: false` | |

### 5C — Unauthorised Role

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 5.16 | Login as `user` (`user@forvismazars.com`), attempt to submit a candidate vote | Blocked — `403` "not authorised to vote" error | |

---

## 6 — Resolution Voting

> **Prerequisite:** Session must be active (Section 4.0).

### 6A — Good Standing Voter

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 6.1 | Login as `voter` (`employee@forvismazars.com`), navigate to `/voting/resolutions` | Resolution cards load | |
| 6.2 | Select Yes / No / Abstain on each resolution | Option highlights | |
| 6.3 | Click "Submit Votes" | Confirmation modal appears | |
| 6.4 | Confirm submission | Success modal with blockchain hash — `flagged: false` | |
| 6.5 | Click "View My Receipt" button | Navigates to `/vote-receipt/:id` | |
| 6.6 | Try to vote again | Blocked — "Already voted" message | |

### 6B — Non-Good Standing Voter

> Setup: Revoke good standing on a voter via the Users tab badge (see 18.9) before running these.

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 6.7 | Login as the non-good-standing voter, navigate to `/voting/resolutions` | Page loads normally | |
| 6.8 | Select options and confirm submission | Vote IS submitted — `flagged: true` — warning banner visible | |
| 6.9 | Check `/admin` → Audit tab | Entry: `VOTE_CAST_NOT_GOOD_STANDING` | |

### 6C — Unauthorised Role

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 6.10 | Login as `user` (`user@forvismazars.com`), attempt to submit resolution vote | Blocked — `403` "not authorised to vote" error | |

---

## 7 — Vote Receipt

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 7.1 | Navigate to `/vote-receipt/:id` (from success modal) | Receipt page loads with vote details | |
| 7.2 | Blockchain hash / transaction ID visible | Hash string displayed | |
| 7.3 | Click "Print Receipt" | Browser print dialog opens | |
| 7.4 | Click "Copy Link" | URL copied to clipboard | |
| 7.5 | Navigate to `/vote-receipt/9999` (invalid ID) | Error state shown (not blank) | |

---

## 8 — Vote Verification

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 8.1 | Navigate to `/verify` | Verification form loads | |
| 8.2 | Enter a valid vote ID | Vote details returned | |
| 8.3 | Enter an invalid vote ID | "Not found" error message | |

---

## 9 — Proxy Assignment

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 9.1 | Navigate to `/proxy-assignment` | Form / instructions load | |
| 9.2 | Search for a colleague | Results appear | |
| 9.3 | Select a colleague as proxy holder | Selection confirmed | |
| 9.4 | Choose "Discretionary" proxy type, submit | Success message | |
| 9.5 | Navigate to `/proxy-form` | Proxy appointment form loads | |
| 9.6 | Fill in instructional proxy details, submit | Success message | |

---

## 10 — Proxy Vote Weight (Proxy Holder)

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 10.1 | Login as `proxy.holder@forvismazars.com` / `Demo@123` | — | |
| 10.2 | Navigate to `/voting/candidates` | Vote weight indicator shows `> 1` | |
| 10.3 | Submit vote | `votesToAllocate` reflects total proxy weight in request | |
| 10.4 | Navigate to `/voting/resolutions` | Vote weight shown | |
| 10.5 | Submit resolution votes | Proxy user IDs sent correctly | |

---

## 11 — Profile & Settings

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 11.1 | Navigate to `/profile` | Profile details shown (name, email, department, role) | |
| 11.2 | Navigate to `/settings` | Settings form loads | |
| 11.3 | Update a field, save | Success confirmation | |

---

## 12 — Notifications

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 12.1 | Navigate to `/notifications` | Notifications list loads | |
| 12.2 | Mark a notification as read | Status updates | |

---

## 13 — Live Q&A

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 13.1 | Navigate to `/qa` | Q&A page loads | |
| 13.2 | Submit a question | Question appears in list | |

---

## 14 — Meeting Management

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 14.1 | Navigate to `/meetings` | Meetings list loads | |
| 14.2 | View a meeting detail | Details expand/open | |

---

## 15 — Live Voting Results

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 15.1 | Navigate to `/voting/results` | Skeleton loader, then data renders | |
| 15.2 | Candidates tab | Ranked list with gold/silver/bronze medal colours | |
| 15.3 | Resolutions tab | Segmented bars (Yes / No / Abstain %) | |
| 15.4 | Attendance tab | Attendee count and quorum status | |
| 15.5 | Cast a vote in a separate tab | Results update automatically via SSE (no page refresh) | |
| 15.6 | Tab counts | Not showing `(0)` while loading | |
| 15.7 | Click "Export PDF" | Print dialog opens with formatted report | |

---

## 16 — Admin Dashboard (`/admin`)

### 16A — Users Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 16A.1 | Login as `admin`, navigate to `/admin` | Dashboard loads, Users tab active | |
| 16A.2 | Users table shows **Role** and **Standing** columns | Colour-coded badges visible | |
| 16A.3 | A `voter` with good standing shows a green **✔ Good Standing** badge | Visible | |
| 16A.4 | A `voter` shows **🔴 Standing** button in Actions | Button visible | |
| 16A.5 | Click **🔴 Standing** (enter note, confirm) | Badge turns red — ✖ Not in Good Standing | |
| 16A.6 | Click **🟢 Standing** to restore | Badge returns green | |
| 16A.7 | A `user` account shows a **✔ Approve** button (promotes to voter) | Button visible | |
| 16A.8 | Click **✔ Approve** on a `user` | Role changes to `voter` | |
| 16A.9 | A `voter` account shows a **✕ Revoke** button | Removes voter role → back to `user` | |
| 16A.10 | Search for a user by name | Filtered results appear | |
| 16A.11 | Edit a user's vote allocation | Save succeeds | |
| 16A.12 | Deactivate / activate a user | Status updates | |

### 16B — Candidates Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 16B.1 | Click "Candidates" tab | Candidate list loads | |
| 16B.2 | Click "Add Candidate" | Form/modal opens | |
| 16B.3 | Fill in name, department, achievements, submit | New candidate appears in list | |
| 16B.4 | Edit an existing candidate | Changes saved | |
| 16B.5 | Delete a candidate | Removed from list | |
| 16B.6 | New candidate visible on `/voting/candidates` | Appears for voters | |

### 16C — Resolutions Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 16C.1 | Click "Resolutions" tab | Resolutions list with Yes/No/Abstain tallies | |
| 16C.2 | Add a new resolution | Appears in list and on voting page | |
| 16C.3 | Edit a resolution title/description | Changes saved | |
| 16C.4 | Delete a resolution | Removed from list | |

### 16D — Proxies Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 16D.1 | Click "Proxies" tab | Proxy groups listed | |
| 16D.2 | Expand a proxy group | Shows discretionary / instructional members with vote weights | |

### 16E — Votes Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 16E.1 | Click "Votes" tab | All cast votes listed | |
| 16E.2 | Filter by vote type | Filtered list updates | |

### 16F — Audit Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 16F.1 | Click "Audit" tab | Audit log entries visible inline | |

### 16G — Results Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 16G.1 | Click "Results" tab | Live graphical results panel renders | |

### 16H — Reports Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 16H.1 | Click "Reports" tab | Export options visible | |
| 16H.2 | Export CSV | `.csv` file downloads | |
| 16H.3 | Export Excel | `.xlsx` file downloads | |
| 16H.4 | Export PDF | Print dialog / PDF generated | |

---

## 17 — Admin Session Controls

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 17.1 | Click "Set Timer" on admin dashboard | `SetTimerModal` opens | |
| 17.2 | Set a custom end time, save | Timer updated | |
| 17.3 | Click "Start Session" | Session status → `active` | |
| 17.4 | Click "End Session" | Session status → `ended` | |
| 17.5 | Check-in page: navigate to `/check-in` | Attendee list with check-in buttons | |
| 17.6 | Mark an attendee as present | Status changes | |

---

## 18 — Admin Approvals & Voter Promotion

### Full Registration Flow

```
User registers → /admin/approvals shows pending record
  Modal has three buttons in one row:
  ├─ "Activate Account"      → IsActive=1, Role=voter, temp password generated,
  │                             login credentials emailed (button shows ✓ Activated)
  ├─ "Grant Good Standing"   → IsGoodStanding=1 (can be done independently of Activate)
  │                             Without this: voter can log in and vote BUT votes are
  │                             FLAGGED (not rejected) → flagged:true + audit log entry
  │                             AuditLog: VOTE_CAST_NOT_GOOD_STANDING
  └─ "Reject" (pending only) → requires text in textarea → account deleted, reason logged

Later (from /admin Users tab — Standing column):
  └─ Clickable badge (voter only): ✔ Good Standing ↔ ✖ Not in Standing
      Revoke → IsGoodStanding=0 → votes still cast but flagged
      Restore → IsGoodStanding=1 → votes count normally
```

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 18.1 | Navigate to `/admin/approvals` | Pending registrations listed with columns: Name, Email, Status, Active, Good Standing | |
| 18.2 | Click **View** on a pending user | Modal opens — action row shows three buttons: **Activate Account**, **Grant Good Standing**, **Reject** | |
| 18.3 | Click **Activate Account** | `IsActive=1`, role → `voter`, temp password generated, login credentials emailed; button changes to **✓ Activated** (disabled) | |
| 18.4 | Click **Grant Good Standing** | `IsGoodStanding=1`; button changes to **✓ Good Standing** (disabled) | |
| 18.5 | Click **Reject** with an empty textarea | Button is disabled — cannot click until reason is typed | |
| 18.6 | Type a reason in the textarea, click **Reject** | User record deleted, modal closes, row removed from list | |
| 18.7 | User activated in 18.3 logs in with emailed credentials | Prompted to set a new password; can access voting pages | |
| 18.8 | Activated user (good standing granted in 18.4) submits a candidate vote | Vote accepted — `flagged: false` — success modal with blockchain hash | |
| 18.9 | Activated user WITHOUT good standing (skip 18.4) submits a vote | Vote IS cast — `flagged: true` — warning banner shown to voter | |
| 18.10 | Login as `admin`, go to `/admin` Users tab → find the voter → click the **✔ Good Standing** badge | Confirm → badge → **✖ Not in Standing** (`IsGoodStanding=0`) | |
| 18.11 | Non-good-standing voter submits another vote | Vote cast — `flagged: true` — not outright blocked | |
| 18.12 | Check Audit tab | AuditLog entry: `VOTE_CAST_NOT_GOOD_STANDING` | |
| 18.13 | Click the **✖ Not in Standing** badge to restore | Badge → **✔ Good Standing** (`IsGoodStanding=1`); voter's next votes count normally | |

---

## 19 — Admin Management Dashboard

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 19.1 | Navigate to `/admin-manage` | Full user list with role badges | |
| 19.2 | Create a new user | User added | |
| 19.3 | Edit an existing user's role | Role updated | |
| 19.4 | Delete a user | User removed | |

---

## 20 — Super Admin Dashboard (`/superadmin`)

### Sessions Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 20.1 | Login as `superadmin`, navigate to `/superadmin` | Sessions tab loads | |
| 20.2 | Create a new session (name, dates, quorum %, assign admin) | Session appears in list | |
| 20.3 | Start the session | Status → `active` | |
| 20.4 | End the session | Status → `ended` | |
| 20.5 | Cancel a session | Status → `cancelled` | |

### Admins Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 20.6 | Click "Admins" tab | Admin/auditor accounts listed | |
| 20.7 | Create a new admin account | Account created | |
| 20.8 | Reset an admin's password | Success message | |
| 20.9 | Deactivate an admin | Account deactivated | |

### Vote Splitting Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 20.10 | Click "Vote Splitting" tab | Per-user vote limits listed | |
| 20.11 | Set a custom vote limit for a user | Limit saved | |

---

## 21 — Super Admin Panel (`/superadmin-panel`)

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 21.1 | Navigate to `/superadmin-panel` | Stat cards load (employees, sessions, votes, admins) | |
| 21.2 | Click "Refresh" | Stats reload | |
| 21.3 | Click "Full Dashboard" | Navigates to `/superadmin` | |
| 21.4 | All Quick Action buttons | Each navigates to correct route | |
| 21.5 | System Status section | All 4 services show "Operational" | |
| 21.6 | Logout button | Logs out, redirects to `/login` | |

---

## 22 — Auditor Portal (`/auditor`)

### Audit Logs Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 22.1 | Login as `auditor`, navigate to `/auditor` | Audit log tab loads | |
| 22.2 | Log entries visible (timestamp, user, action, IP, hash) | Data renders | |
| 22.3 | Filter by status = `failed` | Only failed entries shown | |
| 22.4 | Filter by status = `warning` | Only warnings shown | |
| 22.5 | Search a username | Matching entries shown | |

### Attendance Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 22.6 | Click "Attendance" tab | Attendee list loads | |
| 22.7 | Quorum meter visible | Shows `X% / Y% threshold` | |
| 22.8 | Adjust quorum threshold slider | Meter updates | |

### Reports Tab
| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 22.9 | Click "Reports" tab | Export cards visible | |
| 22.10 | Download Attendance CSV | `.csv` file downloads | |
| 22.11 | Download Audit Log Excel | `.xlsx` file downloads | |
| 22.12 | Download AGM Results PDF | Print dialog opens | |

---

## 23 — Features Demo Page

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 23.1 | Navigate to `/demo` | Feature showcase page loads | |
| 23.2 | All feature sections render without error | No blank sections | |

---

## 24 — Edge Cases & Error States

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 24.1 | Navigate to a non-existent route e.g. `/blah` | Redirects to `/login` | |
| 24.2 | Submit vote with no session active | Blocked with error message | |
| 24.3 | `user` role tries `/superadmin` directly | `/unauthorized` page | |
| 24.4 | `/vote-receipt/9999` (invalid ID) | Error state (not blank page) | |
| 24.5 | Forgot password with unregistered email | Appropriate error message | |
| 24.6 | Registration with duplicate email | Duplicate error shown | |
| 24.7 | Blockchain hash shown as "Pending..." | Displays gracefully (not a crash) | |
| 24.8 | `user` role POSTs directly to `/api/votes/candidate` | `403` — "not authorised to vote" | |
| 24.9 | `auditor` role POSTs directly to `/api/votes/resolution` | `403` — "not authorised to vote" | |

---

## 25 — SSE / Real-Time Checks

| # | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| 25.1 | Open `/voting/results` in Tab A | Results load via SSE | |
| 25.2 | Cast a vote in Tab B | Results in Tab A update with no page refresh | |
| 25.3 | Close and reopen `/voting/results` | SSE reconnects cleanly (no double connection) | |
| 25.4 | Check browser Network tab for SSE stream | Single `EventStream` connection at `/api/sessions/:id/results/stream` | |

---

## Test Summary

| Section | Total Tests | Passed | Failed | Notes |
|---|---|---|---|---|
| 1 — Authentication | 10 | | | |
| 2 — User Registration | 5 | | | |
| 3 — Home & Navigation | 5 | | | |
| 4 — Voting Selection | 5 | | | |
| 5 — Candidate Voting | 16 | | | |
| 6 — Resolution Voting | 10 | | | |
| 7 — Vote Receipt | 5 | | | |
| 8 — Vote Verification | 3 | | | |
| 9 — Proxy Assignment | 6 | | | |
| 10 — Proxy Vote Weight | 5 | | | |
| 11 — Profile & Settings | 3 | | | |
| 12 — Notifications | 2 | | | |
| 13 — Live Q&A | 2 | | | |
| 14 — Meeting Management | 2 | | | |
| 15 — Live Results | 7 | | | |
| 16 — Admin Dashboard | 30 | | | |
| 17 — Admin Session Controls | 6 | | | |
| 18 — Admin Approvals & Good Standing | 13 | | | |
| 19 — Admin Management | 4 | | | |
| 20 — Super Admin Dashboard | 11 | | | |
| 21 — Super Admin Panel | 6 | | | |
| 22 — Auditor Portal | 12 | | | |
| 23 — Features Demo Page | 2 | | | |
| 24 — Edge Cases | 9 | | | |
| 25 — SSE / Real-Time | 4 | | | |
| **TOTAL** | **193** | | | |
