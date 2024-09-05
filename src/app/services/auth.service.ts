import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  user,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import { Observable, from, catchError, throwError, switchMap } from 'rxjs';
import { UserInterface } from '../interfaces/user.interface';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebaseAuth = inject(Auth);
  user$ = user(this.firebaseAuth);
  currentUserSig = signal<UserInterface | null | undefined>(undefined);
  constructor(private firestore: Firestore) {}

  register(
    email: string,
    username: string,
    password: string
  ): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    )
      .then((response) => {
        return updateProfile(response.user, { displayName: username }).then(
          () => {
            const userRef = doc(this.firestore, `users/${response.user.uid}`);
            return setDoc(userRef, {
              uid: response.user.uid,
              email: response.user.email,
              username: response.user.displayName || username,
              profilePicture: '',
            }).then(() => {
              this.currentUserSig.set({
                email: response.user.email || '',
                username: response.user.displayName || username,
              });
            });
          }
        );
      })
      .catch((error) => {
        console.error('Error en el registro:', error);
        return Promise.reject(error);
      });

    return from(promise).pipe(
      catchError((error) => {
        return throwError(
          () => new Error('Error en el registro: ' + error.message)
        );
      })
    );
  }

  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then((response) => {
      this.currentUserSig.set({
        email: response.user.email || '',
        username: response.user.displayName || '',
      });
    });

    return from(promise).pipe(
      catchError((error) => {
        return throwError(
          () => new Error('Error en el inicio de sesión: ' + error.message)
        );
      })
    );
  }

  loginWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
    const promise = signInWithPopup(this.firebaseAuth, provider)
      .then(async (response) => {
        const userRef = doc(this.firestore, `users/${response.user.uid}`);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: response.user.uid,
            email: response.user.email,
            username: response.user.displayName || '',
            profilePicture: response.user.photoURL || '',
          });
        }

        this.currentUserSig.set({
          email: response.user.email || '',
          username: response.user.displayName || '',
          profilePicture: response.user.photoURL || '',
        });
      })
      .catch((error) => {
        console.error('Error en el inicio de sesión con Google:', error);
        return Promise.reject(error);
      });

    return from(promise).pipe(
      catchError((error) => {
        return throwError(
          () =>
            new Error(
              'Error en el inicio de sesión con Google: ' + error.message
            )
        );
      })
    );
  }

  resetPassword(email: string): Observable<void> {
    const usersCollection = collection(this.firestore, 'users');
    const emailQuery = query(usersCollection, where('email', '==', email));

    return from(getDocs(emailQuery)).pipe(
      switchMap((querySnapshot) => {
        if (querySnapshot.empty) {
          return throwError(
            () =>
              new Error(
                'El correo ingresado no está registrado en nuestro sistema.'
              )
          );
        } else {
          return from(sendPasswordResetEmail(this.firebaseAuth, email));
        }
      }),
      catchError((error) => {
        return throwError(
          () =>
            new Error(
              'Error al enviar el correo de recuperación: ' + error.message
            )
        );
      })
    );
  }

  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth).then(() => {
      this.currentUserSig.set(null);
    });

    return from(promise);
  }
}
