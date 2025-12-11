// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCuktaMaqSVDxcOdAdmUxh-XDebHbMgKSk",
    authDomain: "dungeonexplorer.firebaseapp.com",
    projectId: "dungeonexplorer",
    storageBucket: "dungeonexplorer.firebasestorage.app",
    messagingSenderId: "833417807998",
    appId: "1:833417807998:web:8644d113fe40fe59e9f02f",
    measurementId: "G-8GBNC6EHQJ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

console.log('Firebase initialized successfully');
