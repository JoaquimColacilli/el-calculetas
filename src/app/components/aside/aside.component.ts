import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { UserInterface } from '../../interfaces/user.interface';

@Component({
  selector: 'app-aside',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, RouterModule],
  templateUrl: './aside.component.html',
  styleUrls: ['./aside.component.css'],
})
export class AsideComponent implements OnInit {
  backgroundColor = '#4a5568'; // Default color
  lightThemeColor = ''; // Lightened color for hover
  activeColor = ''; // Darkened color for active link

  constructor(
    private authService: AuthService,
    private router: Router, // To detect active routes
    library: FaIconLibrary
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.authService
      .getUserData()
      .subscribe((userData: UserInterface | null) => {
        if (userData && userData.themeColor) {
          this.backgroundColor = userData.themeColor;
          this.lightThemeColor = this.lightenColor(userData.themeColor, 15); // Hover color
          this.activeColor = this.darkenColor(userData.themeColor, 10); // Active color

          // Apply CSS variables for dynamic theme changes
          document.documentElement.style.setProperty(
            '--active-color',
            this.activeColor
          );
          document.documentElement.style.setProperty(
            '--light-theme-color',
            this.lightThemeColor
          );
        }
      });
  }

  lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = ((num >> 8) & 0x00ff) + amt,
      B = (num & 0x0000ff) + amt;

    return `#${(
      0x1000000 +
      (R > 255 ? 255 : R) * 0x10000 +
      (G > 255 ? 255 : G) * 0x100 +
      (B > 255 ? 255 : B)
    )
      .toString(16)
      .slice(1)}`;
  }

  darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      G = ((num >> 8) & 0x00ff) - amt,
      B = (num & 0x0000ff) - amt;

    return `#${(
      0x1000000 +
      (R < 0 ? 0 : R) * 0x10000 +
      (G < 0 ? 0 : G) * 0x100 +
      (B < 0 ? 0 : B)
    )
      .toString(16)
      .slice(1)}`;
  }

  isActive(url: string): boolean {
    return this.router.url === url;
  }
}
