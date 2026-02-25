# Hardcoded English Strings Audit Report

> **Generated:** Comprehensive audit of all components and pages under `app/[lang]/` and `components/` for hardcoded English text that should be using the dictionary system (`useDictionary()` for client components, `getDictionary(lang)` for server components).

---

## Summary

| Category | Files Audited | Files with Hardcoded Strings | Using Dictionary |
|----------|--------------|-------------------------------|-----------------|
| **Volunteer Dashboard & Pages** | 12 | **12** | 0 |
| **NGO Dashboard & Pages** | 11 | **11** | 0 |
| **Admin Pages** | 15 | **15** | 0 |
| **Shared Dashboard Components** | 5 | **5** | 0 |
| **Stream/Messaging Components** | 6 | **6** | 0 |
| **Notification Components** | 3 | **3** | 0 |
| **Payment Components** | 2 | **2** | 0 |
| **Public Listing Pages** | 3 | **3** | 0 |
| **Detail/Profile Pages** | 3 | **3** | 0 |
| **Home Components** | 9 | **3** | 6 ✅ |
| **Shared UI Components** | 7 | **1** (navbar partial) | 6 ✅ |
| **Public Pages (about, contact, pricing)** | 3 | **0** | 3 ✅ |
| **TOTAL** | **~79** | **~64** | **~15** |

**Verdict:** ~81% of audited files have zero dictionary integration. The vast majority of user-facing text across dashboards, admin, messaging, notifications, payments, listing pages, and detail pages is fully hardcoded in English.

---

## Severity Legend

- 🔴 **CRITICAL** — User-visible headings, descriptions, labels, buttons, status text, empty states, toast messages
- 🟡 **MEDIUM** — Placeholder text, dropdown options, filter labels, sort options
- 🟢 **LOW** — Tooltips, aria-labels, alt text, date format locale strings

---

## 1. VOLUNTEER PAGES (All hardcoded — NO dictionary usage)

### `app/[lang]/volunteer/dashboard/page.tsx` (367 lines, SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~40 | `"Welcome back,"` | 🔴 |
| ~41 | `"Here's what's happening with your impact journey."` | 🔴 |
| ~50 | `"Applications"` | 🔴 |
| ~55 | `"Active Opportunities"` | 🔴 |
| ~60 | `"Completed"` | 🔴 |
| ~65 | `"Hours Given"` | 🔴 |
| ~80 | `"Recommended Opportunities"` | 🔴 |
| ~85 | `"View All"` | 🔴 |
| ~90 | `"No opportunities matched yet"` | 🔴 |
| ~95 | `"Complete your profile to get personalized recommendations"` | 🔴 |
| ~100 | `"Complete Profile"` | 🔴 |
| ~105 | `"% match"` | 🟡 |
| ~120 | `"My Profile"` | 🔴 |
| ~125 | `"Location not set"` | 🔴 |
| ~130 | `"New"` | 🔴 |
| ~135 | `"tasks"` | 🟡 |
| ~140 | `"Profile Completion"` | 🔴 |
| ~145 | `"Skills"` | 🔴 |
| ~155 | `"Your Impact"` | 🔴 |
| ~160 | `"Estimated value contributed"` | 🔴 |
| ~170 | `"Subscription"` / `"PRO"` | 🔴 |
| ~180 | `"Applications this month"` | 🔴 |
| ~185 | `"Upgrade to Pro for unlimited applications"` | 🔴 |
| ~190 | `"Apply to as many opportunities as you want with Pro"` | 🔴 |
| ~195 | `"Upgrade to Pro"` | 🔴 |
| ~200 | `"Pro Plan Active"` | 🔴 |
| ~205 | `"Unlimited applications available"` | 🔴 |
| ~210 | `"Renews:"` | 🟡 |

### `app/[lang]/volunteer/applications/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~25 | `"My Applications"` | 🔴 |
| ~26 | `"Track the status of your impact agent applications"` | 🔴 |
| ~35 | `"All"` / `"Pending"` / `"Shortlisted"` / `"Accepted"` / `"Rejected"` | 🔴 |
| ~50 | `"No applications found"` | 🔴 |
| ~55 | `"Browse Opportunities"` | 🔴 |
| ~70 | `"Application #"` | 🔴 |
| ~75 | `"Opportunity ID:"` | 🟡 |
| ~80 | `"Applied"` / `"Reviewed"` | 🔴 |
| ~85 | `"View Opportunity"` | 🔴 |
| ~90 | `"Feedback from NGO:"` | 🔴 |

### `app/[lang]/volunteer/opportunities/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~30 | `"Browse Opportunities"` | 🔴 |
| ~31 | `"Find impact agent opportunities that match your skills"` | 🔴 |
| ~40 | `"Recommended for You"` / `"All Opportunities"` | 🔴 |
| ~50 | `"Complete your profile to get personalized recommendations"` | 🔴 |
| ~55 | `"Complete Profile"` | 🔴 |
| ~60 | `"% match"` | 🟡 |
| ~70 | `"Deadline:"` | 🟡 |
| ~75 | `"applicants"` | 🟡 |
| ~80 | `"View Details"` | 🔴 |

