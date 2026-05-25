# Atlas — Bugs Found

Last Updated: May 21, 2026

---

## 🔴 CRITICAL BUGS

### 1. Backend Process Stops Unexpectedly
**Status:** ⚠️ Recurring  
**Severity:** Critical  
**Impact:** All API calls fail with "Network Error"

**Description:**  
The backend server (`node --watch index.js`) stops running without any error output. This causes all frontend API calls to fail with `Network Error`. The process must be manually restarted.

**Root Cause:**  
Likely related to `--watch` mode behavior on Windows or unhandled promise rejections crashing the process.

**Workaround:**  
Run `npm run dev` in a dedicated terminal and keep it open.

**Fix Required:**  
- Add unhandled rejection handler
- Consider using `nodemon` instead of `--watch`
- Add process error handlers in `index.js`

---

### 2. Cloudinary Credentials Were Incorrect
**Status:** ✅ Fixed  
**Severity:** Critical  
**Impact:** Avatar upload completely broken

**Description:**  
The `.env` file had wrong Cloudinary credentials:
- `CLOUDINARY_CLOUD_NAME=Atlas` (should be `dzdqpunb5`)
- `CLOUDINARY_API_KEY=513672241359761` (wrong key)
- `CLOUDINARY_API_SECRET=sDVFVSBLqGZ0DPtjWY9Bvf53mCw` (wrong secret)

**Fix Applied:**  
Updated to correct credentials from user's Cloudinary dashboard.

---

### 3. User Response Missing `bio` and `avatarUrl` Fields
**Status:** ✅ Fixed  
**Severity:** High  
**Impact:** Settings page couldn't display user's bio or avatar

**Description:**  
The auth controller's register, login, and reset-password responses didn't include `bio` and `avatarUrl` fields. When the settings page loaded, these fields were `undefined`.

**Files Affected:**
- `backend/controllers/authController.js` (registerUser, loginUser, resetPassword)
- `backend/controllers/oauthController.js` (googleCallback, githubCallback)

**Fix Applied:**  
Added `bio` and `avatarUrl` to all user response objects.

---

### 4. DALL-E 3 Model Unavailable (400 Error)
**Status:** ✅ Fixed  
**Severity:** High  
**Impact:** Image generation broken for users without DALL-E 3 access

**Description:**  
OpenAI API returns `400 The model 'dall-e-3' does not exist` for API keys without DALL-E 3 access.

**Fix Applied:**  
Added automatic fallback to `dall-e-2` with size validation in `imageController.js:31-48`.

---

### 5. Mongoose v9 "next is not a function" Error
**Status:** ✅ Fixed  
**Severity:** High  
**Impact:** Password reset and user save operations crash with "next is not a function"

**Description:**  
Mongoose v9 no longer passes `next` to async pre hooks. The `UserSchema.pre('save', async function (next))` hook called `next()` which was `undefined`.

**Files Affected:**
- `backend/models/User.js:69-75`

**Fix Applied:**  
Removed `next` parameter, replaced `next()` with `return` for early exit.

---

## 🟡 MEDIUM BUGS

### 6. Mongoose 9 Deprecation Warnings
**Status:** ✅ Fixed  
**Severity:** Medium  
**Impact:** Console warnings, potential future breakage

**Description:**  
Mongoose 9 deprecated the `new` option in `findByIdAndUpdate` and `findOneAndUpdate`. Should use `returnDocument: 'after'` instead.

**Affected Files:**
- `backend/controllers/userController.js` (updateDetails)
- `backend/controllers/chatController.js` (sendMessage, deleteChat)

**Warning Message:**
```
Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
```

---

### 7. Settings Page — Sign Out Button Not Connected
**Status:** ✅ Fixed  
**Severity:** Medium  
**Impact:** User couldn't sign out from settings

**Description:**  
The sign out button in the settings sidebar was a plain `<button>` with no `onClick` handler.

**Fix Applied:**  
Connected to `useAuthStore.logout()` with redirect to `/login`.

---

### 8. Settings Page — Profile Form Static Data
**Status:** ✅ Fixed  
**Severity:** Medium  
**Impact:** Profile updates didn't save to database

**Description:**  
All profile inputs used `defaultValue` instead of controlled `value` props. No API calls were made on submit.

**Fix Applied:**  
Converted to controlled components with `useState`, connected to `PUT /api/user/update-details`.

---

### 9. Settings Page — Password Change Not Connected
**Status:** ✅ Fixed  
**Severity:** Medium  
**Impact:** Password changes didn't work

**Description:**  
Password form had no `onSubmit` handler and no API integration.

**Fix Applied:**  
Connected to `PUT /api/user/update-password` with validation.

---

### 10. Settings Page — Account Deletion Not Connected
**Status:** ✅ Fixed  
**Severity:** Medium  
**Impact:** Users couldn't delete their accounts

**Description:**  
Delete button had no click handler.

**Fix Applied:**  
Connected to `DELETE /api/user/delete-account` with confirmation dialog.

---

### 11. Settings Page — Theme Selection Not Persisted
**Status:** ✅ Fixed  
**Severity:** Medium  
**Impact:** Theme selection was visual only, no actual dark mode

