import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { NavbarComponent } from '../../../../navbar/navbar.component';
import { AsideComponent } from '../../../../aside/aside.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { AuthService } from '../../../../../services/auth.service';
import { PhotoEditorComponent } from './photo-editor/photo-editor.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    NavbarComponent,
    AsideComponent,
    ColorPickerComponent,
    PhotoEditorComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  userSelectedColor: string = '';
  @ViewChild('colorPickerDialog')
  colorPickerDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('photoEditorDialog')
  photoEditorDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  backgroundColor = '#3498db';
  buttonColor = this.lightenColor(this.backgroundColor, 10);
  buttonHoverColor = this.darkenColor(this.backgroundColor, 10);

  cancelButtonColor = this.lightenColor(this.backgroundColor, 10);
  cancelButtonHoverColor = this.darkenColor(this.backgroundColor, 10);

  saveButtonColor = this.lightenColor(this.backgroundColor, 10);
  saveButtonHoverColor = this.darkenColor(this.backgroundColor, 10);

  isPhotoEditorOpen = false;

  userName: string = '';
  userEmail: string = '';
  userPhoto: string = '';
  userLocation: string = '';

  croppedImage!: string | null;

  resetEditor = false;

  constructor(library: FaIconLibrary, private authService: AuthService) {
    library.addIconPacks(fas);
  }

  ngOnInit() {
    this.authService.getUserData().subscribe(
      (userData) => {
        console.log(userData);
        this.userName = userData.username || '';
        this.userEmail = userData.email || '';
        this.userPhoto = userData.profilePicture || '';
        this.userLocation = userData.location || '';
        this.backgroundColor =
          userData.profileBackgroundColor || this.backgroundColor;
        this.updateButtonColors();
      },
      (error) => {
        console.error('Error obteniendo datos del usuario:', error);
      }
    );
  }

  updateButtonColors() {
    this.saveButtonColor = this.lightenColor(this.backgroundColor, 10);
    this.saveButtonHoverColor = this.darkenColor(this.backgroundColor, 10);
    this.cancelButtonColor = this.lightenColor(this.backgroundColor, 10);
    this.cancelButtonHoverColor = this.darkenColor(this.backgroundColor, 10);
  }

  openColorPicker() {
    this.colorPickerDialog.nativeElement.showModal();
  }

  changeColor(color: string) {
    this.backgroundColor = color;
    this.updateButtonColors();
    this.colorPickerDialog.nativeElement.close();
  }

  openFileSelector() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.userPhoto = reader.result as string;
        this.openPhotoEditor();
      };

      reader.readAsDataURL(file);
    }
  }

  openPhotoEditor() {
    this.resetEditor = true;
    setTimeout(() => {
      this.resetEditor = false;
    }, 0);
    this.isPhotoEditorOpen = true;
    this.photoEditorDialog.nativeElement.showModal();
  }

  closePhotoEditor() {
    this.isPhotoEditorOpen = false;
    this.photoEditorDialog.nativeElement.close();
  }

  onImageCropped(croppedImage: string) {
    this.userPhoto = croppedImage;
    this.closePhotoEditor();
  }

  lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = ((num >> 8) & 0x00ff) + amt,
      B = (num & 0x0000ff) + amt;

    return `#${(
      0x1000000 +
      (R > 255 ? 255 : R) * 0x10000 +
      (G > 255 ? 255 : G) * 0x100 +
      (B > 255 ? 255 : B)
    )
      .toString(16)
      .slice(1)}`;
  }

  darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      G = ((num >> 8) & 0x00ff) - amt,
      B = (num & 0x0000ff) - amt;

    return `#${(
      0x1000000 +
      (R < 0 ? 0 : R) * 0x10000 +
      (G < 0 ? 0 : G) * 0x100 +
      (B < 0 ? 0 : B)
    )
      .toString(16)
      .slice(1)}`;
  }
}