### `app/[lang]/volunteer/profile/page.tsx` (705 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~45 | `"Edit Profile"` | 🔴 |
| ~46 | `"Update your information to help NGOs find you"` | 🔴 |
| ~50 | `"View Public Profile"` | 🔴 |
| ~55 | `"Profile Completion"` | 🔴 |
| ~56 | `"Complete your profile to increase your chances..."` | 🔴 |
| ~65 | `"Basic Info"` / `"Skills & Experience"` / `"Preferences"` (tabs) | 🔴 |
| ~75 | `"Basic Information"` / `"Your personal details and bio"` | 🔴 |
| ~80 | `"Profile Photo"` / `"JPG or PNG. Max 5MB."` | 🟡 |
| ~90 | `"Full Name"` / `"Phone Number"` / `"Location"` | 🔴 |
| ~95 | `"+91 98765 43210"` (placeholder) | 🟡 |
| ~100 | `"City, State, Country"` | 🟡 |
| ~105 | `"Update Location"` / `"Your location helps match you with nearby opportunities"` | 🔴 |
| ~115 | `"Professional Headline"` / `"Bio"` | 🔴 |
| ~120 | `"LinkedIn URL"` / `"Portfolio URL"` | 🟡 |
| ~130 | `"Resume / CV"` / `"Upload your resume..."` | 🔴 |
| ~135 | `"View Resume"` / `"Click to download or view"` / `"Replace"` / `"Upload Resume"` | 🔴 |
| ~140 | `"PDF, DOC, or DOCX up to 10MB"` | 🟡 |
| ~145 | `"Uploading..."` | 🔴 |
| ~160 | `"Skills & Expertise"` / `"Your skills were set during onboarding."` | 🔴 |
| ~165 | `"Your Current Skills"` / `"No skills added yet..."` | 🔴 |
| ~170 | `"Manage Skills in Settings"` | 🔴 |
| ~180 | `"Impact Preferences"` / `"Set your availability and preferences"` | 🔴 |
| ~185 | `"Weekly Availability"` | 🔴 |
| ~190 | `"1-5"` / `"5-10"` / `"10-20"` / `"20+ hours per week"` | 🟡 |
| ~200 | `"Your Causes"` / `"No causes selected."` | 🔴 |
| ~210 | `"Work Mode"` / `"Not set"` | 🔴 |
| ~220 | `"Impact Agent Type"` / `"Pro-Bono Only"` / `"Paid Only"` / `"Open to Both"` / `"Not set"` | 🔴 |
| ~230 | `"Save Changes"` / `"Saving..."` / `"Saved!"` | 🔴 |

### `app/[lang]/volunteer/settings/page.tsx` (1142 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~30 | `"Settings"` / `"Manage your account, skills, and preferences"` | 🔴 |
| ~35 | `"Skills"` / `"Account"` / `"Alerts"` / `"Privacy"` / `"Billing"` (tabs) | 🔴 |
| ~50 | `"Your Skills"` / `"Add or remove skills that NGOs can match you with"` | 🔴 |
| ~55 | `"No skills added yet..."` | 🔴 |
| ~60 | `"Category"` / `"Skill"` / `"Level"` (column headers) | 🔴 |
| ~65 | `"Select category"` / `"Select skill"` (placeholders) | 🟡 |
| ~70 | `"Beginner"` / `"Intermediate"` / `"Expert"` | 🔴 |
| ~75 | `"Add Skill"` / `"Cancel"` | 🔴 |
| ~80 | `"Causes You Care About"` / `"Select causes to get matched..."` | 🔴 |
| ~85 | `"Save Skills & Causes"` | 🔴 |
| ~100 | `"Account Information"` / `"Full Name"` / `"Edit in your profile settings"` | 🔴 |
| ~105 | `"Email"` / `"Change Password"` | 🔴 |
| ~110 | `"Current Password"` / `"New Password"` / `"Confirm New Password"` | 🔴 |
| ~600+ | Additional privacy settings, billing section, alert preferences (not fully read) | 🔴 |

### `app/[lang]/volunteer/notifications/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~20 | `"Notifications"` | 🔴 |
| ~25 | Unread count text | 🔴 |
| ~30 | `"You're all caught up!"` | 🔴 |
| ~35 | `"Settings"` | 🔴 |
| ~40 | `"All"` / `"Unread"` / `"Read"` (tabs) | 🔴 |
| ~45 | `"Mark all as read"` | 🔴 |

### `app/[lang]/volunteer/impact/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~25 | `"Your Impact Dashboard"` | 🔴 |
| ~26 | `"See the difference you're making in the world"` | 🔴 |
| ~30 | `"{level} Impact Agent"` | 🔴 |
| ~35 | `"more hours to reach the next level"` | 🔴 |
| ~40 | `"You've reached the highest level — incredible!"` | 🔴 |
| ~50 | `"Projects Completed"` / `"Hours Contributed"` / `"Average Rating"` / `"Value Created"` | 🔴 |
| ~60 | `"Badges"` / `"Earned!"` | 🔴 |
| ~70 | `"Reviews"` / `"No reviews yet"` | 🔴 |
| ~75 | `"Complete projects to receive reviews from NGOs"` | 🔴 |
| ~80 | `"Impact Certificate Available"` | 🔴 |
| ~85 | `"Your verified impact certificate is ready."` | 🔴 |

### `app/[lang]/volunteer/referrals/page.tsx` (CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~20 | `"Refer & Earn"` | 🔴 |
| ~21 | `"Invite friends to JustBeCause..."` | 🔴 |
| ~30 | `"Your Referral Link"` / `"Share this link..."` | 🔴 |
| ~35 | `"Copied"` / `"Copy"` | 🔴 |
| ~40 | `"Share Referral Link"` | 🔴 |
| ~45 | `"Generate Your Referral Code"` / `"Generating..."` | 🔴 |
| ~55 | `"People Signed Up"` / `"Completed Onboarding"` | 🔴 |
| ~60 | `"Referral Codes"` | 🔴 |
| ~70 | `"How Referrals Work"` | 🔴 |
| ~75 | `"Share Your Link"` / `"They Sign Up"` / `"Earn Badges"` | 🔴 |

### `app/[lang]/volunteer/saved-projects/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~20 | `"Saved Opportunities"` | 🔴 |
| ~21 | `"Opportunities you've bookmarked for later"` | 🔴 |
| ~30 | `"No saved opportunities yet"` | 🔴 |
| ~35 | `"When you find opportunities..."` | 🔴 |
| ~40 | `"Browse Opportunities"` | 🔴 |
| ~50 | `"Organization"` / `"View Details"` | 🔴 |

