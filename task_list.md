# Test User Flows

- [x] Discover application structure and setup local environment
  - [x] Check package.json for start scripts
  - [x] Identify database start scripts
  - [x] Find all application routes to list CUJs
- [x] Ensure local app is running (e.g. `npm run dev`)
- [x] Execute tests for CUJs using browser subagent
  - [x] CUJ: Signup/Login (Blocked: Only Google OAuth available)
  - [x] CUJ: Household Creation (Blocked by Login)
  - [x] CUJ: Checking In (Blocked by Login)
  - [x] CUJ: Checking Out (Blocked by Login)
  - [x] CUJ: Inviting Members (Blocked by Login)
  - [x] CUJ: Admin privileges (Verified Access Control, Blocked by Login)
- [x] Document list of CUJs, what worked, and what didn't

# Local Integration Testing (Mock Auth)
- [x] Add Mock Authentication Provider
  - [x] Update `src/app/api/auth/[...nextauth]/route.ts` to include CredentialsProvider for `NODE_ENV === "development"`
- [x] Re-run CUJ Tests with Mock Auth
  - [x] Household/Account Initialization (Working, but skips naming step)
  - [x] Checking In (Failed, no UI)
  - [x] Checking Out (Failed, no UI)
  - [x] Inviting Members (Working)
  - [x] Admin Privileges (Verified)
- [x] Update `cuj_report.md` with new findings

# Frontend Improvements (Post-Testing)
- [x] **Feature**: Implement Check-in/Check-out UI
  - [x] Investigate existing attendance API limits
  - [x] Build Check-in button on Dashboard/Profile
  - [x] Create commit for Check-in UI
- [x] **Bug Fix**: Household Naming step
  - [x] Alter Household creation flow to include a `<form>` and naming input
  - [x] Create commit for Household Naming fix

# Phase 2 Polish & Event Setup
- [ ] Admin Past Badge Events View
- [ ] Admin Past Visit Events View (with Editing)
- [ ] Personal Past Visits View
- [ ] Household Past Visits View
- [ ] Notification Settings (Participant & Lead)
- [ ] Move Login/Profile to Top Right
- [ ] Testing New Polish Features
- [ ] Review Next Phase Plan
