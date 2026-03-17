import { auth } from "./config"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth"

const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()

export const registerWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const loginWithGoogle = () =>
  signInWithPopup(auth, googleProvider)

export const loginWithFacebook = () =>
  signInWithPopup(auth, facebookProvider)

export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email)

export const logout = () => signOut(auth)
