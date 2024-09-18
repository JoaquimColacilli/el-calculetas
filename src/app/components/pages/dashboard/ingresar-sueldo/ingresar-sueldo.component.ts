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
  validForNextMonth: boolean[] = [true];

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
      salaryDetails?: Array<{
        amount: number;
        currency: string;
        validForNextMonth: boolean;
      }>;
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
      // Si hay sueldos ingresados anteriormente
      this.salaries = [];
      this.selectedCurrencies = [];
      this.isCurrencySelected = [];
      this.validForNextMonth = [];

      this.data.salaryDetails.forEach((detail) => {
        // Evitar sueldos con amount 0
        if (detail.amount > 0) {
          this.salaries.push(`$${detail.amount}`);
          this.selectedCurrencies.push(detail.currency);
          this.isCurrencySelected.push(true);
          this.validForNextMonth.push(detail.validForNextMonth ?? true); // Inicializar con true por defecto
        }
      });

      // Si todos los sueldos tienen amount 0, mostrar un input vacío para ingresar un nuevo sueldo
      if (this.salaries.length === 0) {
        this.salaries.push('');
        this.selectedCurrencies.push('');
        this.isCurrencySelected.push(false);
        this.validForNextMonth.push(true); // Inicializar con true
      }
    } else {
      // Si no hay sueldos anteriores, inicializar con un input vacío
      this.salaries = [''];
      this.selectedCurrencies = [''];
      this.isCurrencySelected = [false];
      this.validForNextMonth = [true];
    }
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  addSalary(): void {
    // Solo agregar un nuevo input si el último sueldo ya tiene moneda seleccionada
    if (this.isCurrencySelected[this.isCurrencySelected.length - 1]) {
      this.salaries.push('');
      this.selectedCurrencies.push('');
      this.isCurrencySelected.push(false);
      this.validForNextMonth.push(true); // Inicializar con true
    } else {
      console.warn('Complete el sueldo anterior antes de agregar uno nuevo.');
    }
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
  }

  saveSalary(): void {
    const salaryDetails = this.salaries
      .map((salary, index) => {
        const value =
          parseFloat(salary.replace(/[^\d,]/g, '').replace(/,/g, '.')) || 0;
        const currency = this.selectedCurrencies[index];
        const validForNextMonth = this.validForNextMonth[index];

        return {
          amount: value,
          currency,
          validForNextMonth,
        };
      })
      .filter((salary) => salary.amount > 0 && salary.currency); // Filtrar solo sueldos con valores válidos

    console.log(salaryDetails);
    // Devolver el array de sueldos válidos
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
    // Eliminar sueldo y todas las propiedades asociadas
    this.salaries.splice(index, 1);
    this.selectedCurrencies.splice(index, 1);
    this.isCurrencySelected.splice(index, 1);
    this.validForNextMonth.splice(index, 1);

    if (this.salaries.length === 0) {
      // Si todos los sueldos se eliminaron, restablecer los arrays
      this.salaries.push('');
      this.selectedCurrencies.push('');
      this.isCurrencySelected.push(false);
      this.validForNextMonth.push(true);
    }

    this.calculateTotalSalaries();
  }
}
