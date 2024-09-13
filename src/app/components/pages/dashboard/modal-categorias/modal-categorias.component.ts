import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, HostListener } from '@angular/core';
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
  @ViewChild('categoryInput') categoryInput!: ElementRef<HTMLInputElement>;

  categories: Category[] = DefaultCategories;
  selectedCategory: Category | null = null;
  warningCategories: Set<Category> = new Set(); // Mantener advertencias de las categorías

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
    this.selectedCategory = category;
    setTimeout(() => {
      this.categoryInput?.nativeElement.focus();
    }, 0); // Se usa setTimeout para asegurar que el input ya esté visible
  }

  getCategoryClasses(category: Category): any {
    if (this.selectedCategory === category) {
      return 'ring-2 ring-blue-500 border-blue-500 bg-gray-300';
    } else if (this.warningCategories.has(category)) {
      return 'ring-2 ring-red-500 bg-white';
    } else {
      return 'bg-white';
    }
  }

  saveCategory(category: Category): void {
    const index = this.categories.findIndex((c) => c === category);
    if (index !== -1) {
      this.categories[index] = { ...category };
    }
    this.warningCategories.delete(category); // Quita del set al guardar
    this.selectedCategory = null; // Si quieres limpiar la selección después de guardar
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (
      this.selectedCategory &&
      !this.categoryInput.nativeElement.contains(event.target as Node)
    ) {
      this.warningCategories.add(this.selectedCategory);
    }
  }

  deleteCategory(category: Category): void {
    this.categories = this.categories.filter((c) => c !== category);
    if (this.selectedCategory === category) {
      this.selectedCategory = null;
    }
    this.warningCategories.delete(category);
  }

  addNewCategory(): void {
    const newCategory: Category = { name: 'Nueva Categoría', type: 'others' };
    this.categories.push(newCategory);
    this.editCategory(newCategory);
  }

  getCategoryIcon(category: Category): string {
    const icons: { [key: string]: string } = {
      rent: 'home',
      utilities: 'lightbulb',
      transport: 'bus',
      food: 'utensils',
      education: 'book',
      health: 'heartbeat',
      entertainment: 'gamepad',
      clothing: 'tshirt',
      travel: 'plane',
      savings: 'piggy-bank',
      debt: 'credit-card',
      gifts: 'gift',
      maintenance: 'tools',
      taxes: 'file-invoice-dollar',
      others: 'ellipsis-h',
    };

    return icons[category.type] || 'question-circle';
  }
}
