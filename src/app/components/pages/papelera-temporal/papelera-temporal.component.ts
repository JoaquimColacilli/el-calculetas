import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth'; // Importa onAuthStateChanged
import { Subscription } from 'rxjs';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AsideComponent } from '../../aside/aside.component';

@Component({
  selector: 'app-papelera-temporal',
  templateUrl: './papelera-temporal.component.html',
  styleUrls: ['./papelera-temporal.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    NavbarComponent,
    AsideComponent,
  ],
})
export class PapeleraTemporalComponent implements OnInit {
  items: any[] = [];
  isLoadingData: boolean = true;

  filterName: string = '';
  filterDate: string = '';
  filteredItems: any[] = [];

  itemsPerPage: number = 3;
  currentPage: number = 1;
  totalPages: number = 1;

  private trashDataSubscription: Subscription | null = null;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    library: FaIconLibrary
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.loadTrashData(user.uid);
      } else {
        console.log('Usuario no autenticado');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.trashDataSubscription) {
      this.trashDataSubscription.unsubscribe();
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString); // Convierte la fecha de UTC a local
    const day = String(date.getUTCDate()).padStart(2, '0'); // Día en UTC
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Mes en UTC
    const year = date.getUTCFullYear(); // Año en UTC
    return `${day}/${month}/${year}`; // Devuelve en formato dd/MM/yyyy
  }
  getDaysUntilDeletion(deletedAt: string): number {
    const [day, month, year] = deletedAt.split('/');
    const deletedDate = new Date(`${year}-${month}-${day}`);

    if (isNaN(deletedDate.getTime())) {
      return NaN;
    }

    const currentDate = new Date();

    const diffTime = currentDate.getTime() - deletedDate.getTime();

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(10 - diffDays, 0);
  }

  clearFilters(): void {
    this.filterName = '';
    this.filterDate = '';
    this.applyFilters();
  }

  loadTrashData(uid: string): void {
    if (!uid) return;

    const trashCollection = collection(
      this.firestore,
      `users/${uid}/papeleraTemporal`
    );

    this.isLoadingData = true;
    this.trashDataSubscription = collectionData(trashCollection).subscribe(
      (data: any) => {
        this.items = data.map((item: any) => ({
          ...item,
          deletedAt: this.formatDate(item.deletedAt),
        }));
        this.isLoadingData = false;
        this.applyFilters();
      },
      (error: any) => {
        console.error(
          'Error al cargar los datos de la papelera temporal:',
          error
        );
        this.isLoadingData = false;
      }
    );
  }

  applyFilters(): void {
    const searchQueryLower = this.filterName.toLowerCase();
    this.filteredItems = this.items.filter((item) => {
      const matchesName = searchQueryLower
        ? item.name.toLowerCase().includes(searchQueryLower)
        : true;

      const matchesDate = this.filterDate
        ? this.compareDates(item.deletedAt, this.filterDate)
        : true;

      return matchesName && matchesDate;
    });
    this.updatePagination();
  }

  // Compara la fecha en formato dd/MM/yyyy con el valor del input date (yyyy-MM-dd)
  compareDates(deletedAt: string, filterDate: string): boolean {
    // Convierte la fecha almacenada (dd/MM/yyyy) a (yyyy-MM-dd) para compararla con el input de tipo date.
    const [day, month, year] = deletedAt.split('/');
    const formattedDeletedAt = `${year}-${month.padStart(
      2,
      '0'
    )}-${day.padStart(2, '0')}`; // Formato yyyy-MM-dd

    // Compara con la fecha seleccionada en el input de tipo date (ya en formato yyyy-MM-dd).
    return formattedDeletedAt === filterDate;
  }

  get paginatedItems(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredItems.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
  }

  async restoreExpense(expense: any): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid || !expense.id) return;

    try {
      const expenseDoc = doc(
        this.firestore,
        `users/${uid}/gastos/${expense.id}`
      );
      await setDoc(expenseDoc, {
        ...expense,
        restoredAt: new Date().toLocaleDateString('es-ES'),
      });

      await this.deleteFromTrash(expense);
    } catch (error) {
      console.error('Error al restaurar el gasto:', error);
    }
  }

  async deleteFromTrash(expense: any): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid || !expense.id) return;

    try {
      const trashDoc = doc(
        this.firestore,
        `users/${uid}/papeleraTemporal/${expense.id}`
      );
      await deleteDoc(trashDoc);
    } catch (error) {
      console.error('Error al eliminar definitivamente el gasto:', error);
    }
  }
}
