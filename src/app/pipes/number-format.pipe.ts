import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberFormat',
  standalone: true,
})
export class NumberFormatPipe implements PipeTransform {
  transform(value: number | string): string {
    if (value === null || value === undefined || value === '') return '';

    // Convertir el valor a número si viene como string
    let numberValue = typeof value === 'string' ? parseFloat(value) : value;

    // Si el número es inválido (NaN), retorna una cadena vacía
    if (isNaN(numberValue)) {
      return '';
    }

    // Formatear manualmente los separadores de miles y decimales
    return this.formatNumberWithThousandSeparator(numberValue);
  }

  private formatNumberWithThousandSeparator(value: number): string {
    // Forzamos el valor a 2 decimales y convertimos a string
    const [integerPart, decimalPart] = value.toFixed(2).split('.');

    // Añadir puntos como separador de miles
    const formattedIntegerPart = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      '.'
    );

    // Devolver el número formateado con coma como separador decimal
    return `${formattedIntegerPart},${decimalPart}`;
  }
}
