import { auth } from "./config"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth"
import { Capacitor } from "@capacitor/core"

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope("email")
googleProvider.addScope("profile")
googleProvider.setCustomParameters({ prompt: "select_account" })
const isNative = () => Capacitor.isNativePlatform()

export const registerWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email)

export const logout = async () => {
  if (isNative()) {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication")
    await FirebaseAuthentication.signOut()
  }
  return signOut(auth)
}

export const loginWithGoogle = async () => {
  if (!isNative()) {
    return signInWithPopup(auth, googleProvider)
  }

  const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication")
  const result = await FirebaseAuthentication.signInWithGoogle()

  const idToken = result.credential?.idToken
  const accessToken = result.credential?.accessToken
  if (!idToken) throw new Error("Google Sign-In: no se recibio idToken")

  const credential = GoogleAuthProvider.credential(idToken, accessToken)
  return signInWithCredential(auth, credential)
}
