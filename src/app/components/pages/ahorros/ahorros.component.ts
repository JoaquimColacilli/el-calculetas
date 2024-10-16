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
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import moment from 'moment';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { MetaAhorroInterface } from '../../../interfaces/meta.ahorro.interface';
import { AhorroApiService } from '../../../services/ahorro-api.service';

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
  public totalIngresos: number = 0;
  public totalIngresosUSD: number = 0;
  public dineroRestante: number = 0;
  public dineroRestanteUSD: number = 0;
  public dineroRestanteARS: number = 0;
  public isModalCompraOpen: boolean = false;
  public isModalVentaOpen: boolean = false;
  public previousMontoARS: number = 0;
  public montoARS: number = 0;
  public montoUSD: number = 0;
  public tasaConversion: number = 0;
  public dineroPrevio: number = 0;
  public dineroPrevioUSD: number = 0;
  public totalDineroEnCuentaUSD: number = 0;
  public isDeleteModalOpen = false;
  public conversionEditadaId: string | null = null;
  currentMonth: string = moment().format('MMMM, YYYY');

  public metaAhorro: number | null = null;
  public metaAhorroId: string | null = null;

  public isDeleteMetaModalOpen: boolean = false;

  public allConversiones: AhorroInterface[] = [];

  quote: string = '';
  author: string = '';

  public isMetaModalOpen: boolean = false;
  public conversionAEliminar: AhorroInterface | null = null;
  salaryDetails: Array<{
    amount: number;
    currency: string;
    validForNextMonth: boolean;
    lastModified?: Date;
  }> = [];
  financeItems: FinanceInterface[] = [];

  constructor(
    library: FaIconLibrary,
    private ahorrosService: AhorrosService,
    private financeService: FinanceService,
    private sueldoService: SueldoService,
    private ahorroApiService: AhorroApiService
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.loadAllAhorros();
    this.loadSalaries();
    this.loadAhorrosPorMes(this.currentMonth);
    this.loadExpenses();
    this.calculateDineroRestante();
    this.calculateDineroRestanteUsd();
    this.calcularTotales();
    this.loadMetaAhorroPorMes(this.currentMonth);
    this.obtenerYTraducirCita();
  }

  obtenerYTraducirCita() {
    this.ahorroApiService.getQuote('money').subscribe(
      (response: any) => {
        if (response.length > 0) {
          const originalQuote = response[0].quote;
          console.log(originalQuote);
          this.author = response[0].author;

          this.ahorroApiService.translateText(originalQuote, 'ES').subscribe(
            (translateResponse: any) => {
              if (
                translateResponse.translations &&
                translateResponse.translations.length > 0
              ) {
                this.quote = translateResponse.translations[0].text;
              } else {
                this.quote = originalQuote;
              }
              console.log('Cita traducida:', this.quote);
            },
            (error) => {
              console.error('Error al traducir la cita:', error);
              this.quote = originalQuote;
            }
          );
        } else {
          console.error('No se encontraron citas en la respuesta.');
        }

        console.log('Autor:', this.author);
      },
      (error) => {
        console.error('Error al obtener la cita:', error);
      }
    );
  }

  reloadQuote() {
    this.obtenerYTraducirCita();
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

  loadMetaAhorroPorMes(month: string): void {
    this.ahorrosService.getMetaAhorroPorMes(month).subscribe({
      next: (meta) => {
        if (meta) {
          this.metaAhorro = meta.value;
          this.metaAhorroId = meta.id || null;
        } else {
          this.metaAhorro = null;
          this.metaAhorroId = null;
        }
      },
      error: (error) => {
        console.error('Error al cargar la meta de ahorro:', error);
      },
    });
  }

  loadAhorrosPorMes(month: string): void {
    this.isLoadingData = true;
    this.ahorrosService.getAhorrosPorMes(month).subscribe({
      next: (ahorros) => {
        this.conversiones = ahorros;
        this.calcularTotales();
        this.calculateDineroRestante();
        this.calculateDineroRestanteUsd();
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('Error al cargar ahorros por mes:', error);
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

  calculateWaveTop() {
    return `${100 - this.calcularPorcentajeAhorro()}%`;
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
    // Total acumulado de ahorros en USD (todas las conversiones)
    this.totalAhorrosUSD = this.allConversiones.reduce((acc, ahorro) => {
      return acc + (ahorro.montoUsd || 0);
    }, 0);

    // Total de ahorros del mes seleccionado
    this.ahorrosDelMes = this.conversiones.reduce((acc, ahorro) => {
      return acc + (ahorro.montoUsd || 0);
    }, 0);
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
        this.calcularTotales();
        this.isLoadingData = false;
      },
      error: (error: any) => {
        console.error('Error cargando los gastos:', error);
        this.isLoadingData = false;
      },
    });
  }

  loadAllAhorros(): void {
    this.isLoadingData = true;
    this.ahorrosService.getAllAhorros().subscribe({
      next: (ahorros) => {
        this.allConversiones = ahorros;
        this.calcularTotales();
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('Error al cargar todos los ahorros:', error);
        this.isLoadingData = false;
      },
    });
  }

  abrirModalMeta(): void {
    this.isMetaModalOpen = true;
  }

  cerrarModalMeta(): void {
    this.isMetaModalOpen = false;
  }

  calcularPorcentajeAhorro(): number {
    if (!this.metaAhorro || this.metaAhorro === 0) {
      return 0;
    }
    return parseFloat(
      ((this.totalAhorrosUSD / this.metaAhorro) * 100).toFixed(2)
    );
  }

  abrirModalCompra(): void {
    this.isModalCompraOpen = true;
    this.montoARS = 0;
    this.montoUSD = 0;
    this.tasaConversion = 0;
    this.dineroPrevio = this.dineroRestante;
  }

  abrirModalVenta(): void {
    this.isModalVentaOpen = true;
    this.montoUSD = 0;
    this.montoARS = 0;
    this.tasaConversion = 0;
    this.dineroPrevioUSD = this.dineroRestanteUSD;
  }

  cerrarModalCompra(): void {
    this.isModalCompraOpen = false;
    this.loadAhorrosPorMes(this.currentMonth);
  }

  cerrarModalVenta(): void {
    this.isModalVentaOpen = false;
    this.loadAhorrosPorMes(this.currentMonth);
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
        Swal.fire({
          position: 'top',
          icon: 'success',
          text: `Has comprado ${montoUSD.toFixed(
            2
          )} USD por ${this.montoARS.toFixed(2)} ARS`,
          showConfirmButton: false,
          timer: 3000,
          toast: true,
        });
      },
      error: (error) => {
        console.error('Error al agregar ahorro:', error);
      },
    });
  }

  venderAhorro(): void {
    if (!this.isVentaValida()) {
      return;
    }

    const montoARS = this.montoUSD * this.tasaConversion;

    this.dineroRestanteUSD -= this.montoUSD;
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
      next: () => {
        this.conversiones.unshift(nuevoAhorro);
        this.calcularTotales();
        this.calculateDineroRestante();
        this.calculateDineroRestanteUsd();
        this.cerrarModalVenta();
        Swal.fire({
          position: 'top',
          icon: 'success',
          text: `Has vendido ${this.montoUSD.toFixed(
            2
          )} USD por ${montoARS.toFixed(2)} ARS`,
          showConfirmButton: false,
          timer: 3000,
          toast: true,
        });
      },
      error: (error) => {
        console.error('Error al registrar la venta:', error);
      },
    });
  }

  guardarConversionEditada(id: string | null, isCompra: boolean): void {
    if (!id) return;

    const updatedAhorro: Partial<AhorroInterface> = {
      montoArs: this.montoARS,
      montoUsd: this.montoUSD,
      valorUsdActual: this.tasaConversion,
    };

    this.ahorrosService.updateAhorro(id, updatedAhorro).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Actualización exitosa',
          text: 'La conversión ha sido actualizada correctamente.',
          timer: 2000,
          showConfirmButton: false,
        });
        this.loadAhorrosPorMes(this.currentMonth);
        this.cerrarModalCompra();
        this.cerrarModalVenta();
      },
      error: (error) => {
        console.error('Error al actualizar el ahorro:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el ahorro.',
        });
      },
    });
  }

  isCompraValida(): boolean {
    return this.montoARS <= this.dineroPrevio && this.montoARS > 0;
  }

  isVentaValida(): boolean {
    return this.montoUSD <= this.dineroPrevioUSD && this.montoUSD > 0;
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

  actualizarMontoARS(): void {
    this.montoARS = this.montoUSD * this.tasaConversion;

    if (this.montoUSD > this.dineroPrevioUSD) {
      this.dineroRestanteUSD -= this.montoUSD - this.dineroPrevioUSD;
    } else {
      this.dineroRestanteUSD += this.dineroPrevioUSD - this.montoUSD;
    }

    this.dineroRestanteUSD = this.dineroPrevioUSD - this.montoUSD;
  }

  getSaldoRestanteClass(): string {
    const porcentaje = (this.dineroRestante / this.dineroPrevio) * 100;

    if (porcentaje >= 75) {
      return 'text-green-600 bg-green-50';
    } else if (porcentaje >= 25) {
      return 'text-yellow-600 bg-yellow-50';
    } else {
      return 'text-red-600 bg-red-50';
    }
  }

  getSaldoRestanteUSDClass(): string {
    const porcentaje = (this.dineroRestanteUSD / this.dineroPrevioUSD) * 100;

    if (porcentaje >= 75) {
      return 'text-green-600 bg-green-50';
    } else if (porcentaje >= 25) {
      return 'text-yellow-600 bg-yellow-50';
    } else {
      return 'text-red-600 bg-red-50';
    }
  }

  editarConversion(conversion: AhorroInterface): void {
    // Asigna el id de la conversión editada
    this.conversionEditadaId = conversion.id ?? null;

    if (conversion.isCompra) {
      // Abre el modal de compra y carga los valores
      this.isModalCompraOpen = true;
      this.montoARS = conversion.montoArs || 0;
      this.montoUSD = conversion.montoUsd || 0;
      this.tasaConversion = conversion.valorUsdActual || 0;
      this.dineroPrevio = this.dineroRestante;
    } else if (conversion.isVenta) {
      // Abre el modal de venta y carga los valores
      this.isModalVentaOpen = true;
      this.montoARS = conversion.montoArs || 0;
      this.montoUSD = conversion.montoUsd || 0;
      this.tasaConversion = conversion.valorUsdActual || 0;
      this.dineroPrevioUSD = this.dineroRestanteUSD;
    }
  }

  eliminarConversion(conversion: AhorroInterface): void {
    this.isDeleteModalOpen = true;
    this.conversionAEliminar = conversion;
  }

  // Método para confirmar la eliminación
  confirmarEliminarConversion(): void {
    if (this.conversionAEliminar?.id) {
      this.ahorrosService.deleteAhorro(this.conversionAEliminar.id).subscribe({
        next: () => {
          Swal.fire(
            'Eliminado',
            'La conversión ha sido eliminada con éxito',
            'success'
          );
          this.loadAhorrosPorMes(this.currentMonth);
          this.cerrarModalEliminar();
        },
        error: (error) => {
          console.error('Error al eliminar la conversión:', error);
          Swal.fire('Error', 'No se pudo eliminar la conversión', 'error');
        },
      });
    }
  }

  cerrarModalEliminar(): void {
    this.isDeleteModalOpen = false;
    this.conversionAEliminar = null; // Limpia la conversión seleccionada
  }

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

  previousMonth() {
    const newDate = moment(this.currentMonth, 'MMMM, YYYY').subtract(
      1,
      'months'
    );
    this.currentMonth = newDate.format('MMMM, YYYY');
    this.loadAhorrosPorMes(this.currentMonth);
    this.loadMetaAhorroPorMes(this.currentMonth); // Agrega esta línea
  }

  nextMonth() {
    const newDate = moment(this.currentMonth, 'MMMM, YYYY').add(1, 'months');
    this.currentMonth = newDate.format('MMMM, YYYY');
    this.loadAhorrosPorMes(this.currentMonth);
    this.loadMetaAhorroPorMes(this.currentMonth); // Agrega esta línea
  }

  translateMonthToSpanish(month: string): string {
    const [englishMonth, year] = month.split(', ');
    const spanishMonth = monthTranslations[englishMonth];
    return `${spanishMonth}, ${year}`;
  }

  guardarMetaAhorro(): void {
    if (this.metaAhorro != null) {
      if (this.metaAhorroId) {
        // Actualizar meta existente
        this.ahorrosService
          .updateMetaAhorro(this.metaAhorroId, { value: this.metaAhorro! })
          .subscribe({
            next: () => {
              Swal.fire('Éxito', 'Meta actualizada correctamente', 'success');
              this.cerrarModalMeta();
            },
            error: (error) => {
              console.error('Error al actualizar la meta:', error);
              Swal.fire('Error', 'No se pudo actualizar la meta', 'error');
            },
          });
      } else {
        // Agregar nueva meta
        const nuevaMeta: MetaAhorroInterface = {
          month: this.currentMonth,
          value: this.metaAhorro!,
        };
        this.ahorrosService.addMetaAhorro(nuevaMeta).subscribe({
          next: (docRef) => {
            this.metaAhorroId = docRef.id; // Asignar el ID de la meta guardada
            Swal.fire('Éxito', 'Meta guardada correctamente', 'success');
            this.cerrarModalMeta();
          },
          error: (error) => {
            console.error('Error al guardar la meta:', error);
            Swal.fire('Error', 'No se pudo guardar la meta', 'error');
          },
        });
      }
    }
  }

  eliminarMetaAhorro(): void {
    if (this.metaAhorroId) {
      this.ahorrosService.deleteMetaAhorro(this.metaAhorroId).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Meta eliminada correctamente', 'success');
          this.metaAhorro = null;
          this.metaAhorroId = null; // Restablecer metaAhorroId
        },
        error: (error) => {
          console.error('Error al eliminar la meta:', error);
          Swal.fire('Error', 'No se pudo eliminar la meta', 'error');
        },
      });
    }
  }

  abrirModalEliminarMeta(): void {
    this.isDeleteMetaModalOpen = true;
  }

  cerrarModalEliminarMeta(): void {
    this.isDeleteMetaModalOpen = false;
  }

  confirmarEliminarMetaAhorro(): void {
    if (this.metaAhorroId) {
      this.ahorrosService.deleteMetaAhorro(this.metaAhorroId).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Meta eliminada correctamente', 'success');
          this.metaAhorro = null;
          this.metaAhorroId = null;
          this.isDeleteMetaModalOpen = false;
        },
        error: (error) => {
          console.error('Error al eliminar la meta:', error);
          Swal.fire('Error', 'No se pudo eliminar la meta', 'error');
        },
      });
    }
  }
}
