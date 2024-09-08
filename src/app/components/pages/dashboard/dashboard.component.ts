import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

import { WeatherService } from '../../../services/weather.service';

interface FinanceItem {
  status: string;
  date: string;
  value: string;
  name: string;
  provider: string;
  category: string;
  obs: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HttpClientModule],
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

  constructor(
    private router: Router,
    library: FaIconLibrary,
    private weatherService: WeatherService
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.loadFinanceItems();
    this.loadUserData();
    this.calculateTotals();
    this.calculateCounts();
    this.getWeatherData();
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
      },
      error: (error) => {
        console.error('Error obteniendo los datos del clima:', error);
      },
    });
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

  loadFinanceItems(): void {
    this.financeItems = [
      {
        status: 'Pagado',
        date: '07/09/2023',
        value: '$1,900.00',
        name: 'Servicios',
        provider: 'Proveedor A',
        category: 'Gastos administrativos',
        obs: 'N/A',
      },
      {
        status: 'Vencido',
        date: '08/09/2023',
        value: '$3,200.00',
        name: 'Juguetes',
        provider: 'Perritones',
        category: 'Compra de productos y suministros',
        obs: 'Urgente',
      },
      {
        status: 'Pagado',
        date: '09/09/2023',
        value: '$2,800.00',
        name: 'Comederos',
        provider: 'Cerámica de Maíra',
        category: 'Otros',
        obs: '',
      },
    ];
  }
}
