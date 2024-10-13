import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AsideComponent } from '../../aside/aside.component';
import { RouterModule } from '@angular/router';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { PantallaEnConstruccionComponent } from '../../pantalla-en-construccion/pantalla-en-construccion.component';

interface Ahorro {
  id?: string;
  fecha: string;
  montoARS: number;
  montoUSD: number;
}

interface Conversion {
  fecha: string;
  montoARS: number;
  montoUSD: number;
  tasaConversion: number;
}

@Component({
  selector: 'app-ahorros',
  standalone: true,
  imports: [
    NavbarComponent,
    AsideComponent,
    RouterModule,
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    PantallaEnConstruccionComponent,
  ],
  templateUrl: './ahorros.component.html',
  styleUrls: ['./ahorros.component.css'],
})
export class AhorrosComponent implements OnInit {
  public isLoadingData: boolean = false;
  public conversiones: Conversion[] = [];
  public totalAhorrosARS: number = 150000;
  public totalAhorrosUSD: number = 600;
  public ahorrosDelMes: number = 50000;
  public metaAhorro: number = 100000;

  // Controlar los modales
  public isModalCompraOpen: boolean = false;
  public isModalVentaOpen: boolean = false;

  public montoARS: number = 0;
  public montoUSD: number = 0;
  public tasaConversion: number = 0;

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.loadAhorros();
  }

  getPorcentajeProgreso(): number {
    return Math.min(this.calcularPorcentajeAhorro(), 100);
  }

  calcularPorcentajeAhorro(): number {
    return (this.totalAhorrosARS / this.metaAhorro) * 100;
  }

  loadAhorros(): void {
    this.conversiones = [
      {
        fecha: '2024-10-12',
        montoARS: 50000,
        montoUSD: 200,
        tasaConversion: 250,
      },
      {
        fecha: '2024-09-25',
        montoARS: 100000,
        montoUSD: 400,
        tasaConversion: 250,
      },
    ];
  }

  abrirModalCompra(): void {
    this.isModalCompraOpen = true;
    this.montoARS = 0;
    this.tasaConversion = 0;
  }

  cerrarModalCompra(): void {
    this.isModalCompraOpen = false;
  }

  // Abrir y cerrar el modal de venta
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
    this.totalAhorrosARS -= this.montoARS;
    this.totalAhorrosUSD += montoUSD;

    const nuevaConversion: Conversion = {
      fecha: new Date().toISOString().split('T')[0],
      montoARS: this.montoARS,
      montoUSD: montoUSD,
      tasaConversion: this.tasaConversion,
    };

    this.conversiones.unshift(nuevaConversion);
    this.cerrarModalCompra();
  }

  // Vender dólares
  venderAhorro(): void {
    const montoARS = this.montoUSD * this.tasaConversion;
    this.totalAhorrosUSD -= this.montoUSD;
    this.totalAhorrosARS += montoARS;

    const nuevaConversion: Conversion = {
      fecha: new Date().toISOString().split('T')[0],
      montoARS: montoARS,
      montoUSD: this.montoUSD,
      tasaConversion: this.tasaConversion,
    };

    this.conversiones.unshift(nuevaConversion);
    this.cerrarModalVenta();
  }
}
