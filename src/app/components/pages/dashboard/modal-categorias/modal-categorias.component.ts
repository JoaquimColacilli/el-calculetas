import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  HostListener,
  OnInit,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import {
  Category,
  DefaultCategories,
} from '../../../../interfaces/category.interface';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { CategoryService } from '../../../../services/category.service';

@Component({
  selector: 'app-modal-categorias',
  templateUrl: './modal-categorias.component.html',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  styleUrls: ['./modal-categorias.component.css'],
})
export class ModalCategoriasComponent implements OnInit {
  @ViewChild('categoryInput') categoryInput!: ElementRef<HTMLInputElement>;

  categories: Category[] = DefaultCategories;
  selectedCategory: Category | null = null;
  warningCategories: Set<Category> = new Set();

  constructor(
    public dialogRef: MatDialogRef<ModalCategoriasComponent>,
    library: FaIconLibrary,
    private categoryService: CategoryService
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.loadUserCategories();
  }

  loadUserCategories(): void {
    this.categoryService.getUserCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error al cargar las categorías:', error);
      },
    });
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
    if (category.name.trim() === '') {
      console.warn('El nombre de la categoría no puede estar vacío.');
      return; // No permitir guardar si el nombre está vacío
    }

    if (!category.id) {
      // Si no tiene ID, significa que es una nueva categoría
      this.categoryService
        .addCategory(category)
        .then(() => {
          console.log('Nueva categoría guardada exitosamente en Firebase');
          // Puedes actualizar el ID de la categoría aquí si lo necesitas
        })
        .catch((error) => {
          console.error('Error al guardar la nueva categoría:', error);
        });
    } else {
      // Si tiene ID, es una categoría existente
      this.categoryService
        .updateCategory(category)
        .then(() => {
          console.log('Categoría actualizada exitosamente en Firebase');
        })
        .catch((error) => {
          console.error('Error al actualizar la categoría:', error);
        });
    }

    this.warningCategories.delete(category); // Quita del set al guardar
    this.selectedCategory = null; // Limpia la selección después de guardar
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

    const categoryId = category.id || category.name;

    this.categoryService
      .deleteCategory(categoryId)
      .then(() => {
        console.log('Categoría eliminada exitosamente');
      })
      .catch((error) => {
        console.error('Error al eliminar la categoría:', error);
      });
  }

  addNewCategory(): void {
    const newCategory: Category = { name: '', type: 'others' }; // Categoría vacía en modo edición
    this.categories.push(newCategory); // Agregar la categoría a la lista
    this.editCategory(newCategory); // Poner la categoría en modo de edición
  }

  trackByCategoryId(index: number, category: Category): string {
    return category.id || index.toString(); // Usar id si existe, de lo contrario usar índice
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
