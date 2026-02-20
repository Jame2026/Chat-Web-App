# 🚀 Premium Chat Application

A high-end, real-time messaging platform built with **React**, **Vite**, and **Firebase**. This app features a premium user interface with smooth animations, advanced media handling, and real-time synchronization.

---

## ✨ Key Features

### 💬 Messaging Experience
- **Real-time Chat**: Instant message delivery powered by Firestore.
- **Seen Status**: Modern Messenger-style mini-avatar indicator when recipients read your messages.
- **Rich Media Support**: Send images and videos with large, immersive previews (up to 850px).
- **Voice Messages**: Record and send voice notes with a built-in wave visualizer.
- **Reactions**: React to any message with curated emojis.
- **Message Editing**: Fix typos on the fly with real-time sync.
- **Clear Chat**: Securely wipe your conversation history.

### 👤 Profile & Personalization
- **Premium Image Cropping**: Built-in circular cropper for user profile photos with zoom controls.
- **Status Bio & Presence**: Set your availability (Active, Away, Busy) and a custom status bio.
- **Dynamic Themes**: Toggle between a sleek Dark Mode and Light Mode.
- **Chat Wallpapers**: Customize each chat background with beautiful gradients or custom themes.

### 🛡️ Security & Performance
- **Firebase Authentication**: Secure sign-in system.
- **User Blocking**: Manage your privacy by blocking unwanted users.
- **Optimized Storage**: Client-side image compression for faster uploads.
- **Instant Search**: Find friends and conversations instantly in the sidebar.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Framer Motion (Animations), Lucide React (Icons).
- **Backend**: Firebase (Firestore, Authentication, Storage).
- **Utilities**: `react-easy-crop` for profile photos, `emoji-picker-react`.

---

## ⚙️ Project Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Firebase project

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Firebase Configuration
Locate the Firebase config in `src/firebase.js` and replace the placeholder values with your actual project credentials from the [Firebase Console](https://console.firebase.google.com/):

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 4. Setting up Firebase Rules
Ensure your Firestore and Storage rules are configured to allow authenticated users to read and write.

**Firestore:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Start Development
Run the application locally:
```bash
npm run dev
```

---

## 📖 How to Use

1.  **Sign In**: Use the authentication screen to create an account or log in.
2.  **Add Friends**: Open the **Directory** (People icon in the sidebar) to find and start chats with other users.
3.  **Customize**: Go to **Settings** (Gear icon) to change your avatar (using the new cropper!), update your bio, or toggle Dark Mode.
4.  **Chat**: Send text, images, or voice notes. Click on images to view them full-screen!
