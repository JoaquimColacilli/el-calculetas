import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  setDoc,
  doc,
  docData,
  Timestamp,
  getDoc,
  arrayUnion,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
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

  resetSalariesAtStartOfMonth(): Observable<void> {
    return this.authService.getUserData().pipe(
      switchMap(async (userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        // Reference the 'currentSalaries' document
        const currentSalariesDocRef = doc(
          this.firestore,
          `users/${uid}/salaries/currentSalaries`
        );

        const snapshot = await getDoc(currentSalariesDocRef);
        if (!snapshot.exists()) {
          return;
        }

        // Check for the reset
        const lastResetDate = snapshot.data()?.['lastResetDate'];
        const currentDate = new Date();
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );

        if (lastResetDate && lastResetDate.toDate() >= firstDayOfMonth) {
          console.log('Ya se realizó el reset este mes.');
          return;
        }

        // Get current salaries
        const currentSalaries = snapshot.data()?.['salaries'] || [];

        const totalARS = currentSalaries
          .filter((s: any) => s.currency === 'ARS')
          .reduce((acc: number, salary: any) => acc + salary.amount, 0);

        const totalUSD = currentSalaries
          .filter((s: any) => s.currency === 'USD')
          .reduce((acc: number, salary: any) => acc + salary.amount, 0);

        // Save history
        const historyCollectionRef = collection(
          currentSalariesDocRef,
          'history'
        );

        await addDoc(historyCollectionRef, {
          totalARS,
          totalUSD,
          details: currentSalaries,
          timestamp: Timestamp.fromDate(new Date()),
        });

        // Reset current salaries and update lastResetDate
        await setDoc(
          currentSalariesDocRef,
          {
            salaries: [],
            lastResetDate: Timestamp.fromDate(new Date()),
          },
          { merge: true }
        );
      }),
      catchError((error) => {
        console.error('Error al restablecer los sueldos:', error);
        return throwError(() => new Error('Error al restablecer los sueldos'));
      })
    );
  }
}
