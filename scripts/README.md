# User Creation Scripts

## Prerequisites

1. Install Firebase Admin SDK:
```bash
npm install firebase-admin
```

2. Download Service Account Key:
   - Go to [Firebase Console](https://console.firebase.google.com/project/blp-imis/settings/serviceaccounts/adminsdk)
   - Click **Generate New Private Key**
   - Save the JSON file as `serviceAccountKey.json` in the project root
   - **⚠️ IMPORTANT**: Add `serviceAccountKey.json` to `.gitignore` (never commit this file!)

## Using the Script

### Create a Single User

```bash
node scripts/create-user.js <email> <password> <role> [displayName] [state] [lga]
```

**Example:**
```bash
node scripts/create-user.js admin@ngo.org MySecurePass123 national_admin "Admin User" "Lagos" "Ikeja"
```

**Available Roles:**
- `national_admin` - Full system access
- `state_admin` - State-level management  
- `field_officer` - Field data collection
- `m_e` - Monitoring and evaluation
- `finance` - Financial management
- `donor` - Donor portal access

### Bulk User Creation

Create a CSV file with user data and use a script to import:

```csv
email,password,role,displayName,state,lga
user1@ngo.org,pass123,field_officer,User One,Lagos,Ikeja
user2@ngo.org,pass123,state_admin,User Two,Abuja,Garki
```

Then create a script to read and process the CSV.

## Security Notes

- Never commit `serviceAccountKey.json` to version control
- Use strong passwords (minimum 8 characters, mixed case, numbers, symbols)
- Rotate service account keys periodically
- Limit access to the service account key

