import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  docData,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, catchError, throwError } from 'rxjs';
import { Category } from '../interfaces/category.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  // Obtener categorías del usuario actual
  getUserCategories(): Observable<Category[]> {
    return this.authService.getUserData().pipe(
      switchMap((userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }

        const categoriesCollection = collection(
          this.firestore,
          `users/${uid}/categories`
        );

        return collectionData(categoriesCollection, {
          idField: 'id',
        }) as Observable<Category[]>;
      }),
      catchError((error) => {
        console.error('Error al obtener las categorías:', error);
        return throwError(() => new Error('Error al obtener las categorías'));
      })
    );
  }

  // Añadir una nueva categoría
  addCategory(category: Category): Promise<void> {
    return this.authService.getCurrentUserUid().then((uid) => {
      if (!uid) throw new Error('Usuario no autenticado');
      const categoriesCollection = collection(
        this.firestore,
        `users/${uid}/categories`
      );
      return addDoc(categoriesCollection, category).then((docRef) => {
        category.id = docRef.id; // Asignar el id generado por Firebase
      });
    });
  }

  // Actualizar una categoría existente
  updateCategory(category: Category): Promise<void> {
    return this.authService.getCurrentUserUid().then((uid) => {
      if (!uid) throw new Error('Usuario no autenticado');
      if (!category.id) throw new Error('La categoría no tiene un ID válido');
      const categoryDoc = doc(
        this.firestore,
        `users/${uid}/categories/${category.id}`
      );
      return updateDoc(categoryDoc, { ...category });
    });
  }

  // Eliminar una categoría
  deleteCategory(categoryId: string): Promise<void> {
    return this.authService.getCurrentUserUid().then((uid) => {
      if (!uid) throw new Error('Usuario no autenticado');
      const categoryDoc = doc(
        this.firestore,
        `users/${uid}/categories/${categoryId}`
      );
      return deleteDoc(categoryDoc);
    });
  }

  // Obtener una categoría específica por ID
  getCategoryById(categoryId: string): Observable<Category | undefined> {
    return this.authService.getUserData().pipe(
      switchMap((userData) => {
        const uid = userData?.uid;
        if (!uid) {
          throw new Error('Usuario no autenticado');
        }
        const categoryDoc = doc(
          this.firestore,
          `users/${uid}/categories/${categoryId}`
        );
        return docData(categoryDoc) as Observable<Category | undefined>;
      }),
      catchError((error) => {
        console.error('Error al obtener la categoría:', error);
        return throwError(() => new Error('Error al obtener la categoría'));
      })
    );
  }
}
