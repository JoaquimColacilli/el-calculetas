import { Routes } from '@angular/router';
import { LoginComponent } from './components/pages/dashboard/account-management/login/login.component';
import { RegisterComponent } from './components/pages/dashboard/account-management/register/register.component';
import { DashboardComponent } from './components/pages/dashboard/dashboard.component';
import { ResetPasswordComponent } from './components/pages/dashboard/account-management/reset-password/reset-password.component';
import { ProfileComponent } from './components/pages/dashboard/account-management/profile/profile.component';
import { PapeleraTemporalComponent } from './components/pages/papelera-temporal/papelera-temporal.component';
import { AhorrosComponent } from './components/pages/ahorros/ahorros.component';
import { EstadisticasComponent } from './components/pages/estadisticas/estadisticas.component';
import { AuthGuard } from './guard/auth.guard';
import { NovedadesComponent } from './components/pages/novedades/novedades.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  {
    path: 'papelera-temporal',
    component: PapeleraTemporalComponent,
    canActivate: [AuthGuard],
  },
  { path: 'ahorros', component: AhorrosComponent, canActivate: [AuthGuard] },
  {
    path: 'estadisticas',
    component: EstadisticasComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'novedades',
    component: NovedadesComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: 'login' },
];
