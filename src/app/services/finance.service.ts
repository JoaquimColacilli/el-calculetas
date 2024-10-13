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
import moment from 'moment';

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

        // Guardar el gasto en la colección de gastos con un placeholder para el timestamp
        const docRef = await addDoc(gastosCollection, {
          ...expense,
          timestamp: serverTimestamp(), // Se añade pero puede retornar null hasta que Firebase lo procese
        });

        // Asegúrate de que el campo timestamp se resuelva correctamente
        await updateDoc(docRef, { timestamp: serverTimestamp() });

        // Si el gasto tiene cuotas, agregarlo también a la colección 'expensesNextMonth'
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

  getTotalExpenses(
    period: string
  ): Observable<{ totalARS: number; totalUSD: number }> {
    return this.getExpenses().pipe(
      switchMap((expenses) => {
        let totalARS = 0;
        let totalUSD = 0;

        const filteredExpenses = this.filterExpensesByPeriod(expenses, period); // Filtramos los gastos por el período

        filteredExpenses.forEach((expense) => {
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

  getExpensesByCategory(
    period: string
  ): Observable<{ [currency: string]: { [category: string]: number } }> {
    return this.getExpenses().pipe(
      switchMap((expenses) => {
        const expensesByCategory: {
          [currency: string]: { [category: string]: number };
        } = {};

        const filteredExpenses = this.filterExpensesByPeriod(expenses, period); // Filtramos los gastos por el período

        filteredExpenses.forEach((expense) => {
          const value = parseFloat(expense.value);
          const currency = expense.currency;
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

  filterExpensesByPeriod(
    expenses: FinanceInterface[],
    period: string
  ): FinanceInterface[] {
    const currentMonth = moment(period, 'MMMM, YYYY'); // Convertimos 'period' a un objeto Moment
    return this.getExpensesForThisMonth(expenses, currentMonth); // Filtramos los gastos por mes
  }

  getExpensesForThisMonth(
    expenses: FinanceInterface[],
    currentMonth: moment.Moment
  ): FinanceInterface[] {
    return expenses.filter((item) => {
      const itemDate = this.parseDateForComparison(item.date); // Parseamos la fecha
      return (
        itemDate.getFullYear() === currentMonth.year() && // Comparamos el año
        itemDate.getMonth() === currentMonth.month() // Comparamos el mes
      );
    });
  }

  getExpensesForThisWeek(expenses: FinanceInterface[]): FinanceInterface[] {
    const now = new Date();
    const startOfWeek = this.getStartOfWeek(now);
    const endOfWeek = this.getEndOfWeek(now);

    return expenses.filter((item) => {
      const itemDate = this.parseDateForComparison(item.date);
      return itemDate >= startOfWeek && itemDate <= endOfWeek;
    });
  }

  getExpensesForThisYear(expenses: FinanceInterface[]): FinanceInterface[] {
    const now = new Date();
    const currentYear = now.getFullYear();

    return expenses.filter((item) => {
      const itemDate = this.parseDateForComparison(item.date);
      return itemDate.getFullYear() === currentYear;
    });
  }

  parseDateForComparison(dateString: string): Date {
    const formats = ['DD/MM/YYYY', 'DD-MM-YYYY']; // Manejar ambos formatos de fecha
    const parsedDate = moment(dateString, formats, true); // Intentamos parsear la fecha con ambos formatos
    return parsedDate.isValid() ? parsedDate.toDate() : new Date(); // Si es válida, devolvemos la fecha; de lo contrario, retornamos la fecha actual para evitar errores
  }

  getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para que el lunes sea el inicio
    const startOfWeek = new Date(date.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0); // Normaliza a medianoche
    return startOfWeek;
  }

  getEndOfWeek(date: Date): Date {
    const startOfWeek = this.getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Fin de semana (domingo)
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
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
