# Atlas — Pending Work

Last Updated: May 21, 2026

---

## 🔴 HIGH PRIORITY

### 1. Razorpay Payment — Frontend Integration
**Estimated Time:** 3-4 hours

- [ ] Pricing page buttons don't call backend API
- [ ] No order creation flow (`POST /api/payments/razorpay/create-order`)
- [ ] No Razorpay checkout popup integration (Razorpay.js script)
- [ ] No payment verification flow (`POST /api/payments/razorpay/verify`)
- [ ] No success/failure UI handling
- [ ] No subscription tier update reflected in UI after purchase
- [ ] No Razorpay script tag added to `app/layout.tsx`

### 2. Apply Email Config Changes (Gmail SMTP)
**Estimated Time:** ✅ Done

- [x] `EMAIL_HOST` → `smtp.gmail.com`
- [x] `EMAIL_PORT` → `587`
- [x] `EMAIL_USER` → `csharswat9@gmail.com`
- [x] `EMAIL_PASS` → App Password provided
- [x] Add `secure: false` to `sendEmail.js` transporter
- [x] Applied to both files

---

## 🟡 MEDIUM PRIORITY

### 4. Email Verification on Registration
**Estimated Time:** 2-3 hours

- [ ] No email verification token generation on register
- [ ] No verification email template
- [ ] No verification endpoint
- [ ] No frontend verification page
- [ ] No `isVerified` field in User model

---

## 🟢 LOW PRIORITY

### 5. OAuth Polish
**Estimated Time:** 2-3 hours

- [ ] No profile picture sync from OAuth providers
- [ ] No account linking (Google + GitHub to same account)
- [ ] No OAuth provider info displayed in user profile

### 6. Testing
**Estimated Time:** 4-6 hours

- [ ] Zero test files for other features
- [ ] No unit tests for controllers
- [ ] No integration tests for API endpoints
- [ ] No frontend component tests
- [x] E2E tests for settings page (20/20 passing)

### 7. Deployment Setup
**Estimated Time:** 3-4 hours

- [ ] No Docker configuration
- [ ] No CI/CD pipeline
- [ ] CORS locked to localhost only
- [ ] No production environment variable management
- [ ] No error tracking/monitoring (Sentry, etc.)
- [ ] No health check endpoint for deployment platforms

### 8. SEO & Meta Tags
**Estimated Time:** 1-2 hours

- [ ] Static metadata in layout.tsx
- [ ] No dynamic metadata per page
- [ ] No Open Graph tags
- [ ] No sitemap.xml
- [ ] No robots.txt

---

## 📋 TECHNICAL DEBT

- [ ] Backend uses JavaScript (no TypeScript) — inconsistent with frontend
- [x] ~~No input validation library (no Zod/Joi/express-validator)~~ — `express-validator` added to auth routes
- [x] ~~No error handling middleware for uncaught exceptions~~ — global error handler added
- [x] ~~No logging library — all `console.log`/`console.error`~~ — `winston` logger with timestamps + request ID support
- [x] ~~No Helmet security headers — only CORS + rate limiting~~ — `helmet()` enabled
- [x] ~~`grok-sdk`, `stripe`, `crypto`~~ — removed from dependencies
- [x] ~~Mongoose 9 deprecation warnings (`new` option → `returnDocument: 'after'`)~~ — fixed
- [x] ~~No API documentation (Swagger/Redoc)~~ — Swagger UI at `/api/docs`
- [x] ~~No rate limiting on auth routes specifically~~ — separate `authLimiter` (10 req/15min) applied
- [x] ~~Password reset tokens not cleaned up after use~~ — cleaned on use + expired tokens cleared on new request
- [x] ~~No pagination for chat history (returns all chats at once)~~ — `?page=&limit=` added to `GET /api/chat`
- [ ] No caching layer (Redis)
- [x] ~~No request ID tracking for debugging~~ — UUID per request + `X-Request-Id` header
- [x] ~~No graceful shutdown handling~~ — SIGTERM/SIGINT handlers close HTTP + MongoDB gracefully
