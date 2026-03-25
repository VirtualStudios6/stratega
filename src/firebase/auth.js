import { auth } from "./config"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth"
import { Capacitor } from "@capacitor/core"

const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()

// ── Utilidades ────────────────────────────────────────────────────────────────

/** true cuando la app corre dentro de un dispositivo nativo (Android / iOS) */
const isNative = () => Capacitor.isNativePlatform()

// ── Auth básico ───────────────────────────────────────────────────────────────

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

// ── Google Sign-In ────────────────────────────────────────────────────────────
//
//  • Web        → Firebase signInWithPopup (flujo original, sin cambios)
//  • Android/iOS → @capacitor-firebase/authentication abre el selector nativo
//                  de cuentas de Google y devuelve un idToken que Firebase valida
//

export const loginWithGoogle = async () => {
  if (!isNative()) {
    // ── WEB ──────────────────────────────────────────────────────────────────
    return signInWithPopup(auth, googleProvider)
  }

  // ── ANDROID / iOS ─────────────────────────────────────────────────────────
  const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication")

  // Abre el selector de cuentas de Google nativo
  const result = await FirebaseAuthentication.signInWithGoogle()

  // Extrae el idToken (y opcionalmente el accessToken) que devuelve el plugin
  const idToken = result.credential?.idToken
  const accessToken = result.credential?.accessToken
  if (!idToken) throw new Error("Google Sign-In: no se recibió idToken")

  // Autentica en Firebase web usando ese token (sincroniza el estado con el SDK nativo)
  const credential = GoogleAuthProvider.credential(idToken, accessToken)
  return signInWithCredential(auth, credential)
}

// ── Facebook Sign-In ──────────────────────────────────────────────────────────
//
//  • Web        → Firebase signInWithPopup (flujo original)
//  • Android/iOS → @capacitor-firebase/authentication abre el flujo nativo de
//                  Facebook y devuelve un accessToken que Firebase valida
//

export const loginWithFacebook = async () => {
  if (!isNative()) {
    return signInWithPopup(auth, facebookProvider)
  }

  // ── ANDROID / iOS ─────────────────────────────────────────────────────────
  const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication")

  // Abre el flujo nativo de Facebook
  const result = await FirebaseAuthentication.signInWithFacebook()

  // Facebook devuelve un accessToken (no idToken)
  const accessToken = result.credential?.accessToken
  if (!accessToken) throw new Error("Facebook Sign-In: no se recibió accessToken")

  // Autentica en Firebase web usando ese token
  const credential = FacebookAuthProvider.credential(accessToken)
  return signInWithCredential(auth, credential)
}
