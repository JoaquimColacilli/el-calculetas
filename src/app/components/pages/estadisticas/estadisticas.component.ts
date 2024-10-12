import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AsideComponent } from '../../aside/aside.component';
import { PantallaEnConstruccionComponent } from '../../pantalla-en-construccion/pantalla-en-construccion.component';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../../services/finance.service';
import { Chart, ChartConfiguration } from 'chart.js/auto';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [
    NavbarComponent,
    AsideComponent,
    PantallaEnConstruccionComponent,
    CommonModule,
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

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    this.isLoadingData = true;
    this.loadFinanceExpenses();
    this.loadExpensesByCategory();
  }

  loadFinanceExpenses() {
    this.financeService.getTotalExpenses().subscribe((totals) => {
      this.totalGastosARS = totals.totalARS;
      this.totalGastosUSD = totals.totalUSD;
    });
  }

  loadExpensesByCategory() {
    this.financeService.getExpensesByCategory().subscribe((categoryData) => {
      this.expensesByCategoryARS = categoryData['ARS'] || {};
      this.expensesByCategoryUSD = categoryData['USD'] || {};

      this.isLoadingData = false;

      // Renderiza los gráficos con un ligero retardo para asegurarse de que el DOM esté actualizado.
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
}
