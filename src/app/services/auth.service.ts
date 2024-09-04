import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  user,
  signOut,
} from '@angular/fire/auth';
import { Observable, from, catchError, throwError, tap } from 'rxjs';
import { UserInterface } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebaseAuth = inject(Auth);
  user$ = user(this.firebaseAuth);
  currentUserSig = signal<UserInterface | null | undefined>(undefined);

  /**
   * Registra un nuevo usuario con correo, nombre de usuario y contraseña.
   * @param email Correo electrónico del usuario
   * @param username Nombre de usuario a mostrar
   * @param password Contraseña del usuario
   * @returns Observable que emite void si el registro es exitoso o un error si falla
   */
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
            this.currentUserSig.set({
              email: response.user.email || '',
              username: response.user.displayName || username,
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

  /**
   * Inicia sesión con correo y contraseña.
   * @param email Correo electrónico del usuario
   * @param password Contraseña del usuario
   * @returns Observable que emite void si el inicio de sesión es exitoso
   */
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

  /**
   * Cierra la sesión del usuario.
   * @returns Observable que emite void si el cierre de sesión es exitoso
   */
  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth).then(() => {
      this.currentUserSig.set(null);
    });

    return from(promise);
  }
}
