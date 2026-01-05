# Quick Start: Create Your First Admin User

## Fastest Method (Firebase Console)

### 1. Create Authentication User (2 minutes)

1. Visit: https://console.firebase.google.com/project/blp-imis/authentication/users
2. Click **"Add user"**
3. Enter:
   - Email: `admin@yourngo.org`
   - Password: `[Choose a strong password]`
4. Click **"Add user"**
5. **Copy the User UID** (click on the user to see it)

### 2. Create Firestore User Document (2 minutes)

1. Visit: https://console.firebase.google.com/project/blp-imis/firestore/data
2. Click **"Start collection"** (if `users` doesn't exist)
3. Collection ID: `users`
4. Click **"Add document"**
5. **Document ID**: Paste the User UID from step 1
6. Add these fields (click **"Add field"** for each):

| Field Name | Type | Value |
|------------|------|-------|
| `email` | string | `admin@yourngo.org` |
| `displayName` | string | `Admin User` |
| `role` | string | `national_admin` |
| `isActive` | boolean | `true` |
| `twoFactorEnabled` | boolean | `false` |
| `createdAt` | timestamp | Click clock icon → "timestamp" |
| `updatedAt` | timestamp | Click clock icon → "timestamp" |

7. Click **"Save"**

### 3. Test Login

1. Go to: https://blp-imis-e9428.web.app/login
2. Enter your email and password
3. You should be redirected to the dashboard! 🎉

## Optional: Add More Fields

You can also add these optional fields to the user document:

- `state` (string) - e.g., "Lagos"
- `lga` (string) - e.g., "Ikeja"  
- `phoneNumber` (string) - e.g., "+2341234567890"
- `photoURL` (string) - URL to profile picture

## Create Additional Users

Repeat steps 1-2 for each user, changing:
- Email and password
- Role (see available roles below)
- Display name

### Available Roles

- `national_admin` - Full access (use for first admin)
- `state_admin` - State-level management
- `field_officer` - Field data collection
- `m_e` - Monitoring & Evaluation
- `finance` - Financial management
- `donor` - Donor portal

## Troubleshooting

**"User profile not found"**
- Make sure the Firestore document ID exactly matches the User UID
- Check that all required fields are present

**Can't login**
- Verify email/password are correct
- Check that `isActive` is set to `true`
- Ensure `role` field exists and is valid

**Permission errors**
- Verify the role is set correctly
- Check Firestore security rules are deployed

