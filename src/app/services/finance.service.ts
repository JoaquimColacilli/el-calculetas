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
    // Fetch the authenticated user's data
    return this.authService.getUserData().pipe(
      switchMap((userData) => {
        // Extract the UID from the fetched user data
        const uid = userData?.uid;

        // Log UID for debugging
        console.log('User UID:', uid);

        // Check if the UID is available
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        // Define the Firestore collection path based on the user's UID
        const expensesCollection = collection(
          this.firestore,
          `users/${uid}/gastos`
        );

        // Return the collection data as an observable of FinanceInterface array
        return collectionData(expensesCollection, {
          idField: 'id',
        }) as Observable<FinanceInterface[]>;
      }),
      catchError((error) => {
        // Handle errors appropriately
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