### `app/[lang]/volunteer/onboarding/page.tsx` (1349 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| Entire file | Complete onboarding wizard with step labels, form fields, error messages, success toasts, geolocation prompts — ALL hardcoded | 🔴 |

### `app/[lang]/volunteer/messages/page.tsx` (simple wrapper)
No hardcoded strings — wraps `<ChatView />` which itself has hardcoded strings (see Stream section).

---

## 2. NGO PAGES (All hardcoded — NO dictionary usage)

### `app/[lang]/ngo/dashboard/page.tsx` (395 lines, SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~40 | `"Welcome,"` | 🔴 |
| ~41 | `"Manage your opportunities and connect with skilled impact agents."` | 🔴 |
| ~45 | `"Post New Opportunity"` | 🔴 |
| ~50 | `"Active Opportunities"` / `"Pending Applications"` / `"Completed"` / `"Total Applications"` | 🔴 |
| ~70 | `"View All"` | 🔴 |
| ~75 | `"No active opportunities"` / `"Create your first opportunity"` | 🔴 |
| ~80 | `"applications"` / `"View Applications"` | 🔴 |
| ~90 | `"Recent Applications"` / `"View"` / `"New Application"` | 🔴 |
| ~100 | `"Best Matches"` / `"Find More"` | 🔴 |
| ~105 | `"No matching impact agents yet"` / `"Post an opportunity to get matched"` | 🔴 |
| ~110 | `"Post Opportunity"` | 🔴 |
| ~120 | `"Quick Actions"` | 🔴 |
| ~125 | `"Post New Opportunity"` / `"Browse Impact Agents"` / `"Messages"` | 🔴 |
| ~140 | `"Subscription"` / `"PRO"` | 🔴 |
| ~145 | `"Free Plan - No Unlocks"` | 🔴 |
| ~150 | `"Upgrade to Pro to unlock impact agent profiles"` | 🔴 |
| ~155 | `"Upgrade to Pro for unlimited unlocks"` | 🔴 |
| ~160 | `"View contact details of any impact agent"` | 🔴 |
| ~165 | `"Upgrade to Pro"` / `"Pro Plan Active"` | 🔴 |
| ~170 | `"Unlimited impact agent profile unlocks"` / `"Renews:"` | 🔴 |

### `app/[lang]/ngo/applications/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~25 | `"Applications"` / `"Review and manage impact agent applications..."` | 🔴 |
| ~30 | `"No applications yet"` / `"When impact agents apply..."` | 🔴 |
| ~35 | `"Post an Opportunity"` | 🔴 |
| ~40 | `"Pending"` / `"Shortlisted"` / `"Accepted"` / `"All"` (tabs) | 🔴 |
| ~50 | `"Impact Agent"` / `"Location not specified"` | 🔴 |
| ~55 | `"Applied for:"` / `"tasks completed"` | 🔴 |
| ~60 | `"View Profile"` | 🔴 |
| ~65 | `"No {tab} applications"` | 🔴 |

### `app/[lang]/ngo/projects/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~25 | `"My Requirements"` / `"Manage your impact agent opportunities"` | 🔴 |
| ~30 | `"Post New Requirement"` | 🔴 |
| ~35 | `"Active"` / `"Closed"` / `"Completed"` (stats and tabs) | 🔴 |
| ~40 | `"No opportunities found"` / `"Create your first opportunity"` | 🔴 |
| ~50 | `"Due:"` / `"applicants"` / `"accepted"` | 🟡 |
| ~55 | `"View Applications"` | 🔴 |

### `app/[lang]/ngo/post-project/page.tsx` (606 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~30 | `"Post a New Requirement"` | 🔴 |
| ~35 | `"Choose a requirement type..."` | 🔴 |
| ~40-100 | Project template names and descriptions (all hardcoded) | 🔴 |
| ~110 | `"Or create a custom opportunity"` | 🔴 |
| ~115 | `"Back to Dashboard"` | 🔴 |
| ~120 | `"Step {n} of 3"` | 🔴 |
| ~125 | `"Opportunity Details"` / `"Provide information about your opportunity"` | 🔴 |
| ~300+ | Form labels, validation messages, submission toasts | 🔴 |

### `app/[lang]/ngo/profile/page.tsx` (858 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| Entire file | Organization profile form with all labels, causes, field descriptions — ALL hardcoded | 🔴 |

### `app/[lang]/ngo/settings/page.tsx` (860 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| Entire file | Settings form, password change, privacy settings, billing — ALL hardcoded | 🔴 |

### `app/[lang]/ngo/find-talent/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~20 | `"Find Talent"` | 🔴 |
| ~21 | `"Browse skilled impact agents to help with your opportunities"` | 🔴 |

### `app/[lang]/ngo/onboarding/page.tsx` (1343 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| Entire file | Complete NGO onboarding wizard — organization details, verification, skills selection, causes — ALL hardcoded | 🔴 |

### `app/[lang]/ngo/notifications/page.tsx` — Same pattern as volunteer notifications

### `app/[lang]/ngo/messages/page.tsx` — Wraps `<ChatView />` (see Stream section)

---

## 3. ADMIN PAGES (All hardcoded — NO dictionary usage)

> **Note:** Admin pages may be intentionally English-only for internal use. Listed for completeness.

