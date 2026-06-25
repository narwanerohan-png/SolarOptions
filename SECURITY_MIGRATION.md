# Security Migration Plan: Firebase Authentication & Razorpay Integration

This document outlines the security migration plan for upgrading the current authentication, subscription, and payment architecture to a robust, enterprise-grade, secure model using **Firebase Authentication (Firebase Admin SDK)** and server-side **Razorpay signature verification**.

---

## 1. Current Architecture

### 1.1 Authentication & User Storage
- **Identity Provider**: Custom-built login/register endpoints proxying to a Google Apps Script (GAS) Web App connected to a Google Sheet (**Sheet2**).
- **Session Management**: Custom client-side state matching plaintext/unhashed passwords retrieved from Sheet2 via the Express proxy.
- **Data Protection**: Zero backend cryptography or password hashing is performed. Passwords are saved, queried, and verified in cleartext.

### 1.2 Registration & Payment Flow
- **Razorpay Checkout**: Initiated purely client-side in `src/App.tsx` (lines 461-570).
- **Payment Verification**: Once Razorpay returns a successful `razorpay_payment_id`, the client browser POSTs the payload directly to `/api/register` (lines 1066-1250) or `/api/feedback`.
- **Payment Signature Verification**: **None.** The backend does not verify the Razorpay payment signature or call Razorpay's API to confirm the transaction's legitimacy.
- **Account Generation**: Upon receiving the client's request containing a user-provided `paymentId`, the Express server blindly calls the Google Apps Script Web App to create a user row in Sheet2.

### 1.3 Subscription Verification
- **Paid Status Resolution**: Subscriptions are determined by parsing Sheet2 records. A paid user is defined by the absence of a trial marker or presence of a string containing a valid `paymentId`.
- **Protected Endpoints**: `/api/facilities` and `/api/leads` perform custom checks by loading Sheet2 via `fetchSheet2Users()` and checking the requesting user's status.

### 1.4 Primary Security Risks Identified
1. **Plaintext Password Exposure**: Passwords stored in cleartext in Google Sheets are readable by anyone with access to the spreadsheet or Google Apps Script.
2. **Razorpay Signature Bypass**: Any user or script can bypass Razorpay payments completely by POSTing a dummy `paymentId` directly to `/api/register` to gain full paid access.
3. **Google Apps Script Over-Trust**: Google Apps Script acts as an open endpoint, blindly writing whatever values (`isTrial`, `paymentId`, `validUntil`) the Express backend sends it.
4. **Lack of Proper Bearer Token Verification**: API endpoints like `/api/facilities` are secured using raw request body email comparisons, which are easily spoofed if an attacker crafts direct API requests.

---

## 2. Target Architecture

```
[ Client Browser ]
        │
   (Firebase SDK / Google Sign-In) 
        │  (Sends JWT ID Token in Auth Header)
        ▼
[ Express Server (Node.js) ]
        │
  (Firebase Admin SDK) ◄── Verifies JWT & extracts UID/Email
        │
  (Razorpay SDK)       ◄── Performs server-to-server signature verification
        │
  (Secure Controller)  ◄── Blocks unauthorized requests to /api/leads & /api/facilities
        │
        ▼
[ Google Sheets / Firestore ] (For persistent application data)
```

### 2.1 Firebase Admin Authentication
- **Identity Provider**: Google Firebase Authentication handles login, password resets, and Google Sign-In securely on the client.
- **Token Verification**: The client includes a Firebase ID Token (`Bearer JWT`) in the `Authorization` header of all API calls.
- **Middleware**: Express runs a global/route-specific `authMiddleware` that uses `firebase-admin` to decrypt, verify, and parse the JWT.

### 2.2 Secure Payment Flow
- **Razorpay Orders**: The client requests a secure `order_id` from a new `/api/payments/create-order` endpoint.
- **Signature Verification**: On checkout completion, the client sends `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to a secure `/api/payments/verify` endpoint.
- **Cryptographic Check**: The backend calculates the expected signature using HMAC-SHA256 with the `RAZORPAY_KEY_SECRET` and matches it against the received signature before updating any user privileges.

### 2.3 Access Control & Storage
- User metadata (subscriptions, custom claims) is stored in **Firestore** or synchronizes securely back to the spreadsheet using validated, server-controlled properties.

---

## 3. Migration Phases

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Setup & Environment Provisioning              │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ Phase 2: Firebase Admin SDK Integration                │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ Phase 3: Route Protection & Middleware Implementation   │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ Phase 4: Secure Razorpay Integration                    │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ Phase 5: Client Migration & Dual-Authentication Gate  │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ Phase 6: Full Cutover & Deprecation of Plaintext Auth  │
└────────────────────────────────────────────────────────┘
```

