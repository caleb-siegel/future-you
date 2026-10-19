# Future You

> **"When you're making an important decision, remember what your past experiences have taught you."**

Future You is a responsive, personal knowledge-base application that helps you capture lessons from everyday experiences, translate them into enduring preferences, and retrieve those principles when making future life plans and decisions.

---

## 🌟 Core Concepts

1. **Memories**: Experiences, observations, lessons, and thoughts captured in seconds.
2. **Preferences**: Principles and criteria explicitly derived from your experiences (e.g. *"At least two bathrooms"*).
3. **Plans**: Future decisions or goals (e.g. *"Find Our Next Apartment"*, *"Plan Summer Trip"*) that associate and prioritize relevant preferences with custom notes and checklist progress.

---

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router v7
- **Styling**: Tailwind CSS v4, custom warm editorial aesthetic (Plus Jakarta Sans + Newsreader)
- **Backend & Database**: Cloud Firestore (NoSQL, Native Mode)
- **Authentication**: Firebase Authentication (Email & Password, persistent sessions)
- **Hosting**: Firebase Hosting
- **Icons**: Lucide React

---

## 📂 Project Structure

```text
├── firestore.rules          # Strict security rules ensuring data privacy by authenticated UID
├── firestore.indexes.json   # Compound query index configurations
├── firebase.json            # Firebase Hosting and Firestore configuration
├── .firebaserc              # Default Firebase project pointer (future-you-app-4912)
├── .env.example             # Documented environment variables
├── src/
│   ├── components/
│   │   ├── auth/            # ProtectedRoute guards
│   │   ├── layout/          # Responsive AppLayout (desktop sidebar + mobile navigation)
│   │   ├── memories/        # QuickCapture, MemoryCard, EditMemoryModal, FormPreferenceModal
│   │   ├── preferences/     # PreferenceCard, CreatePreferenceModal, EditPreferenceModal
│   │   ├── plans/           # PlanCard, CreatePlanModal, EditPlanModal, AddPreferencesToPlanModal
│   │   └── ui/              # Reusable Button, Modal, Badge, EmptyState, ConfirmDialog
│   ├── context/
│   │   └── AuthContext.tsx  # Authentication state and hooks
│   ├── pages/
│   │   ├── HomePage.tsx               # Greeting, inline Quick Capture, recent memories & plans
│   │   ├── MemoriesPage.tsx           # Search, category & tag filters, date sorting, detail view
│   │   ├── PreferencesPage.tsx        # Filter by status, importance, category; add to plans
│   │   ├── PreferenceDetailPage.tsx   # Detailed view with supporting memories & linked plans
│   │   ├── PlansPage.tsx              # Active, completed, and archived decision plans
│   │   ├── PlanDetailPage.tsx         # Plan checklist with independent importance & memory reviews
│   │   ├── SettingsPage.tsx           # Account info, storage status, sign out
│   │   ├── LoginPage.tsx              # Clean minimal sign-in
│   │   ├── SignUpPage.tsx             # New account creation
│   │   └── ForgotPasswordPage.tsx     # Password reset flow
│   ├── services/
│   │   ├── firebase.ts      # Firebase app initialization
│   │   ├── auth.ts          # Auth service wrappers
│   │   ├── memories.ts      # Firestore CRUD & cascade cleanup on preferences
│   │   ├── preferences.ts   # Firestore CRUD for preferences
│   │   ├── plans.ts         # Firestore CRUD for plans & item cascade deletion
│   │   └── planItems.ts     # Plan items with independent importance & deduplication
│   ├── types/
│   │   └── index.ts         # TypeScript models, enums, and category definitions
│   ├── App.tsx              # Client routes
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind CSS and typography tokens
```

---

## 🔒 Security & Data Integrity

- **Strict Access Control**: Unauthenticated requests are completely denied. Authenticated users can only read, write, update, or delete documents where `resource.data.userId == request.auth.uid`.
- **Field & Enum Validation**: Memory content is bounded to 10,000 characters; importance and status fields are validated against strict enums (`must_have`, `high`, `medium`, `low`).
- **Cascade Cleanup**:
  - Deleting a memory automatically removes its reference from supporting memories lists in affected preferences without deleting or corrupting those preferences.
  - Deleting a plan cleans up its associated checklist items without deleting underlying preferences or memories.
  - Adding a preference to a plan enforces deduplication so duplicate items cannot be created for the same plan.

---

## 🛠️ Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Ensure `.env` contains your Firebase project keys:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Run development server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for production
```bash
npm run build
```

---

## 🌐 Deployment to Firebase

The project is configured for Firebase Hosting and Cloud Firestore:

1. **Deploy Firestore Security Rules & Indexes**:
   ```bash
   npx -y firebase-tools@latest deploy --only firestore
   ```

2. **Deploy Frontend Build to Firebase Hosting**:
   ```bash
   npm run build
   npx -y firebase-tools@latest deploy --only hosting
   ```

**Live Deployment URL**: [https://future-you-app-4912.web.app](https://future-you-app-4912.web.app)  
**Firebase Console**: [https://console.firebase.google.com/project/future-you-app-4912/overview](https://console.firebase.google.com/project/future-you-app-4912/overview)
