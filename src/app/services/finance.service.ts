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

  // FinanceService.ts

  // FinanceService.ts

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

        // Asegúrate de que el campo timestamp se resuelva correctamente
        await updateDoc(docRef, { timestamp: serverTimestamp() });

        // Si el gasto tiene cuotas y currentCuota es menor que numCuotas, agregarlo a 'expensesNextMonth'
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
          const nextMonthDocRef = doc(expensesNextMonthCollection, docRef.id);
          await setDoc(nextMonthDocRef, {
            ...nextMonthExpense,
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

        // Importar gastos fijos desde 'gastosFijos'
        await this.importFixedExpenses(uid);

        // Importar gastos con cuotas desde 'expensesNextMonth' si las fechas de vencimiento están configuradas
        await this.importExpensesNextMonth(uid);

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

      // Agregar el gasto a la colección 'gastos'
      await this.addExpenseToFirebase(expenseData).toPromise();
    }
  }

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

    // Obtener las tarjetas del usuario
    const cardsCollection = collection(this.firestore, `users/${uid}/tarjetas`);
    const cardsSnapshot = await getDocs(cardsCollection);

    // Construir un mapa de cardId a datos de la tarjeta
    const cardsMap = new Map<string, any>();
    cardsSnapshot.forEach((docSnapshot) => {
      const cardData = docSnapshot.data();
      cardsMap.set(docSnapshot.id, cardData);
    });

    for (const docSnapshot of querySnapshot.docs) {
      const expenseData = docSnapshot.data() as FinanceInterface;

      const cardId = expenseData.cardId;
      if (!cardId) {
        console.warn(
          `El gasto con ID ${docSnapshot.id} no tiene 'cardId' asociado.`
        );
        continue;
      }

      const cardData = cardsMap.get(cardId);
      if (!cardData) {
        console.warn(`La tarjeta con ID ${cardId} no existe.`);
        continue;
      }

      // Verificar si la fecha de vencimiento de la tarjeta está configurada
      if (!cardData.selectedDay || !cardData.selectedMonth) {
        console.log(
          `La tarjeta con ID ${cardId} no tiene fecha de vencimiento configurada. No se importará el gasto con ID ${docSnapshot.id}.`
        );
        continue;
      }

      // Establecer la fecha del gasto a la fecha de vencimiento de la tarjeta para este mes
      const currentYear = new Date().getFullYear();
      const expenseDate = new Date(
        currentYear,
        cardData.selectedMonth - 1,
        cardData.selectedDay
      );

      const formattedDate = moment(expenseDate).format('DD/MM/YYYY');

      expenseData.date = formattedDate;

      // Agregar el gasto a la colección 'gastos'
      await this.addExpenseToFirebase(expenseData).toPromise();

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
    }
  }

  // Obtener el UID del usuario actual de manera sincrónica
  private async getCurrentUserUid(): Promise<string | null> {
    const userData = await this.authService.getUserData().toPromise();
    return userData?.uid || null;
  }
}
