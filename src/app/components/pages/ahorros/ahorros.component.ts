import { Component, OnInit } from '@angular/core';
import { AhorrosService } from '../../../services/ahorros.service';
import { AhorroInterface } from '../../../interfaces/ahorro.interface';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AsideComponent } from '../../aside/aside.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NumberFormatPipe } from '../../../pipes/number-format.pipe';
import { DineroEnCuentaService } from '../../../services/dinero-en-cuenta.service';
import { FinanceInterface } from '../../../interfaces/finance.interface';
import { FinanceService } from '../../../services/finance.service';
import { SueldoService } from '../../../services/sueldo.service';

@Component({
  selector: 'app-ahorros',
  templateUrl: './ahorros.component.html',
  styleUrls: ['./ahorros.component.css'],
  imports: [
    NavbarComponent,
    AsideComponent,
    RouterModule,
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    NumberFormatPipe,
  ],
  standalone: true,
})
export class AhorrosComponent implements OnInit {
  public isLoadingData: boolean = false;
  public conversiones: AhorroInterface[] = [];
  public totalAhorrosUSD: number = 0;
  public ahorrosDelMes: number = 0;
  public metaAhorro: number = 10;
  public totalIngresos: number = 0;
  public totalIngresosUSD: number = 0;
  public dineroRestante: number = 0;
  public dineroRestanteUSD: number = 0;
  public dineroRestanteARS: number = 0;
  public isModalCompraOpen: boolean = false;
  public isModalVentaOpen: boolean = false;
  previousMontoARS: number = 0;
  public montoARS: number = 0;
  public montoUSD: number = 0;
  public tasaConversion: number = 0;

  salaryDetails: Array<{
    amount: number;
    currency: string;
    validForNextMonth: boolean;
    lastModified?: Date;
  }> = [];
  financeItems: FinanceInterface[] = [];

  constructor(
    private ahorrosService: AhorrosService,
    private financeService: FinanceService,
    private sueldoService: SueldoService
  ) {}
  totalDineroEnCuentaUSD: number = 0;

  ngOnInit(): void {
    this.loadSalaries();
    this.loadAhorros();
    this.loadExpenses();
    this.calculateDineroRestante();
    this.calculateDineroRestanteUsd();
    this.calcularTotales();
  }

  loadSalaries(): void {
    this.sueldoService.getSalaries().subscribe({
      next: (salariesData) => {
        const salaries = salariesData?.salaries || [];

        this.salaryDetails = salaries;

        this.totalIngresos = 0;
        this.totalIngresosUSD = 0;

        salaries.forEach((salary: any) => {
          if (salary.currency === 'USD') {
            this.totalIngresosUSD += salary.amount;
          } else if (salary.currency === 'ARS') {
            this.totalIngresos += salary.amount;
          }
        });

        this.totalDineroEnCuentaUSD = this.totalIngresosUSD;

        console.log('Total Ingresos ARS:', this.totalIngresos);
        console.log('Total Dinero en Cuenta USD:', this.totalDineroEnCuentaUSD);

        this.calculateDineroRestante();
        this.calculateDineroRestanteUsd();
      },
      error: (error) => {
        console.error('Error al cargar los sueldos desde Firebase:', error);
      },
    });
  }
  loadAhorros(): void {
    this.isLoadingData = true;
    this.ahorrosService.getAhorros().subscribe({
      next: (ahorros) => {
        this.conversiones = ahorros;
        this.calcularTotales();
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('Error al cargar ahorros:', error);
        this.isLoadingData = false;
      },
    });
  }

  calculateDineroRestante(): number {
    const gastosPagadosEsteMes = this.financeItems.filter((item) => {
      return item.status === 'Pagado' && item.currency === 'ARS';
    });

    const totalPagadoEsteMes = gastosPagadosEsteMes.reduce(
      (acc, item) => acc + parseFloat(String(item.value)),
      0
    );

    const totalAhorrosArs = this.conversiones.reduce((acc, ahorro) => {
      if (ahorro.isCompra) {
        return acc - (ahorro.montoArs || 0);
      } else if (ahorro.isVenta) {
        return acc + (ahorro.montoArs || 0);
      }
      return acc;
    }, 0);

    this.dineroRestante =
      this.totalIngresos - totalPagadoEsteMes + totalAhorrosArs;

    console.log('Dinero restante en ARS:', this.dineroRestante);

    return this.dineroRestante;
  }

