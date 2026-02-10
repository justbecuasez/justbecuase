# JustBecause Network - API Inventory Report

**Generated:** February 10, 2026  
**Purpose:** Complete API structure analysis for NestJS migration planning

---

## Summary

| Category | API Endpoints | Server Actions |
|----------|---------------|----------------|
| Admin | 6 | 15+ |
| Auth | 8 | 4 |
| Debug | 1 | - |
| Location | 1 | - |
| Messages | 5 | 6 |
| Newsletter | 1 | - |
| Payments | 7 | 3 |
| Projects | 1 | 8 |
| Settings | 1 | 3 |
| Test | 3 | - |
| Upload | 1 | - |
| User | 4 | 10+ |
| **Total** | **39 endpoints** | **60+ server actions** |

---

## API Endpoints by Category

### 1. Admin APIs (`/api/admin/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/create-admin` | POST | Create a new admin account (admin-only) |
| `/api/admin/notifications` | GET | Get all notifications (admin view with pagination) |
| `/api/admin/notifications` | POST | Send notification to users (all, volunteers, NGOs, or specific) |
| `/api/admin/payment-config` | GET | Get payment gateway configuration (masked secrets) |
| `/api/admin/payment-config` | POST | Save payment gateway configuration (Stripe/Razorpay) |
| `/api/admin/sms-config` | GET | Get current SMS configuration status |
| `/api/admin/sms-config` | POST | Save SMS provider configuration (Twilio/Vonage/MSG91/TextLocal) |
| `/api/admin/support` | GET | Get all support tickets |
| `/api/admin/support` | POST | Create ticket or add admin response |
| `/api/admin/test-payment` | POST | Create a test payment order |
| `/api/admin/test-payment` | PUT | Verify a test payment |

---

### 2. Auth APIs (`/api/auth/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...all]` | GET, POST | Better Auth catch-all handler (signin, signup, signout, etc.) |
| `/api/auth/send-otp` | POST | Send email OTP for verification |
| `/api/auth/send-sms-otp` | POST | Send SMS OTP via configured provider |
| `/api/auth/verify-otp` | POST | Verify email OTP code |
| `/api/auth/verify-sms-otp` | POST | Verify SMS OTP code |
| `/api/auth/password/verify-code` | POST | Verify password reset code |
| `/api/auth/welcome` | POST | Send welcome email to new user |

---

### 3. Debug APIs (`/api/debug/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/debug/sms-config` | GET | Debug endpoint to check SMS configuration status |

---

### 4. Location APIs (`/api/location/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/location` | GET | Get location from IP (fallback) |
| `/api/location` | POST | Geocoding (address ↔ coordinates) via Google Maps API |

---

### 5. Messages APIs (`/api/messages/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/messages/unread` | GET | Get unread message count and summary |
| `/api/messages/[conversationId]` | GET | Get messages for a conversation (supports polling with `after` param) |
| `/api/messages/[conversationId]` | POST | Send a message to a conversation |
| `/api/messages/[conversationId]/read` | POST | Mark all messages as read |
| `/api/messages/[conversationId]/typing` | GET | Get who is typing in conversation |
| `/api/messages/[conversationId]/typing` | POST | Set typing status |

---

### 6. Newsletter APIs (`/api/newsletter/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/newsletter/subscribe` | POST | Subscribe to newsletter with email |

---

### 7. Payments APIs (`/api/payments/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/create-order` | POST | **DEPRECATED** - Returns error, redirects to subscription upgrade |
| `/api/payments/create-subscription` | POST | Create payment order for subscription (Stripe/Razorpay) |
| `/api/payments/stripe-callback` | GET | Handle Stripe payment intent callback |
| `/api/payments/stripe-link-callback` | GET | Handle Stripe Payment Link redirect callback |
| `/api/payments/unlock-with-subscription` | POST | Unlock volunteer profile using Pro subscription |
| `/api/payments/verify` | POST | Verify payment and unlock profile (Stripe/Razorpay) |
| `/api/payments/verify-subscription` | POST | Verify payment and activate subscription |

---

### 8. Projects APIs (`/api/projects/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | Browse active projects (public) |

---

### 9. Settings APIs (`/api/settings/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings` | GET | Get public platform settings (no auth required) |

---

### 10. Test APIs (`/api/test-*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/test-email` | GET | Debug endpoint for testing Resend email (should be removed) |
| `/api/test-reset` | POST | Debug endpoint for password reset flow (should be removed) |
| `/api/test-users` | GET | Debug endpoint to check users in database (should be removed) |

---

### 11. Upload APIs (`/api/upload/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Generate Cloudinary upload signature (authenticated) |

---

### 12. User APIs (`/api/user/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/export-data` | GET | Export all user data (GDPR compliance) |
| `/api/user/notifications` | GET | Get user notifications with unread count |
| `/api/user/privacy` | GET | Get user privacy settings |
| `/api/user/privacy` | PUT | Update user privacy settings |
| `/api/user/subscription` | GET | Get user subscription status (NGO or Volunteer) |

