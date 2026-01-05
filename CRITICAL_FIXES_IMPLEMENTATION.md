# Critical Fixes Implementation Guide

## 🔴 URGENT: Firestore Security Rules Fix

### Current Status
- **CRITICAL VULNERABILITY**: Firestore rules allow full read/write access to anyone until 2025-12-25
- **Risk Level**: CRITICAL
- **Action Required**: IMMEDIATE

### Implementation Steps

1. **Backup Current Rules**
```bash
cp firestore.rules firestore.rules.backup
```

2. **Update firestore.rules** with the secure rules from TESTING_AND_IMPROVEMENTS.md

3. **Test Rules Locally** (if using emulators)
```bash
firebase emulators:start
```

4. **Deploy Rules**
```bash
firebase deploy --only firestore:rules
```

5. **Verify Rules**
- Test with different user roles
- Ensure all operations work correctly
- Check audit logs

### Rollback Plan
If issues occur:
```bash
cp firestore.rules.backup firestore.rules
firebase deploy --only firestore:rules
```

---

## 🔐 2FA Implementation Quick Start

### Step 1: Install Dependencies
```bash
npm install speakeasy qrcode @types/speakeasy @types/qrcode
```

### Step 2: Create Service File
Create `src/lib/2fa-service.ts` (see TESTING_AND_IMPROVEMENTS.md for full code)

### Step 3: Create UI Component
Create `src/features/auth/components/two-factor-setup.tsx`

### Step 4: Add to User Settings
Add 2FA setup component to user profile/settings page

### Step 5: Update Login Flow
Modify `src/routes/login.tsx` to check for 2FA after password verification

### Testing Checklist
- [ ] Generate 2FA secret
- [ ] Scan QR code with authenticator app
- [ ] Verify token
- [ ] Enable 2FA
- [ ] Login with 2FA
- [ ] Test backup codes
- [ ] Test disabling 2FA

---

## 🛡️ Rate Limiting Implementation

### Step 1: Create Cloud Function
```typescript
// functions/src/rate-limiter.ts
// See TESTING_AND_IMPROVEMENTS.md for implementation
```

### Step 2: Apply to Login Endpoint
```typescript
// functions/src/index.ts
import { rateLimit } from './rate-limiter';

export const loginWithRateLimit = functions.https.onCall(async (data, context) => {
  const ip = context.rawRequest.ip || 'unknown';
  
  if (!rateLimit(ip, 5, 60000)) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many login attempts. Please try again later.'
    );
  }
  
  // Continue with login logic
});
```

### Step 3: Apply to API Endpoints
Add rate limiting to all public-facing endpoints

---

## 🔒 Password Policy Implementation

### Step 1: Create Password Policy Service
Create `src/lib/password-policy.ts` (see TESTING_AND_IMPROVEMENTS.md)

### Step 2: Update Registration Form
```typescript
// src/routes/register.tsx
import { validatePassword } from '@/lib/password-policy';

const handlePasswordChange = (password: string) => {
  const validation = validatePassword(password);
  if (!validation.valid) {
    setPasswordErrors(validation.errors);
  }
};
```

### Step 3: Update Password Reset
Apply same validation to password reset flow

---

## 📊 Monitoring & Logging Setup

### Step 1: Install Monitoring
```bash
npm install @sentry/react @sentry/tracing
```

### Step 2: Initialize Sentry
```typescript
// src/lib/monitoring.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
  environment: import.meta.env.MODE,
});
```

### Step 3: Add Error Boundaries
```typescript
// src/components/error-boundary.tsx
import { ErrorBoundary } from "@sentry/react";

export function AppErrorBoundary({ children }) {
  return <ErrorBoundary fallback={<ErrorFallback />}>{children}</ErrorBoundary>;
}
```

---

## ✅ Testing Implementation

### Step 1: Set Up Test Infrastructure
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Step 2: Create Test Structure
```
tests/
├── unit/
├── integration/
└── e2e/
```

### Step 3: Write Critical Tests
- Authentication flow
- Form validations
- File uploads
- Security rules

---

## 🚀 Deployment Checklist

Before deploying fixes:

- [ ] Backup current rules and data
- [ ] Test all changes in staging
- [ ] Review security rules with team
- [ ] Set up monitoring
- [ ] Prepare rollback plan
- [ ] Notify users of changes
- [ ] Deploy during low-traffic period
- [ ] Monitor for 24 hours post-deployment

---

## 📞 Support

For questions or issues:
1. Check TESTING_AND_IMPROVEMENTS.md for detailed documentation
2. Review Firebase documentation
3. Contact development team

---

**Last Updated**: 2025-01-27

