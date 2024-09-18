import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  HostListener,
  NgZone,
  ChangeDetectorRef,
  Directive,
} from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

import { WeatherService } from '../../../services/weather.service';
import { CurrencyService } from '../../../services/currency.service';
import { FormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';

import Swal from 'sweetalert2';

import { FinanceInterface } from '../../../interfaces/finance.interface';
import {
  Category,
  DefaultCategories,
} from '../../../interfaces/category.interface';

import { ModalCategoriasComponent } from './modal-categorias/modal-categorias.component';
import { IngresarSueldoComponent } from './ingresar-sueldo/ingresar-sueldo.component';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NumberFormatPipe } from '../../../pipes/number-format.pipe';

// import { ExpensesService } from '../../../services/gastos.service';
import { FinanceService } from '../../../services/finance.service';

import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
} from '@angular/fire/firestore';
import { SueldoService } from '../../../services/sueldo.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    HttpClientModule,
    FormsModule,
    NgSelectModule,
    MatTooltipModule,
    NumberFormatPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  @ViewChild('categorySelect', { static: true }) categorySelect!: ElementRef;

  authService = inject(AuthService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  financeItems: FinanceInterface[] = [];
  userData: any = null;
  totalAmount = 0;
  totalVencidos = 0;
  totalPagados = 0;
  totalPorPagar = 0;
  vencidosCount = 0;
  pagadosCount = 0;
  porPagarCount = 0;
  sueldoIngresado = 0;
  dineroRestante = 0;
  dineroRestanteUSD = 0;
  totalIngresos = 0;
  options = ['Este mes', 'Esta semana', 'Este año'];
  categories: Category[] = DefaultCategories;

  currentIndex = 0;
  weatherData: any = null;
  isDay: boolean = false;
  isNight: boolean = false;
  isUserMenuOpen = false;
  isClosing = false;
  dolarBlueCompra: number = 0;
  dolarBlueVenta: number = 0;
  dolarBolsaCompra: number = 0;
  dolarBolsaVenta: number = 0;
  dolarTarjetaCompra: number = 0;
  dolarTarjetaVenta: number = 0;
  dolarCriptoCompra: number = 0;
  dolarCriptoVenta: number = 0;
  addingExpense: boolean = false;
  newExpense: FinanceInterface = this.createEmptyExpense();
  isLoading: boolean = false;
  isLoadingData: boolean = false;
  isRefreshing: boolean = false;
  showNotification: boolean = false;
  showNotificationGastoAdded: boolean = false;
  deletedExpenseName: string = '';
  addedItemName: string = '';
  editedItemName: string = '';

  salaryDetails: Array<{
    amount: number;
    currency: string;
    validForNextMonth: boolean;
  }> = [];

  sortOrder: 'asc' | 'desc' = 'desc';

  currentDateTime: string = '';
  private intervalId: any;

  searchQuery: string = '';
  selectedCategory: string | null = null;

  isTodayChecked: boolean = true;

  groupedExpenses: { [key: string]: number } = {};

  totalAmountARS = 0;
  totalAmountUSD = 0;
  totalVencidosARS = 0;
  totalPagadosARS = 0;
  totalPorPagarARS = 0;
  totalVencidosUSD = 0;
  totalPagadosUSD = 0;
  totalPorPagarUSD = 0;

  totalIngresosUSD: number = 0;
  totalDineroEnCuentaUSD: number = 0;

  editingIndex: number | null = null;
  currentExpense: FinanceInterface = this.createEmptyExpense();
  isSaveAttempted = false;

  selectAll = false;
  showSelectButton: boolean = false;

  haySeleccionados = false;

  constructor(
    private router: Router,
    library: FaIconLibrary,
    private weatherService: WeatherService,
    private currencyService: CurrencyService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private zone: NgZone,
    private financeService: FinanceService,
    private el: ElementRef,
    private sueldoService: SueldoService
  ) {
    library.addIconPacks(fas);
  }

  async ngOnInit(): Promise<void> {
    this.loadUserData();
    this.calculateTotals();
    this.calculateCounts();
    this.getWeatherData();
    this.calculateDayOrNight();
    this.loadDollarRates();

    this.updateDateTime();
    this.intervalId = setInterval(() => this.updateDateTime(), 1000);

    this.checkAndUpdateExpensesStatus();
    setInterval(() => {
      this.checkAndUpdateExpensesStatus();
    }, 24 * 60 * 60 * 1000);

    this.setTodayDate();

    this.sortFinanceItems();

    this.updateGroupedExpenses();

    this.loadSalaries();

    this.loadExpenses();
  }

  loadExpenses(): void {
    this.isLoadingData = true;
    this.financeService.getExpenses().subscribe({
      next: (expenses) => {
        this.financeItems = expenses;

        console.log(this.financeItems);
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.isLoadingData = false;
      },
    });
  }

  loadSalaries(): void {
    this.sueldoService.getSalaries().subscribe({
      next: (salariesData) => {
        // Verifica que los datos contengan el array de sueldos
        const salaries = salariesData?.salaries || [];

        this.salaryDetails = salaries;

        // Calcular los totales a partir de los sueldos cargados
        this.totalIngresos = 0;
        this.totalIngresosUSD = 0;

        salaries.forEach((salary: any) => {
          if (salary.currency === 'USD') {
            this.totalIngresosUSD += salary.amount;
          } else if (salary.currency === 'ARS') {
            this.totalIngresos += salary.amount;
          }
        });

        this.totalDineroEnCuentaUSD = this.totalIngresosUSD;
        console.log('Total Ingresos ARS:', this.totalIngresos);
        console.log('Total Dinero en Cuenta USD:', this.totalDineroEnCuentaUSD);

        this.calculateDineroRestante();
      },
      error: (error) => {
        console.error('Error al cargar los sueldos desde Firebase:', error);
      },
    });
  }

  private getCurrentUserUid(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  createEmptyExpense(): FinanceInterface {
    return {
      isPaid: false,
      status: 'Por pagar',
      date: '',
      value: '',
      name: '',
      provider: '',
      category: '',
      obs: '',
      currency: 'ARS',
    };
  }

  // Obtener los gastos del usuario actual
  async getExpenses(): Promise<void> {
    const uid = this.getCurrentUserUid();
    if (!uid) return;

    const gastosCollection = collection(this.firestore, `users/${uid}/gastos`);
    const querySnapshot = await getDocs(gastosCollection);
    this.financeItems = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FinanceInterface[];
    this.cdr.detectChanges();
  }

  // Agregar un nuevo gasto
  addExpense() {
    this.addingExpense = true;
    this.isTodayChecked = true;
    this.toggleTodayDate();
    this.getDisplayDate();
  }

  // Editar un gasto existente
  editExpense(expense: FinanceInterface): void {
    const index = this.financeItems.findIndex((item) => item.id === expense.id);
    this.editingIndex = index;
    this.currentExpense = { ...expense };
    this.addingExpense = true;

    // Convertir la fecha del formato dd/MM/yyyy a yyyy-MM-dd si es necesario
    if (this.currentExpense.date && this.currentExpense.date.includes('/')) {
      const [day, month, year] = this.currentExpense.date.split('/');
      this.currentExpense.date = `${year}-${month.padStart(
        2,
        '0'
      )}-${day.padStart(2, '0')}`;
      this.getExpenses();
    }

    // Verificar si la fecha del registro coincide con hoy y ajustar el checkbox
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Sin horas, minutos y segundos para comparar correctamente
    const selectedDate = this.parseDate(this.currentExpense.date);

    console.log(this.currentExpense);
    this.isTodayChecked = selectedDate.getTime() === today.getTime();
  }

  async addExpenseToFirebase(expense: FinanceInterface): Promise<void> {
    const uid = this.getCurrentUserUid();
    if (!uid) return;

    const gastosCollection = collection(this.firestore, `users/${uid}/gastos`);
    await addDoc(gastosCollection, expense);
    this.getExpenses();
  }

  async saveExpense(): Promise<void> {
    this.isSaveAttempted = true;

    if (
      !this.currentExpense.name ||
      !this.currentExpense.value ||
      !this.currentExpense.date ||
      !this.currentExpense.provider ||
      !this.currentExpense.category
    ) {
      console.log('Faltan campos obligatorios.');
      return;
    }

    // Convertir el valor a número, quitar puntos y luego volver a string
    this.currentExpense.value = this.currentExpense.value
      ? parseFloat(this.currentExpense.value.replace(/\./g, '')).toString()
      : '0'; // Asegura que se guarde como string

    this.showAddExpense(this.currentExpense.name);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.addingExpense = false;

    let selectedDate = this.parseDate(this.currentExpense.date);

    if (this.isTodayChecked) {
      this.currentExpense.date = this.formatDate(today);
      selectedDate = today;
    }

    if (selectedDate.getTime() === today.getTime()) {
      this.currentExpense.status = 'Por pagar';
    } else if (selectedDate > today) {
      this.currentExpense.status = 'Por pagar';
    } else {
      this.currentExpense.status = this.currentExpense.isPaid
        ? 'Pagado'
        : 'Vencido';
    }

    if (this.editingIndex !== null) {
      await this.editExpense(this.currentExpense);
      this.showEditExpense(this.currentExpense.name);
      this.editingIndex = null;
    } else {
      await this.addExpenseToFirebase(this.currentExpense);
      this.financeItems.unshift({ ...this.currentExpense });
    }

    this.calculateTotals();
    this.calculateCounts();
    this.calculateDineroRestante();
    this.updateGroupedExpenses();
    this.cancelAddingExpense();

    this.getExpenses();
  }

  startEditingExpense(expense: FinanceInterface): void {
    this.addingExpense = true;
    this.editingIndex = this.filteredFinanceItems.indexOf(expense);
    this.currentExpense = { ...expense };

    // Convertir la fecha al formato correcto si es necesario
    if (this.currentExpense.date.includes('/')) {
      const [day, month, year] = this.currentExpense.date.split('/');
      this.currentExpense.date = `${year}-${month.padStart(
        2,
        '0'
      )}-${day.padStart(2, '0')}`;
    }

    // Ajustar el checkbox según la fecha
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = this.parseDate(this.currentExpense.date);
    this.isTodayChecked = selectedDate.getTime() === today.getTime();
  }

  // Eliminar un gasto
  async deleteExpense(expense: FinanceInterface): Promise<void> {
    const uid = this.getCurrentUserUid();
    if (!uid || !expense.id) return;

    try {
      const expenseDoc = doc(
        this.firestore,
        `users/${uid}/gastos/${expense.id}`
      );
      await deleteDoc(expenseDoc);
      this.getExpenses(); // Refresca los gastos tras eliminar uno
      this.showDeleteNotification(expense.name); // Muestra notificación
    } catch (error) {
      console.error('Error al eliminar el gasto:', error);
    }
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const menuElement = document.querySelector('.user-menu');
    const iconElement = document.querySelector('.icon-menu-toggle');

    if (
      this.isUserMenuOpen &&
      !menuElement?.contains(target) &&
      !iconElement?.contains(target)
    ) {
      this.closeUserMenu();
    }
  }

  updateGroupedExpenses() {
    this.groupedExpenses = this.financeItems.reduce((acc, item) => {
      // Convertir item.value a string antes de aplicar replace
      const value = parseFloat(String(item.value).replace(/[\$,]/g, ''));
      if (!acc[item.currency]) {
        acc[item.currency] = 0;
      }
      acc[item.currency] += value;
      return acc;
    }, {} as { [key: string]: number });
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  get countSelectedItems(): number {
    return this.financeItems.filter((item) => item.selected).length;
  }

  eliminarSeleccionados() {
    this.financeItems = this.financeItems.filter((item) => !item.selected);
    this.selectAll = false;
    this.haySeleccionados = false;
    this.cdr.detectChanges();
  }

  updateDateTime(): void {
    const now = new Date();
    this.currentDateTime = now.toLocaleString('es-ES', {
      dateStyle: 'full',
      timeStyle: 'medium',
    });
  }

  openModalCategorias(): void {
    this.dialog.open(ModalCategoriasComponent, {
      width: '500px',
      panelClass: 'custom-modal-class',
    });
  }

  openModalIngresarSueldo(): void {
    const dialogRef = this.dialog.open(IngresarSueldoComponent, {
      width: '500px',
      panelClass: 'custom-modal-class',
      data: {
        dolarBolsaVenta: this.dolarBolsaVenta,
        salaryDetails: this.getSalaryDetails(), // Cargar sueldos actuales
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && Array.isArray(result)) {
        // Sobrescribir los sueldos existentes con los nuevos
        this.salaryDetails = result;

        // Resetear los ingresos totales antes de recalcular
        this.totalIngresos = 0;
        this.totalIngresosUSD = 0;

        // Recalcular ingresos totales con los nuevos valores
        result.forEach((salary) => {
          if (salary.currency === 'USD') {
            this.totalIngresosUSD += salary.amount;
          } else if (salary.currency === 'ARS') {
            this.totalIngresos += salary.amount;
          }
        });

        // Guardar los nuevos ingresos en Firebase
        this.saveSalariesToFirebase(result);

        // Actualizar el total en cuenta
        this.totalDineroEnCuentaUSD = this.totalIngresosUSD;
        console.log('Total Ingresos ARS:', this.totalIngresos);
        console.log('Total Dinero en Cuenta USD:', this.totalDineroEnCuentaUSD);

        this.calculateDineroRestante();
      }
    });
  }

  saveSalariesToFirebase(salaries: any[]): void {
    this.sueldoService.addSalaries(salaries).subscribe({
      next: () => {
        console.log('Sueldo guardado exitosamente en Firebase');
      },
      error: (error) => {
        console.error('Error al guardar sueldo en Firebase:', error);
      },
    });
  }

  getSalaryDetails(): Array<{
    amount: number;
    currency: string;
    validForNextMonth: boolean;
  }> {
    return this.salaryDetails || [];
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.sortFinanceItems();
  }

  sortFinanceItems() {
    this.financeItems.sort((a, b) => {
      const dateA = this.parseDate(a.date).getTime();
      const dateB = this.parseDate(b.date).getTime();

      return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
    this.isClosing = false;
  }

  onAnimationEnd() {
    if (this.isClosing) {
      this.isUserMenuOpen = false;
      this.isClosing = false;
    }
  }

  reloadRates() {
    this.isRefreshing = true;
    this.isLoading = true;

    setTimeout(() => {
      this.loadDollarRates();
      setTimeout(() => {
        this.isRefreshing = false;
      }, 500);
    }, 200);
  }

  getCountByStatus(status: string): number {
    return this.filteredFinanceItems.filter((item) => item.status === status)
      .length;
  }

  getTotalByCurrency(currency: string): number {
    return this.filteredFinanceItems
      .filter((item) => item.currency === currency)
      .reduce((acc, item) => acc + parseFloat(String(item.value)), 0);
  }

  getTotalByStatusAndCurrency(status: string, currency: string): number {
    return this.filteredFinanceItems
      .filter((item) => item.status === status && item.currency === currency)
      .reduce((acc, item) => acc + parseFloat(String(item.value)), 0);
  }

  handleValueChange(value: string): void {
    // Remover todo lo que no sea número y los puntos anteriores
    let numericValue = value.replace(/\D/g, '');

    // Aplicar el formato de miles usando puntos
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Asignar el valor formateado al modelo
    this.currentExpense.value = formattedValue;
  }

  getCurrentMonthItems(): FinanceInterface[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (this.options[this.currentIndex]) {
      case 'Este mes':
        return this.financeItems.filter((item) => {
          const itemDate = this.parseDate(item.date);
          return (
            itemDate.getFullYear() === currentYear &&
            itemDate.getMonth() === currentMonth
          );
        });

      case 'Este año':
        return this.financeItems.filter((item) => {
          const itemDate = this.parseDate(item.date);
          return itemDate.getFullYear() === currentYear;
        });

      case 'Esta semana':
        const startOfWeek = this.getStartOfWeek(now);
        const endOfWeek = this.getEndOfWeek(now);
        return this.financeItems.filter((item) => {
          const itemDate = this.parseDate(item.date);
          return itemDate >= startOfWeek && itemDate <= endOfWeek;
        });

      default:
        return this.financeItems;
    }
  }

  getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para que el inicio de la semana sea el lunes
    const startOfWeek = new Date(date.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0); // Asegura que el tiempo sea a la medianoche
    return startOfWeek;
  }

  getEndOfWeek(date: Date): Date {
    const startOfWeek = this.getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Ajusta para que el fin de la semana sea el domingo
    endOfWeek.setHours(23, 59, 59, 999); // Asegura que el tiempo sea al final del día
    return endOfWeek;
  }

  // Método para calcular los gastos del mes agrupados por moneda
  getGroupedExpensesCurrentMonth(): { [key: string]: number } {
    const grouped = this.getCurrentMonthItems().reduce((acc, item) => {
      const value = parseFloat(String(item.value));
      if (!acc[item.currency]) {
        acc[item.currency] = 0;
      }
      acc[item.currency] += value;
      return acc;
    }, {} as { [key: string]: number });

    //console.log('Grouped Expenses:', grouped); // Verifica aquí si los ARS están incluidos
    return grouped;
  }

  loadDollarRates() {
    this.currencyService.getDollarRates().subscribe({
      next: (data) => {
        this.dolarBlueCompra = data[1].compra;
        this.dolarBlueVenta = data[1].venta;
        this.dolarBolsaCompra = data[2].compra;
        this.dolarBolsaVenta = data[2].venta;
        this.dolarTarjetaCompra = data[6].compra;
        this.dolarTarjetaVenta = data[6].venta;
        this.dolarCriptoCompra = data[5].compra;
        this.dolarCriptoVenta = data[5].venta;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error obteniendo cotizaciones del dólar:', error);
        this.isLoading = false;
      },
    });
  }

  getWeatherData() {
    this.weatherService.getWeather('Buenos Aires', 'AR').subscribe({
      next: (data) => {
        this.weatherData = data;
        this.calculateDayOrNight();
      },
      error: (error) => {
        console.error('Error obteniendo los datos del clima:', error);
      },
    });
  }

  calculateDayOrNight(): void {
    if (this.weatherData) {
      const currentTime = new Date().getTime() / 1000;
      const sunrise = this.weatherData.sys.sunrise;
      const sunset = this.weatherData.sys.sunset;

      this.isDay = currentTime >= sunrise && currentTime < sunset;
      this.isNight = currentTime < sunrise || currentTime >= sunset;
    }
  }

  getCardColor(): string {
    const dineroRestanteARS = this.calculateDineroRestante();
    const dineroRestanteUSD =
      this.calculateDineroRestanteUsd() * this.dolarBolsaVenta;

    // Si no hay ningún gasto pagado, retorna color gris
    if (this.dineroEnCuentaEsCero()) {
      return 'from-gray-100 to-gray-200';
    }

    // Sumar ambos valores convertidos a ARS para unificar el cálculo del porcentaje
    const totalDineroRestante = dineroRestanteARS + dineroRestanteUSD;
    const percentage = (totalDineroRestante / 100000) * 100;

    if (percentage <= 20) {
      return 'from-red-100 to-red-200';
    } else if (percentage <= 50) {
      return 'from-yellow-100 to-yellow-200';
    } else if (percentage <= 80) {
      return 'from-blue-100 to-blue-200';
    } else {
      return 'from-green-100 to-green-200';
    }
  }

  getTextColor(): string {
    const dineroRestanteARS = this.calculateDineroRestante();
    const dineroRestanteUSD =
      this.calculateDineroRestanteUsd() * this.dolarBolsaVenta;

    // Si no hay ningún gasto pagado, retorna texto negro
    if (this.dineroEnCuentaEsCero()) {
      return 'text-black';
    }

    const totalDineroRestante = dineroRestanteARS + dineroRestanteUSD;
    const percentage = (totalDineroRestante / 100000) * 100;

    if (percentage <= 20) {
      return 'text-red-800';
    } else if (percentage <= 50) {
      return 'text-yellow-800';
    } else if (percentage <= 80) {
      return 'text-blue-800';
    } else {
      return 'text-green-800';
    }
  }

  dineroEnCuentaEsCero(): boolean {
    return !this.filteredFinanceItems.some((item) => item.isPaid);
  }

  calculateCounts(): void {
    this.vencidosCount = this.financeItems.filter(
      (item) => item.status === 'Vencido'
    ).length;
    this.pagadosCount = this.financeItems.filter(
      (item) => item.status === 'Pagado'
    ).length;
    this.porPagarCount = this.financeItems.filter(
      (item) => item.status === 'Por pagar'
    ).length;
  }

  calculateDineroRestante(): number {
    const now = new Date();
    const dolarBolsaVenta = this.dolarBolsaVenta;

    // Filtra los gastos pagados en ARS de este mes
    const gastosPagadosEsteMes = this.financeItems.filter((item) => {
      const itemDate = this.parseDate(item.date);
      return (
        item.status === 'Pagado' &&
        item.currency === 'ARS' &&
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    });

    // Suma el total de los gastos pagados en ARS para este mes
    const totalPagadoEsteMes = gastosPagadosEsteMes.reduce(
      (acc, item) => acc + parseFloat(String(item.value)),
      0
    );

    // Calcula el dinero restante basado en los ingresos en ARS menos los gastos en ARS
    this.dineroRestante = this.totalIngresos - totalPagadoEsteMes;

    // Devuelve el dinero restante en ARS
    return this.dineroRestante;
  }

  calculateDineroRestanteUsd(): number {
    const now = new Date();

    // Filtra los gastos pagados en USD de este mes
    const gastosPagadosUsd = this.financeItems.filter((item) => {
      const itemDate = this.parseDate(item.date);
      return (
        item.status === 'Pagado' &&
        item.currency === 'USD' &&
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    });

    // Suma los gastos pagados en USD
    const totalGastosUsd = gastosPagadosUsd.reduce(
      (acc, item) => acc + parseFloat(String(item.value)),
      0
    );

    // Calcula el dinero restante en USD restando los gastos pagados en USD de los ingresos en USD
    this.dineroRestanteUSD = this.totalIngresosUSD - totalGastosUsd;

    // Devuelve el dinero restante en USD
    return this.dineroRestanteUSD;
  }

  calculateTotals(): void {
    // Totales en ARS
    this.totalAmountARS = this.financeItems
      .filter((item) => item.currency === 'ARS')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalVencidosARS = this.financeItems
      .filter((item) => item.status === 'Vencido' && item.currency === 'ARS')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalPagadosARS = this.financeItems
      .filter((item) => item.status === 'Pagado' && item.currency === 'ARS')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalPorPagarARS = this.financeItems
      .filter((item) => item.status === 'Por pagar' && item.currency === 'ARS')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    // Totales en USD
    this.totalAmountUSD = this.financeItems
      .filter((item) => item.currency === 'USD')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalVencidosUSD = this.financeItems
      .filter((item) => item.status === 'Vencido' && item.currency === 'USD')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalPagadosUSD = this.financeItems
      .filter((item) => item.status === 'Pagado' && item.currency === 'USD')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.totalPorPagarUSD = this.financeItems
      .filter((item) => item.status === 'Por pagar' && item.currency === 'USD')
      .reduce(
        (acc, item) =>
          acc + parseFloat(String(item.value).replace(/[\$,]/g, '')),
        0
      );

    this.calculateDineroRestante();
  }

  ingresarSueldo(monto: number): void {
    this.sueldoIngresado = monto;
    this.totalIngresos += monto;
    this.calculateDineroRestante();
  }

  loadUserData(): void {
    this.authService.getUserData().subscribe({
      next: (data: any) => {
        this.userData = data;
      },
      error: (error: any) => {
        console.error(error);
        this.router.navigate(['/login']);
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  addCategory(name: string) {
    const newCategory: Category = { name, type: 'others' };
    this.categories.push(newCategory);
    this.newExpense.category = name;
  }

  hasExpensesCurrentMonth(): boolean {
    const expenses = this.getGroupedExpensesCurrentMonth();
    return Object.keys(expenses).length > 0;
  }

  viewProfile(): void {}

  editProfile(): void {}

  manageAccount(): void {}

  loadFinanceItems(): void {
    this.financeItems = [
      {
        isPaid: true,
        status: 'Pagado',
        date: '07/07/2024',
        value: '1900.00',
        currency: 'ARS',
        name: 'Servicios',
        provider: 'Proveedor A',
        category: 'Gastos administrativos',
        obs: 'N/A',
      },
      {
        isPaid: false,
        status: 'Vencido',
        date: '08/09/2024',
        value: '3200.00',
        currency: 'USD',
        name: 'Juguetes',
        provider: 'Perritones',
        category: 'Compra de productos y suministros',
        obs: 'Urgente',
      },
      {
        isPaid: true,
        status: 'Pagado',
        date: '09/09/2024',
        value: '2800.00',
        currency: 'USD',
        name: 'Comederos',
        provider: 'Cerámica de Maíra',
        category: 'Otros',
        obs: '',
      },
    ];
  }

  togglePayment(item: FinanceInterface): void {
    this.updateExpenseStatus(item);

    // Añade un pequeño retraso antes de actualizar en Firebase
    setTimeout(() => {
      this.updateExpenseInFirebase(item);
    }, 300); // 300ms es suficiente para permitir la animación

    this.calculateCounts();
    this.calculateTotals();
  }

  updateExpenseStatus(item: FinanceInterface): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemDate = this.parseDate(item.date);

    if (item.isPaid) {
      item.status = 'Pagado';
    } else {
      if (itemDate.getTime() === today.getTime()) {
        item.status = 'Por pagar';
      } else if (itemDate < today) {
        item.status = 'Vencido';
      } else {
        item.status = 'Por pagar';
      }
    }
  }

  async updateExpenseInFirebase(expense: FinanceInterface): Promise<void> {
    const uid = await this.authService.getCurrentUserUid();
    if (!uid || !expense.id) return;

    const expenseDoc = doc(this.firestore, `users/${uid}/gastos/${expense.id}`);
    await updateDoc(expenseDoc, {
      isPaid: expense.isPaid,
      status: expense.status,
    });
  }

  get filteredFinanceItems(): FinanceInterface[] {
    const searchQueryLower = this.searchQuery.toLowerCase();
    const filteredItems = this.financeItems.filter((item) => {
      const matchesSearchQuery = Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchQueryLower)
      );
      const matchesCategory = this.selectedCategory
        ? item.category === this.selectedCategory
        : true;
      return matchesSearchQuery && matchesCategory;
    });

    return this.filterByDate(filteredItems);
  }

  filterByDate(items: FinanceInterface[]): FinanceInterface[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (this.options[this.currentIndex]) {
      case 'Este mes':
        return items.filter((item) => {
          const itemDate = this.parseDate(item.date);
          return (
            itemDate.getFullYear() === currentYear &&
            itemDate.getMonth() === currentMonth
          );
        });

      case 'Esta semana':
        const currentWeekStart = this.getStartOfWeek(now);
        const currentWeekEnd = this.getEndOfWeek(now);
        return items.filter((item) => {
          const itemDate = this.parseDate(item.date);
          return itemDate >= currentWeekStart && itemDate <= currentWeekEnd;
        });

      case 'Este año':
        return items.filter((item) => {
          const itemDate = this.parseDate(item.date);
          return itemDate.getFullYear() === currentYear;
        });

      default:
        // Asegúrate de que esta sección devuelva todos los ítems si no hay filtro
        return items;
    }
  }

  parseDate(dateString: string): Date {
    if (dateString.includes('-')) {
      return new Date(dateString);
    }

    const [day, month, year] = dateString.split('/').map(Number);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month - 1, day);
    }

    return new Date('Invalid Date'); // Maneja fechas no válidas
  }

  previousOption() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.options.length - 1;
    }
    this.changeView(this.getViewFromIndex(this.currentIndex));
  }

  nextOption() {
    if (this.currentIndex < this.options.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
    this.changeView(this.getViewFromIndex(this.currentIndex));
  }

  getViewFromIndex(index: number): 'year' | 'month' | 'week' {
    switch (this.options[index]) {
      case 'Este año':
        return 'year';
      case 'Este mes':
        return 'month';
      case 'Esta semana':
        return 'week';
      default:
        return 'month';
    }
  }

  changeView(view: 'year' | 'month' | 'week') {
    this.currentIndex = this.options.indexOf(
      view === 'year'
        ? 'Este año'
        : view === 'month'
        ? 'Este mes'
        : 'Esta semana'
    );

    const visibleItems = this.getCurrentMonthItems();
    visibleItems.forEach((item) => {
      item.selected = false; // Deselecciona cada elemento visible
    });

    this.selectAll = false; // Asegura que selectAll esté siempre en false al cambiar de vista
    this.actualizarEstadoSeleccionados(); // Actualiza el estado de selección
    this.cdr.detectChanges(); // Detecta los cambios
  }

  getCategoryName(category: string | { name: string }): string {
    return typeof category === 'object' ? category.name : category;
  }

  //

  onCheckboxChange() {
    this.selectAll = this.financeItems.every((item) => item.selected);
    this.actualizarEstadoSeleccionados();
  }

  actualizarEstadoSeleccionados() {
    const visibleItems = this.getCurrentMonthItems();
    this.haySeleccionados = visibleItems.some((item) => item.selected);
    // Evita cambiar selectAll a true automáticamente al iniciar la vista
    this.selectAll =
      this.haySeleccionados && visibleItems.every((item) => item.selected);
  }

  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    const visibleItems = this.getCurrentMonthItems();

    visibleItems.forEach((item) => {
      item.selected = this.selectAll;
    });

    this.actualizarEstadoSeleccionados();
  }

  cancelAddingExpense(): void {
    this.addingExpense = false;
    this.editingIndex = null;
    this.currentExpense = this.createEmptyExpense();
    this.isSaveAttempted = false;
  }
  // saveExpense() {
  //   this.isSaveAttempted = true;

  //   // Verifica que todos los campos obligatorios estén llenos
  //   if (
  //     !this.currentExpense.name ||
  //     !this.currentExpense.value ||
  //     !this.currentExpense.date ||
  //     !this.currentExpense.provider ||
  //     !this.currentExpense.category
  //   ) {
  //     // No guarda si faltan campos
  //     console.log('Faltan campos obligatorios.');
  //     return;
  //   }

  //   this.showAddExpense(this.currentExpense.name);
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   this.addingExpense = false;

  //   let selectedDate = this.parseDate(this.currentExpense.date);

  //   if (this.isTodayChecked) {
  //     this.currentExpense.date = this.formatDate(today);
  //     selectedDate = today;
  //   }

  //   console.log(selectedDate);
  //   console.log(today);

  //   if (selectedDate > today) {
  //     this.currentExpense.status = 'Por pagar';
  //     console.log(this.currentExpense);
  //   } else if (selectedDate < today) {
  //     this.currentExpense.status = this.currentExpense.isPaid
  //       ? 'Pagado'
  //       : 'Vencido';
  //     console.log(this.currentExpense);
  //   } else {
  //     this.currentExpense.status = this.currentExpense.isPaid
  //       ? 'Pagado'
  //       : 'Vencido';
  //     console.log(this.currentExpense);
  //   }

  //   if (selectedDate.getTime() === today.getTime()) {
  //     this.currentExpense.status = 'Por pagar';
  //   } else if (selectedDate > today) {
  //     this.currentExpense.status = 'Por pagar';
  //   } else {
  //     this.currentExpense.status = this.currentExpense.isPaid
  //       ? 'Pagado'
  //       : 'Vencido';
  //   }

  //   // Check if editing an existing expense
  //   if (this.editingIndex !== null) {
  //     this.showEditExpense(this.currentExpense.name);
  //     this.financeItems[this.editingIndex] = { ...this.currentExpense };
  //     this.editingIndex = null; // Reset the editing index
  //   } else {
  //     // Add new expense
  //     this.financeItems.unshift({ ...this.currentExpense });
  //   }

  //   this.calculateTotals();
  //   this.calculateCounts();
  //   this.calculateDineroRestante();
  //   this.updateGroupedExpenses();
  //   this.cancelAddingExpense();
  // }

  // addExpense() {
  //   this.addingExpense = true;
  //   this.isTodayChecked = true;
  //   this.toggleTodayDate();
  //   this.getDisplayDate();
  // }

  // editExpense(index: number): void {
  //   this.editingIndex = index;
  //   this.currentExpense = { ...this.financeItems[index] };
  //   this.addingExpense = true;

  //   // Convertir la fecha del formato dd/MM/yyyy a yyyy-MM-dd si es necesario
  //   if (this.currentExpense.date && this.currentExpense.date.includes('/')) {
  //     const [day, month, year] = this.currentExpense.date.split('/');
  //     this.currentExpense.date = `${year}-${month.padStart(
  //       2,
  //       '0'
  //     )}-${day.padStart(2, '0')}`;
  //   }

  //   // Verificar si la fecha del registro coincide con hoy y ajustar el checkbox
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0); // Sin horas, minutos y segundos para comparar correctamente
  //   const selectedDate = this.parseDate(this.currentExpense.date);

  //   console.log(this.currentExpense);
  //   this.isTodayChecked = selectedDate.getTime() === today.getTime();
  // }

  // deleteExpense(item: FinanceInterface) {
  //   this.financeItems = this.financeItems.filter((expense) => expense !== item);
  //   this.cdr.detectChanges();

  //   this.showDeleteNotification(item.name);
  // }

  checkAndUpdateExpensesStatus(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.financeItems.forEach((item) => {
      const itemDate = this.parseDate(item.date);
      if (item.status === 'Por pagar' && itemDate <= today) {
        item.status = 'Vencido';
      }
    });

    this.calculateCounts();
    this.calculateTotals();
  }

  setTodayDate(): void {
    const today = new Date();
    this.newExpense.date = this.formatDate(today);
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getDisplayDate(): string {
    if (this.isTodayChecked) {
      // Obtener la fecha de hoy correctamente sin cambios de huso horario
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Aseguramos que no haya variación de hora
      return today.toISOString().split('T')[0]; // Formato ISO compatible con el input date
    } else {
      // Asegura que si la fecha tiene formato dd/mm/yyyy, se convierta a yyyy-MM-dd
      if (this.currentExpense.date && this.currentExpense.date.includes('/')) {
        const [day, month, year] = this.currentExpense.date.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return this.currentExpense.date || '';
    }
  }

  toggleTodayDate() {
    // Definir 'today' al inicio del método para usarlo en ambos casos
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Asegura que se maneje correctamente el día actual sin errores de huso horario

    if (this.isTodayChecked) {
      // Si el checkbox está marcado, asignar la fecha de hoy
      this.currentExpense.date = today.toISOString().split('T')[0]; // Formato ISO para el input de tipo date
    } else {
      // Si el checkbox está desmarcado, no cambiar la fecha actual del input
      const currentDate = this.currentExpense.date;
      if (currentDate !== today.toISOString().split('T')[0]) {
        this.isTodayChecked = false;
      }
    }
  }

  formatDateDisplay(dateString: string): string {
    if (!dateString || typeof dateString !== 'string') {
      console.error('Fecha inválida o en formato incorrecto:', dateString);
      return 'Fecha inválida';
    }

    // Detectar si la fecha es en formato dd/MM/yyyy
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      if (!day || !month || !year) {
        console.error('Partes de la fecha inválidas:', { day, month, year });
        return 'Fecha inválida';
      }
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }

    // Detectar si la fecha es en formato yyyy-MM-dd
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      if (!year || !month || !day) {
        console.error('Partes de la fecha inválidas:', { year, month, day });
        return 'Fecha inválida';
      }
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }

    console.error('Formato de fecha no reconocido:', dateString);
    return 'Fecha inválida';
  }

  showDeleteNotification(deletedItemName: string) {
    this.deletedExpenseName = deletedItemName;
    Swal.fire({
      position: 'top',
      icon: 'info',
      title: `Se ha enviado el gasto "${deletedItemName}" a la papelera temporal.`,
      showConfirmButton: false,
      timer: 3000,
      toast: true,
      customClass: {
        popup: 'swal-custom-popup',
      },
    });
  }

  showAddExpense(addedItemName: string) {
    this.addedItemName = addedItemName;
    Swal.fire({
      position: 'top',
      icon: 'info',
      title: `Se ha añadido el gasto "${addedItemName}" correctamente.`,
      showConfirmButton: false,
      timer: 3000,
      toast: true,
      customClass: {
        popup: 'swal-custom-popup',
      },
    });
  }

  showEditExpense(editedItemName: string) {
    this.editedItemName = editedItemName;
    Swal.fire({
      position: 'top',
      icon: 'info',
      title: `Se ha moficiado el gasto "${editedItemName}" correctamente.`,
      showConfirmButton: false,
      timer: 3000,
      toast: true,
      customClass: {
        popup: 'swal-custom-popup',
      },
    });
  }

  // createEmptyExpense(): FinanceInterface {
  //   return {
  //     isPaid: false,
  //     status: 'Por pagar',
  //     date: '',
  //     value: '',
  //     name: '',
  //     provider: '',
  //     category: '',
  //     obs: '',
  //     currency: 'ARS',
  //   };
  // }
}
