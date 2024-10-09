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
  styleUrl: './estadisticas.component.css',
})
export class EstadisticasComponent implements OnInit {
  isLoadingData: boolean = false;
  totalGastosARS: number = 0;
  totalGastosUSD: number = 0;
  doughnutChart: Chart<'doughnut', number[], string> | null = null;
  expensesByCategory: { [category: string]: number } = {};

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    this.createLineChart();
    this.createBarChart();
    this.createDoughnutChart();
    this.loadExpensesByCategory();
    this.loadFinanceExpenses();
  }

  loadFinanceExpenses() {
    this.financeService.getTotalExpenses().subscribe((totals) => {
      this.totalGastosARS = totals.totalARS;
      this.totalGastosUSD = totals.totalUSD;
    });
  }

  loadExpensesByCategory() {
    this.financeService.getExpensesByCategory().subscribe((categoryData) => {
      this.expensesByCategory = categoryData;
      this.createDoughnutChart();
    });
  }

  createLineChart(): void {
    const canvas = document.getElementById('lineChart') as HTMLCanvasElement;
    const ctxLine = canvas?.getContext('2d');

    if (ctxLine) {
      const chartConfig: ChartConfiguration = {
        type: 'line',
        data: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June'],
          datasets: [
            {
              label: 'Sales',
              data: [65, 59, 80, 81, 56, 55],
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      };

      new Chart(ctxLine, chartConfig);
    } else {
      console.error('No se pudo obtener el contexto 2D del canvas');
    }
  }

  createBarChart(): void {
    const canvas = document.getElementById('barChart') as HTMLCanvasElement;
    const ctxBar = canvas?.getContext('2d');

    if (ctxBar) {
      new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: ['Comida', 'Transporte', 'Ocio', 'Ropa', 'Salud'],
          datasets: [
            {
              label: 'Gastos por Categoría',
              data: [300, 150, 200, 100, 250],
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
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    } else {
      console.error('No se pudo obtener el contexto 2D del canvas');
    }
  }

  updateDoughnutChart(): void {
    if (this.doughnutChart) {
      this.doughnutChart.data.datasets[0].data = [
        this.totalGastosARS,
        this.totalGastosUSD,
      ];
      this.doughnutChart.update();
    }
  }

  createDoughnutChart(): void {
    const canvas = document.getElementById(
      'doughnutChart'
    ) as HTMLCanvasElement;
    const ctxDoughnut = canvas?.getContext('2d');

    // Destruir el gráfico previo si existe
    if (this.doughnutChart) {
      this.doughnutChart.destroy();
    }

    if (ctxDoughnut) {
      const categories = Object.keys(this.expensesByCategory);
      const categoryValues = Object.values(this.expensesByCategory);

      const config: ChartConfiguration<'doughnut', number[], string> = {
        type: 'doughnut',
        data: {
          labels: categories,
          datasets: [
            {
              label: 'Gastos por Categoría',
              data: categoryValues,
              backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FFA07A',
                '#8A2BE2',
                '#00FA9A',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          animation: {
            animateScale: true,
          },
        },
      };

      // Crear un nuevo gráfico después de destruir el anterior
      this.doughnutChart = new Chart(ctxDoughnut, config);
    }
  }
}
