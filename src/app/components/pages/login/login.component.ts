import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import {
  Persistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, FontAwesomeModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  authService = inject(AuthService);
  router = inject(Router);
  showPassword = false;

  keepLoggedIn = true;
  form = this.fb.nonNullable.group({
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas);
  }

  errorMessage: string | null = null;
  isLoading = false;

  onSubmit(): void {
    this.isLoading = true;
    const rawForm = this.form.getRawValue();
    const persistence: Persistence = this.keepLoggedIn
      ? browserLocalPersistence // Usa la constante correcta para local persistence
      : browserSessionPersistence; // Usa la constante correcta para session persistence

    // Configura la persistencia antes de iniciar sesión
    this.authService
      .setPersistence(persistence)
      .then(() => {
        this.authService.login(rawForm.email, rawForm.password).subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigateByUrl('/dashboard');
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message;
          },
        });
      })
      .catch((error) => {
        this.isLoading = false;
        this.errorMessage = 'Error al configurar la persistencia de la sesión.';
        console.error('Error setting persistence:', error);
      });
  }

  loginWithGoogle(): void {
    this.isLoading = true;
    const persistence: Persistence = this.keepLoggedIn
      ? browserLocalPersistence
      : browserSessionPersistence;

    this.authService
      .setPersistence(persistence)
      .then(() => {
        console.log(
          'Setting persistence:',
          this.keepLoggedIn ? 'LOCAL' : 'SESSION'
        );

        this.authService.loginWithGoogle().subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigateByUrl('/dashboard');
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message;
          },
        });
      })
      .catch((error) => {
        this.isLoading = false;
        this.errorMessage = 'Error al configurar la persistencia de la sesión.';
        console.error('Error setting persistence:', error);
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleKeepLoggedIn(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.keepLoggedIn = input.checked;
  }
}