### Phase 1: Setup & Environment Provisioning
1. Ensure the Firebase Project is provisioned (already configured via `firebase-applet-config.json`).
2. Generate a Firebase Service Account key file from the Firebase Console.
3. Securely set up the required production environment variables.

### Phase 2: Firebase Admin SDK Integration
1. Add `firebase-admin` and `razorpay` to dependencies.
2. Create a secure initialization helper in `/api/lib/firebaseAdmin.ts` that safely parses credentials from environment variables.

### Phase 3: Route Protection & Middleware Implementation
1. Develop an Express middleware (`requireAuth`) that extracts the HTTP `Authorization` Bearer token.
2. Protect `/api/facilities` and `/api/leads` using the `requireAuth` middleware.
3. Resolve user subscription details by looking up their verified Firebase UID in Firestore or a secure sheet mapping.

### Phase 4: Secure Razorpay Integration
1. Create `/api/payments/create-order` on the server to prevent tamperable prices.
2. Create `/api/payments/verify` on the server to cryptographically verify signatures using Razorpay's recommended patterns.

### Phase 5: Client Migration & Dual-Authentication Gate
1. Refactor `src/App.tsx` to handle authentication through the client Firebase SDK.
2. Implement a "Dual-Authentication Gate" on the backend during development to allow users logged in with legacy systems or Google Apps Script to function temporarily during migration.

### Phase 6: Full Cutover & Deprecation of Plaintext Auth
1. Remove plaintext auth endpoints `/api/login` and `/api/register`.
2. Disable the Apps Script Web App write permissions for unauthorized endpoints.

---

## 4. Rollback Plan

Should the system fail, degrade, or throw unauthorized errors for valid users in production, the following rollback steps will be taken:

1. **Step 1: Environment Switch**
   - Flip the `ENABLE_SECURE_AUTH` toggle variable in the environment configuration to `false`.
2. **Step 2: Fallback Logic**
   - The middleware will fallback to using the legacy Apps Script spreadsheet verification.
3. **Step 3: Frontend Hot-Patch**
   - Redeploy the stable branch without the Firebase client-side check.
4. **Step 4: Database Safety**
   - Ensure the Google Sheet remains the source-of-truth during the transition so user records are never lost.

---

## 5. Files That Will Be Modified

### 5.1 Backend Files
- `/package.json`: Add `firebase-admin` and `razorpay` as dependencies.
- `/api/index.ts`: Import and initialize Firebase Admin, inject `requireAuth` middleware, add Razorpay verification endpoints.
- `/api/lib/firebaseAdmin.ts` *(New)*: Handles safe validation of service account credentials.

### 5.2 Frontend Files
- `/src/App.tsx`: Transition authentication functions from proxy API requests to direct Firebase SDK wrappers (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signInWithPopup`). Add the Bearer Token to outgoing `fetch` headers.
- `/src/lib/firebase.ts`: Confirm standard export of `auth` and client configurations.

---

## 6. Environment Variables That Will Be Added

Add the following placeholders to `.env.example`:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Razorpay Production Keys
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Feature Flag for Rollbacks
ENABLE_SECURE_AUTH=true
```

---

## 7. Testing Checklist

- [ ] **Auth Token Expiration**: Verify that the Express server rejects expired JWTs and prompts client token refresh.
- [ ] **Protected Routes**: Verify that calling `/api/facilities` or `/api/leads` without an `Authorization` header returns a `401 Unauthorized` status.
- [ ] **Tamper Proofing**: Verify that sending an altered JWT returns a `403 Forbidden` status.
- [ ] **Payment Verification Failure**: Inject a malformed Razorpay signature into the verification endpoint to verify that the subscription status remains unpaid.
- [ ] **Successful Onboarding**: Verify that complete payment, signature confirmation, user record updating, and premium dashboard access occur smoothly in a single continuous user journey.

---

## 8. Safe Deployment Sequence

1. **Prerequisite**: Set up all environment variables (`FIREBASE_PRIVATE_KEY`, `RAZORPAY_KEY_SECRET`, etc.) in the Cloud console environment.
2. **Deploy Backend Upgrade**: Deploy the Express update featuring the dual-auth gate.
3. **Verify Database Coexistence**: Confirm database queries work for both legacy accounts and new Firebase accounts.
4. **Deploy Client Upgrade**: Update the React application so users register and pay via the new, secured system.
5. **Clean up**: Decommission legacy endpoints once 100% of the active user base has migrated.
