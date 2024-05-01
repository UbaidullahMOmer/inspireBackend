const { initializeApp } = require("firebase/app");
const { getAuth, GoogleAuthProvider } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");

const firebaseConfig = {
  apiKey: "AIzaSyB9uMv2ii1C53p1yiST6kTIDwHRhdN8T2o",
  authDomain: "inspire-ubaidullah.firebaseapp.com",
  projectId: "inspire-ubaidullah",
  storageBucket: "inspire-ubaidullah.appspot.com",
  messagingSenderId: "806978500096",
  appId: "1:806978500096:web:eee96a5945f563e0de8ae5",
  measurementId: "G-3E1XSWW3E3"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const storage = getStorage(app);
const db = getFirestore(app);

module.exports = { auth, googleProvider, storage, db };
