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
  @Input() reset: boolean = false;
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
    if (changes['reset'] && changes['reset'].currentValue) {
      this.imageLoaded = false;
      this.resetCropper();
    }
    if (changes['imageUrl'] && this.imageUrl) {
      this.loadImage(this.imageUrl);
    }
  }

  resetCropper(): void {
    if (this.cropper) {
      this.cropper.destroy();
    }
    this.imageLoaded = false;
    this.modalStyle = {
      width: '400px',
      height: '300px',
    };
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
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 0.8,
        responsive: true,
        center: true,
        zoomable: true,
        zoomOnWheel: true,
        dragMode: 'move',
        toggleDragModeOnDblclick: false,
        minContainerWidth: 500,
        minContainerHeight: 500,
        minCanvasWidth: 500,
        minCanvasHeight: 500,
        initialAspectRatio: 1,
        cropBoxMovable: false,
        cropBoxResizable: true,
        background: false,
        ready: () => {
          this.resizeModal(true);
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
