import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  query,
  where,
  collection,
  getDocs,
  setDoc,
} from '@angular/fire/firestore';
import { Observable, from, throwError, catchError, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserInterface } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  // Obtener el perfil del usuario por UID
  getUserProfile(uid: string): Observable<UserInterface | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(getDoc(userRef)).pipe(
      map((docSnapshot) => {
        if (docSnapshot.exists()) {
          return docSnapshot.data() as UserInterface;
        } else {
          return null;
        }
      })
    );
  }

  // Obtener el usuario por correo electrónico
  getUserByEmail(email: string): Observable<UserInterface[]> {
    const usersCollection = collection(this.firestore, 'users');
    const emailQuery = query(usersCollection, where('email', '==', email));

    return from(getDocs(emailQuery)).pipe(
      map((querySnapshot) => {
        return querySnapshot.docs.map((doc) => doc.data() as UserInterface);
      })
    );
  }

  addReaction(reaction: any, messageId: string): Observable<void> {
    const currentUser = this.authService.currentUserSig();

    if (!currentUser || !currentUser.uid) {
      console.error('Usuario no autenticado o UID no disponible');
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const userId = currentUser.uid;
    const userRef = doc(
      this.firestore,
      `messages/${messageId}/reactions/${userId}`
    );

    // Guardar la reacción en Firestore
    return from(
      setDoc(userRef, {
        emoji: reaction.emoji,
        userId: userId,
        username: currentUser.username || 'Usuario Desconocido', // Por si acaso no hay un username
      })
    ).pipe(
      catchError((error) => {
        console.error('Error guardando la reacción:', error);
        return throwError(() => new Error('Error al guardar la reacción'));
      })
    );
  }
}
