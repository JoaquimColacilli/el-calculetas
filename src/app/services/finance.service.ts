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
import {
  deleteDoc,
  DocumentReference,
  getDocs,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

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

        // Si el gasto tiene cuotas, agregarlo a la colección 'expensesNextMonth' con el mismo id
        if (expense.numCuotas && expense.currentCuota) {
          const nextMonthCollection = collection(
            this.firestore,
            `users/${uid}/expensesNextMonth`
          );
          await setDoc(
            doc(this.firestore, `users/${uid}/expensesNextMonth/${docRef.id}`),
            {
              ...expense,
              date: '', // Dejar el campo 'date' vacío
              currentCuota: expense.currentCuota + 1, // Incrementar la cuota
              timestamp: serverTimestamp(),
            }
          );
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

        // Actualizar el gasto en la colección 'gastos'
        await updateDoc(expenseDocRef, {
          ...updatedExpense,
          numCuotas: updatedExpense.numCuotas ?? null,
          currentCuota: updatedExpense.currentCuota ?? null,
        });

        // Si el gasto tiene cuotas, actualizar también en 'expensesNextMonth'
        if (updatedExpense.numCuotas && updatedExpense.currentCuota) {
          const nextMonthDocRef = doc(
            this.firestore,
            `users/${uid}/expensesNextMonth/${id}`
          );
          await updateDoc(nextMonthDocRef, {
            ...updatedExpense,
            date: '', // Mantener la fecha vacía para el próximo mes
            currentCuota: updatedExpense.currentCuota + 1, // Incrementar la cuota
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

  updateExpenseWithoutTimestamp(
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
          numCuotas: updatedExpense.numCuotas ?? null,
          currentCuota: updatedExpense.currentCuota ?? null,
        });

        return;
      }),
      catchError((error) => {
        console.error(
          'Error al actualizar el gasto sin timestamp en Firebase:',
          error
        );
        return throwError(
          () =>
            new Error('Error al actualizar el gasto sin timestamp en Firebase')
        );
      })
    );
  }

  eliminarGastoFijo(expense: FinanceInterface): Observable<void> {
    return this.authService.getUserData().pipe(
      switchMap(async (userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const gastosFijosCollection = collection(
          this.firestore,
          `users/${uid}/gastosFijos`
        );
        const q = query(
          gastosFijosCollection,
          where('name', '==', expense.name),
          where('value', '==', expense.value),
          where('provider', '==', expense.provider)
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (docSnapshot) => {
          const fixedExpenseDocRef = doc(
            this.firestore,
            `users/${uid}/gastosFijos/${docSnapshot.id}`
          );
          await deleteDoc(fixedExpenseDocRef);
        });

        return;
      }),
      catchError((error) => {
        console.error('Error al eliminar el gasto fijo en Firebase:', error);
        return throwError(
          () => new Error('Error al eliminar el gasto fijo en Firebase')
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

  getExpensesByCategory(): Observable<{
    [currency: string]: { [category: string]: number };
  }> {
    return this.getExpenses().pipe(
      switchMap((expenses) => {
        const expensesByCategory: {
          [currency: string]: { [category: string]: number };
        } = {};

        expenses.forEach((expense) => {
          const value = parseFloat(expense.value);
          const currency = expense.currency; // Asegúrate de que cada gasto tiene una propiedad 'currency'
          const categoryName =
            typeof expense.category === 'string'
              ? expense.category
              : expense.category.name;

          if (!expensesByCategory[currency]) {
            expensesByCategory[currency] = {};
          }

          if (expensesByCategory[currency][categoryName]) {
            expensesByCategory[currency][categoryName] += value;
          } else {
            expensesByCategory[currency][categoryName] = value;
          }
        });

        console.log(expensesByCategory); // Muestra los gastos organizados por moneda y categoría

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

  marcarGastoComoFijo(
    expense: FinanceInterface
  ): Observable<DocumentReference> {
    return this.authService.getUserData().pipe(
      switchMap(async (userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const gastosFijosCollection = collection(
          this.firestore,
          `users/${uid}/gastosFijos`
        );

        // Guardar el gasto fijo en la colección de gastos fijos
        const docRef = await addDoc(gastosFijosCollection, {
          ...expense,
          timestamp: serverTimestamp(),
        });

        return docRef;
      }),
      catchError((error) => {
        console.error('Error al agregar gasto fijo a Firebase:', error);
        return throwError(
          () => new Error('Error al agregar gasto fijo a Firebase')
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
