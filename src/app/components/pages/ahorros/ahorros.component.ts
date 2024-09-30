import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AsideComponent } from '../../aside/aside.component';
import { Router, RouterModule } from '@angular/router';
import { PantallaEnConstruccionComponent } from '../../pantalla-en-construccion/pantalla-en-construccion.component';

@Component({
  selector: 'app-ahorros',
  standalone: true,
  imports: [
    NavbarComponent,
    AsideComponent,
    RouterModule,
    PantallaEnConstruccionComponent,
  ],
  templateUrl: './ahorros.component.html',
  styleUrl: './ahorros.component.css',
})
export class AhorrosComponent {}
