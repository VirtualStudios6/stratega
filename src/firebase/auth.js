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

export const logout = () => signOut(auth)

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

  // Extrae el idToken que devuelve el plugin
  const idToken = result.credential?.idToken
  if (!idToken) throw new Error("Google Sign-In: no se recibió idToken")

  // Autentica en Firebase usando ese token (crea o reanuda la sesión)
  const credential = GoogleAuthProvider.credential(idToken)
  return signInWithCredential(auth, credential)
}

// ── Facebook Sign-In ──────────────────────────────────────────────────────────
// signInWithPopup no funciona correctamente en WebView nativo de Capacitor.
// En native lanzamos un error claro para que el UI pueda informar al usuario.

export const loginWithFacebook = () => {
  if (isNative()) {
    return Promise.reject(
      new Error("Facebook login no está disponible en la app nativa por el momento.")
    )
  }
  return signInWithPopup(auth, facebookProvider)
}
