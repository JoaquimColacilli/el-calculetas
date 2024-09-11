import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-ingresar-sueldo',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './ingresar-sueldo.component.html',
  styleUrls: ['./ingresar-sueldo.component.css'],
})
export class IngresarSueldoComponent implements OnInit {
  salaries: string[] = ['']; // Lista de sueldos ingresados
  dolarBolsaVenta: number = 0;
  totalSalaryInDollars: number = 0;

  constructor(
    public dialogRef: MatDialogRef<IngresarSueldoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { dolarBolsaVenta: number },
    library: FaIconLibrary
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.dolarBolsaVenta = this.data.dolarBolsaVenta;
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  addSalary(): void {
    // Agrega un nuevo input de sueldo vacío
    this.salaries.push('');
  }

  updateSalaries(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value.replace(/[^0-9]/g, '');

    // Actualiza el valor directamente para evitar perder el focus
    if (value === '') {
      inputElement.placeholder = '$0'; // Asegura que el placeholder sea "$0" cuando está vacío
      this.salaries[index] = '';
    } else {
      this.salaries[index] = `$${value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    }

    // Actualiza el cálculo total
    this.calculateTotalSalaryInDollars();
  }

  preventDollarRemoval(event: Event): void {
    const inputElement = event.target as HTMLInputElement;

    if (!inputElement.value.startsWith('$')) {
      inputElement.value = `$${inputElement.value.replace(/[^0-9]/g, '')}`;
    }
  }

  calculateTotalSalaryInDollars(): void {
    let total = 0;
    this.salaries.forEach((salary) => {
      total += parseFloat(salary.replace(/[^\d]/g, '')) || 0;
    });

    this.totalSalaryInDollars =
      this.dolarBolsaVenta > 0 ? total / this.dolarBolsaVenta : 0;
  }

  saveSalary(): void {
    this.calculateTotalSalaryInDollars();
    this.dialogRef.close({
      salaries: this.salaries,
      totalInDollars: this.totalSalaryInDollars,
    });

    console.log(this.salaries);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
