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
  salaries: string[] = [''];
  dolarBolsaVenta: number = 0;
  totalSalaryInDollars: number = 0;
  totalSalaryInArs: number = 0;
  selectedCurrency: string = '';
  selectedCurrencies: string[] = [];
  isCurrencySelected: boolean[] = [false];
  // Arrays para almacenar conversiones de cada salario
  totalSalaryInDollarsArray: number[] = [];
  totalSalaryInArsArray: number[] = [];
  totalCombinedSalaryInArs: number = 0;
  totalCombinedSalaryInDollars: number = 0;

  // Variables para controlar la visualización de conversiones
  showUsdToArs: boolean = false;
  showArsToUsd: boolean = false;

  totalOriginalSalariesInUsd: number = 0;
  totalOriginalSalariesInArs: number = 0;

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
    this.salaries.push('');
    this.isCurrencySelected.push(false);
    this.selectedCurrencies.push('');
  }

  updateSalaries(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value.replace(/[^0-9]/g, '');

    if (value === '') {
      inputElement.placeholder = '$0';
      this.salaries[index] = '';
    } else {
      this.salaries[index] = `$${value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    }

    this.calculateTotalSalaries();
  }

  preventDollarRemoval(event: Event): void {
    const inputElement = event.target as HTMLInputElement;

    if (!inputElement.value.startsWith('$')) {
      inputElement.value = `$${inputElement.value.replace(/[^0-9]/g, '')}`;
    }
  }

  calculateTotalSalaries(): void {
    this.totalSalaryInDollars = 0;
    this.totalSalaryInArs = 0;

    this.salaries.forEach((salary, index) => {
      const value =
        parseFloat(salary.replace(/[^\d,]/g, '').replace(/,/g, '.')) || 0;

      if (this.selectedCurrencies[index] === 'USD') {
        this.totalSalaryInDollars += value;
      } else if (this.selectedCurrencies[index] === 'ARS') {
        this.totalSalaryInArs += value;
      }
    });

    // Asegúrate de que los valores se estén calculando correctamente
    console.log('Total USD:', this.totalSalaryInDollars);
    console.log('Total ARS:', this.totalSalaryInArs);
  }

  saveSalary(): void {
    this.calculateTotalSalaries();

    // Asegúrate de que los valores de totalInDollars y totalInArs sean correctos antes de cerrar
    console.log({
      totalInDollars: this.totalSalaryInDollars,
      totalInArs: this.totalSalaryInArs,
    });

    this.dialogRef.close({
      totalInDollars: this.totalSalaryInDollars,
      totalInArs: this.totalSalaryInArs,
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  selectCurrency(currency: string, index: number): void {
    this.selectedCurrencies[index] = currency;
    this.isCurrencySelected[index] = true;

    // Mostrar la conversión correspondiente
    if (currency === 'USD') {
      this.showUsdToArs = true;
    } else if (currency === 'ARS') {
      this.showArsToUsd = true;
    }
  }

  resetCurrencySelection(index: number): void {
    this.isCurrencySelected[index] = false;
    this.selectedCurrencies[index] = '';
    this.salaries[index] = '';
    this.calculateTotalSalaries();
  }

  showConversions(): boolean {
    return (
      this.selectedCurrencies.some(
        (currency) => currency === 'USD' || currency === 'ARS'
      ) &&
      (this.totalCombinedSalaryInArs > 0 ||
        this.totalCombinedSalaryInDollars > 0)
    );
  }
}