### `app/[lang]/admin/dashboard/page.tsx` (453 lines, SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~36 | `"Dashboard"` | 🔴 |
| ~38 | `"Real-time overview of your platform's performance"` | 🔴 |
| ~42 | `"Last updated:"` | 🟡 |
| ~68 | `"Total Impact Agents"` / `"this month"` | 🔴 |
| ~80 | `"Total NGOs"` / `"Active Opportunities"` / `"Applications"` / `"Total Revenue"` | 🔴 |
| ~105 | `"NGO Verification Rate"` / `"of {n} NGOs verified"` | 🔴 |
| ~115 | `"Project Success Rate"` / `"of {n} projects completed"` | 🔴 |
| ~125 | `"Application Accept Rate"` / `"of {n} applications accepted"` | 🔴 |
| ~140 | `"Recent Activity"` / `"Real-time platform activity feed"` | 🔴 |
| ~155 | `"No recent activity"` | 🔴 |
| ~165 | `"Action Items"` / `"Tasks requiring your attention"` | 🔴 |
| ~170 | `"Pending NGO Verifications"` / `"Review and verify"` | 🔴 |
| ~180 | `"Pending Applications"` / `"Awaiting NGO response"` | 🔴 |
| ~190 | `"Support Tickets"` / `"User requests"` | 🔴 |
| ~200 | `"Reports to Review"` / `"Content/user reports"` | 🔴 |
| ~215 | `"Skills in Demand"` / `"Most requested skills from active opportunities"` | 🔴 |
| ~225 | `"No data available"` | 🔴 |
| ~240 | `"Top Causes"` / `"Most popular cause categories"` | 🔴 |
| ~260 | `"Quick Navigation"` | 🔴 |
| ~265 | `"Manage Users"` / `"All Projects"` / `"Payments"` / `"Settings"` | 🔴 |

### `components/admin/app-sidebar.tsx` (CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~42 | Group labels: `"Overview"`, `"Management"`, `"Finance"`, `"Communication"`, `"Analytics"`, `"Administration"` | 🔴 |
| ~44-85 | Nav items: `"Dashboard"`, `"Users"`, `"Impact Agents"`, `"NGOs"`, `"Opportunities"`, `"Payments"`, `"Coupons"`, `"Notifications"`, `"Reports"`, `"Team"`, `"Ban History"`, `"Admin Accounts"`, `"Settings"` | 🔴 |
| ~105 | `"Admin Panel"` / `"JustBeCause"` | 🔴 |

### `components/admin/admin-header.tsx` (CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~55 | `"Admin"` (badge) | 🔴 |
| ~60 | `"View Site"` | 🔴 |
| ~80 | `"Settings"` / `"Sign Out"` | 🔴 |

### `app/[lang]/admin/users/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~50 | `"All Users"` / `"Manage all registered users on the platform"` | 🔴 |
| ~65 | `"Total Users"` / `"Impact Agents"` / `"NGOs"` / `"Admins"` | 🔴 |
| ~80 | `"Registered Users"` | 🔴 |

### `app/[lang]/admin/ngos/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~20 | `"Manage NGOs"` / `"View and manage all NGO profiles"` | 🔴 |
| ~35 | `"Total NGOs"` / `"Verified"` / `"Pending Verification"` / `"Premium Subscribers"` | 🔴 |
| ~50 | `"All NGOs"` | 🔴 |

### `app/[lang]/admin/volunteers/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~25 | `"Manage Impact Agents"` / `"View and manage all impact agent profiles"` | 🔴 |
| ~40 | `"Total Impact Agents"` / `"Verified"` / `"Pending"` / `"Banned"` | 🔴 |
| ~55 | `"All Impact Agents"` | 🔴 |

### `app/[lang]/admin/projects/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~20 | `"Manage Opportunities"` / `"View and manage all impact agent opportunities"` | 🔴 |
| ~30 | `"Total Opportunities"` / `"Active"` / `"Completed"` / `"Total Applications"` | 🔴 |
| ~45 | `"All Opportunities"` | 🔴 |

### `app/[lang]/admin/payments/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~38 | `"Payments & Transactions"` / `"View all payment transactions and revenue"` | 🔴 |
| ~42 | `"Export Report"` | 🔴 |
| ~50 | `"Total Revenue"` / `"Profile Unlocks"` / `"Total Transactions"` / `"Success Rate"` | 🔴 |
| ~65 | `"From profile unlock payments"` / `"All time"` / `"Of all transactions"` | 🟡 |
| ~75 | `"Recent Transactions"` | 🔴 |
| ~80 | `"No transactions yet"` / `"Transactions will appear here..."` | 🔴 |
| ~90 | `"Transaction ID"` / `"Type"` / `"Amount"` / `"Status"` / `"Date"` | 🔴 |

### `app/[lang]/admin/reports/page.tsx` (SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~60 | `"Reports & Analytics"` / `"View platform analytics and generate reports"` | 🔴 |
| ~63 | `"Download Report"` | 🔴 |
| ~70 | `"New Users (This Month)"` / `"New NGOs (This Month)"` / `"New Opportunities (This Month)"` / `"Conversion Rate"` | 🔴 |
| ~100 | `"User Growth"` / `"Opportunity Activity"` | 🔴 |
| ~110 | `"Chart will appear when there's data"` | 🔴 |

### `app/[lang]/admin/settings/page.tsx` (1660 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| Entire file | Platform settings, SMS config, payment gateway config, feature toggles — ALL hardcoded | 🔴 |

### `app/[lang]/admin/support/page.tsx` (475 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| Entire file | Support ticket management — status labels, priority labels, response forms | 🔴 |

### `app/[lang]/admin/team/page.tsx` (626 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| Entire file | Team member management — forms, labels, toasts | 🔴 |

### `app/[lang]/admin/notifications/page.tsx` (357 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~100 | `"Send Notifications"` / `"Send notifications to users, impact agents, or NGOs"` | 🔴 |
| ~110 | `"New Notification"` / `"Compose and send a notification..."` | 🔴 |
| ~120 | `"Target Audience"` / `"All Users"` / `"All Impact Agents"` / `"All NGOs"` / `"Specific Users"` | 🔴 |
| ~140 | `"Notification Type"` / `"System Announcement"` / `"New Application"` etc. | 🔴 |
| ~160 | `"Title *"` / `"Notification title"` | 🟡 |

