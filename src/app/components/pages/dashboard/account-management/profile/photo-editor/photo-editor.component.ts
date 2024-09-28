import {
  Component,
  ViewChild,
  ElementRef,
  EventEmitter,
  Output,
  Input,
} from '@angular/core';
import Cropper from 'cropperjs';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-photo-editor',
  standalone: true,
  template: `
    <div class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Editar imagen</h2>
          <button class="close-button" (click)="cancelCrop()">✕</button>
        </div>
        <div class="upload-container">
          <input
            type="file"
            accept="image/*"
            #fileInput
            class="hidden"
            (change)="onImageUpload($event)"
          />
          <div class="upload-area " (click)="fileInput.click()">
            <fa-icon
              [icon]="['fas', 'cloud-upload-alt']"
              class="upload-icon flex justify-center items-center align-middle"
            ></fa-icon>
            <p class="upload-text">Haz clic para subir una imagen</p>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="cancelCrop()" class="btn-cancel">Cancelar</button>
          <button (click)="cropImage()" class="btn-confirm">Aplicar</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal {
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
      }

      .modal-content {
        background: #2f3136;
        padding: 20px;
        border-radius: 10px;
        max-width: 500px;
        width: 100%;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .modal-title {
        font-size: 18px;
        font-weight: 600;
      }

      .close-button {
        background: transparent;
        border: none;
        font-size: 20px;
        color: #b9bbbe;
        cursor: pointer;
      }

      .upload-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 250px;
        background: #202225;
        border: 2px dashed #4f545c;
        border-radius: 10px;
        cursor: pointer;
      }

      .upload-icon {
        font-size: 48px;
        color: #b9bbbe;
        margin-bottom: 10px;
      }

      .upload-text {
        font-size: 14px;
        color: #b9bbbe;
      }

      .crop-container {
        width: 100%;
        height: 300px;
        overflow: hidden;
        margin-bottom: 15px;
      }

      img {
        max-width: 100%;
      }

      .modal-footer {
        display: flex;
        justify-content: right;
        margin-top: 1rem;
      }

      .btn-confirm,
      .btn-cancel {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s;
      }

      .btn-confirm {
        background: #7289da;
        color: white;
      }

      .btn-confirm:hover {
        background: #5b6eae;
      }

      .btn-cancel {
        background: #f04747;
        color: white;
        margin-right: 1rem;
      }

      .btn-cancel:hover {
        background: #c03c3c;
      }

      .hidden {
        display: none;
      }
    `,
  ],
  imports: [FontAwesomeModule, CommonModule],
})
export class PhotoEditorComponent {
  @ViewChild('image', { static: false }) imageElement!: ElementRef;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  @Output() imageCropped = new EventEmitter<string>();
  @Input() imageUrl!: string;
  private cropper!: Cropper;

  ngAfterViewInit() {
    if (this.imageUrl) {
      this.initializeCropper();
    }
  }

  initializeCropper() {
    this.cropper = new Cropper(this.imageElement.nativeElement, {
      aspectRatio: 1,
      viewMode: 1,
      background: false,
      movable: true,
      zoomable: true,
      scalable: true,
      rotatable: true,
      responsive: true,
      checkOrientation: false,
    });
  }

  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
        this.initializeCropper();
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  cropImage() {
    if (this.cropper) {
      const canvas = this.cropper.getCroppedCanvas({
        width: 300,
        height: 300,
      });
      const croppedImageUrl = canvas.toDataURL('image/png');
      this.imageCropped.emit(croppedImageUrl);
    }
  }

  cancelCrop() {
    this.cropper?.destroy();
    this.imageUrl = '';
    this.fileInput.nativeElement.value = '';
  }
}
