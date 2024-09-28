import {
  Component,
  ViewChild,
  ElementRef,
  EventEmitter,
  Output,
  Input,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import Cropper from 'cropperjs';
import { CommonModule } from '@angular/common';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { fas } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-photo-editor',
  standalone: true,
  templateUrl: './photo-editor.component.html',
  styleUrls: ['./photo-editor.component.css'],
  imports: [CommonModule, FontAwesomeModule, FormsModule],
})
export class PhotoEditorComponent implements AfterViewInit, OnChanges {
  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Input() imageUrl!: string;
  @Output() imageCropped = new EventEmitter<string>();
  @Output() closeEditor = new EventEmitter<void>();

  cropper!: Cropper;
  imageLoaded = false;
  private imageToLoad: string | null = null;

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas);
  }

  ngAfterViewInit(): void {
    if (this.imageToLoad) {
      this.loadImage(this.imageToLoad);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] && this.imageUrl) {
      // Guardar la imagen temporalmente hasta que el view esté listo
      if (this.imageElement) {
        this.loadImage(this.imageUrl);
      } else {
        this.imageToLoad = this.imageUrl;
      }
    }
  }

  // Método para abrir el input de archivo desde el componente
  openFileInput() {
    this.fileInput.nativeElement.click();
  }

  // Método para manejar la carga de la imagen desde el input
  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.loadImage(reader.result as string);
      };

      reader.readAsDataURL(file);
    }
  }

  // Método para cargar la imagen en el Cropper
  loadImage(imageSrc: string): void {
    if (!this.imageElement) {
      this.imageToLoad = imageSrc; // Almacenar temporalmente si el view no está listo
      return;
    }

    const image = this.imageElement.nativeElement;
    image.src = imageSrc;

    if (this.cropper) {
      this.cropper.destroy(); // Destruir el Cropper anterior si existe
    }

    this.cropper = new Cropper(image, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 0.8,
      responsive: true,
    });

    this.imageLoaded = true; // Se ha cargado una imagen
    this.imageToLoad = null; // Limpiar la imagen temporal
  }

  // Método para obtener la imagen recortada
  cropImage(): void {
    if (this.cropper) {
      const canvas = this.cropper.getCroppedCanvas();
      const croppedImageData = canvas.toDataURL('image/png');
      this.imageCropped.emit(croppedImageData); // Emitir la imagen recortada
    }
  }

  // Método para cancelar el recorte y regresar a la vista de carga
  cancelCrop(): void {
    this.imageLoaded = false;
    this.cropper?.destroy();
    this.imageToLoad = null;
  }

  // Método para cerrar el editor
  close(): void {
    this.cancelCrop();
    this.closeEditor.emit();
  }
}