  calculateDineroRestanteUsd(): number {
    const now = new Date();

    const totalGastosUsd = this.financeItems
      .filter((item) => {
        const itemDate = this.parseDate(item.date);
        return (
          item.status === 'Pagado' &&
          item.currency === 'USD' &&
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth()
        );
      })
      .reduce((acc, item) => acc + parseFloat(String(item.value)), 0);

    const totalAhorrosUsd = this.conversiones.reduce((acc, ahorro) => {
      if (ahorro.isCompra) {
        return acc + (ahorro.montoUsd || 0);
      } else if (ahorro.isVenta) {
        return acc - Math.abs(ahorro.montoUsd || 0);
      }
      return acc;
    }, 0);

    this.dineroRestanteUSD =
      this.totalIngresosUSD + totalAhorrosUsd - totalGastosUsd;

    console.log('Dinero restante en USD:', this.dineroRestanteUSD);

    return this.dineroRestanteUSD;
  }

  calcularTotales(): void {
    this.totalAhorrosUSD = this.conversiones.reduce(
      (acc, ahorro) => acc + ahorro.montoUsd,
      0
    );
    this.ahorrosDelMes = this.conversiones
      .filter((ahorro) => {
        const ahorroDate = new Date(ahorro.timestamp);
        const currentDate = new Date();
        return (
          ahorroDate.getMonth() === currentDate.getMonth() &&
          ahorroDate.getFullYear() === currentDate.getFullYear()
        );
      })
      .reduce((acc, ahorro) => acc + ahorro.montoUsd, 0);
  }

  loadExpenses(): void {
    this.isLoadingData = true;
    this.financeService.getExpenses().subscribe({
      next: (expenses: any) => {
        this.financeItems = expenses.map((expense: any) => {
          const numericValue = parseFloat(String(expense.value));
          return {
            ...expense,
            value: String(numericValue),
          };
        });
        this.calculateDineroRestante();
        this.calculateDineroRestanteUsd();

        this.isLoadingData = false;
      },
      error: (error: any) => {
        console.error('Error cargando los gastos:', error);
        this.isLoadingData = false;
      },
    });
  }

  calcularPorcentajeAhorro(): number {
    return (this.totalAhorrosUSD / this.metaAhorro) * 100;
  }

  abrirModalCompra(): void {
    this.isModalCompraOpen = true;
    this.montoARS = 0;
    this.tasaConversion = 0;
  }

  cerrarModalCompra(): void {
    this.isModalCompraOpen = false;
  }

  abrirModalVenta(): void {
    this.isModalVentaOpen = true;
    this.montoUSD = 0;
    this.tasaConversion = 0;
  }

  cerrarModalVenta(): void {
    this.isModalVentaOpen = false;
  }

  parseDate(dateString: string): Date {
    let date;
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date('Invalid Date');
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  convertirAhorro(): void {
    if (!this.isCompraValida()) {
      return;
    }

    const montoUSD = this.montoARS / this.tasaConversion;

    this.dineroRestante -= this.montoARS;

    this.dineroRestanteUSD += montoUSD;

    const nuevoAhorro: AhorroInterface = {
      timestamp: new Date(),
      montoArs: this.montoARS,
      montoUsd: montoUSD,
      valorUsdActual: this.tasaConversion,
      isCompra: true,
      isVenta: false,
    };

    this.ahorrosService.addAhorro(nuevoAhorro).subscribe({
      next: (docRef) => {
        this.conversiones.unshift(nuevoAhorro);
        this.calcularTotales();
        this.calculateDineroRestante();
        this.calculateDineroRestanteUsd();
        this.cerrarModalCompra();
      },
      error: (error) => {
        console.error('Error al agregar ahorro:', error);
      },
    });
  }

  venderAhorro(): void {
    const montoARS = this.montoUSD * this.tasaConversion;

    this.dineroRestante += montoARS;

    const nuevoAhorro: AhorroInterface = {
      timestamp: new Date(),
      montoArs: montoARS,
      montoUsd: -this.montoUSD,
      valorUsdActual: this.tasaConversion,
      isCompra: false,
      isVenta: true,
    };

    this.ahorrosService.addAhorro(nuevoAhorro).subscribe({
      next: (docRef) => {
        this.conversiones.unshift(nuevoAhorro);
        this.calcularTotales();
        this.calculateDineroRestante();
        this.calculateDineroRestanteUsd();
        this.cerrarModalVenta();
      },
      error: (error) => {
        console.error('Error al registrar la venta:', error);
      },
    });
  }

  isCompraValida(): boolean {
    return this.montoARS <= this.dineroRestante && this.montoARS > 0;
  }

  actualizarMontoUSD(): void {
    this.montoUSD = this.montoARS / this.tasaConversion;

    if (this.montoARS > this.previousMontoARS) {
      this.dineroRestante -= this.montoARS - this.previousMontoARS;
    } else {
      this.dineroRestante += this.previousMontoARS - this.montoARS;
    }

    this.previousMontoARS = this.montoARS;
  }
  editarConversion(conversion: AhorroInterface): void {}

  eliminarConversion(conversion: AhorroInterface): void {}

  convertTimestampToDate(timestamp: any): string {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    return '';
  }
}
