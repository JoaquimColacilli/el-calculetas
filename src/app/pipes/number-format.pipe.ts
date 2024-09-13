import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberFormat',
  standalone: true, // Asegúrate de que esta línea esté presente
})
export class NumberFormatPipe implements PipeTransform {
  transform(value: number | string): string {
    if (!value) return '';
    return Number(value).toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
}
