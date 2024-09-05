import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  onSubmit(): void {
    this.isLoading = true;
    const email = this.form.value.email!;
    this.authService.resetPassword(email).subscribe({
      next: () => {
        this.successMessage =
          'Correo de recuperación enviado. Revisá tu bandeja de entrada.';
        this.errorMessage = null;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.successMessage = null;
        this.isLoading = false;
      },
    });
  }

  goToHome(): void {
    this.router.navigate(['/']); // Navega a la pantalla principal o inicio
  }
}
