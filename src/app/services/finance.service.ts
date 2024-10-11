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

        // Si el gasto tiene cuotas, agregarlo también a la colección 'expensesNextMonth'
        if (expense.numCuotas && expense.currentCuota) {
          const nextMonthCollection = collection(
            this.firestore,
            `users/${uid}/expensesNextMonth`
          );
          await addDoc(nextMonthCollection, {
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

        // Actualizar el gasto en la colección 'gastos'
        await updateDoc(expenseDocRef, {
          ...updatedExpense,
          numCuotas: updatedExpense.numCuotas ?? null, // Asegurar que el valor de numCuotas se actualice
          currentCuota: updatedExpense.currentCuota ?? null, // También actualizar el currentCuota
          timestamp: serverTimestamp(),
        });

        // Si el gasto tiene cuotas, buscar en 'expensesNextMonth' por nombre y actualizarlo
        if (
          (updatedExpense.numCuotas ?? 0) > 0 &&
          updatedExpense.currentCuota
        ) {
          const nextMonthCollection = collection(
            this.firestore,
            `users/${uid}/expensesNextMonth`
          );
          const q = query(
            nextMonthCollection,
            where('name', '==', updatedExpense.name)
          );

          const querySnapshot = await getDocs(q);
          querySnapshot.forEach(async (docSnapshot) => {
            const nextMonthDocRef = doc(
              this.firestore,
              `users/${uid}/expensesNextMonth/${docSnapshot.id}`
            );
            await updateDoc(nextMonthDocRef, {
              ...updatedExpense,
              numCuotas: updatedExpense.numCuotas, // Asegurarse de que el valor actualizado se guarde
              currentCuota: updatedExpense.currentCuota, // Asegurar que se actualice el currentCuota
              timestamp: serverTimestamp(),
            });
          });
        } else {
          const nextMonthCollection = collection(
            this.firestore,
            `users/${uid}/expensesNextMonth`
          );
          const q = query(
            nextMonthCollection,
            where('name', '==', updatedExpense.name)
          );

          const querySnapshot = await getDocs(q);
          querySnapshot.forEach(async (docSnapshot) => {
            const nextMonthDocRef = doc(
              this.firestore,
              `users/${uid}/expensesNextMonth/${docSnapshot.id}`
            );
            await deleteDoc(nextMonthDocRef);
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
