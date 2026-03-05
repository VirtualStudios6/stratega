import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyBiEMIbwISIt5-J9_yE3xhFaLtCtyhPJOQ",
  authDomain: "stratega-planner.firebaseapp.com",
  projectId: "stratega-planner",
  storageBucket: "stratega-planner.firebasestorage.app",
  messagingSenderId: "1022294410705",
  appId: "1:1022294410705:web:729c2e424c613679298cf0",
  measurementId: "G-6X89SLDPH5"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
