import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FinanceInterface } from '../interfaces/finance.interface';
import { AuthService } from '../services/auth.service';
import { switchMap, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  getExpenses(): Observable<FinanceInterface[]> {
    return this.authService.getUserData().pipe(
      switchMap((userData) => {
        const uid = userData?.uid;

        console.log('User UID:', uid);

        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const expensesCollection = collection(
          this.firestore,
          `users/${uid}/gastos`
        );

        return collectionData(expensesCollection, {
          idField: 'id',
        }) as Observable<FinanceInterface[]>;
      }),
      catchError((error) => {
        console.error('Error fetching expenses:', error);
        return throwError(() => new Error('Failed to fetch expenses'));
      })
    );
  }

  // // Agregar un nuevo gasto
  // addExpense(expense: FinanceInterface): Promise<void> {
  //   const id = this.firestore.createId(); // Genera un ID único
  //   return this.firestore
  //     .collection(this.collectionName)
  //     .doc(id)
  //     .set({ ...expense, id });
  // }

  // // Actualizar un gasto existente
  // updateExpense(id: string, expense: Partial<FinanceInterface>): Promise<void> {
  //   return this.firestore
  //     .collection(this.collectionName)
  //     .doc(id)
  //     .update(expense);
  // }

  // // Eliminar un gasto
  // deleteExpense(id: string): Promise<void> {
  //   return this.firestore.collection(this.collectionName).doc(id).delete();
  // }
}