### `app/[lang]/admin/bans/page.tsx` (CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~40 | `"Ban History"` / `"View and manage banned users"` | 🔴 |
| ~50 | `"Currently Banned"` / `"Total Ban Records"` / `"Unbanned"` | 🔴 |
| ~65 | `"All Ban Records"` | 🔴 |
| ~75 | `"User"` / `"Type"` / `"Reason"` / `"Status"` / `"Banned At"` / `"Unbanned At"` | 🔴 |
| ~100 | `"Banned"` / `"Unbanned"` (badge text) | 🔴 |
| ~110 | `"No ban records found"` / `"Ban records will appear here..."` | 🔴 |

### `app/[lang]/admin/coupons/page.tsx` (520 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| Entire file | Coupon management — form labels, validation messages, column headers | 🔴 |

### `app/[lang]/admin/admins/page.tsx` (298 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~100 | `"Admin Management"` / `"Manage administrator accounts..."` | 🔴 |
| ~108 | `"Add Admin"` | 🔴 |
| ~115 | `"Create New Admin Account"` / `"Add a new administrator..."` | 🔴 |
| ~130 | `"Full Name"` / `"Email Address"` / `"Password"` | 🔴 |
| ~140 | `"John Doe"` / `"admin@justbecausenetwork.com"` / `"Minimum 8 characters"` | 🟡 |
| ~150 | `"Cancel"` | 🔴 |

---

## 4. SHARED DASHBOARD COMPONENTS (All hardcoded — NO dictionary usage)

### `components/dashboard/volunteer-app-sidebar.tsx` (112 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~30 | Group labels: `"Main"` / `"Account"` | 🔴 |
| ~35-60 | Nav items: `"Dashboard"`, `"Impact Dashboard"`, `"Opportunities"`, `"Applications"`, `"Saved Opportunities"`, `"Messages"`, `"Notifications"`, `"Refer & Earn"`, `"My Profile"`, `"Settings"` | 🔴 |
| ~70 | `"Impact Agent"` / `"Dashboard"` (header) | 🔴 |

### `components/dashboard/ngo-app-sidebar.tsx` (116 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~30 | Group labels: `"Main"` / `"Account"` | 🔴 |
| ~35-60 | Nav items: `"Dashboard"`, `"Post Requirement"`, `"My Requirements"`, `"Applications"`, `"Find Talent"`, `"Messages"`, `"Notifications"`, `"Organization"`, `"Billing"`, `"Upgrade Plan"`, `"Settings"` | 🔴 |
| ~70 | `"NGO Dashboard"` / `"Manage your organization"` | 🔴 |

### `components/dashboard/dashboard-content-header.tsx` (CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~30 | `"Search opportunities or NGOs..."` / `"Search impact agents, skills, or projects..."` | 🟡 |
| ~40 | `"My Account"` / `"Profile"` / `"Settings"` / `"Sign Out"` | 🔴 |

### `components/dashboard/dashboard-header.tsx` (159 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~30 | Same search placeholders as above | 🟡 |
| ~50 | `"Dashboard"` / `"Browse Opportunities"` / `"My Applications"` | 🔴 |
| ~55 | `"Opportunities"` / `"My Profile"` | 🔴 |
| ~60 | `"My Requirements"` / `"Post Requirement"` / `"Applications"` / `"Organization Profile"` | 🔴 |

### `components/dashboard/welcome-toast.tsx` (CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~15 | `"Welcome to JustBeCause, {name}!"` | 🔴 |
| ~16 | `"Your profile has been set up successfully. Start exploring impact opportunities!"` | 🔴 |

---

## 5. STREAM / MESSAGING COMPONENTS (All hardcoded — NO dictionary usage)

### `components/stream/chat-view.tsx` (400 lines)
| Line | String | Severity |
|------|--------|----------|
| ~80 | `"Connection Failed"` | 🔴 |
| ~85 | `"Unable to connect to messaging..."` | 🔴 |
| ~90 | `"Reconnect"` / `"Connecting..."` | 🔴 |
| ~100 | `"JustBeCause Messenger"` | 🔴 |
| ~110 | `"Select a conversation to start messaging..."` | 🔴 |
| ~115 | `"No messages yet"` / `"Unknown"` | 🔴 |

### `components/stream/start-conversation-button.tsx`
| Line | String | Severity |
|------|--------|----------|
| ~20 | `"Message"` | 🔴 |
| ~25 | `"Please sign in to send messages"` | 🔴 |
| ~30 | `"Please enter a message"` | 🔴 |
| ~35 | `"Message sent!"` / `"Failed to send message..."` | 🔴 |
| ~45 | `"Message {name}"` / `"Send a message about..."` | 🔴 |
| ~50 | `"Start a conversation with..."` / `"Write your message..."` | 🟡 |
| ~55 | `"Cancel"` / `"Sending..."` / `"Send Message"` | 🔴 |

### `components/stream/video-call-button.tsx` (262 lines)
| Line | String | Severity |
|------|--------|----------|
| ~30 | `"Permission denied"` / `"Device not found"` / `"Cannot access media devices"` | 🔴 |
| ~50 | `"Video call started"` / `"Voice call started"` | 🔴 |
| ~55 | `"Call ended"` / `"Call declined"` / `"Call missed"` / `"Call cancelled"` | 🔴 |

### `components/stream/active-call-view.tsx`
| Line | String | Severity |
|------|--------|----------|
| ~20 | `"Ringing..."` / `"Joining..."` | 🔴 |
| ~25 | `"In call · {n} participant(s)"` | 🔴 |
| ~30 | `"Reconnecting..."` | 🔴 |