---

## Server Actions (`lib/actions.ts`)

### Authentication & User Management

| Action | Description |
|--------|-------------|
| `getCurrentUser()` | Get current authenticated user from session |
| `requireAuth()` | Require authentication, redirect if not logged in |
| `requireRole(roles)` | Require specific role(s), redirect if unauthorized |
| `selectRole(role)` | Set user role (volunteer/ngo) during onboarding |
| `completeOnboarding()` | Mark user as onboarded |

### Volunteer Profile

| Action | Description |
|--------|-------------|
| `saveVolunteerOnboarding(data)` | Save/update volunteer profile during onboarding |
| `getVolunteerProfile(userId?)` | Get volunteer profile by user ID |
| `updateVolunteerProfile(updates)` | Update volunteer profile fields |
| `getVolunteerSubscriptionStatus()` | Get subscription status with limits |
| `getVolunteerProfileView(volunteerId)` | Get profile with visibility rules applied |

### NGO Profile

| Action | Description |
|--------|-------------|
| `saveNGOOnboarding(data)` | Save/update NGO profile during onboarding |
| `getNGOProfile(userId?)` | Get NGO profile by user ID |
| `updateNGOProfile(updates)` | Update NGO profile fields |
| `getNGOSubscriptionStatus()` | Get subscription status with limits |
| `getNGOById(userId)` | Get NGO profile by user ID |

### Projects

| Action | Description |
|--------|-------------|
| `createProject(data)` | Create a new project (checks subscription limits) |
| `getProject(id)` | Get project by ID |
| `getProjectById(id)` | Alias for getProject |
| `getActiveProjects(limit?)` | Get active projects |
| `getNGOProjects()` | Get current NGO's projects |
| `getMyProjectsAsNGO()` | Alias for getNGOProjects |
| `updateProject(id, updates)` | Update project |
| `deleteProject(id)` | Delete project |
| `browseProjects(filters?)` | Browse projects with optional filters |

### Applications

| Action | Description |
|--------|-------------|
| `applyToProject(projectId, coverMessage?)` | Apply to a project (checks subscription limits) |
| `hasAppliedToProject(projectId)` | Check if user already applied |
| `getMyApplications()` | Get volunteer's applications |
| `getProjectApplications(projectId)` | Get applications for a project |
| `getNGOApplications()` | Get all applications for NGO's projects |
| `getNGOApplicationsEnriched()` | Get applications with project/volunteer info |
| `updateApplicationStatus(id, status, notes?)` | Update application status |

### Project Bookmarks

| Action | Description |
|--------|-------------|
| `toggleSaveProject(projectId)` | Save/unsave a project |
| `isProjectSaved(projectId)` | Check if project is saved |
| `getSavedProjects()` | Get all saved projects |

### Profile Unlocks

| Action | Description |
|--------|-------------|
| `unlockVolunteerProfile(volunteerId, paymentId?)` | Unlock volunteer profile (Pro subscription) |
| `getUnlockedProfiles()` | Get NGO's unlocked profiles |

### Matching

| Action | Description |
|--------|-------------|
| `getMatchedVolunteersForProject(projectId)` | AI-powered volunteer matching |
| `getMatchedOpportunitiesForVolunteer()` | AI-powered opportunity matching |

### Notifications

| Action | Description |
|--------|-------------|
| `getNotifications()` | Get user's notifications |
| `getMyNotifications()` | Alias for getNotifications |
| `markNotificationRead(id)` | Mark notification as read |
| `markAllNotificationsRead()` | Mark all notifications as read |
| `getUnreadNotificationCount()` | Get unread count |

### Messages/Conversations

| Action | Description |
|--------|-------------|
| `getMyConversations()` | Get user's conversations with enriched data |
| `getConversation(id)` | Get single conversation |
| `getConversationMessages(id, limit?)` | Get messages in conversation |
| `sendMessage(receiverId, content, projectId?)` | Send a message |
| `startConversation(receiverId, projectId?, initialMessage?)` | Start a new conversation |
| `getUnreadMessageCount()` | Get unread message count |

### Admin Actions

| Action | Description |
|--------|-------------|
| `getAdminSettings()` | Get admin settings (auto-initializes) |
| `updateAdminSettings(settings)` | Update admin settings |
| `getPublicSettings()` | Get public platform settings |
| `getAdminStats()` | Get basic admin statistics |
| `getAdminAnalytics()` | Get detailed admin analytics |
| `adminChangeUserRole(userId, newRole)` | Change user role |
| `getAllVolunteers(page, limit)` | Paginated volunteers list |
| `getAllNGOs(page, limit)` | Paginated NGOs list |
| `getAllProjects(page, limit)` | Paginated projects list |
| `verifyNGO(userId, isVerified)` | Update NGO verification |
| `verifyVolunteer(userId, isVerified)` | Update volunteer verification |
| `verifyUser(userId, userType, isVerified)` | Generic verification |
| `suspendUser(userId, userType)` | Suspend user account |
| `reactivateUser(userId, userType)` | Reactivate suspended user |
| `adminDeleteUser(userId, userType)` | Delete user and all data |

