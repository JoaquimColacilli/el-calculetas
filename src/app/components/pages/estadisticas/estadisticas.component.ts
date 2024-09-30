import { Component } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AsideComponent } from '../../aside/aside.component';
import { PantallaEnConstruccionComponent } from '../../pantalla-en-construccion/pantalla-en-construccion.component';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [NavbarComponent, AsideComponent, PantallaEnConstruccionComponent],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css',
})
export class EstadisticasComponent {}
