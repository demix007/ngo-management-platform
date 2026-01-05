# Deployment Guide

This guide covers the best practices for deploying your React + Firebase application.

## 🎯 Recommended: Firebase Hosting

**Firebase Hosting is the best choice** for this application because:
- ✅ Already configured in your project
- ✅ Seamless integration with Firebase services (Auth, Firestore, Storage)
- ✅ Free SSL certificates
- ✅ Global CDN for fast content delivery
- ✅ Easy deployment with Firebase CLI
- ✅ Automatic rollback capabilities
- ✅ Custom domain support

### Prerequisites

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Verify your project**:
   ```bash
   firebase projects:list
   ```
   Ensure `blp-imis-c3e61` is listed.

### Deployment Steps

#### Step 1: Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

#### Step 2: Deploy Security Rules (First Time Only)

Before deploying your app, ensure your Firestore and Storage security rules are deployed:

```bash
firebase deploy --only firestore:rules,storage:rules
```

#### Step 3: Deploy Firebase Functions (If Needed)

If you have Firebase Functions that need to be deployed:

```bash
firebase deploy --only functions
```

#### Step 4: Deploy to Firebase Hosting

Deploy your React application:

```bash
firebase deploy --only hosting
```

**Note**: If you encounter timeout errors when deploying functions, you can deploy hosting separately:

```bash
# Deploy only hosting (skip functions if they're causing issues)
firebase deploy --only hosting,firestore:rules,storage:rules
```

Or deploy everything at once (if functions are working):

```bash
firebase deploy
```

#### Troubleshooting Functions Deployment

If you get a timeout error when deploying functions:

1. **Deploy hosting first** (your React app):
   ```bash
   firebase deploy --only hosting
   ```

2. **Deploy functions separately**:
   ```bash
   cd functions
   npm run build
   cd ..
   firebase deploy --only functions
   ```

3. **Check functions code** for:
   - Synchronous operations at module level
   - Multiple `admin.initializeApp()` calls
   - Heavy imports that block initialization

#### Step 5: Verify Deployment

After deployment, your app will be available at:
- **Default URL**: `https://blp-imis-c3e61-7c687.web.app`
- **Custom Domain**: (if configured) Your custom domain

### Continuous Deployment (CI/CD)

#### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: blp-imis-c3e61
```

**Required Secrets:**
- `FIREBASE_SERVICE_ACCOUNT`: JSON content of your Firebase service account key

#### GitLab CI Example

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  image: node:18
  before_script:
    - npm install -g firebase-tools
  script:
    - firebase deploy --only hosting --token $FIREBASE_TOKEN
  only:
    - main
```

**Required Variables:**
- `FIREBASE_TOKEN`: Get it by running `firebase login:ci`

### Environment Variables (Optional but Recommended)

For better security, consider using environment variables for Firebase config. See the "Environment Variables Setup" section below.

---

## 🔄 Alternative Deployment Options

### Option 2: Vercel

Vercel is excellent for React applications with automatic deployments.

#### Setup Steps:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Create `vercel.json`**:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

**Pros:**
- ✅ Automatic deployments from Git
- ✅ Preview deployments for PRs
- ✅ Excellent performance
- ✅ Free tier available

**Cons:**
- ⚠️ Requires environment variable setup
- ⚠️ Less integrated with Firebase services

### Option 3: Netlify

Similar to Vercel, great for React apps.

#### Setup Steps:

1. **Create `netlify.toml`**:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy via CLI**:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

3. **Set Environment Variables** in Netlify Dashboard

**Pros:**
- ✅ Easy setup
- ✅ Free tier
- ✅ Good documentation

**Cons:**
- ⚠️ Requires environment variable setup
- ⚠️ Less integrated with Firebase

### Option 4: Cloudflare Pages

Fast global CDN with good performance.

#### Setup Steps:

1. Connect your Git repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Configure environment variables in dashboard