### `components/stream/incoming-call-handler.tsx` (400 lines)
| Line | String | Severity |
|------|--------|----------|
| Entire file | Call handling UI with ringtone logic, accept/decline buttons — hardcoded | 🔴 |

### `components/stream/stream-message-badge.tsx`
| Line | String | Severity |
|------|--------|----------|
| ~15 | `"Messages"` (tooltip) | 🟢 |
| ~20 | `"{n} unread message(s)"` | 🔴 |

---

## 6. NOTIFICATION COMPONENTS (All hardcoded — NO dictionary usage)

### `components/notifications/notification-card.tsx` (511 lines)
| Line | String | Severity |
|------|--------|----------|
| ~30-80 | Badge texts: `"Accepted"`, `"Rejected"`, `"New"`, `"Warning"`, `"Limit"`, `"Unlocked"`, `"Pro"`, `"Match"`, `"Badge"` | 🔴 |
| ~100+ | Notification type descriptions and action labels | 🔴 |

### `components/notifications/notification-actions.tsx`
| Line | String | Severity |
|------|--------|----------|
| ~15 | `"All notifications marked as read"` (toast) | 🔴 |
| ~20 | `"Failed to mark notifications as read"` (toast) | 🔴 |
| ~25 | `"An error occurred"` (toast) | 🔴 |
| ~30 | `"Mark all as read"` (button) | 🔴 |

### `components/notifications/notification-listener.tsx`
| Line | String | Severity |
|------|--------|----------|
| ~20 | `"Browser notifications enabled"` | 🔴 |
| ~25 | `"Enable Browser Notifications"` | 🔴 |
| ~30 | `"Notifications enabled!"` / `"You'll receive browser notifications..."` | 🔴 |
| ~35 | `"Permission denied"` / `"You can enable notifications..."` | 🔴 |

---

## 7. PAYMENT COMPONENTS (All hardcoded — NO dictionary usage)

### `components/payments/payment-link-button.tsx`
| Line | String | Severity |
|------|--------|----------|
| ~15 | `"Payment not configured"` / `"Payment link not set up yet..."` | 🔴 |
| ~20 | `"Redirecting..."` | 🔴 |
| ~25 | `"Payment error"` / `"Unable to create payment link"` | 🔴 |

### `components/payments/unlock-profile-button.tsx`
| Line | String | Severity |
|------|--------|----------|
| ~20 | `"Profile Unlocked"` (already unlocked) | 🔴 |
| ~25 | `"Unlock Profile"` / `"Unlocking..."` | 🔴 |
| ~30 | `"Profile unlocked!"` / `"You can now view..."` | 🔴 |
| ~35 | `"Failed to unlock"` | 🔴 |
| ~40 | `"Upgrade to Pro to Unlock"` | 🔴 |

---

## 8. PUBLIC LISTING PAGES (All hardcoded — NO dictionary usage)

### `app/[lang]/volunteers/page.tsx` (541 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~50 | `"Impact Agent Type"` / `"All Impact Agents"` / `"Pro Bono"` / `"Paid"` / `"Open to Both"` | 🔴 |
| ~60 | `"Work Mode"` / `"Any"` / `"Remote"` / `"On-site"` / `"Hybrid"` | 🔴 |
| ~70 | `"Skills"` / `"Causes"` (filter labels) | 🔴 |
| ~80 | `"Clear all filters"` | 🔴 |
| ~100 | `"Find Skilled Impact Agents"` | 🔴 |
| ~105 | `"Connect with talented professionals ready to contribute..."` | 🔴 |
| ~115 | `"Search by skills, location, or name..."` | 🟡 |
| ~125 | `"Filters"` | 🔴 |
| ~135 | `"Sort by"` / `"Best Match"` / `"Highest Rated"` / `"Most Experienced"` / `"Most Hours"` | 🔴 |
| ~145 | `"Active filters:"` | 🟡 |
| ~165 | `"Showing {n} of {total} impact agents"` | 🔴 |
| ~175 | `"No impact agents found"` | 🔴 |
| ~180 | `"Try adjusting your filters or search terms"` / `"Check back later for new impact agents"` | 🔴 |
| ~185 | `"Clear Filters"` | 🔴 |

### `app/[lang]/projects/page.tsx` (514 lines, CLIENT)
| Line | String | Severity |
|------|--------|----------|
| ~155 | `"Time Commitment"` / `"1-5 hours/week"` / `"5-10 hours/week"` etc. | 🔴 |
| ~160 | `"Location"` / `"Remote"` / `"On-site"` / `"Hybrid"` | 🔴 |
| ~170 | `"Clear all filters"` | 🔴 |
| ~180 | `"Browse Opportunities"` | 🔴 |
| ~185 | `"Find opportunities that match your skills and interests"` | 🔴 |
| ~195 | `"Search opportunities, skills, or organizations..."` | 🟡 |
| ~205 | `"Filters"` | 🔴 |
| ~215 | `"Newest First"` / `"Most Relevant"` / `"Closing Soon"` / `"Most Popular"` | 🔴 |
| ~230 | `"Active filters:"` | 🟡 |
| ~250 | `"Showing {n} of {total} opportunities"` | 🔴 |
| ~260 | `"No opportunities found"` / `"Try adjusting your filters"` / `"Check back later..."` | 🔴 |
| ~270 | `"Clear Filters"` | 🔴 |
| ~290 | `"Load More Opportunities"` | 🔴 |

### `app/[lang]/ngos/[id]/page.tsx` (344 lines, SERVER)
The ngos listing directory only has `[id]/page.tsx`. No top-level listing page for NGOs was found separately.

---

## 9. DETAIL/PROFILE PAGES (All hardcoded — NO dictionary usage)

