import { Component } from '@angular/core';
import { AsideComponent } from '../../aside/aside.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import {
  FontAwesomeModule,
  FaIconComponent,
  FaIconLibrary,
} from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { fas } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-papelera-temporal',
  standalone: true,
  imports: [
    AsideComponent,
    NavbarComponent,
    CommonModule,
    FontAwesomeModule,
    FaIconComponent,
  ],
  templateUrl: './papelera-temporal.component.html',
  styleUrl: './papelera-temporal.component.css',
})
export class PapeleraTemporalComponent {
  items = [{ name: 'Almuerzo', deletedAt: '25/09/2024' }];
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas);
  }

  getDaysUntilDeletion(deletedAt: string): number {
    // Convertir la fecha de formato dd/mm/yyyy a mm/dd/yyyy
    const [day, month, year] = deletedAt.split('/');
    const deletedDate = new Date(`${month}/${day}/${year}`);

    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - deletedDate.getTime());
    const diffDays = 10 - Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
