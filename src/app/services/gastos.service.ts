// import { Injectable, inject } from '@angular/core';
// import {
//   Firestore,
//   collection,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   getDocs,
//   query,
// } from '@angular/fire/firestore';
// import { Observable, from } from 'rxjs';
// import { FinanceInterface } from '../interfaces/finance.interface';
// import { AuthService } from './auth.service';
// import { map } from 'rxjs/operators';

// @Injectable({
//   providedIn: 'root',
// })
// export class ExpensesService {
//   private firestore = inject(Firestore);
//   private authService = inject(AuthService);

//   getExpenses(): Observable<FinanceInterface[]> {
//     const uid = this.authService.getCurrentUserUid();
//     if (!uid) throw new Error('Usuario no autenticado');

//     const expensesCollection = collection(
//       this.firestore,
//       `users/${uid}/gastos`
//     );
//     const q = query(expensesCollection);

//     console.log(expensesCollection);

//     return from(getDocs(q)).pipe(
//       map((querySnapshot) =>
//         querySnapshot.docs.map(
//           (doc) => ({ id: doc.id, ...doc.data() } as FinanceInterface)
//         )
//       )
//     );
//   }

//   addExpense(expense: FinanceInterface): Observable<void> {
//     const uid = this.authService.getCurrentUserUid();
//     if (!uid) throw new Error('Usuario no autenticado');

//     const expensesCollection = collection(
//       this.firestore,
//       `users/${uid}/gastos`
//     );
//     return from(addDoc(expensesCollection, { ...expense })).pipe(
//       map(() => void 0)
//     );
//   }

//   editExpense(expense: FinanceInterface): Observable<void> {
//     const uid = this.authService.getCurrentUserUid();
//     if (!uid || !expense.id) throw new Error('Usuario no autenticado');

//     const expenseDoc = doc(this.firestore, `users/${uid}/gastos/${expense.id}`);
//     return from(updateDoc(expenseDoc, { ...expense }));
//   }

//   deleteExpense(expense: FinanceInterface): Observable<void> {
//     const uid = this.authService.getCurrentUserUid();
//     if (!uid || !expense.id) throw new Error('Usuario no autenticado');

//     const expenseDoc = doc(this.firestore, `users/${uid}/gastos/${expense.id}`);
//     return from(deleteDoc(expenseDoc));
//   }
// }
