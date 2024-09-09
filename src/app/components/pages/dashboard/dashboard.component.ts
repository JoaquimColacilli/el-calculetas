import { Component, inject, OnInit, HostListener } from '@angular/core';
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

interface FinanceItem {
  isPaid: boolean;
  status: string;
  date: string;
  value: string;
  currency: string;
  name: string;
  provider: string;
  category: string;
  obs: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HttpClientModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  financeItems: FinanceItem[] = [];
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

  isLoading: boolean = false;
  isRefreshing: boolean = false;

  constructor(
    private router: Router,
    library: FaIconLibrary,
    private weatherService: WeatherService,
    private currencyService: CurrencyService
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
      console.log('hola');
      const currentTime = new Date().getTime() / 1000;
      const sunrise = this.weatherData.sys.sunrise;
      const sunset = this.weatherData.sys.sunset;

      this.isDay = currentTime >= sunrise && currentTime < sunset;
      this.isNight = currentTime < sunrise || currentTime >= sunset;

      console.log('Es de día:', this.isDay);
      console.log('Es de noche:', this.isNight);
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

  viewProfile(): void {
    console.log('Ver Perfil');
  }

  editProfile(): void {
    console.log('Editar Perfil');
  }

  manageAccount(): void {
    console.log('Administrar Cuenta');
  }

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

  togglePayment(item: FinanceItem) {
    console.log(
      `Pago para ${item.name} está ahora ${item.isPaid ? 'activo' : 'inactivo'}`
    );
  }
}
