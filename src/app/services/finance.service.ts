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
import { from, Observable, of, throwError } from 'rxjs';
import { FinanceInterface } from '../interfaces/finance.interface';
import { AuthService } from '../services/auth.service';
import { switchMap, catchError, take } from 'rxjs/operators';
import {
  deleteDoc,
  DocumentReference,
  getDocs,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import moment from 'moment';
import { startOfMonth, isSameMonth } from 'date-fns';

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

  // FinanceService.ts

  // FinanceService.ts

  // En FinanceService

  addExpenseToFirebase(
    expense: FinanceInterface
  ): Observable<DocumentReference> {
    return this.authService.getUserData().pipe(
      take(1),
      switchMap((userData) => {
        const uid = userData?.uid;
        if (!uid) {
          return throwError(() => new Error('Usuario no autenticado'));
        }

        const gastosCollection = collection(
          this.firestore,
          `users/${uid}/gastos`
        );

        // Convertir la promesa en un Observable usando 'from'
        return from(
          addDoc(gastosCollection, {
            ...expense,
            timestamp: serverTimestamp(),
          }).then(async (docRef) => {
            // Asegurarse de que el campo timestamp se resuelva correctamente
            await updateDoc(docRef, { timestamp: serverTimestamp() });

            // Manejar cuotas
            if (
              expense.numCuotas &&
              expense.currentCuota &&
              expense.currentCuota < expense.numCuotas
            ) {
              const expensesNextMonthCollection = collection(
                this.firestore,
                `users/${uid}/expensesNextMonth`
              );

              // Preparar el gasto para el próximo mes
              const nextMonthExpense = {
                ...expense,
                date: '', // Mantener la fecha vacía para ser asignada cuando se importe
                currentCuota: expense.currentCuota + 1, // Incrementar la cuota actual
              };

              // Usar el mismo ID del documento para mantener consistencia
              const nextMonthDocRef = doc(
                expensesNextMonthCollection,
                docRef.id
              );
              await setDoc(nextMonthDocRef, {
                ...nextMonthExpense,
                timestamp: serverTimestamp(),
              });
            }

            return docRef;
          })
        );
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

  // FinanceService.ts

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

        // Establecer 'date' como vacío
        const fixedExpense = { ...expense, date: '' };

        // Guardar el gasto fijo en la colección de gastos fijos
        const docRef = await addDoc(gastosFijosCollection, {
          ...fixedExpense,
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
  // FinanceService.ts

  importExpensesForNewMonth(): Observable<void> {
    return this.authService.getUserData().pipe(
      switchMap(async (userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        // Obtener la fecha de la última importación
        const lastImportDate = await this.authService
          .getUserLastImportDate(uid)
          .toPromise();

        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);

        // Verificar si ya se realizó la importación este mes
        if (lastImportDate && isSameMonth(lastImportDate, now)) {
          console.log('La importación de gastos para este mes ya se realizó.');
          return;
        }

        // Realizar la importación de gastos
        await this.importFixedExpenses(uid);
        await this.importExpensesNextMonth(uid);

        // Actualizar la fecha de la última importación
        await this.authService.updateUserLastImportDate(
          uid,
          startOfCurrentMonth
        );

        return;
      }),
      catchError((error) => {
        console.error('Error al importar gastos para el nuevo mes:', error);
        return throwError(
          () => new Error('Error al importar gastos para el nuevo mes')
        );
      })
    );
  }

  // En FinanceService

  private async importFixedExpenses(uid: string): Promise<void> {
    const gastosFijosCollection = collection(
      this.firestore,
      `users/${uid}/gastosFijos`
    );
    const querySnapshot = await getDocs(gastosFijosCollection);

    for (const docSnapshot of querySnapshot.docs) {
      const expenseData = docSnapshot.data() as FinanceInterface;

      // Establecer la fecha al primer día del mes actual
      const today = new Date();
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      const formattedDate = moment(firstDayOfMonth).format('DD/MM/YYYY');

      expenseData.date = formattedDate;

      // Verificar si el gasto ya existe en 'gastos' usando el ID del gasto fijo
      const gastosCollection = collection(
        this.firestore,
        `users/${uid}/gastos`
      );
      const q = query(
        gastosCollection,
        where('fixedExpenseId', '==', docSnapshot.id),
        where('date', '==', expenseData.date)
      );
      const existingExpense = await getDocs(q);

      if (existingExpense.empty) {
        // Agregar el campo 'fixedExpenseId' al gasto antes de guardarlo
        const expenseWithFixedId = {
          ...expenseData,
          fixedExpenseId: docSnapshot.id,
        };

        // Agregar el gasto a la colección 'gastos'
        await this.addExpenseToFirebase(expenseWithFixedId).toPromise();
      } else {
        console.log(
          `El gasto fijo "${expenseData.name}" ya existe para este mes.`
        );
      }
    }
  }

  // En FinanceService

  private async importExpensesNextMonth(uid: string): Promise<void> {
    const expensesNextMonthCollection = collection(
      this.firestore,
      `users/${uid}/expensesNextMonth`
    );
    const querySnapshot = await getDocs(expensesNextMonthCollection);

    if (querySnapshot.empty) {
      console.log('No hay gastos en expensesNextMonth para importar.');
      return;
    }

    for (const docSnapshot of querySnapshot.docs) {
      const expenseData = docSnapshot.data() as FinanceInterface;

      // Establecer la fecha del gasto al primer día del mes actual
      const today = new Date();
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      const formattedDate = moment(firstDayOfMonth).format('DD/MM/YYYY');

      expenseData.date = formattedDate;

      // Verificar si el gasto ya existe en 'gastos' usando el ID del documento
      const gastosCollection = collection(
        this.firestore,
        `users/${uid}/gastos`
      );
      const q = query(
        gastosCollection,
        where('nextMonthExpenseId', '==', docSnapshot.id),
        where('date', '==', expenseData.date)
      );
      const existingExpense = await getDocs(q);

      if (existingExpense.empty) {
        // Agregar el campo 'nextMonthExpenseId' al gasto antes de guardarlo
        const expenseWithNextMonthId = {
          ...expenseData,
          nextMonthExpenseId: docSnapshot.id,
        };

        // Agregar el gasto a la colección 'gastos'
        await this.addExpenseToFirebase(expenseWithNextMonthId).toPromise();

        // Manejar cuotas
        if (expenseData.numCuotas && expenseData.currentCuota) {
          if (expenseData.currentCuota < expenseData.numCuotas) {
            // Incrementar currentCuota
            expenseData.currentCuota += 1;

            // Mantener date vacío para el próximo mes
            expenseData.date = '';

            // Actualizar el documento en 'expensesNextMonth'
            const expenseDocRef = doc(
              this.firestore,
              `users/${uid}/expensesNextMonth/${docSnapshot.id}`
            );
            await updateDoc(expenseDocRef, {
              ...expenseData,
              timestamp: serverTimestamp(),
            });
          } else {
            // Si todas las cuotas se pagaron, eliminar de 'expensesNextMonth'
            const expenseDocRef = doc(
              this.firestore,
              `users/${uid}/expensesNextMonth/${docSnapshot.id}`
            );
            await deleteDoc(expenseDocRef);
          }
        } else {
          // Si no es una cuota, eliminar de 'expensesNextMonth' después de agregar
          const expenseDocRef = doc(
            this.firestore,
            `users/${uid}/expensesNextMonth/${docSnapshot.id}`
          );
          await deleteDoc(expenseDocRef);
        }
      } else {
        console.log(
          `El gasto con cuota "${expenseData.name}" ya existe para este mes.`
        );
      }
    }
  }

  // Obtener el UID del usuario actual de manera sincrónica
  private async getCurrentUserUid(): Promise<string | null> {
    const userData = await this.authService.getUserData().toPromise();
    return userData?.uid || null;
  }
}