### `app/[lang]/volunteers/[id]/page.tsx` (477 lines, SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~85 | `"Profile Locked"` / `"Impact Agent"` | 🔴 |
| ~100 | `"Location not specified"` / `"rating"` / `"opportunities completed"` | 🔴 |
| ~110 | `"Paid"` / `"Pro Bono"` / `"Free & Paid"` | 🔴 |
| ~115 | `"hrs/month free"` | 🟡 |
| ~140 | `"Subscribe to View"` | 🔴 |
| ~160 | `"Pro Subscription Required"` | 🔴 |
| ~165 | `"This is a free impact agent. Subscribe to our Pro plan..."` | 🔴 |
| ~170 | `"Upgrade to Pro"` | 🔴 |
| ~180 | `"About"` / `"Subscribe to Pro to view full bio"` | 🔴 |
| ~190 | `"No bio provided yet."` | 🔴 |
| ~200 | `"Skills & Expertise"` / `"No skills listed yet."` | 🔴 |
| ~220 | `"Reviews & Ratings"` | 🔴 |
| ~230 | `"Causes They Care About"` / `"No causes specified yet."` | 🔴 |
| ~250 | `"Impact Summary"` | 🔴 |
| ~255 | `"Hours Contributed"` / `"Projects Completed"` / `"Estimated Value"` | 🔴 |
| ~270 | `"Work Preferences"` / `"Work Mode"` / `"Hours/Week"` / `"Hourly Rate"` / `"NGO Discounted Rate"` | 🔴 |
| ~290 | `"Achievements"` / `"Top Rated"` / `"100+ Hours"` / `"10+ Projects"` / `"Verified"` | 🔴 |
| ~310 | `"No achievements yet. Complete projects to earn badges!"` | 🔴 |
| ~320 | `"Connect"` / `"LinkedIn Profile"` / `"Portfolio Website"` | 🔴 |

### `app/[lang]/ngos/[id]/page.tsx` (344 lines, SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~85 | `"projects posted"` | 🔴 |
| ~125 | `"Visit Website"` | 🔴 |
| ~140 | `"About {ngoName}"` | 🔴 |
| ~145 | `"{ngoName} is a registered nonprofit organization..."` (fallback) | 🔴 |
| ~150 | `"Mission"` | 🔴 |
| ~165 | `"Open Projects ({n})"` / `"View All"` | 🔴 |
| ~190 | `"No Open Opportunities"` / `"This organization doesn't have any open opportunities..."` | 🔴 |
| ~200 | `"Skills They're Looking For"` | 🔴 |
| ~215 | `"Impact"` / `"Projects Posted"` / `"Impact Agents"` / `"Value Created"` | 🔴 |
| ~235 | `"Organization Details"` / `"Registration"` / `"Team Size"` / `"Status"` | 🔴 |
| ~245 | `"Verified"` / `"Pending Verification"` | 🔴 |
| ~250 | `"Member Since"` | 🔴 |
| ~260 | `"Connect"` / `"Website"` / `"Email"` / `"Phone"` / `"LinkedIn"` | 🔴 |

### `app/[lang]/projects/[id]/page.tsx` (433 lines, SERVER)
| Line | String | Severity |
|------|--------|----------|
| ~80 | `"Back to Opportunities"` | 🔴 |
| ~120 | `"Verified Organization"` / `"Organization"` | 🔴 |
| ~130 | `"Opportunity Description"` | 🔴 |
| ~140 | `"Skills Required"` / `"No specific skills required"` | 🔴 |
| ~150 | `"Experience Level"` | 🔴 |
| ~160 | `"Causes"` | 🔴 |
| ~175 | `"Opportunity Documents"` | 🔴 |
| ~200 | `"About {ngoName}"` / `"{ngoName} is a registered nonprofit..."` | 🔴 |
| ~210 | `"View Organization Profile →"` | 🔴 |
| ~225 | `"Time Commitment"` / `"Duration"` / `"Deadline"` / `"Work Mode"` / `"Applications"` | 🔴 |
| ~250 | `"Opportunity Completed"` / `"Applications Closed"` / `"Not Accepting Applications"` | 🔴 |
| ~270 | `"{n} people viewed this opportunity"` | 🟡 |
| ~280 | `"Similar Opportunities"` | 🔴 |

---

## 10. HOME COMPONENTS (Mostly using dictionary ✅)

### ✅ Already internationalized:
- `components/home/hero-section.tsx` — Uses `useDictionary()`, `dict.hero` with fallbacks
- `components/home/global-search-section.tsx` — Uses `useDictionary()`
- `components/home/featured-projects.tsx` — Uses `useDictionary()`
- `components/home/how-it-works.tsx` — Uses `useDictionary()`
- `components/home/testimonials.tsx` — Uses `useDictionary()`
- `components/home/cta-section.tsx` — Uses `useDictionary()`

### ❌ NOT using dictionary:
| File | Hardcoded Strings | Severity |
|------|-------------------|----------|
| `components/home/impact-metrics.tsx` | `"Skilled Impact Agents"`, `"Opportunities Completed"`, `"NGOs Supported"`, `"Hours Contributed"`, `"Value Generated"`, `"Our Impact."`, `"Real numbers showing..."`, `"Annual Report 2025"` | 🔴 |
| `components/home/mission-section.tsx` | `"Our Mission"`, `"Connecting Skills with Purpose"`, `"We believe everyone has the power..."`, `"Register as Impact Agent"`, `"Register as NGO"` | 🔴 |
| `components/home/skill-categories.tsx` | `"Find Opportunities By Skill"`, `"Browse opportunities that match your expertise..."`, `"opportunities"` (count label) | 🔴 |

---

## 11. SHARED UI COMPONENTS (Mostly using dictionary ✅)