**Pros:**
- ✅ Excellent global performance
- ✅ Free tier
- ✅ DDoS protection

**Cons:**
- ⚠️ Requires environment variable setup
- ⚠️ Less integrated with Firebase

---

## 🔐 Environment Variables Setup (Recommended)

For better security and flexibility, use environment variables instead of hardcoded config.

### Step 1: Create `.env.production`

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Step 2: Update `src/lib/firebase.ts`

The file should use `import.meta.env` to read environment variables. See the updated configuration below.

### Step 3: Add `.env.production` to `.gitignore`

```gitignore
.env.production
.env.local
```

### Step 4: Set Environment Variables in Deployment Platform

- **Firebase Hosting**: Use Firebase Functions environment config or build-time replacement
- **Vercel/Netlify**: Set in dashboard under Project Settings > Environment Variables

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] **Build succeeds**: `npm run build` completes without errors
- [ ] **Security rules deployed**: Firestore and Storage rules are up to date
- [ ] **Firebase Functions deployed** (if applicable)
- [ ] **Environment variables set** (if using them)
- [ ] **Custom domain configured** (if needed)
- [ ] **Firebase Authentication providers enabled** in Firebase Console
- [ ] **Storage bucket configured** with proper CORS settings
- [ ] **Firestore indexes created** (if using complex queries)
- [ ] **Test production build locally**: `npm run preview`

---

## 🚀 Quick Deploy Commands

### First Time Deployment
```bash
# 1. Build
npm run build

# 2. Deploy rules
firebase deploy --only firestore:rules,storage:rules

# 3. Deploy functions (if needed)
firebase deploy --only functions

# 4. Deploy hosting
firebase deploy --only hosting
```

### Subsequent Deployments
```bash
npm run build && firebase deploy --only hosting
```

### Deploy Everything
```bash
npm run build && firebase deploy
```

---

## 🔧 Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build` shows detailed errors

### Firebase Authentication Not Working
- Verify authorized domains in Firebase Console > Authentication > Settings
- Check that your domain is added to authorized domains list

### Storage Upload Fails
- Verify Storage security rules are deployed
- Check CORS configuration in Firebase Console > Storage
- Ensure Storage bucket is properly configured

### Functions Not Deploying
- Ensure you're in the correct Firebase project: `firebase use <project-id>`
- Check functions directory has proper `package.json`
- Verify billing is enabled (required for Cloud Functions)

---

## 📊 Monitoring & Analytics

After deployment:

1. **Firebase Console**: Monitor usage, errors, and performance
2. **Firebase Analytics**: Track user behavior (already configured)
3. **Firebase Performance**: Monitor app performance
4. **Error Reporting**: Set up Firebase Crashlytics for error tracking

---

## 🔄 Rollback

If something goes wrong:

```bash
# List recent deployments
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

---

## 📝 Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Vite Production Build Guide](https://vitejs.dev/guide/build.html)
- [React Deployment Best Practices](https://react.dev/learn/start-a-new-react-project#production-deployment)

---

## 💡 Best Practices

1. **Always test locally first**: `npm run preview` to test production build
2. **Use staging environment**: Deploy to a preview channel before production
3. **Monitor after deployment**: Check Firebase Console for errors
4. **Set up alerts**: Configure Firebase alerts for critical issues
5. **Version control**: Tag releases in Git for easy rollback
6. **Document changes**: Keep a changelog of deployments

---

## 🎯 Recommended Workflow

1. **Development**: Work on feature branch
2. **Testing**: Test locally with `npm run dev`
3. **Build Test**: Run `npm run build && npm run preview`
4. **Staging**: Deploy to preview channel: `firebase hosting:channel:deploy staging`
5. **Production**: Merge to main, deploy to production: `firebase deploy --only hosting`

---

For questions or issues, refer to the [Firebase Documentation](https://firebase.google.com/docs) or your project's README.

