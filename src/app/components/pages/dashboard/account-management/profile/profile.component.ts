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
import { WeatherService } from '../../../../../services/weather.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { City, CityList } from '../../../../../interfaces/cities.interface';
import { UserInterface } from '../../../../../interfaces/user.interface';
import Swal from 'sweetalert2';
import { RouterLink } from '@angular/router';

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
    NgSelectModule,
    RouterLink,
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
  @ViewChild('locationModal') locationModal: any;

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
  croppedImage!: string | null;

  resetEditor = false;

  cityList = CityList;
  filteredCityList = CityList;
  selectedCity: City | null = null;
  userLocation: string | null = null;

  isSavingChanges: boolean = false;

  constructor(
    library: FaIconLibrary,
    private authService: AuthService,
    private weatherService: WeatherService
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit() {
    this.authService.getUserData().subscribe(
      (userData) => {
        if (userData) {
          console.log(userData);
          this.userName = userData?.username || '';
          this.userEmail = userData?.email || '';
          this.userPhoto = userData?.profilePicture || '';
          this.userLocation = userData?.ubicacion || '';
          this.updateButtonColors();
        }
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

  openLocationModal() {
    this.locationModal.nativeElement.showModal();
  }

  closeLocationModal() {
    this.locationModal.nativeElement.close();
  }

  onCityInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const searchTerm = inputElement?.value || '';
    this.filterCities(searchTerm);
  }

  filterCities(searchTerm: string): void {
    this.filteredCityList = this.cityList.filter((city) =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  selectCity(city: City): void {
    this.selectedCity = city;
  }

  saveLocation(): void {
    if (this.selectedCity) {
      this.userLocation = `${this.selectedCity.name}, ${this.selectedCity.countryCode}`;
      this.closeLocationModal();
    }
  }

  saveChanges(): void {
    this.isSavingChanges = true;

    const updatedData: Partial<UserInterface> = {
      username: this.userName,
      profilePicture: this.userPhoto,
      ubicacion: this.userLocation || '',
    };

    const currentUser = this.authService.currentUserSig();
    if (currentUser && currentUser.uid) {
      this.authService
        .updateUserProfile(currentUser.uid, updatedData)
        .then(() => {
          console.log('Perfil actualizado exitosamente');
          this.showUpdateNotificaction();
        })
        .catch((error) => {
          console.error('Error actualizando el perfil:', error);
        })
        .finally(() => {
          this.isSavingChanges = false;
        });
    } else {
      console.error('No hay usuario autenticado');
      this.isSavingChanges = false;
    }
  }

  showUpdateNotificaction() {
    Swal.fire({
      position: 'top',
      icon: 'success',
      title: `El perfil fue actualizado correctamente`,
      showConfirmButton: false,
      timer: 3000,
      toast: true,
      customClass: {
        popup: 'swal-custom-popup',
      },
    });
  }
}