### Ban Management

| Action | Description |
|--------|-------------|
| `banUser(userId, userType, reason)` | Ban user with reason |
| `unbanUser(userId, userType)` | Unban user |
| `getBanRecords()` | Get all ban records |
| `getUserBanHistory(userId)` | Get user's ban history |

### Team Members (About Page)

| Action | Description |
|--------|-------------|
| `createTeamMember(member)` | Create team member |
| `updateTeamMember(id, updates)` | Update team member |
| `deleteTeamMember(id)` | Delete team member |
| `getTeamMembers()` | Get all team members |
| `getActiveTeamMembers()` | Get active members only |
| `reorderTeamMembers(orderedIds)` | Reorder team members |

### Browse & Search

| Action | Description |
|--------|-------------|
| `browseVolunteers(filters?)` | Browse volunteers with filters |
| `browseNGOs(filters?)` | Browse NGOs with filters |
| `getSkillCategoryCounts()` | Get project counts by skill category |

### Transactions & Payments

| Action | Description |
|--------|-------------|
| `getMyTransactions()` | Get user's transactions |
| `getAllTransactions(page, limit)` | Get all transactions (admin) |
| `getPaymentStats()` | Get payment statistics |

### Account Management

| Action | Description |
|--------|-------------|
| `changePassword(current, new)` | Change user password |
| `deleteAccount()` | Delete user account and all data |

### NGO Follow

| Action | Description |
|--------|-------------|
| `followNgo(ngoId)` | Follow an NGO |
| `unfollowNgo(ngoId)` | Unfollow an NGO |
| `isFollowingNgo(ngoId)` | Check if following NGO |

### Platform

| Action | Description |
|--------|-------------|
| `getImpactMetrics()` | Get platform impact metrics |
| `initializePlatform()` | Initialize platform defaults |

---

## Database Collections Used

| Collection | Purpose |
|------------|---------|
| `user` | User accounts (Better Auth) |
| `account` | OAuth/credential accounts (Better Auth) |
| `session` | User sessions (Better Auth) |
| `volunteerProfiles` | Volunteer profile data |
| `ngoProfiles` | NGO profile data |
| `projects` | Project listings |
| `applications` | Project applications |
| `conversations` | Message conversations |
| `messages` | Individual messages |
| `notifications` | User notifications |
| `profileUnlocks` | NGO profile unlock records |
| `transactions` | Payment transactions |
| `adminSettings` | Platform settings |
| `admins` | Admin user list |
| `subscriptionPlans` | Subscription plan definitions |
| `banRecords` | User ban records |
| `teamMembers` | Team members (about page) |
| `newsletter_subscribers` | Newsletter subscriptions |
| `email_otps` | Email OTP codes |
| `sms_otps` | SMS OTP codes |
| `verified_emails` | Verified email tracking |
| `verified_phones` | Verified phone tracking |
| `system_config` | SMS/payment gateway config |
| `paymentGatewayConfig` | Payment credentials |
| `support_tickets` | Support ticket system |

---

## External Services Integration

| Service | Purpose |
|---------|---------|
| **Better Auth** | Authentication (email/password, OAuth) |
| **MongoDB** | Database |
| **Cloudinary** | Image/file uploads |
| **Stripe** | Payment processing |
| **Razorpay** | Payment processing (India) |
| **Resend** | Email delivery |
| **Twilio** | SMS delivery |
| **Vonage** | SMS delivery (alternative) |
| **MSG91** | SMS delivery (India) |
| **TextLocal** | SMS delivery (India) |
| **Google Maps** | Geocoding |

---

## Migration Recommendations for NestJS

### High Priority APIs (Core Functionality)
1. Auth endpoints (Better Auth replacement needed)
2. User profile management (volunteer/NGO)
3. Projects CRUD
4. Applications CRUD
5. Messages/conversations

### Medium Priority
1. Payment processing (Stripe/Razorpay)
2. Admin management endpoints
3. Notifications system
4. Matching algorithms

### Low Priority (Can defer)
1. Debug/test endpoints (remove)
2. Newsletter subscription
3. Team member management

### Architecture Notes
- Most business logic is in server actions, not API routes
- Consider splitting into NestJS modules: auth, users, projects, applications, messages, payments, admin
- Database helpers in `lib/database.ts` contain reusable MongoDB operations
- Validation logic in `lib/validation.ts`
- Payment abstraction in `lib/payment-gateway.ts`
- Email utility in `lib/email.ts`
