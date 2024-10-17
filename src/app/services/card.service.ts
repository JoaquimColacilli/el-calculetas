// src/app/services/card.service.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  docData,
  setDoc,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, catchError, throwError, of, from } from 'rxjs';
import { Card } from '../interfaces/card.interface';
import { getDocs } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class CardService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  getUserCards(): Observable<Card[]> {
    return this.authService.getUserData().pipe(
      switchMap((userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const cardsCollection = collection(
          this.firestore,
          `users/${uid}/tarjetas`
        );

        return collectionData(cardsCollection, {
          idField: 'id',
        }) as Observable<Card[]>;
      }),
      catchError((error) => {
        console.error('Error al obtener las tarjetas:', error);
        return throwError(() => new Error('Error al obtener las tarjetas'));
      })
    );
  }

  addCard(card: Card): Promise<void> {
    return this.authService.getCurrentUserUid().then((uid) => {
      if (!uid) throw new Error('Usuario no autenticado');
      const cardsCollection = collection(
        this.firestore,
        `users/${uid}/tarjetas`
      );
      return addDoc(cardsCollection, card).then((docRef) => {
        card.id = docRef.id;
      });
    });
  }

  // Actualizar una tarjeta existente
  updateCard(card: Card): Promise<void> {
    return this.authService.getCurrentUserUid().then((uid) => {
      if (!uid) throw new Error('Usuario no autenticado');
      if (!card.id) throw new Error('La tarjeta no tiene un ID válido');
      const cardDoc = doc(this.firestore, `users/${uid}/tarjetas/${card.id}`);
      return updateDoc(cardDoc, {
        selectedDay: card.selectedDay,
        selectedMonth: card.selectedMonth,
        date: card.date ? card.date.toISOString() : null,
        name: card.name, // Asegurar que el nombre se actualice
      });
    });
  }

  deleteCard(cardId: string): Promise<void> {
    return this.authService.getCurrentUserUid().then((uid) => {
      if (!uid) throw new Error('Usuario no autenticado');
      const cardDoc = doc(this.firestore, `users/${uid}/tarjetas/${cardId}`);
      return deleteDoc(cardDoc);
    });
  }

  getCardById(cardId: string): Observable<Card | undefined> {
    return this.authService.getUserData().pipe(
      switchMap((userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }
        const cardDoc = doc(this.firestore, `users/${uid}/tarjetas/${cardId}`);
        return docData(cardDoc) as Observable<Card | undefined>;
      }),
      catchError((error) => {
        console.error('Error al obtener la tarjeta:', error);
        return throwError(() => new Error('Error al obtener la tarjeta'));
      })
    );
  }

  // Guardar o actualizar una tarjeta (por ejemplo, al inicializar)
  // Guardar o actualizar una tarjeta (por ejemplo, al inicializar)
  setCard(card: Card): Promise<void> {
    return this.authService.getCurrentUserUid().then((uid) => {
      if (!uid) throw new Error('Usuario no autenticado');
      const cardDoc = doc(this.firestore, `users/${uid}/tarjetas/${card.id}`);
      return setDoc(cardDoc, {
        ...card,
        date: card.date ? card.date.toISOString() : null,
        name: card.name, // Asegurar que el nombre se guarde
      });
    });
  }

  resetCardExpirationDates(): Observable<void> {
    return from(
      this.authService.getCurrentUserUid().then(async (uid) => {
        if (!uid) throw new Error('Usuario no autenticado');
        const cardsCollection = collection(
          this.firestore,
          `users/${uid}/tarjetas`
        );
        const querySnapshot = await getDocs(cardsCollection);

        for (const docSnapshot of querySnapshot.docs) {
          const cardDocRef = doc(
            this.firestore,
            `users/${uid}/tarjetas/${docSnapshot.id}`
          );
          await updateDoc(cardDocRef, {
            selectedDay: null,
            selectedMonth: null,
            date: null,
          });
        }
      })
    ).pipe(
      catchError((error) => {
        console.error(
          'Error al resetear las fechas de vencimiento de las tarjetas:',
          error
        );
        return throwError(
          () =>
            new Error(
              'Error al resetear las fechas de vencimiento de las tarjetas'
            )
        );
      })
    );
  }
}
