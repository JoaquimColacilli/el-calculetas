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

  totalSalaryInDollarsArray: number[] = [];
  totalSalaryInArsArray: number[] = [];
  totalCombinedSalaryInArs: number = 0;
  totalCombinedSalaryInDollars: number = 0;

  showUsdToArs: boolean = false;
  showArsToUsd: boolean = false;

  totalOriginalSalariesInUsd: number = 0;
  totalOriginalSalariesInArs: number = 0;

  showCurrencySelectionOnce: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<IngresarSueldoComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      dolarBolsaVenta: number;
      salaryDetails?: Array<{ amount: number; currency: string }>;
    },
    library: FaIconLibrary
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.dolarBolsaVenta = this.data.dolarBolsaVenta;

    if (
      Array.isArray(this.data.salaryDetails) &&
      this.data.salaryDetails.length > 0
    ) {
      const allZeros = this.data.salaryDetails.every(
        (detail) => detail.amount === 0
      );

      if (allZeros) {
        this.showCurrencySelectionOnce = true; // Mostrar solo una vez si todos los sueldos son 0
        this.salaries = [''];
        this.isCurrencySelected = [false];
        this.selectedCurrencies = [''];
      } else {
        // Si hay valores, inicializamos los sueldos como antes
        this.salaries = this.data.salaryDetails.map((detail) => {
          return detail.amount === 0 ? '' : `$${detail.amount}`;
        });
        this.selectedCurrencies = this.data.salaryDetails.map(
          (detail) => detail.currency
        );
        this.isCurrencySelected = this.selectedCurrencies.map(
          (currency, index) => {
            return this.salaries[index] !== ''; // Solo seleccionamos si hay un valor
          }
        );
      }
    } else {
      this.salaries = [''];
      this.isCurrencySelected = [false];
      this.selectedCurrencies = [''];
    }
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

    console.log('Total USD:', this.totalSalaryInDollars);
    console.log('Total ARS:', this.totalSalaryInArs);
  }

  saveSalary(): void {
    const salaryDetails = this.salaries.map((salary, index) => {
      const value =
        parseFloat(salary.replace(/[^\d,]/g, '').replace(/,/g, '.')) || 0;
      const currency = this.selectedCurrencies[index];

      return {
        amount: value,
        currency: currency,
      };
    });

    console.log(salaryDetails); // Verificar el array de objetos

    this.dialogRef.close(salaryDetails);
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

  removeSalary(index: number): void {
    this.salaries.splice(index, 1);
    this.selectedCurrencies.splice(index, 1);
    this.isCurrencySelected.splice(index, 1);

    if (this.salaries.length === 0) {
      this.salaries.push('');
      this.isCurrencySelected.push(false);
      this.selectedCurrencies.push('');
    }

    this.calculateTotalSalaries();
  }
}
