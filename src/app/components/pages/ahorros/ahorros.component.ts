import { Component, OnInit } from '@angular/core';
import { AhorrosService } from '../../../services/ahorros.service';
import { AhorroInterface } from '../../../interfaces/ahorro.interface';
import { Timestamp } from '@angular/fire/firestore';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AsideComponent } from '../../aside/aside.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NumberFormatPipe } from '../../../pipes/number-format.pipe';

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
  public metaAhorro: number = 100000;
  public totalIngresos: number = 200000; // Inicializar con un valor de ejemplo
  public totalIngresosUSD: number = 1000; // Inicializar con un valor de ejemplo
  public dineroRestante: number = 0;
  public dineroRestanteUSD: number = 0;

  // Controlar los modales
  public isModalCompraOpen: boolean = false;
  public isModalVentaOpen: boolean = false;

  public montoARS: number = 0;
  public montoUSD: number = 0;
  public tasaConversion: number = 0;

  constructor(private ahorrosService: AhorrosService) {}

  ngOnInit(): void {
    this.loadAhorros(); // Cargar ahorros al iniciar
    this.calcularDineroRestante();
    this.calcularDineroRestanteUsd();
  }

  // Cargar los ahorros desde el servicio
  loadAhorros(): void {
    this.isLoadingData = true;
    this.ahorrosService.getAhorros().subscribe({
      next: (ahorros) => {
        this.conversiones = ahorros;
        this.calcularTotales(); // Calcular totales después de cargar
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('Error al cargar ahorros:', error);
        this.isLoadingData = false;
      },
    });
  }

  // Calcular los totales de USD y los ahorros del mes
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

  // Progreso hacia la meta de ahorro
  calcularPorcentajeAhorro(): number {
    return (this.totalAhorrosUSD / this.metaAhorro) * 100;
  }

  // Lógica para calcular dinero restante en ARS
  calcularDineroRestante(): number {
    const gastosPagadosEsteMes = this.conversiones.filter((item) => {
      return item.montoArs > 0;
    });

    const totalPagadoEsteMes = gastosPagadosEsteMes.reduce(
      (acc, item) => acc + item.montoArs,
      0
    );

    this.dineroRestante = this.totalIngresos - totalPagadoEsteMes;
    return this.dineroRestante;
  }

  // Lógica para calcular dinero restante en USD
  calcularDineroRestanteUsd(): number {
    const gastosPagadosUsd = this.conversiones.filter((item) => {
      return item.montoUsd < 0;
    });

    const totalGastosUsd = gastosPagadosUsd.reduce(
      (acc, item) => acc + Math.abs(item.montoUsd),
      0
    );

    this.dineroRestanteUSD = this.totalIngresosUSD - totalGastosUsd;
    return this.dineroRestanteUSD;
  }

  // Modal de compra
  abrirModalCompra(): void {
    this.isModalCompraOpen = true;
    this.montoARS = 0;
    this.tasaConversion = 0;
  }

  cerrarModalCompra(): void {
    this.isModalCompraOpen = false;
  }

  // Modal de venta
  abrirModalVenta(): void {
    this.isModalVentaOpen = true;
    this.montoUSD = 0;
    this.tasaConversion = 0;
  }

  cerrarModalVenta(): void {
    this.isModalVentaOpen = false;
  }

  // Convertir ahorro en la compra de dólares
  convertirAhorro(): void {
    const montoUSD = this.montoARS / this.tasaConversion;

    // Descontar monto en ARS del dinero restante (porque es una compra)
    this.dineroRestante -= this.montoARS;

    // Aumentar el monto en USD en dineroRestanteUSD
    this.dineroRestanteUSD += montoUSD;

    const nuevoAhorro: AhorroInterface = {
      timestamp: new Date(),
      montoArs: this.montoARS,
      montoUsd: montoUSD,
      valorUsdActual: this.tasaConversion,
      isCompra: true, // Indicamos que es una compra
      isVenta: false, // No es una venta
    };

    // Guardar el ahorro en Firebase
    this.ahorrosService.addAhorro(nuevoAhorro).subscribe({
      next: (docRef) => {
        this.conversiones.unshift(nuevoAhorro);
        this.calcularTotales();
        this.calcularDineroRestante();
        this.calcularDineroRestanteUsd();
        this.cerrarModalCompra();
      },
      error: (error) => {
        console.error('Error al agregar ahorro:', error);
      },
    });
  }

  // Vender dólares
  venderAhorro(): void {
    const montoARS = this.montoUSD * this.tasaConversion;

    // Aumentar monto en ARS en el dinero restante (porque es una venta)
    this.dineroRestante += montoARS;

    const nuevoAhorro: AhorroInterface = {
      timestamp: new Date(),
      montoArs: montoARS,
      montoUsd: -this.montoUSD, // Deducimos los dólares vendidos
      valorUsdActual: this.tasaConversion,
      isCompra: false, // No es una compra
      isVenta: true, // Indicamos que es una venta
    };

    // Guardar la venta en Firebase
    this.ahorrosService.addAhorro(nuevoAhorro).subscribe({
      next: (docRef) => {
        this.conversiones.unshift(nuevoAhorro);
        this.calcularTotales();
        this.calcularDineroRestante(); // Recalculamos ARS después de la venta
        this.calcularDineroRestanteUsd(); // Recalculamos USD después de la venta
        this.cerrarModalVenta();
      },
      error: (error) => {
        console.error('Error al registrar la venta:', error);
      },
    });
  }

  // Editar y eliminar conversiones
  editarConversion(conversion: AhorroInterface): void {
    // Aquí puedes agregar la lógica de edición
  }

  eliminarConversion(conversion: AhorroInterface): void {
    // Aquí puedes agregar la lógica de eliminación
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
}
