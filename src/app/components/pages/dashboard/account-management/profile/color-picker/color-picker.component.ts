import { CommonModule } from '@angular/common';
import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  Input,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'app-color-picker',
  template: `
    <div class="p-4 bg-white rounded-lg shadow-lg max-w-xs mx-auto">
      <h3 class="text-lg font-semibold text-gray-700 mb-4">
        Selecciona un color
      </h3>
      <div class="grid grid-cols-5 gap-2">
        <!-- Círculos de colores predefinidos -->
        <div
          *ngFor="let color of colors"
          [ngStyle]="{
            'background-color': color,
            border:
              color === selectedColor
                ? '2px solid #000'
                : '2px solid transparent'
          }"
          class="w-10 h-10 rounded-full cursor-pointer hover:border-gray-500"
          (click)="selectColor(color)"
          title="{{ color }}"
        ></div>

        <!-- Botón para agregar color personalizado -->
        <div
          class="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300 flex items-center justify-center hover:border-gray-500 text-gray-600"
          (click)="openColorPicker()"
          title="Seleccionar color personalizado"
        >
          +
        </div>
      </div>

      <!-- Input de color oculto -->
      <input
        type="color"
        #customColorInput
        class="hidden"
        (change)="selectCustomColor($event)"
      />

      <p class="mt-4 text-gray-600 text-sm text-center">
        Color actual:
        <span class="font-semibold" [style.color]="selectedColor">
          {{ selectedColor }}
        </span>
      </p>
      <div class="flex justify-center mt-4 space-x-2">
        <!-- Botón Restaurar -->
        <button
          (click)="resetColor()"
          class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 ease-in-out shadow-md"
        >
          Restaurar
        </button>

        <!-- Botón Confirmar -->
        <button
          (click)="confirmColor()"
          class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded hover:from-blue-600 hover:to-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out shadow-md"
        >
          Confirmar
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      div {
        cursor: pointer;
        transition: border 0.2s ease;
        text-align: center;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule],
})
export class ColorPickerComponent implements OnInit {
  // Colores predefinidos
  colors = [
    '#3498db',
    '#e74c3c',
    '#2ecc71',
    '#f39c12',
    '#9b59b6',
    '#1abc9c',
    '#34495e',
    '#95a5a6',
    '#e67e22',
    '#e84393',
  ];

  @Input() initialColor: string = '';
  @Output() colorSelected = new EventEmitter<string>();
  selectedColor: string = '';

  @ViewChild('customColorInput')
  customColorInput!: ElementRef<HTMLInputElement>;

  ngOnInit() {
    this.selectedColor = this.initialColor || this.colors[0];
  }

  selectColor(color: string) {
    this.selectedColor = color;
  }

  openColorPicker() {
    this.customColorInput.nativeElement.click();
  }

  selectCustomColor(event: Event) {
    const input = event.target as HTMLInputElement;
    const customColor = input.value;
    this.selectedColor = customColor;
    this.addCustomColor(customColor);
  }

  addCustomColor(color: string) {
    if (!this.colors.includes(color)) {
      this.colors.push(color);
    }
  }

  resetColor() {
    this.selectedColor = this.initialColor || this.colors[0];
  }

  confirmColor() {
    this.colorSelected.emit(this.selectedColor);
  }
}
