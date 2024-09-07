import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

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
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  financeItems: FinanceItem[] = [];
  userData: any = null;

  constructor(private router: Router, library: FaIconLibrary) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.loadFinanceItems();
    this.loadUserData();
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
