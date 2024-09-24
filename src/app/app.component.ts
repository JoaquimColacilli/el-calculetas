import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { UserInterface } from './interfaces/user.interface';
import { Router } from '@angular/router';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user: User) => {
      if (user) {
        this.authService.currentUserSig.set({
          uid: user.uid!,
          email: user.email!,
          username: user.displayName!,
        });
      } else {
        this.authService.currentUserSig.set(null);
      }
      console.log(this.authService.currentUserSig());
    });
  }

  title = 'el-calculetas';
}
