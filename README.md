# Cricket Tournament Points Table

A full-stack web application for managing and displaying cricket tournament standings.

## Features
- Public viewing of tournaments, match fixtures, and auto-sorted points tables.
- Admin dashboard to create tournaments, manage teams, manually enter stats and NRR, and schedule matches.
- Firebase integration (Firestore, Auth) with robust security rules.

## Setup Instructions

1. **Firebase Configuration**
   - Create a project in [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore Database and Firebase Authentication (Email/Password provider).
   - Create a Web App and copy the config credentials.
   - Rename `.env.example` to `.env` and fill in your Firebase credentials:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     ...
     ```

2. **Security Rules**
   Deploy the `firestore.rules` to your Firebase project:
   - Go to Firestore -> Rules in the Firebase console and copy the contents of `firestore.rules` into it, or use Firebase CLI (`firebase deploy --only firestore:rules`).

3. **Admin Account Setup**
   - In Firebase Console -> Authentication, create a user with your email and password.
   - In Firestore Database, create a collection named `admins`.
   - Add a document where the Document ID is your exact email address (e.g. `your_email@domain.com`). The document doesn't need fields, just the ID.

4. **Data Seeding (Optional)**
   A script `seed.js` is provided to initialize a demo tournament. 
   - Add a temporary service account key or run the script in a Node environment configured with admin privileges, OR you can simply log into the Admin Dashboard (`/admin/login`) and create the teams manually!

## Development
Run the local dev server:
```bash
npm install
npm run dev
```

## Deployment
This app can be deployed to Vercel, Netlify, or Firebase Hosting.
- For Vercel/Netlify: set the Build Command to `npm run build` and Output Directory to `dist`. Add the `.env` variables in their respective dashboards.
