import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  HostListener,
  OnDestroy,
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

import { ChangeDetectorRef } from '@angular/core';

import Swal from 'sweetalert2';

import { FinanceInterface } from '../../../interfaces/finance.interface';
import {
  Category,
  DefaultCategories,
} from '../../../interfaces/category.interface';

import { ModalCategoriasComponent } from './modal-categorias/modal-categorias.component';
import { IngresarSueldoComponent } from './ingresar-sueldo/ingresar-sueldo.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    HttpClientModule,
    FormsModule,
    NgSelectModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  @ViewChild('categorySelect', { static: true }) categorySelect!: ElementRef;

  authService = inject(AuthService);
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
  isRefreshing: boolean = false;
  showNotification: boolean = false;
  deletedExpenseName: string = '';

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

  constructor(
    private router: Router,
    library: FaIconLibrary,
    private weatherService: WeatherService,
    private currencyService: CurrencyService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.loadFinanceItems();
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
      },
    });

    // Captura los datos devueltos por el modal
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.salaries) {
        // Sumamos los sueldos ingresados y actualizamos totalIngresos
        const totalSueldoIngresado = result.salaries.reduce(
          (acc: number, salary: string) => {
            return acc + parseFloat(salary.replace(/[^\d]/g, '')) || 0;
          },
          0
        );

        this.totalIngresos += totalSueldoIngresado;
        this.calculateDineroRestante(); // Actualizamos el cálculo de dinero restante
      }
    });
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

  getCurrentMonthItems(): FinanceInterface[] {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return this.filteredFinanceItems.filter((item) => {
      const itemDate = this.parseDate(item.date);
      return (
        itemDate.getMonth() === currentMonth &&
        itemDate.getFullYear() === currentYear
      );
    });
  }

  // Método para calcular los gastos del mes agrupados por moneda
  getGroupedExpensesCurrentMonth(): { [key: string]: number } {
    return this.getCurrentMonthItems().reduce((acc, item) => {
      const value = parseFloat(String(item.value));
      if (!acc[item.currency]) {
        acc[item.currency] = 0;
      }
      acc[item.currency] += value;
      return acc;
    }, {} as { [key: string]: number });
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
    // Calcula el total de gastos pagados del mes en ARS
    const totalPagadoEsteMes = this.getCurrentMonthItems()
      .filter((item) => item.status === 'Pagado' && item.currency === 'ARS')
      .reduce((acc, item) => acc + parseFloat(String(item.value)), 0);

    // Calcula el dinero restante como la diferencia entre ingresos y gastos
    this.dineroRestante = this.totalIngresos - totalPagadoEsteMes;
    return this.dineroRestante;
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
    const newCategory = { name };

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

  togglePayment(item: FinanceInterface) {
    // Actualiza el estado basado en el checkbox y la fecha
    this.updateExpenseStatus(item);

    // Recalcula los conteos y totales
    this.calculateCounts();
    this.calculateTotals();
  }

  updateExpenseStatus(item: FinanceInterface) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Asegura que solo se compare la fecha sin la hora
    const itemDate = this.parseDate(item.date);

    if (item.isPaid) {
      item.status = 'Pagado';
    } else {
      if (itemDate.getTime() === today.getTime()) {
        item.status = 'Por pagar'; // Si es hoy y está desactivado, va a "Por pagar"
      } else if (itemDate < today) {
        item.status = 'Vencido';
      } else {
        item.status = 'Por pagar';
      }
    }
  }

  addExpense() {
    this.addingExpense = true;
    this.isTodayChecked = true;
    this.toggleTodayDate();
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
    // Verifica si el string es una fecha en formato ISO (YYYY-MM-DD)
    if (dateString.includes('-')) {
      return new Date(dateString);
    }

    // Si no, asume que está en formato dd/mm/yyyy
    const [day, month, year] = dateString.split('/').map(Number);

    // Si no hay errores al convertir, retorna la fecha
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month - 1, day);
    }

    // Si el formato no es válido, retorna Invalid Date
    return new Date('Invalid Date');
  }

  getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  getEndOfWeek(date: Date): Date {
    const startOfWeek = this.getStartOfWeek(date);
    return new Date(startOfWeek.setDate(startOfWeek.getDate() + 6)); // El último día es domingo
  }

  // Navegación entre opciones de filtro
  previousOption(): void {
    if (this.currentIndex === 0) {
      this.currentIndex = this.options.length - 1;
    } else {
      this.currentIndex--;
    }
  }

  nextOption(): void {
    if (this.currentIndex === this.options.length - 1) {
      this.currentIndex = 0;
    } else {
      this.currentIndex++;
    }
  }

  getCategoryName(category: string | { name: string }): string {
    return typeof category === 'object' ? category.name : category;
  }

  saveExpense() {
    if (this.newExpense.name && this.newExpense.value) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      this.addingExpense = false;

      let selectedDate = this.parseDate(this.newExpense.date);

      if (this.isTodayChecked) {
        this.newExpense.date = this.formatDate(today);
        selectedDate = today;
      }

      console.log(selectedDate);
      console.log(today);

      if (selectedDate > today) {
        this.newExpense.status = 'Por pagar';

        console.log(this.newExpense);
      } else if (selectedDate < today) {
        this.newExpense.status = this.newExpense.isPaid ? 'Pagado' : 'Vencido';
        console.log(this.newExpense);
      } else {
        this.newExpense.status = this.newExpense.isPaid ? 'Pagado' : 'Vencido';
        console.log(this.newExpense);
      }

      if (selectedDate.getTime() === today.getTime()) {
        this.newExpense.status = 'Por pagar';
      } else if (selectedDate > today) {
        this.newExpense.status = 'Por pagar';
      } else {
        this.newExpense.status = this.newExpense.isPaid ? 'Pagado' : 'Vencido';
      }

      this.financeItems.unshift({ ...this.newExpense });

      this.calculateTotals();
      this.calculateCounts();
      this.calculateDineroRestante();

      this.updateGroupedExpenses();
      this.cancelAddingExpense();
    }
    this.cancelAddingExpense();
    console.log(this.newExpense);
  }

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

  toggleTodayDate() {
    if (this.isTodayChecked) {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      this.newExpense.date = formattedDate;
    } else {
      this.newExpense.date = '';
    }
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

  cancelAddingExpense() {
    this.addingExpense = false;
    this.newExpense = this.createEmptyExpense();
  }

  editExpense(item: FinanceInterface) {}

  deleteExpense(item: FinanceInterface) {
    this.financeItems = this.financeItems.filter((expense) => expense !== item);
    this.cdr.detectChanges();

    this.showDeleteNotification(item.name);
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
}
