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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js';

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
const storage = getStorage(app);

const getStateDocRef = (uid) => doc(db, 'users', uid, 'app', 'state');
const sharedCollection = collection(db, 'sharedContent');

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

  createShareItem: async ({ ownerUid, type, content }) => {
    const payload = {
      ownerUid,
      type,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const sharedDoc = await addDoc(sharedCollection, payload);
    return sharedDoc.id;
  },
  updateShareItem: async ({ shareId, ownerUid, content }) => {
    const sharedDocRef = doc(db, 'sharedContent', shareId);
    const sharedDoc = await getDoc(sharedDocRef);
    if (!sharedDoc.exists()) {
      throw new Error('Shared content not found.');
    }

    const data = sharedDoc.data();
    if (data.ownerUid && data.ownerUid !== ownerUid) {
      throw new Error('You can only update content you own.');
    }

    await setDoc(
      sharedDocRef,
      {
        content,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },
  getShareItem: async (shareId) => {
    const sharedDocRef = doc(db, 'sharedContent', shareId);
    const sharedDoc = await getDoc(sharedDocRef);
    if (!sharedDoc.exists()) {
      return null;
    }

    return { id: sharedDoc.id, ...sharedDoc.data() };
  },

  uploadNoteAttachment: async ({ uid, file }) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const objectPath = `users/${uid}/noteAttachments/${Date.now()}-${safeName}`;
    const objectRef = ref(storage, objectPath);
    await uploadBytes(objectRef, file);
    const url = await getDownloadURL(objectRef);
    return { name: file.name, url, path: objectPath };
  },

  removeShareItem: async ({ shareId, ownerUid }) => {
    const sharedDocRef = doc(db, 'sharedContent', shareId);
    const sharedDoc = await getDoc(sharedDocRef);
    if (!sharedDoc.exists()) {
      return;
    }

    const data = sharedDoc.data();
    if (data.ownerUid && data.ownerUid !== ownerUid) {
      throw new Error('You can only unshare content you own.');
    }

    await deleteDoc(sharedDocRef);
  },
};
