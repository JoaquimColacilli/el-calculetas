import { Routes } from '@angular/router';
import { LoginComponent } from './components/pages/dashboard/account-management/login/login.component';
import { RegisterComponent } from './components/pages/dashboard/account-management/register/register.component';
import { DashboardComponent } from './components/pages/dashboard/dashboard.component';
import { ResetPasswordComponent } from './components/pages/dashboard/account-management/reset-password/reset-password.component';
import { ProfileComponent } from './components/pages/dashboard/account-management/profile/profile.component';
import { PapeleraTemporalComponent } from './components/pages/papelera-temporal/papelera-temporal.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'papelera-temporal', component: PapeleraTemporalComponent },
];
