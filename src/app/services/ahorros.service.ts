import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
} from '@angular/fire/firestore';
import { Observable, throwError } from 'rxjs';
import { AhorroInterface } from '../interfaces/ahorro.interface';
import { AuthService } from '../services/auth.service';
import { switchMap, catchError, map } from 'rxjs/operators';
import { deleteDoc, DocumentReference } from 'firebase/firestore';
import moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class AhorrosService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  getAhorros(): Observable<AhorroInterface[]> {
    return this.authService.getUserData().pipe(
      switchMap((userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }
        const ahorrosCollection = collection(
          this.firestore,
          `users/${uid}/ahorros`
        );
        const ahorrosQuery = query(
          ahorrosCollection,
          orderBy('timestamp', 'desc')
        );
        return collectionData(ahorrosQuery, { idField: 'id' }) as Observable<
          AhorroInterface[]
        >;
      }),
      catchError((error) => {
        console.error('Error al obtener ahorros:', error);
        return throwError(() => new Error('No se pudo obtener los ahorros'));
      })
    );
  }

  // Método para agregar un nuevo ahorro
  addAhorro(ahorro: AhorroInterface): Observable<DocumentReference> {
    return this.authService.getUserData().pipe(
      switchMap(async (userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const ahorrosCollection = collection(
          this.firestore,
          `users/${uid}/ahorros`
        );

        const docRef = await addDoc(ahorrosCollection, {
          ...ahorro,
          timestamp: serverTimestamp(),
        });

        return docRef;
      }),
      catchError((error) => {
        console.error('Error al agregar ahorro:', error);
        return throwError(() => new Error('No se pudo agregar el ahorro'));
      })
    );
  }

  updateAhorro(
    id: string,
    updatedAhorro: Partial<AhorroInterface>
  ): Observable<void> {
    return this.authService.getUserData().pipe(
      switchMap(async (userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const ahorroDocRef = doc(this.firestore, `users/${uid}/ahorros/${id}`);

        await updateDoc(ahorroDocRef, updatedAhorro);
        return;
      }),
      catchError((error) => {
        console.error('Error al actualizar el ahorro:', error);
        return throwError(() => new Error('No se pudo actualizar el ahorro'));
      })
    );
  }

  deleteAhorro(id: string): Observable<void> {
    return this.authService.getUserData().pipe(
      switchMap(async (userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const ahorroDocRef = doc(this.firestore, `users/${uid}/ahorros/${id}`);

        await deleteDoc(ahorroDocRef);
        return;
      }),
      catchError((error) => {
        console.error('Error al eliminar el ahorro:', error);
        return throwError(() => new Error('No se pudo eliminar el ahorro'));
      })
    );
  }

  getAhorrosPorMes(month: string): Observable<AhorroInterface[]> {
    return this.getAhorros().pipe(
      map((ahorros: AhorroInterface[]) => {
        const filteredAhorros = ahorros.filter((ahorro: any) => {
          const ahorroDate = new Date(ahorro.timestamp.seconds * 1000);
          const ahorroMonth = moment(ahorroDate).format('MMMM, YYYY');
          return ahorroMonth === month;
        });
        return filteredAhorros;
      }),
      catchError((error) => {
        console.error('Error al obtener los ahorros por mes:', error);
        return throwError(
          () => new Error('Error al filtrar los ahorros por mes')
        );
      })
    );
  }
}
