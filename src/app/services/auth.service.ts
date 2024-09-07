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

import { User } from '@angular/fire/auth';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'El formato del correo electrónico es inválido.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
  'auth/user-not-found': 'No se encontró una cuenta con este correo.',
  'auth/wrong-password':
    'La contraseña es incorrecta. Por favor, intenta nuevamente.',
  'auth/email-already-in-use':
    'El correo electrónico ya está en uso por otra cuenta.',
  'auth/operation-not-allowed':
    'Esta operación no está permitida. Contacta al soporte.',
  'auth/weak-password':
    'La contraseña es demasiado débil. Por favor, elige una más segura.',
  'auth/invalid-credential': 'La credencial proporcionada es inválida.',
  'auth/account-exists-with-different-credential':
    'Ya existe una cuenta con el mismo correo electrónico pero con credenciales diferentes.',
  'auth/network-request-failed':
    'Hubo un problema con la conexión de red. Por favor, intenta nuevamente.',
  'auth/too-many-requests':
    'Demasiados intentos. Por favor, espera un momento y vuelve a intentar.',
  'auth/requires-recent-login':
    'Por seguridad, por favor vuelve a iniciar sesión y repite la operación.',
};

function getErrorMessage(error: any): string {
  const errorString = error.message || error.toString();
  const errorCodeMatch = errorString.match(/auth\/[a-z\-]+/i);
  const errorCode = errorCodeMatch ? errorCodeMatch[0] : '';

  return (
    AUTH_ERROR_MESSAGES[errorCode] ||
    'Ha ocurrido un error. Por favor, intenta nuevamente.'
  );
}

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
        const customMessage = getErrorMessage(error);
        console.log(customMessage);

        return Promise.reject(new Error(customMessage));
      });

    return from(promise).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
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
        const customMessage = getErrorMessage(error);
        console.log(customMessage);

        return throwError(() => new Error(customMessage));
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
        const customMessage = getErrorMessage(error);
        console.log(customMessage);
        return Promise.reject(new Error(customMessage));
      });

    return from(promise).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
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
        const customMessage = getErrorMessage(error);
        console.log(customMessage);
        return throwError(() => new Error(customMessage));
      })
    );
  }

  getUserData(): Observable<any> {
    return this.user$.pipe(
      switchMap((authUser: User | null) => {
        if (!authUser || !authUser.uid) {
          throw new Error('Usuario no autenticado');
        }
        const userRef = doc(this.firestore, `users/${authUser.uid}`);
        return from(getDoc(userRef)).pipe(
          switchMap((docSnapshot) => {
            if (!docSnapshot.exists()) {
              throw new Error('Usuario no encontrado en la base de datos');
            }
            return [docSnapshot.data()];
          })
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
