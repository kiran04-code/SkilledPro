# SkilledPro — Project Changelog

> This file tracks all changes, additions, and modifications made to the SkilledPro project.

---

## 📋 Change Log

---

### [Session 1] — 2026-04-25

#### 🆕 Initialized
- Created this `CHANGELOG.md` file to track all future changes made to the project.

---

### [Session 2] — 2026-04-25

#### 🆕 Added — Email Verification System

**Backend:**
- `backend/src/utils/emailService.js` — **New:** Nodemailer Gmail SMTP service with branded HTML email template.
- `backend/src/models/User.js` — Added fields: `emailVerified`, `verificationToken` (SHA-256 hashed), `verificationTokenExpiry` (24h TTL).
- `backend/src/controllers/authController.js` — `register` now generates crypto token + sends email (no auto-login). `login` blocks unverified users with 403. Added `verifyEmail` and `resendVerification` controllers.
- `backend/src/routes/auth.js` — Added `GET /verify-email` and `POST /resend-verification` routes.
- `backend/.env` — Added `EMAIL_USER` and `EMAIL_PASS` placeholders.
- Installed `nodemailer` npm package.

**Frontend:**
- `frontend/src/pages/VerifyEmail.jsx` — **New:** Handles pending/loading/success/expired states with inline resend form.
- `frontend/src/pages/Register.jsx` — Redirects to `/verify-email` after registration.
- `frontend/src/pages/Login.jsx` — Shows amber banner with resend button for unverified users.
- `frontend/src/context/AuthContext.jsx` — `register()` no longer auto-logs-in (backend requires email verification first).
- `frontend/src/App.jsx` — Added public `/verify-email` route.

---

### [Session 3] — 2026-04-25

#### ✏️ Modified — Skills Restriction
- `frontend/src/pages/Register.jsx` — Enforced a maximum limit of 2 skills selection in the frontend and updated UI labels. Added a toast error message if users attempt to select more.
- `backend/src/controllers/authController.js` — Added backend validation in the `register` controller to block requests containing more than 2 skills with a 400 Bad Request error.

---

### [Session 4] — 2026-04-25

#### 🆕 Added — Robust Chat Filtering System
- `backend/src/middleware/phoneFilter.js` — Completely rewrote the filter logic. Now it normalizes spelled-out numbers (e.g., "nine eight"), blocks restricted keywords ("whatsapp", "call me"), and uses a strict regex to catch scattered digits indicating a phone number. It returns a detailed reason instead of a boolean.
- `backend/src/socket/socketHandler.js` — Updated `send_message` event handler to pass the specific blocked reason to the frontend via the `message_blocked` event.
- `backend/src/controllers/messageController.js` — Updated `saveMessage` to correctly capture and store the blocked reason in the database when a message violates the rules.

---

### [Session 5] — 2026-04-25

#### 🆕 Added — Live Location Sharing in Chat
- `frontend/src/pages/Chat.jsx` — Added a "Share Live Location" button that requests browser geolocation and emits a formatted `[LOCATION]` message. Updated the message UI to detect this prefix and render a clickable Google Maps link instead of raw text.
- `backend/src/middleware/phoneFilter.js` — Added a strict regex exception to allow system-generated `[LOCATION]` messages to pass through the phone number filter without being blocked (as coordinate digits previously triggered the block).

---

### [Session 6] — 2026-04-25

#### 🆕 Added — Advanced Worker Filtering System
- `backend/src/models/User.js` — Extended schema to include `category`, `lat`, and `lng` to support hierarchical classification and geolocation searches.
- `frontend/src/pages/Register.jsx` — Replaced flat skills array with a `CATEGORY_SKILLS` hierarchical map. Users must select a category first, which reveals the relevant skills.
- `backend/src/controllers/authController.js` — Updated `register` to capture and store the new `category`, `lat`, and `lng` properties.
- `backend/src/utils/haversine.js` — Added mathematical utility to accurately calculate geographical distance in kilometers between two latitude/longitude points.
- `backend/src/controllers/userController.js` — Updated `getWorkers` to dynamically filter MongoDB results by `category`, `skill`, `minRating`, and `minExperience`. Implemented in-memory Haversine distance filtering for the `maxDistance` parameter.
- `frontend/src/pages/Workers.jsx` — Built a responsive multi-filter UI toolbar including Category, dependent Skill, Rating, Experience, and Max Distance dropdowns. Distance selection automatically requests the user's browser geolocation.

---

### [Session 7] — 2026-04-25

#### 🆕 Added — GeoJSON Location System & Distance Matching
- `backend/src/models/User.js` — Replaced flat `lat` and `lng` properties with a `locationCoords` MongoDB GeoJSON Point structure. Added a `2dsphere` index to enable native geographical querying.
- `frontend/src/pages/Register.jsx` — Implemented comprehensive robust location handling:
  - **Interactive Map & GPS**: Re-added the GPS location button alongside the map picker.
  - **Reverse Geocoding**: When coordinates are picked via Map or GPS, the OpenStreetMap Nominatim API automatically converts the coordinates into a readable address string and locks the input field to prevent ambiguity conflicts.
  - **Forward Geocoding**: If a user bypasses GPS/Map and manually types an address, the submission interceptor calls the Nominatim API to convert the typed text into latitude/longitude coordinates to ensure they are accurately trackable for distance filters.
- `backend/src/controllers/authController.js` & `backend/src/controllers/userController.js` — Updated `register` and `updateProfile` endpoints to parse incoming lat/lng arrays into proper MongoDB GeoJSON points.
- `backend/src/controllers/userController.js` — Replaced the in-memory JavaScript distance calculator with an extremely fast MongoDB native `$near` geospatial query. Automatically converts km limits (e.g. 5km, 10km) to meters for MongoDB radius filtering.

---

<!-- 
  New entries will be added below this line as changes are made.
  Format:
  ### [Session N] — YYYY-MM-DD
  #### ✏️ Modified / 🆕 Added / 🗑️ Removed / 🐛 Fixed
  
  - Description of change
-->
  #### ✏️ Modified / 🆕 Added / 🗑️ Removed / 🐛 Fixed
  
  - Description of change
-->
