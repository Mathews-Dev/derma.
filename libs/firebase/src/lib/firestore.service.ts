import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  Firestore,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  onSnapshot
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore: Firestore = inject(Firestore);

  createId(): string {
    return doc(collection(this.firestore, '_')).id;
  }

  getCollection<T>(path: string): Observable<T[]> {
    const collectionRef = collection(this.firestore, path);
    return collectionData(collectionRef, { idField: 'id' }) as Observable<T[]>;
  }

  async getDocument<T>(path: string, docID: string): Promise<T | undefined> {
    const docRef = doc(this.firestore, path, docID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return undefined;
  }

  addDocument<T extends DocumentData>(path: string, data: T): Promise<DocumentReference> {
    const collectionRef = collection(this.firestore, path);
    return addDoc(collectionRef, data);
  }

  setDocument<T extends DocumentData>(path: string, docID: string, data: T): Promise<void> {
    const docRef = doc(this.firestore, path, docID);
    return setDoc(docRef, data);
  }

  updateDocument<T extends DocumentData>(path: string, docID: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.firestore, path, docID);
    // Explicit assertion for Firestore's updateDoc
    return updateDoc(docRef, data as { [x: string]: unknown });
  }

  deleteDocument(path: string, docID: string): Promise<void> {
    const docRef = doc(this.firestore, path, docID);
    return deleteDoc(docRef);
  }

  getCollectionByFilter<T>(path: string, fieldName: string, value: unknown): Observable<T[]> {
    const collectionRef = collection(this.firestore, path);
    const q = query(collectionRef, where(fieldName, "==", value));
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  async getDocumentsByFilter<T>(path: string, fieldName: string, value: unknown): Promise<T[]> {
    const collectionRef = collection(this.firestore, path);
    const q = query(collectionRef, where(fieldName, "==", value));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(snap => ({ id: snap.id, ...snap.data() } as T));
  }

  getCollectionSnapshotByFilter<T>(path: string, fieldName: string, value: unknown): Observable<T[]> {
    const collectionRef = collection(this.firestore, path);
    const q = query(collectionRef, where(fieldName, "==", value));

    return new Observable<T[]>(observer => {
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const data = snapshot.docs.map(snap => ({ id: snap.id, ...snap.data() } as T));
          observer.next(data);
        },
        (error) => observer.error(error)
      );
      return () => unsubscribe();
    });
  }
}
