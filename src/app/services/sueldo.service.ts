import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  setDoc,
  doc,
  docData,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { switchMap, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SueldoService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  getSalaries(): Observable<any> {
    return this.authService.getUserData().pipe(
      switchMap((userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const salariesDocRef = doc(
          this.firestore,
          `users/${uid}/salaries/currentSalaries`
        );

        return docData(salariesDocRef);
      }),
      catchError((error) => {
        console.error('Error al cargar los sueldos:', error);
        return throwError(() => new Error('Error al cargar los sueldos'));
      })
    );
  }

  addSalaries(salaries: any[]): Observable<void> {
    return this.authService.getUserData().pipe(
      switchMap(async (userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const salariesDocRef = doc(
          this.firestore,
          `users/${uid}/salaries/currentSalaries`
        );

        // Sobrescribe el documento con los nuevos sueldos
        await setDoc(salariesDocRef, { salaries }, { merge: true });
      }),
      catchError((error) => {
        console.error('Error al agregar los sueldos:', error);
        return throwError(() => new Error('Error al agregar los sueldos'));
      })
    );
  }
}
