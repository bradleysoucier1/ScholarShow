import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCYjQN1yrkGkiF5vapCx9AiM7TdxKKgb-8',
  authDomain: 'scholarshow-5fcbd.firebaseapp.com',
  projectId: 'scholarshow-5fcbd',
  storageBucket: 'scholarshow-5fcbd.firebasestorage.app',
  messagingSenderId: '959609509986',
  appId: '1:959609509986:web:888bd67d68686c36bad93b',
  measurementId: 'G-0ERP9FQXHW',
};

const app = initializeApp(firebaseConfig);

try {
  getAnalytics(app);
} catch {
  // Analytics can fail in non-browser test environments.
}

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const getStateDocRef = (uid) => doc(db, 'users', uid, 'app', 'state');

const sharedNotesCollection = collection(db, 'sharedNotes');

window.firebaseBridge = {
  onAuthChange: (callback) => onAuthStateChanged(auth, callback),
  signUpWithEmail: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  signInWithEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signInWithGoogle: () => signInWithPopup(auth, googleProvider),
  signOutUser: () => signOut(auth),
  loadCloudState: async (uid) => {
    const snapshot = await getDoc(getStateDocRef(uid));
    return snapshot.exists() ? snapshot.data() : null;
  },
  saveCloudState: async (uid, payload) => {
    await setDoc(
      getStateDocRef(uid),
      {
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  createSharedNote: async ({ ownerUid, note }) => {
    const payload = {
      ownerUid,
      note,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const sharedDoc = await addDoc(sharedNotesCollection, payload);
    return sharedDoc.id;
  },
  getSharedNote: async (shareId) => {
    const sharedDocRef = doc(db, 'sharedNotes', shareId);
    const sharedDoc = await getDoc(sharedDocRef);
    if (!sharedDoc.exists()) {
      return null;
    }

    return { id: sharedDoc.id, ...sharedDoc.data() };
  },
  removeSharedNote: async ({ shareId, ownerUid }) => {
    const sharedDocRef = doc(db, 'sharedNotes', shareId);
    const sharedDoc = await getDoc(sharedDocRef);
    if (!sharedDoc.exists()) {
      return;
    }

    const data = sharedDoc.data();
    if (data.ownerUid && data.ownerUid !== ownerUid) {
      throw new Error('You can only unshare notes you own.');
    }

    await deleteDoc(sharedDocRef);
  },
};
