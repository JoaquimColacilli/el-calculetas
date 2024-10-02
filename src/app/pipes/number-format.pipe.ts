import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberFormat',
  standalone: true,
})
export class NumberFormatPipe implements PipeTransform {
  transform(value: number | string): string {
    if (!value) return '';

    // Convertir el valor a número si viene como string
    let numberValue = typeof value === 'string' ? parseFloat(value) : value;

    // Usar toLocaleString con configuraciones específicas
    return numberValue.toLocaleString('es-ES', {
      minimumFractionDigits: 2, // Asegura que siempre haya 2 decimales
      maximumFractionDigits: 2, // Limita a 2 decimales
    });
  }
}
