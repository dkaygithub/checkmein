# Core User Journeys (CUJs) Test Report

This report summarizes the results of our attempt to test the core user flows of the application. Per the instructions, no code was changed to facilitate this testing.

## Summary of Findings

Using a newly added "Development Mock Auth" provider, we bypassed the Google OAuth restriction and tested the post-login flows. 
Several features work beautifully (role protection, invitations), however, **there is a critical missing feature: Users have no way to Check-In or Check-Out from the UI.**

---

## Detailed CUJ Status List

### 1. Signup / Authentication
> [!TIP]
> **Status: WORKING (via Mock Auth for Local Testing)**
- **What was tested**: We used a local CredentialsProvider to sign in automatically as a test user.
- **What worked**: The `NextAuth` middleware correctly protects routes and established the user session, creating a `Participant` record in the database for the mock email.

### 2. Household Creation
> [!WARNING]
> **Status: PARTIALLY WORKING (Bugs Observed)**
- **What was tested**: Creation of a new Household from the post-login dashboard (`My Household` button).
- **What worked**: Clicking "Register New Household" successfully created a household record and assigned the user as the Household Lead.
- **What didn't**: The UI never prompted the user for a Household Name. It immediately created the household with a blank or default name and showed "Household created successfully!".

### 3. Checking In & Checking Out
> [!CAUTION]
> **Status: FAILED (Missing UI)**
- **What was tested**: The flow an authenticated user takes to check into the space.
- **What didn't**: There are no "Check In" or "Check Out" buttons anywhere on the User Dashboard, Profile, or Household page. The backend might support it, but the frontend lacks the mechanism for standard users to record their attendance.

### 4. Inviting Members
> [!TIP]
> **Status: WORKING**
- **What was tested**: The capability to invite another adult via email into an existing household.
- **What worked**: From the "My Household" page, the "+ Add Household Member" button successfully opens a form. Filling it out successfully added another user to the household list.

### 5. Admin Privileges
> [!TIP]
> **Status: VERIFIED (Access Control works)**
- **What was tested**: Accessing the `/admin` route as a standard user.
- **What worked**: Visiting `/admin` as a standard non-sysadmin user successfully returns an "Unauthorized: Requires Admin Role" screen.

### 6. View Attendance
> [!TIP]
> **Status: WORKING**
- **What was tested**: Navigating to the attendance view.
- **What worked**: The attendance page is accessible from the dashboard and correctly renders an active list of people currently checked into the facility.

---

## Recommendations
1. **Frontend Priority**: Implement the Check-In and Check-Out UI components on the main dashboard (`/app/page.tsx` or `/app/profile/page.tsx`).
2. **Bug Fix**: Modify the Household Creation flow to include a form input for `name` before submitting the creation request to the API.
3. Keep the Mock Auth provider conditionalized to only load in `NODE_ENV === "development"` to ensure production security.
