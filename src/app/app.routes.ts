import { Routes } from '@angular/router';
import { LoginComponent } from './components/pages/login/login.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
];
