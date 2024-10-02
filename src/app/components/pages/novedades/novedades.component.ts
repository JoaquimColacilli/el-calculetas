import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PantallaEnConstruccionComponent } from '../../pantalla-en-construccion/pantalla-en-construccion.component';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule, PantallaEnConstruccionComponent],
  templateUrl: './novedades.component.html',
  styleUrl: './novedades.component.css',
})
export class NovedadesComponent {}
