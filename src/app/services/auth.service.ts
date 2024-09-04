import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  updateProfile,
} from '@angular/fire/auth';
import { Observable, from, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Inyección de Auth de Firebase
  private firebaseAuth = inject(Auth);

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
      .then((response) =>
        updateProfile(response.user, { displayName: username })
      )
      .catch((error) => {
        console.error('Error en el registro:', error);
        return Promise.reject(error); // Rechazar la promesa para que `from` maneje el error
      });

    return from(promise).pipe(
      catchError((error) => {
        return throwError(
          () => new Error('Error en el registro: ' + error.message)
        );
      })
    );
  }
}
