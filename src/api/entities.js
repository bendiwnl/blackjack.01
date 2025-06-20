import { db, auth } from './firebaseClient';
import { collection, getDocs, query, orderBy, limit, addDoc, updateDoc, doc, where, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

export const Game = collection(db, 'games');
export const Player = collection(db, 'players');
export const Transaction = collection(db, 'transactions');
export const AdminLog = collection(db, 'adminLogs');

// Firebase Auth
export const User = auth;

// --- Utility Functions ---

// User utilities
User.me = async () => {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user profile from Firestore
        const userDoc = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDoc);
        const userData = userSnap.exists() ? userSnap.data() : {};
        resolve({ uid: user.uid, email: user.email, ...userData });
      } else {
        resolve(null);
      }
    }, reject);
  });
};

User.list = async (order = '-created_date', max = 100) => {
  let q = query(collection(db, 'users'), orderBy('created_date', order.startsWith('-') ? 'desc' : 'asc'), limit(max));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

User.update = async (userId, data) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, data);
};

User.login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

User.logout = async () => {
  await signOut(auth);
};

User.updateMyUserData = async (data) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, data);
};

// Transaction utilities
Transaction.list = async (order = '-created_date', max = 50) => {
  let q = query(collection(db, 'transactions'), orderBy('created_date', order.startsWith('-') ? 'desc' : 'asc'), limit(max));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

Transaction.create = async (data) => {
  data.created_date = Date.now();
  const docRef = await addDoc(collection(db, 'transactions'), data);
  return { id: docRef.id, ...data };
};

// Game utilities
Game.list = async (order = '-created_date', max = 10) => {
  let q = query(collection(db, 'games'), orderBy('created_date', order.startsWith('-') ? 'desc' : 'asc'), limit(max));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

Game.create = async (data) => {
  data.created_date = Date.now();
  const docRef = await addDoc(collection(db, 'games'), data);
  return { id: docRef.id, ...data };
};

Game.update = async (gameId, data) => {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, data);
  return { id: gameId, ...data };
};

// Player utilities
Player.list = async (order = '-created_date', max = 50) => {
  let q = query(collection(db, 'players'), orderBy('created_date', order.startsWith('-') ? 'desc' : 'asc'), limit(max));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

Player.create = async (data) => {
  data.created_date = Date.now();
  const docRef = await addDoc(collection(db, 'players'), data);
  return { id: docRef.id, ...data };
};

Player.update = async (playerId, data) => {
  const playerRef = doc(db, 'players', playerId);
  await updateDoc(playerRef, data);
  return { id: playerId, ...data };
};

Player.filter = async (filters) => {
  let q = collection(db, 'players');
  let qRef = query(q);
  Object.entries(filters).forEach(([key, value]) => {
    qRef = query(qRef, where(key, '==', value));
  });
  const snapshot = await getDocs(qRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// AdminLog utilities
AdminLog.list = async (order = '-created_date', max = 100) => {
  let q = query(collection(db, 'adminLogs'), orderBy('created_date', order.startsWith('-') ? 'desc' : 'asc'), limit(max));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

AdminLog.create = async (data) => {
  data.created_date = Date.now();
  const docRef = await addDoc(collection(db, 'adminLogs'), data);
  return { id: docRef.id, ...data };
};