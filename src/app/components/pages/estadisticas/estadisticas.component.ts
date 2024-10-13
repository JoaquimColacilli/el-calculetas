import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AsideComponent } from '../../aside/aside.component';
import { PantallaEnConstruccionComponent } from '../../pantalla-en-construccion/pantalla-en-construccion.component';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../../services/finance.service';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs, 'es');

const monthTranslations: { [key: string]: string } = {
  January: 'Enero',
  February: 'Febrero',
  March: 'Marzo',
  April: 'Abril',
  May: 'Mayo',
  June: 'Junio',
  July: 'Julio',
  August: 'Agosto',
  September: 'Septiembre',
  October: 'Octubre',
  November: 'Noviembre',
  December: 'Diciembre',
};

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [
    NavbarComponent,
    AsideComponent,
    PantallaEnConstruccionComponent,
    CommonModule,
    FontAwesomeModule,
  ],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.css'],
})
export class EstadisticasComponent implements OnInit {
  isLoadingData: boolean = false;
  totalGastosARS: number = 0;
  totalGastosUSD: number = 0;
  doughnutChartARS: Chart<'doughnut', number[], string> | null = null;
  doughnutChartUSD: Chart<'doughnut', number[], string> | null = null;
  expensesByCategoryARS: { [category: string]: number } = {};
  expensesByCategoryUSD: { [category: string]: number } = {};
  currentMonth: string = moment().format('MMMM, YYYY');

  constructor(private financeService: FinanceService, library: FaIconLibrary) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.isLoadingData = true;
    this.loadFinanceExpenses(this.currentMonth);
    this.loadExpensesByCategory(this.currentMonth);
  }

  loadFinanceExpenses(month: string) {
    this.financeService.getTotalExpenses(month).subscribe((totals) => {
      this.totalGastosARS = totals.totalARS;
      this.totalGastosUSD = totals.totalUSD;
    });
  }

  loadExpensesByCategory(month: string) {
    this.financeService
      .getExpensesByCategory(month)
      .subscribe((categoryData) => {
        this.expensesByCategoryARS = categoryData['ARS'] || {};
        this.expensesByCategoryUSD = categoryData['USD'] || {};

        this.isLoadingData = false;

        setTimeout(() => {
          this.createDoughnutChartARS();
          this.createDoughnutChartUSD();
        }, 0);
      });
  }

  createDoughnutChartARS(): void {
    const canvas = document.getElementById(
      'doughnutChartARS'
    ) as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (this.doughnutChartARS) {
        this.doughnutChartARS.destroy();
      }
      if (ctx) {
        const categories = Object.keys(this.expensesByCategoryARS);
        const values = Object.values(this.expensesByCategoryARS);
        const config: ChartConfiguration<'doughnut', number[], string> = {
          type: 'doughnut',
          data: {
            labels: categories,
            datasets: [
              {
                data: values,
                backgroundColor: [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF',
                  '#FF9F40',
                  '#C9CBCF',
                  '#F7464A',
                  '#46BFBD',
                  '#FDB45C',
                  '#949FB1',
                  '#4D5360',
                  '#6B8E23',
                  '#DAA520',
                  '#8A2BE2',
                  '#FF4500',
                  '#2E8B57',
                  '#20B2AA',
                  '#9370DB',
                  '#4682B4',
                  '#00FA9A',
                ],
              },
            ],
          },
        };
        this.doughnutChartARS = new Chart(ctx, config);
      }
    }
  }

  createDoughnutChartUSD(): void {
    const canvas = document.getElementById(
      'doughnutChartUSD'
    ) as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (this.doughnutChartUSD) {
        this.doughnutChartUSD.destroy();
      }
      if (ctx) {
        const categories = Object.keys(this.expensesByCategoryUSD);
        const values = Object.values(this.expensesByCategoryUSD);
        const config: ChartConfiguration<'doughnut', number[], string> = {
          type: 'doughnut',
          data: {
            labels: categories,
            datasets: [
              {
                data: values,
                backgroundColor: [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF',
                  '#FF9F40',
                  '#C9CBCF',
                  '#F7464A',
                  '#46BFBD',
                  '#FDB45C',
                  '#949FB1',
                  '#4D5360',
                  '#6B8E23',
                  '#DAA520',
                  '#8A2BE2',
                  '#FF4500',
                  '#2E8B57',
                  '#20B2AA',
                  '#9370DB',
                  '#4682B4',
                  '#00FA9A',
                ],
              },
            ],
          },
        };
        this.doughnutChartUSD = new Chart(ctx, config);
      }
    }
  }

  hasExpensesARS(): boolean {
    return Object.keys(this.expensesByCategoryARS).length > 0;
  }

  hasExpensesUSD(): boolean {
    return Object.keys(this.expensesByCategoryUSD).length > 0;
  }

  previousMonth() {
    const newDate = moment(this.currentMonth, 'MMMM, YYYY').subtract(
      1,
      'months'
    );
    this.currentMonth = newDate.format('MMMM, YYYY');
    this.reloadExpenses(); // Recarga los datos del mes anterior
  }

  nextMonth() {
    const newDate = moment(this.currentMonth, 'MMMM, YYYY').add(1, 'months');
    this.currentMonth = newDate.format('MMMM, YYYY');
    this.reloadExpenses(); // Recarga los datos del siguiente mes
  }

  reloadExpenses(): void {
    this.isLoadingData = true;
    this.loadFinanceExpenses(this.currentMonth); // Llamamos el método con el mes actual
    this.loadExpensesByCategory(this.currentMonth); // Llamamos el método con el mes actual
  }

  translateMonthToSpanish(month: string): string {
    const [englishMonth, year] = month.split(', ');
    const spanishMonth = monthTranslations[englishMonth];
    return `${spanishMonth}, ${year}`;
  }
}
