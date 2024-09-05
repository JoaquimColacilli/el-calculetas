import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  authService = inject(AuthService);
  router = inject(Router);
  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  errorMessage: string | null = null;
  isLoading = false;

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas);
  }

  onSubmit(): void {
    this.isLoading = true;
    const rawForm = this.form.getRawValue();
    this.authService
      .register(rawForm.email, rawForm.username, rawForm.password)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigateByUrl('/dashboard');
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message;
        },
      });
  }

  registerWithGoogle(): void {
    this.isLoading = true;
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
  }
}
