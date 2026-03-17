importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyBiEMIbwISIt5-J9_yE3xhFaLtCtyhPJOQ",
  authDomain: "stratega-planner.firebaseapp.com",
  projectId: "stratega-planner",
  storageBucket: "stratega-planner.firebasestorage.app",
  messagingSenderId: "1022294410705",
  appId: "1:1022294410705:web:729c2e424c613679298cf0",
})

const messaging = firebase.messaging()

// Handles notifications when the browser tab is in the background or closed
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Recordatorio — Stratega"
  const body  = payload.notification?.body  || ""

  self.registration.showNotification(title, {
    body,
    icon:    "/logos/logo.png",
    badge:   "/logos/logo.png",
    tag:     payload.data?.reminderId || "stratega-reminder",
    vibrate: [200, 100, 200],
    data:    payload.data || {},
  })
})
