import { db, storage } from "./config"
import {
  collection, query, where, getDocs, deleteDoc, doc,
} from "firebase/firestore"
import { ref, listAll, deleteObject } from "firebase/storage"

/**
 * Deletes all Firestore documents and Storage files belonging to a user.
 * Individual failures are silently swallowed so the process always completes.
 * @param {string} uid - Firebase Auth UID
 */
export async function deleteUserData(uid) {
  const results = await Promise.allSettled([
    // ── Firestore: single-doc collections (uid is the document ID) ──────────
    safeDelete(() => deleteDoc(doc(db, "users", uid))),
    safeDelete(() => deleteDoc(doc(db, "company_profiles", uid))),

    // ── Firestore: multi-doc collections (filtered by uid field) ────────────
    ...["reminders", "quotes", "feed_posts", "folders", "folder_files",
        "accounting", "planners", "team_members"].map(col =>
      safeDelete(() => deleteCollection(col, uid))
    ),

    // ── Storage ───────────────────────────────────────────────────────────────
    // avatar is a single file, not a folder
    safeDelete(() => deleteObject(ref(storage, `avatars/${uid}`))),
    // feed and folders are folder prefixes
    safeDelete(() => deleteStoragePrefix(`feed/${uid}`)),
    safeDelete(() => deleteStoragePrefix(`folders/${uid}`)),
  ])

  const failed = results.filter(r => r.status === "rejected").length
  if (failed > 0) console.warn(`deleteUserData: ${failed} operation(s) failed (non-blocking)`)
}

/* ── helpers ────────────────────────────────────────────────────────────── */

async function safeDelete(fn) {
  try { await fn() } catch (e) { /* intentionally swallowed */ }
}

async function deleteCollection(collectionName, uid) {
  const snap = await getDocs(query(collection(db, collectionName), where("uid", "==", uid)))
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
}

async function deleteStoragePrefix(prefix) {
  const listResult = await listAll(ref(storage, prefix))
  const deletes = [
    ...listResult.items.map(item => deleteObject(item)),
    ...listResult.prefixes.map(sub => deleteStoragePrefix(sub.fullPath)),
  ]
  await Promise.all(deletes)
}