**Description:**  
Theme buttons didn't change anything. No `dark` class was applied to the DOM.

**Fix Applied:**  
Added theme state with `localStorage` persistence and `document.documentElement.classList` manipulation.

---

### 12. Settings Page — Avatar Upload Missing
**Status:** ✅ Fixed  
**Severity:** Medium  
**Impact:** No way to upload profile pictures

**Description:**  
Avatar section was purely decorative. No file input, no upload logic.

**Fix Applied:**  
- Added `multer` middleware to backend
- Created `POST /api/user/upload-avatar` endpoint
- Added Cloudinary upload with resize/crop transformation
- Added file input with validation (type, size) in frontend

---

### 13. Settings Page — Notifications Tab Was Placeholder
**Status:** ✅ Fixed  
**Severity:** Medium  
**Impact:** Users couldn't configure notification preferences

**Description:**  
Notifications tab showed static text with no controls.

**Fix Applied:**  
Replaced with actual toggle controls for email notifications, marketing emails, and security alerts. Uses `PUT /api/user/update-details` to save preferences.

---

### 14. Chat Page Not Mobile Responsive
**Status:** ✅ Fixed  
**Severity:** Medium  
**Impact:** Chat page unusable on mobile devices

**Description:**  
Sidebar was fixed width with no mobile drawer, header lacked hamburger menu, chat bubbles not responsive.

**Fix Applied:**  
- Added mobile sidebar drawer with overlay
- Mobile header with hamburger toggle
- Responsive chat bubbles (85% width desktop → full width mobile)
- Bottom padding for mobile input area

---

## 🟢 LOW BUGS

### 15. Axios Instance Missing Multipart Content-Type Handling
**Status:** ✅ Handled  
**Severity:** Low  
**Impact:** Avatar upload would fail with wrong content-type

**Description:**  
The Axios interceptor sets `Content-Type: application/json` by default. File uploads need `multipart/form-data`.

**Fix Applied:**  
Avatar upload request explicitly overrides headers: `{ "Content-Type": "multipart/form-data" }`.

---

### 16. Chat Page — Error Message Fallback Too Generic
**Status:** ⚠️ Not Fixed  
**Severity:** Low  
**Impact:** Users see generic "Network Error" instead of helpful messages

**Description:**  
When the backend is down, the error message shown is just "Network Error" which isn't user-friendly.

**Suggested Fix:**  
Add a custom error message mapping for network errors.

---

### 17. No Loading State on Chat Page Initial Load
**Status:** ⚠️ Not Fixed  
**Severity:** Low  
**Impact:** Brief flash of empty state before chat history loads

**Description:**  
When navigating to `/chat`, there's no loading indicator while chat history is being fetched.

---

### 18. `grok-sdk` Package in Dependencies
**Status:** ✅ Fixed (removed)  
**Severity:** Low (potential security risk)  
**Impact:** Unknown — possibly a typo-squatting package

**Description:**  
`package.json` includes `"grok-sdk": "^0.0.1-security"` which appears to be either:
- A typo for `groq-sdk` (which is also present)
- A potentially malicious package

**Suggested Fix:**  
Remove if unused, verify if intentional.

---

### 19. Stripe Package in Dependencies
**Status:** ✅ Fixed (removed — not needed, Razorpay handles payments)
**Severity:** Low
**Impact:** Unused package

**Description:**
`stripe` was installed in `backend/package.json` but never imported or used. The app uses Razorpay exclusively.

**Fix Applied:**
Removed `stripe` from `backend/package.json`.

---

### 20. No Express Error Handling Middleware
**Status:** ⚠️ Not Fixed  
**Severity:** Low  
**Impact:** Unhandled errors return default Express error responses

**Description:**  
The backend has no custom error handling middleware. Express 5 will return generic 500 errors for uncaught exceptions.

**Suggested Fix:**  
Add an error handling middleware at the end of `index.js`.

---

### 21. Password Reset Tokens Not Cleaned Up
**Status:** ⚠️ Not Fixed  
**Severity:** Low  
**Impact:** Database accumulates unused reset tokens

**Description:**  
When a user requests a password reset but doesn't use the link, the token remains in the database until manually cleaned or overwritten by a new request.

---

### 22. Chat History Returns All Chats (No Pagination)
**Status:** ⚠️ Not Fixed  
**Severity:** Low (becomes critical at scale)  
**Impact:** Users with many chats will experience slow load times

**Description:**  
`GET /api/chat` returns all conversations without pagination.

---

### 23. Image Generation Chat Model Not Using Groq
**Status:** ✅ Fixed  
**Severity:** Low  
**Impact:** Chat model was using incorrect model after image generation

**Description:**  
After generating an image, the chat model switched to `gpt-4o-mini` instead of the configured Groq model.

**Fix Applied:**  
Updated chat controller to use Groq model consistently, only using OpenAI for image generation.

---

## 📊 SUMMARY

| Status | Count |
|--------|-------|
| ✅ Fixed | 15 |
| ⚠️ Not Fixed | 7 |
| **Total** | **22** |
