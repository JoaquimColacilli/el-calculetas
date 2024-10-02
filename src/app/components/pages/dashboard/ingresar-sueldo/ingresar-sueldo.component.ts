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

  lastModified: (Date | null)[] = [];

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
        lastModified?: Date | null;
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
      this.salaries = [];
      this.selectedCurrencies = [];
      this.isCurrencySelected = [];
      this.validForNextMonth = [];
      this.lastModified = [];

      this.data.salaryDetails.forEach((detail) => {
        if (detail.amount > 0) {
          const formattedAmount = this.formatSalary(detail.amount);
          this.salaries.push(`$${formattedAmount}`);
          this.selectedCurrencies.push(detail.currency);
          this.isCurrencySelected.push(true);
          this.validForNextMonth.push(detail.validForNextMonth ?? true);
          this.lastModified.push(
            detail.lastModified ? new Date(detail.lastModified) : null
          );

          console.log(this.lastModified);
        }
      });

      if (this.salaries.length === 0) {
        this.salaries.push('');
        this.selectedCurrencies.push('');
        this.isCurrencySelected.push(false);
        this.validForNextMonth.push(true);
        this.lastModified.push(null);
      }
    } else {
      this.salaries = [''];
      this.selectedCurrencies = [''];
      this.isCurrencySelected = [false];
      this.validForNextMonth = [true];
      this.lastModified = [null];
    }
  }

  // Nueva función para formatear el salario
  formatSalary(amount: number): string {
    const integerPart = Math.floor(amount).toLocaleString('es-ES'); // Formatea los miles
    const decimalPart = (amount % 1).toFixed(2).substring(2); // Asegura dos dígitos decimales
    return `${integerPart},${decimalPart}`;
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
      this.lastModified.push(new Date()); // Añadir fecha de modificación actual
    } else {
      console.warn('Complete el sueldo anterior antes de agregar uno nuevo.');
    }
  }

  updateSalaries(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;

    const previousValue = this.salaries[index];

    let cursorPosition = inputElement.selectionStart || 0;

    let value = inputElement.value.replace(/[^0-9,]/g, '');

    if (value === '') {
      this.salaries[index] = '$0,00';
      return;
    }

    let [integerPart, decimalPart = '00'] = value.split(',');

    decimalPart = decimalPart.substring(0, 2).padEnd(2, '0');

    integerPart = parseInt(integerPart.replace(/\./g, ''), 10).toLocaleString(
      'es-ES'
    );

    const formattedValue = `$${integerPart},${decimalPart}`;

    if (previousValue === formattedValue) {
      return;
    }

    this.salaries[index] = formattedValue;

    inputElement.value = formattedValue;

    if (cursorPosition < inputElement.value.indexOf(',')) {
      cursorPosition += 1;
    }

    inputElement.setSelectionRange(cursorPosition, cursorPosition);

    this.lastModified[index] = new Date();

    this.calculateTotalSalaries();
  }

  handleComma(event: KeyboardEvent): void {
    const inputElement = event.target as HTMLInputElement;

    if (event.key === ',') {
      event.preventDefault();
      const position = inputElement.value.indexOf(',');
      if (position !== -1) {
        inputElement.setSelectionRange(position + 1, position + 1);
      }
    }
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
        const previousValue = this.data.salaryDetails?.[index]?.amount || 0;
        const value =
          parseFloat(salary.replace(/[^\d,]/g, '').replace(/,/g, '.')) || 0;
        const currency = this.selectedCurrencies[index];
        const validForNextMonth = this.validForNextMonth[index];

        const lastModified =
          previousValue !== value
            ? new Date().toISOString()
            : this.lastModified[index]?.toISOString() ||
              new Date().toISOString();

        return {
          amount: value,
          currency,
          validForNextMonth,
          lastModified,
        };
      })
      .filter((salary) => salary.amount > 0 && salary.currency);

    console.log(salaryDetails);
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
