# Add project specific ProGuard rules here.

# Capacitor WebView — keep JS interface intact
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# Preserve stack trace line numbers in crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Facebook SDK (dependencia transitiva de Firebase Auth) ─────────────────
# Firebase Auth incluye soporte opcional para Facebook Login. No usamos el SDK
# de Facebook directamente, pero R8 advierte de las clases faltantes al shrink.
-dontwarn com.facebook.CallbackManager$Factory
-dontwarn com.facebook.CallbackManager
-dontwarn com.facebook.FacebookCallback
-dontwarn com.facebook.login.LoginManager
-dontwarn com.facebook.login.widget.LoginButton
