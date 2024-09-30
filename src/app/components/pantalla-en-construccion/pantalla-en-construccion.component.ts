import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { AsideComponent } from '../aside/aside.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-pantalla-en-construccion',
  standalone: true,
  imports: [NavbarComponent, AsideComponent, RouterModule],
  templateUrl: './pantalla-en-construccion.component.html',
  styleUrl: './pantalla-en-construccion.component.css',
})
export class PantallaEnConstruccionComponent implements OnInit {
  clickCount: number = 0;

  ngOnInit() {
    // Lógica para manejar el click en el ícono
    const interactiveIcon = document.getElementById('interactiveIcon');
    const clickCounter = document.getElementById('clickCount');

    if (interactiveIcon && clickCounter) {
      interactiveIcon.addEventListener('click', () => {
        this.clickCount++;
        clickCounter.textContent = this.clickCount.toString();
      });
    }
  }
}
