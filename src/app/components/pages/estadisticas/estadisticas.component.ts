import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AsideComponent } from '../../aside/aside.component';
import { PantallaEnConstruccionComponent } from '../../pantalla-en-construccion/pantalla-en-construccion.component';
import { CommonModule } from '@angular/common';
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
export class EstadisticasComponent implements OnInit, AfterViewInit {
  isLoadingData: boolean = false;

  constructor() {}

  ngAfterViewInit(): void {
    this.createBarChart();
    this.createDoughnutChart();
  }

  ngOnInit(): void {
    this.createLineChart();
    this.createBarChart();
    this.createDoughnutChart();
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

  createDoughnutChart(): void {
    const canvas = document.getElementById(
      'doughnutChart'
    ) as HTMLCanvasElement;
    const ctxDoughnut = canvas?.getContext('2d');

    if (ctxDoughnut) {
      new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
          labels: ['Comida', 'Transporte', 'Ocio', 'Ropa', 'Salud'],
          datasets: [
            {
              label: 'Distribución de Gastos',
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
        },
      });
    } else {
      console.error('No se pudo obtener el contexto 2D del canvas');
    }
  }
}
