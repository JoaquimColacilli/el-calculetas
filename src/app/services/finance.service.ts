import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  orderBy,
  updateDoc,
  doc,
} from '@angular/fire/firestore';
import { Observable, of, throwError } from 'rxjs';
import { FinanceInterface } from '../interfaces/finance.interface';
import { AuthService } from '../services/auth.service';
import { switchMap, catchError } from 'rxjs/operators';
import { DocumentReference, serverTimestamp } from 'firebase/firestore';

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
        const expensesQuery = query(
          expensesCollection,
          orderBy('timestamp', 'desc')
        );

        return collectionData(expensesQuery, {
          idField: 'id',
        }) as Observable<FinanceInterface[]>;
      }),
      catchError((error) => {
        console.error('Error fetching expenses:', error);
        return throwError(() => new Error('Failed to fetch expenses'));
      })
    );
  }

  addExpenseToFirebase(
    expense: FinanceInterface
  ): Observable<DocumentReference> {
    return this.authService.getUserData().pipe(
      switchMap(async (userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const gastosCollection = collection(
          this.firestore,
          `users/${uid}/gastos`
        );

        // Guardar el gasto en la colección de gastos
        const docRef = await addDoc(gastosCollection, {
          ...expense,
          timestamp: serverTimestamp(),
        });

        // Si el gasto tiene nextMonth true, agregarlo a la colección 'gastosNextMonth'
        if (expense.nextMonth) {
          const nextMonthCollection = collection(
            this.firestore,
            `users/${uid}/gastosNextMonth`
          );
          await addDoc(nextMonthCollection, {
            ...expense,
            timestamp: serverTimestamp(),
          });
        }

        // Si el gasto tiene cuotas, guardar también la información de cuotas
        if (expense.numCuotas && expense.currentCuota) {
          const cuotasCollection = collection(
            this.firestore,
            `users/${uid}/cuotas`
          );
          await addDoc(cuotasCollection, {
            ...expense,
            timestamp: serverTimestamp(),
          });
        }

        return docRef;
      }),
      catchError((error) => {
        console.error('Error al agregar gasto a Firebase:', error);
        return throwError(() => new Error('Error al agregar gasto a Firebase'));
      })
    );
  }

  updateExpense(
    id: string,
    updatedExpense: Partial<FinanceInterface>
  ): Observable<void> {
    return this.authService.getUserData().pipe(
      switchMap(async (userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const expenseDocRef = doc(this.firestore, `users/${uid}/gastos/${id}`);

        await updateDoc(expenseDocRef, {
          ...updatedExpense,
          timestamp: serverTimestamp(),
        });

        // Si el gasto tiene cuotas, actualizar también la información de cuotas
        if (
          (updatedExpense.numCuotas ?? 0) > 0 &&
          updatedExpense.currentCuota
        ) {
          const cuotasDocRef = doc(this.firestore, `users/${uid}/cuotas/${id}`);
          await updateDoc(cuotasDocRef, {
            ...updatedExpense,
            timestamp: serverTimestamp(),
          });
        }
      }),
      catchError((error) => {
        console.error('Error al actualizar el gasto en Firebase:', error);
        return throwError(
          () => new Error('Error al actualizar el gasto en Firebase')
        );
      })
    );
  }

  getTotalExpenses(): Observable<{ totalARS: number; totalUSD: number }> {
    return this.getExpenses().pipe(
      switchMap((expenses) => {
        let totalARS = 0;
        let totalUSD = 0;

        expenses.forEach((expense) => {
          const value = parseFloat(expense.value);
          if (expense.currency === 'ARS') {
            totalARS += value;
          } else if (expense.currency === 'USD') {
            totalUSD += value;
          }
        });

        return of({ totalARS, totalUSD });
      }),
      catchError((error) => {
        console.error('Error al calcular los totales:', error);
        return throwError(() => new Error('Error al calcular los totales'));
      })
    );
  }

  getExpensesByCategory(): Observable<{ [category: string]: number }> {
    return this.getExpenses().pipe(
      switchMap((expenses) => {
        const expensesByCategory: { [category: string]: number } = {};

        expenses.forEach((expense) => {
          const value = parseFloat(expense.value);
          const categoryName =
            typeof expense.category === 'string'
              ? expense.category
              : expense.category.name;

          if (expensesByCategory[categoryName]) {
            expensesByCategory[categoryName] += value;
          } else {
            expensesByCategory[categoryName] = value;
          }
        });

        console.log(expensesByCategory);

        return of(expensesByCategory);
      }),
      catchError((error) => {
        console.error('Error al agrupar los gastos por categoría:', error);
        return throwError(
          () => new Error('Error al agrupar los gastos por categoría')
        );
      })
    );
  }

  // Obtener el UID del usuario actual de manera sincrónica
  private async getCurrentUserUid(): Promise<string | null> {
    const userData = await this.authService.getUserData().toPromise();
    return userData?.uid || null;
  }
}
