import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PantallaEnConstruccionComponent } from '../../pantalla-en-construccion/pantalla-en-construccion.component';
import { AsideComponent } from '../../aside/aside.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [
    CommonModule,
    PantallaEnConstruccionComponent,
    AsideComponent,
    NavbarComponent,
    FontAwesomeModule,
    FormsModule,
  ],
  templateUrl: './novedades.component.html',
  styleUrl: './novedades.component.css',
})
export class NovedadesComponent {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas);
  }
}
