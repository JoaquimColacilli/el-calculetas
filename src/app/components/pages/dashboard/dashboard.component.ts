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
  totalIngresos = 50000;
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

  currentDateTime: string = '';
  private intervalId: any;

  searchQuery: string = '';

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

  openModal(): void {
    this.dialog.open(ModalCategoriasComponent, {
      width: '500px',
      panelClass: 'custom-modal-class',
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

  calculateDineroRestante(): void {
    this.dineroRestante = this.totalIngresos - this.totalAmount;
  }

  calculateTotals(): void {
    this.totalAmount = this.financeItems.reduce(
      (acc, item) => acc + parseFloat(item.value.replace(/[\$,]/g, '')),
      0
    );

    this.totalVencidos = this.financeItems
      .filter((item) => item.status === 'Vencido')
      .reduce(
        (acc, item) => acc + parseFloat(item.value.replace(/[\$,]/g, '')),
        0
      );

    this.totalPagados = this.financeItems
      .filter((item) => item.status === 'Pagado')
      .reduce(
        (acc, item) => acc + parseFloat(item.value.replace(/[\$,]/g, '')),
        0
      );

    this.totalPorPagar = this.financeItems
      .filter((item) => item.status === 'Por pagar')
      .reduce(
        (acc, item) => acc + parseFloat(item.value.replace(/[\$,]/g, '')),
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

  viewProfile(): void {}

  editProfile(): void {}

  manageAccount(): void {}

  loadFinanceItems(): void {
    this.financeItems = [
      {
        isPaid: true,
        status: 'Pagado',
        date: '07/09/2023',
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
        date: '08/09/2023',
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
        date: '09/09/2023',
        value: '2800.00',
        currency: 'EUR',
        name: 'Comederos',
        provider: 'Cerámica de Maíra',
        category: 'Otros',
        obs: '',
      },
    ];
  }

  togglePayment(item: FinanceInterface) {
    item.status = item.isPaid ? 'Pagado' : 'Vencido';
  }

  addExpense() {
    this.addingExpense = true;
  }

  get filteredFinanceItems(): FinanceInterface[] {
    if (!this.searchQuery.trim()) {
      return this.financeItems;
    }
    return this.financeItems.filter((item) =>
      `${item.name} ${item.provider} ${item.obs}`
        .toLowerCase()
        .includes(this.searchQuery.toLowerCase())
    );
  }

  saveExpense() {
    if (this.newExpense.name && this.newExpense.value) {
      this.newExpense.status = this.newExpense.isPaid ? 'Pagado' : 'Vencido';
      this.financeItems.unshift({ ...this.newExpense });
      this.cancelAddingExpense();
    }
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
