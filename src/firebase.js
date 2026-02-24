import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyCCtm8gDJ9N9MWA1GoQepJV8vY-68FxDrY",
    authDomain: "chat-app-ac3c1.firebaseapp.com",
    projectId: "chat-app-ac3c1",
    storageBucket: "chat-app-ac3c1.firebasestorage.app",
    messagingSenderId: "854410747474",
    appId: "1:854410747474:web:5d72613b35d6eb9d0fc98b",
    measurementId: "G-VLN9MWHRXX"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- CONNECTION TESTER ---
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const testConnection = async () => {
    console.log("Checking Firestore connection for project: chat-app-ac3c1...");
    try {
        await addDoc(collection(db, "connection_test"), {
            status: "success",
            time: serverTimestamp()
        });
        console.log("✅ SUCCESS: Firestore is connected and writable!");
        return true;
    } catch (e) {
        console.error("❌ CONNECTION FAILED:", e.message);
        if (e.message.includes("permission")) {
            console.error("DEBUG: This is definitely a RULES issue. Please check your Firestore Rules tab.");
        }
        return false;
    }
};

// Run the test once on load
testConnection();

export default app;
