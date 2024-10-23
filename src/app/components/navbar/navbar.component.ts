import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import * as packageInfo from '../../../../package.json';

import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { SwitchAccountModalComponent } from '../pages/dashboard/account-management/switch-account-modal/switch-account-modal.component';
import { WeatherService } from '../../services/weather.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  @Input() navbarBackgroundColor: string = '#ffffff';

  version: string = packageInfo.version;

  currentDateTime: string = '';
  intervalId: any;

  userData: any = null;

  isUserMenuOpen = false;
  isClosing = false;

  pageTitle: string = '';

  // Variables para el clima
  weatherData: any = null;
  isDay: boolean = true;
  isNight: boolean = false;

  constructor(
    library: FaIconLibrary,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private weatherService: WeatherService // Inyectar WeatherService
  ) {
    library.addIconPacks(fas);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setPageTitle(event.url);
      }
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.currentUserSig();

    if (currentUser && currentUser.uid) {
      this.loadUserData();
    } else {
      this.userData = null;
    }

    this.updateDateTime();
    this.intervalId = setInterval(() => this.updateDateTime(), 1000);
    this.setPageTitle(this.router.url);
  }

  loadUserData(): void {
    this.authService.getUserData().subscribe({
      next: (data: any) => {
        this.userData = data;
        console.log(data);
        this.getWeatherData(); // Obtener datos del clima después de cargar userData
      },
      error: (error: any) => {
        console.error(error);
        console.log(this.userData);
      },
    });
  }

  setPageTitle(url: string) {
    if (url.includes('/dashboard')) {
      this.pageTitle = 'Dashboard';
    } else if (url.includes('/profile')) {
      this.pageTitle = 'Perfil';
    } else if (url.includes('/papelera-temporal')) {
      this.pageTitle = 'Papelera Temporal';
    } else if (url.includes('/ahorros')) {
      this.pageTitle = 'Ahorros';
    } else if (url.includes('/estadisticas')) {
      this.pageTitle = 'Estadísticas';
    } else if (url.includes('/novedades')) {
      this.pageTitle = 'Novedades';
    } else {
      this.pageTitle = 'Unknown';
    }
  }

  updateDateTime(): void {
    const now = new Date();
    this.currentDateTime = now.toLocaleString('es-ES', {
      dateStyle: 'full',
      timeStyle: 'medium',
    });
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  onAnimationEnd() {
    if (this.isClosing) {
      this.isUserMenuOpen = false;
      this.isClosing = false;
    }
  }

  viewProfile(): void {
    this.router.navigate(['/profile']);
  }

  editProfile(): void {}

  manageAccount(): void {}

  openSwitchAccountModal(): void {
    this.dialog.open(SwitchAccountModalComponent, {
      width: '400px',
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  // Métodos para el clima
  getWeatherData() {
    if (this.userData?.ubicacion) {
      const [city, countryCode] = this.userData.ubicacion
        .split(',')
        .map((s: any) => s.trim());
      this.weatherService.getWeather(city, countryCode).subscribe({
        next: (data: any) => {
          this.weatherData = data;
          this.calculateDayOrNight();
        },
        error: (error: any) => {
          console.error('Error obteniendo los datos del clima:', error);
        },
      });
    } else {
      console.log('No hay ubicación configurada.');
    }
  }

  calculateDayOrNight() {
    if (this.weatherData) {
      const currentTime = Math.floor(Date.now() / 1000);
      const sunrise = this.weatherData.sys.sunrise;
      const sunset = this.weatherData.sys.sunset;

      this.isDay = currentTime >= sunrise && currentTime <= sunset;
      this.isNight = !this.isDay;
    }
  }
}
