# Comprehensive Critical User Journeys (CUJs)

This document defines the essential flows for all personas in the CheckMeIn-next ecosystem. These journeys ensure that the product meets both functional requirements and UX standards for a Lead PM/UX professional.

---

## 1. Universal Personas

### Participant (Generic User)
*The base persona for anyone interacting with the system.*

- **CUJ 1.1: First-Time Onboarding**
  - As a new visitor, I want to create an account using my Google credentials and provide my basic information (DOB, Address) so I can begin my membership journey.
- **CUJ 1.2: Facility Check-In (Scanner)**
  - As an authenticated participant, I scan my QR code at the Raspberry Pi kiosk to record my arrival.
- **CUJ 1.3: Facility Check-Out (Scanner)**
  - As a checked-in participant, I scan my QR code again to record my departure.
- **CUJ 1.4: Self-Correction (Manual Check-Out)**
  - As a participant who forgot to scan out, I log in remotely to the web portal to manually record my departure time.
- **CUJ 1.5: Program RSVP**
  - As a participant, I view the schedule of upcoming programs and indicate my intent to attend (RSVP) so the leader knows to expect me.
- **CUJ 1.6: Personal Notification Management**
  - As a participant, I want to toggle my notification preferences (Email, Text, Slack) for entry/exit events.

### Member
*A participant with an active paid membership.*

- **CUJ 2.1: Membership Lifecycle (Purchase/Renewal)**
  - As a participant, I follow the link to Shopify to pay for membership, and upon completion, I see my status updated to "Member" in the application.
- **CUJ 2.2: Signature Compliance**
  - As a member, I receive a notification to sign updated waivers or membership agreements and complete them via the integrated e-signature platform.
- **CUJ 2.3: Member-Only Access**
  - As a member, I can view and register for programs that are hidden from non-member participants.

---

## 2. Family & Student Personas

### Parent/Guardian (Household Lead)
*Manages a household and its dependents.*

- **CUJ 3.1: Household Creation & Expansion**
  - As a primary account holder, I create a "Household" entity and invite my spouse (another adult) and children (dependents) to join.
- **CUJ 3.2: Proxy Management (Student Profile)**
  - As a parent, I update my student's email/phone and sign waivers on their behalf because they are under 18.
- **CUJ 3.3: Dependent Supervision (Notifications)**
  - As a parent, I receive real-time notifications when my student checks in or out of the building.
- **CUJ 3.4: Student RSVP**
  - As a parent, I indicate "Attending" or "Not Attending" for my student for an upcoming program.

### Student
*A participant under 18 with restricted permissions.*

- **CUJ 4.1: Restricted Data Ownership**
  - As a student, I can view my profile but am prevented from changing my own contact info or address (must be done by Parent).
- **CUJ 4.2: Aging Out Flow**
  - As a student turning 18, I want to be "promoted" to a primary account holder for my own (new) household.

---

## 3. Operations Personas

### Keyholder
*Responsible for opening and closing the physical space.*

- **CUJ 5.1: Opening the Facility**
  - As the first person to arrive, I scan my badge. The system recognizes me as a Keyholder and transitions the facility status from "Closed" to "Open".
- **CUJ 5.2: Two-Deep Compliance Monitoring**
  - As a Keyholder, I view the dashboard to ensure at least one other adult/keyholder is present when students are in the building.
- **CUJ 5.3: Closing Enforcement (Forced Check-Out)**
  - As the last Keyholder leaving, I signal "Facility Closing" on the kiosk. The system automatically checks out any "ghost" users remaining and notifies them.

### Tool Certifier / Shop Steward
*Manages safety and tool proficiency.*

- **CUJ 6.1: Safety Certification Walkthrough**
  - As a Tool Certifier, after training a member on the CNC Lathe, I update their proficiency level (Basic -> Certified) in their digital profile.
- **CUJ 6.2: Shop Status Oversight**
  - As a Shop Steward, I view the "Currently in Attendance" list to see the safety levels of everyone currently in the shop area.

---

## 4. Leadership & Administrative Personas

### Program Leader / Core Volunteer
*Manages specific educational or community programs.*

- **CUJ 7.1: Program Creation & Scheduling**
  - As a Program Leader, I create a new program (e.g., "Robotics 101"), set the recurrence, and define the expected participant list.
- **CUJ 7.2: Attendance Validation**
  - At the end of a session, I review the automated check-in list for my program and manually adjust entries for any student who forgot to scan.

### Board Member / Auditor
*High-level oversight.*

- **CUJ 8.1: Compliance Reporting**
  - As a Board Member, I generate a report of total volunteer hours and participant attendance for last month to present at the board meeting.
- **CUJ 8.2: Audit Trail Inspection**
  - As an auditor, I search the Audit Log for a specific date to see who modified a member's payment record.

### System Administrator
*Technical management.*

- **CUJ 9.1: Temporary Privilege Escallation**
  - As a sysadmin, I explicitly "Enable Admin Mode" to perform a sensitive task (like changing a user's Google ID mapping), knowing that my actions are being recorded in a high-priority audit log.
- **CUJ 9.2: Role Assignment**
  - As a sysadmin, I assign the "Keyholder" or "Tool Certifier" roles to trusted members.
