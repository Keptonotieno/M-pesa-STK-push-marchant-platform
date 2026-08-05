import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  FirestoreError,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Business, Branch, Customer, Transaction, User, NotificationItem, AuditLog, PaymentMethodConfig } from '../types';

// Realtime listeners for Firestore Collections per Business Tenant
export function subscribeToPaymentMethods(businessId: string, callback: (methods: PaymentMethodConfig[]) => void) {
  try {
    const q = query(collection(db, 'paymentMethods'), where('businessId', '==', businessId));
    return onSnapshot(
      q,
      (snapshot) => {
        const methods: PaymentMethodConfig[] = [];
        snapshot.forEach((d) => {
          methods.push({ id: d.id, ...d.data() } as PaymentMethodConfig);
        });
        callback(methods);
      },
      (error: FirestoreError) => {
        console.warn('Firestore paymentMethods listener warning:', error.message);
      }
    );
  } catch (err) {
    console.warn('Fallback paymentMethods listener:', err);
    return () => {};
  }
}

export function subscribeToTransactions(businessId: string, callback: (txs: Transaction[]) => void) {
  try {
    const q = query(collection(db, 'transactions'), where('businessId', '==', businessId));
    return onSnapshot(
      q,
      (snapshot) => {
        const txs: Transaction[] = [];
        snapshot.forEach((d) => {
          txs.push({ id: d.id, ...d.data() } as Transaction);
        });
        // Sort descending by createdAt
        txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(txs);
      },
      (error: FirestoreError) => {
        console.warn('Firestore transactions listener warning:', error.message);
      }
    );
  } catch (err) {
    console.warn('Fallback transaction listener:', err);
    return () => {};
  }
}

export function subscribeToCustomers(businessId: string, callback: (customers: Customer[]) => void) {
  try {
    const q = query(collection(db, 'customers'), where('businessId', '==', businessId));
    return onSnapshot(
      q,
      (snapshot) => {
        const custs: Customer[] = [];
        snapshot.forEach((d) => {
          custs.push({ id: d.id, ...d.data() } as Customer);
        });
        callback(custs);
      },
      (error: FirestoreError) => {
        console.warn('Firestore customers listener warning:', error.message);
      }
    );
  } catch (err) {
    console.warn('Fallback customer listener:', err);
    return () => {};
  }
}

export function subscribeToBranches(businessId: string, callback: (branches: Branch[]) => void) {
  try {
    const q = query(collection(db, 'branches'), where('businessId', '==', businessId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Branch[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Branch);
        });
        callback(list);
      },
      (error: FirestoreError) => {
        console.warn('Firestore branches listener warning:', error.message);
      }
    );
  } catch (err) {
    console.warn('Fallback branch listener:', err);
    return () => {};
  }
}

// Save / Sync item to Firestore
export async function saveTransactionToFirestore(tx: Transaction) {
  try {
    await setDoc(doc(db, 'transactions', tx.id), tx, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `transactions/${tx.id}`);
  }
}

export async function saveCustomerToFirestore(customer: Customer) {
  try {
    await setDoc(doc(db, 'customers', customer.id), customer, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `customers/${customer.id}`);
  }
}

export async function deleteCustomerFromFirestore(customerId: string) {
  try {
    await deleteDoc(doc(db, 'customers', customerId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `customers/${customerId}`);
  }
}

export async function saveBranchToFirestore(branch: Branch) {
  try {
    await setDoc(doc(db, 'branches', branch.id), branch, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `branches/${branch.id}`);
  }
}

export async function saveBusinessToFirestore(business: Business) {
  try {
    await setDoc(doc(db, 'businesses', business.id), business, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `businesses/${business.id}`);
  }
}

export function subscribeToBusiness(businessId: string, callback: (business: Business) => void) {
  try {
    return onSnapshot(
      doc(db, 'businesses', businessId),
      (snapshot) => {
        if (snapshot.exists()) {
          callback({ id: snapshot.id, ...snapshot.data() } as Business);
        }
      },
      (error: FirestoreError) => {
        console.warn('Firestore business listener warning:', error.message);
      }
    );
  } catch (err) {
    console.warn('Fallback business listener:', err);
    return () => {};
  }
}

export async function getUserFromFirestore(userId: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as User;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching user from Firestore:', err);
    return null;
  }
}

export async function getBusinessFromFirestore(businessId: string): Promise<Business | null> {
  try {
    const snap = await getDoc(doc(db, 'businesses', businessId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Business;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching business from Firestore:', err);
    return null;
  }
}

export async function saveUserToFirestore(user: User) {
  try {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
  }
}

export function subscribeToUser(userId: string, callback: (user: User | null) => void) {
  try {
    return onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          callback({ id: snapshot.id, ...snapshot.data() } as User);
        } else {
          callback(null);
        }
      },
      (error: FirestoreError) => {
        console.warn('Firestore user listener warning:', error.message);
      }
    );
  } catch (err) {
    console.warn('Fallback user listener:', err);
    return () => {};
  }
}

export async function savePaymentMethodToFirestore(method: PaymentMethodConfig) {
  try {
    await setDoc(doc(db, 'paymentMethods', method.id), method, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `paymentMethods/${method.id}`);
  }
}

export async function deletePaymentMethodFromFirestore(methodId: string) {
  try {
    await deleteDoc(doc(db, 'paymentMethods', methodId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `paymentMethods/${methodId}`);
  }
}
