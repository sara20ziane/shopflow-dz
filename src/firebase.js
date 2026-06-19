import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQ7MsDCFCIRJ6sBeg6UhoYUiGBA0cpyM8",
  authDomain: "shopflow-dz.firebaseapp.com",
  projectId: "shopflow-dz",
  storageBucket: "shopflow-dz.firebasestorage.app",
  messagingSenderId: "721551942224",
  appId: "1:721551942224:web:b6287dec072f81d7656755"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
