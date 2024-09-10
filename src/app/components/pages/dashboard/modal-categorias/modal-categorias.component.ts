import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import {
  Category,
  DefaultCategories,
} from '../../../../interfaces/category.interface';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-modal-categorias',
  templateUrl: './modal-categorias.component.html',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  styleUrls: ['./modal-categorias.component.css'],
})
export class ModalCategoriasComponent {
  categories: Category[] = DefaultCategories;
  selectedCategory: Category | null = null;

  constructor(
    public dialogRef: MatDialogRef<ModalCategoriasComponent>,
    library: FaIconLibrary
  ) {
    library.addIconPacks(fas);
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  editCategory(category: Category): void {
    this.selectedCategory = { ...category }; // Copia de la categoría seleccionada
  }

  saveCategory(): void {
    const index = this.categories.findIndex(
      (c) => c.name === this.selectedCategory?.name
    );
    if (index !== -1 && this.selectedCategory) {
      this.categories[index] = { ...this.selectedCategory }; // Actualiza la categoría
    }
    this.selectedCategory = null; // Resetea la selección
  }

  deleteCategory(category: Category): void {
    this.categories = this.categories.filter((c) => c !== category); // Elimina la categoría
  }

  addNewCategory(): void {
    const newCategory: Category = { name: 'Nueva Categoría' };
    this.categories.push(newCategory);
    this.editCategory(newCategory); // Abre el input para editar la nueva categoría
  }

  getCategoryIcon(category: Category): string {
    const icons: { [key: string]: string } = {
      Alquiler: 'home',
      'Servicios Públicos': 'lightbulb',
      Transporte: 'bus',
      'Comida y Bebida': 'utensils',
      Educación: 'book',
      Salud: 'heartbeat',
      Entretenimiento: 'gamepad',
      Ropa: 'tshirt',
      Viajes: 'plane',
      'Ahorro e Inversiones': 'piggy-bank',
      Deuda: 'credit-card',
      'Regalos y Donaciones': 'gift',
      'Mantenimiento de Hogar': 'tools',
      Impuestos: 'file-invoice-dollar',
      Otros: 'ellipsis-h',
    };
    return icons[category.name as keyof typeof icons] || 'question-circle';
  }
}
