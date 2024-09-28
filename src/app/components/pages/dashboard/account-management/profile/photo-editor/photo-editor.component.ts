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
  ChangeDetectorRef,
} from '@angular/core';
import Cropper from 'cropperjs';
import { CommonModule } from '@angular/common';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { fas } from '@fortawesome/free-solid-svg-icons';
import 'cropperjs/dist/cropper.css';

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

  modalStyle: { width: string; height: string } = {
    width: '400px',
    height: '300px',
  };
  constructor(library: FaIconLibrary, private cd: ChangeDetectorRef) {
    library.addIconPacks(fas);
  }

  ngAfterViewInit(): void {
    if (this.imageToLoad) {
      this.loadImage(this.imageToLoad);
      this.imageToLoad = null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] && this.imageUrl) {
      this.loadImage(this.imageUrl);
    }
  }

  openFileInput() {
    this.fileInput.nativeElement.click();
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.imageToLoad = reader.result as string;
        if (this.imageElement && this.imageElement.nativeElement) {
          this.loadImage(this.imageToLoad);
          this.imageToLoad = null;
        }
      };

      reader.readAsDataURL(file);
    }

    this.imageLoaded = true;
  }

  loadImage(imageSrc: string): void {
    const image = this.imageElement.nativeElement;

    image.onload = () => {
      if (this.cropper) {
        this.cropper.destroy();
      }
      this.cropper = new Cropper(image, {
        aspectRatio: 1, // Relación de aspecto para mantener cuadrado
        viewMode: 1, // Evita que la imagen se salga del contenedor
        autoCropArea: 0.8, // Área de recorte inicial
        responsive: true,
        center: true, // Asegura que la imagen esté siempre centrada
        zoomable: true, // Permitir zoom
        zoomOnWheel: true, // Permitir zoom con la rueda del mouse
        dragMode: 'move', // Habilitar movimiento al arrastrar
        toggleDragModeOnDblclick: false,
        minContainerWidth: 500, // Tamaño mínimo del contenedor
        minContainerHeight: 500,
        minCanvasWidth: 500, // Asegura que la imagen no se haga más pequeña que el contenedor
        minCanvasHeight: 500, // Asegura que la imagen no se haga más pequeña que el contenedor
        initialAspectRatio: 1, // Relación de aspecto inicial para mantener cuadrado
        cropBoxMovable: false, // Evita que se mueva el área de recorte
        cropBoxResizable: true, // Permite cambiar el tamaño del área de recorte
        background: false, // No mostrar el fondo de líneas por defecto de Cropper.js
        ready: () => {
          // Redimensiona el modal una vez que la imagen se ha cargado
          this.resizeModal(true);
          // Asegura que la imagen se ajuste a los bordes del contenedor
        },
      });

      this.imageLoaded = true;
      this.cd.detectChanges();
    };

    image.src = imageSrc;
  }

  // Método para cambiar el tamaño del modal
  resizeModal(imageLoaded: boolean): void {
    if (imageLoaded) {
      // Cambia el tamaño del modal cuando la imagen está cargada, limitando el tamaño
      this.modalStyle = {
        width: '600px', // Ancho deseado para el modal
        height: '600px',
      };
    } else {
      // Tamaño inicial del modal
      this.modalStyle = {
        width: '400px',
        height: '300px',
      };
    }
  }

  cropImage(): void {
    if (this.cropper) {
      const canvas = this.cropper.getCroppedCanvas();
      const croppedImageData = canvas.toDataURL('image/jpeg');
      this.imageCropped.emit(croppedImageData);
    }
  }

  cancelCrop(): void {
    if (this.cropper) {
      this.cropper.destroy(); // Destruye la instancia existente
    }
    this.imageLoaded = false;
    this.imageToLoad = null;
    this.modalStyle = {
      width: '400px',
      height: '300px',
    };
  }

  close(): void {
    this.cancelCrop();
    this.closeEditor.emit();
    this.modalStyle = {
      width: '400px',
      height: '300px',
    };
  }
}