### ✅ Already internationalized:
- `components/footer.tsx` — Uses `useDictionary()` with `dict.footer` fallbacks
- `components/project-card.tsx` — Uses `useDictionary()` with `(dict as any).common` fallbacks
- `components/follow-button.tsx` — Uses `useDictionary()` with fallbacks
- `components/share-button.tsx` — Uses `useDictionary()` with fallbacks
- `components/newsletter-subscribe.tsx` — Uses `useDictionary()` with `(dict as any).footer` fallbacks

### ⚠️ Partially internationalized:
| File | Hardcoded Strings (NOT in dictionary) | Severity |
|------|---------------------------------------|----------|
| `components/navbar.tsx` (307 lines) | L228 `"Billing & Payments"`, L242 `"Active"` (badge), L254 `"Billing"`, L266 `"Active"` (badge), L87 `"Admin Panel"` | 🔴 |

### ❌ NOT using dictionary:
| File | Hardcoded Strings | Severity |
|------|-------------------|----------|
| `components/unified-search-bar.tsx` (680 lines) | `"Impact Agent"`, `"NGO"`, `"Opportunity"`, `"Blog"`, `"Page"`, `"Skill"`, `"Cause"` (TYPE_CONFIG labels), plus popular search labels: `"Web Development"`, `"Graphic Design"`, `"Marketing"`, `"Content Writing"`, `"Data Analysis"`, `"Education"` | 🟡 |
| `components/follow-stats-display.tsx` | `"Follower"` / `"Followers"`, `"Following"`, `"Connections"`, `"Followers ({count})"`, `"Following ({count})"`, `"No followers yet"`, `"Not following anyone yet"`, `"NGO"` / `"Impact Agent"` | 🔴 |

---

## 12. PUBLIC PAGES (Mostly using dictionary ✅)

### ✅ Using `getDictionary(lang)`:
- `app/[lang]/about/page.tsx` — Uses `getDictionary()` with `(dict as any).about` fallbacks
- `app/[lang]/contact/page.tsx` — Uses `getDictionary()` with `(dict as any).contact` fallbacks

### ✅ Using `useDictionary()`:
- `app/[lang]/pricing/page.tsx` — Uses `useDictionary()` with `(dict as any).pricing` fallbacks

---

## Files NOT Flagged (Already Correct or N/A)

| File | Reason |
|------|--------|
| `app/[lang]/page.tsx` | No direct strings — delegates to child components |
| `app/[lang]/layout.tsx` | Layout wrapper, no user-visible text |
| `app/[lang]/admin/page.tsx` | Just `redirect("/admin/dashboard")` |
| `app/[lang]/admin/layout.tsx` | Layout wrapper with auth checks only |
| `components/locale-link.tsx` | Utility component, no strings |
| `components/language-switcher.tsx` | Language names intentionally kept as-is |
| `components/store-provider.tsx` | Technical wrapper |
| `components/theme-provider.tsx` | Technical wrapper |
| `components/dictionary-provider.tsx` | The dictionary system itself |
| `hooks/use-locale.ts` | Utility hook |

---

## Recommended Priority Order for Remediation

### Priority 1 — Highest user impact, most visited pages
1. **Volunteer Dashboard** (`volunteer/dashboard/page.tsx`)
2. **NGO Dashboard** (`ngo/dashboard/page.tsx`)
3. **Both Sidebars** (`volunteer-app-sidebar.tsx`, `ngo-app-sidebar.tsx`)
4. **Dashboard Headers** (`dashboard-content-header.tsx`, `dashboard-header.tsx`)
5. **Welcome Toast** (`welcome-toast.tsx`)
6. **Volunteers Listing** (`volunteers/page.tsx`)
7. **Projects Listing** (`projects/page.tsx`)

### Priority 2 — Profile & detail pages
8. **Volunteer Profile Detail** (`volunteers/[id]/page.tsx`)
9. **NGO Profile Detail** (`ngos/[id]/page.tsx`)
10. **Project Detail** (`projects/[id]/page.tsx`)
11. **Volunteer Profile Edit** (`volunteer/profile/page.tsx`)
12. **NGO Profile Edit** (`ngo/profile/page.tsx`)

### Priority 3 — Feature pages
13. **Applications** (both volunteer and NGO)
14. **Opportunities** (`volunteer/opportunities/page.tsx`)
15. **Impact Dashboard** (`volunteer/impact/page.tsx`)
16. **Settings** (both volunteer and NGO)
17. **Saved Opportunities** (`volunteer/saved-projects/page.tsx`)
18. **Referrals** (`volunteer/referrals/page.tsx`)

### Priority 4 — Communication layer
19. **Stream/Chat Components** (all 6 files)
20. **Notification Components** (all 3 files)
21. **Payment Components** (2 files)

### Priority 5 — Onboarding flows
22. **Volunteer Onboarding** (`volunteer/onboarding/page.tsx` — 1349 lines)
23. **NGO Onboarding** (`ngo/onboarding/page.tsx` — 1343 lines)

### Priority 6 — Home page gaps
24. `components/home/impact-metrics.tsx`
25. `components/home/mission-section.tsx`
26. `components/home/skill-categories.tsx`

### Priority 7 — Admin (may be intentionally English-only)
27. All admin pages (15 files + 2 components)

---

## Implementation Notes

- **Server Components** (marked SERVER above): Must use `getDictionary(lang)` — extract `lang` from route params
- **Client Components** (marked CLIENT above): Must use `useDictionary()` hook from `@/components/dictionary-provider`
- **Dictionary files** are at `app/[lang]/dictionaries/en.json` and `app/[lang]/dictionaries/hi.json`
- **Existing pattern** in codebase uses fallback: `dict.section.key || "Fallback English Text"` — follow this pattern
- **Total estimated strings to add:** ~800-1000+ unique translatable strings across all files
