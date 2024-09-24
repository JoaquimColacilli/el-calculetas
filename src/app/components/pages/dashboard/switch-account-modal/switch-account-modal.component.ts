import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../../../services/auth.service';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-switch-account-modal',
  templateUrl: './switch-account-modal.component.html',
  styleUrls: ['./switch-account-modal.component.css'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
})
export class SwitchAccountModalComponent implements OnInit {
  accounts: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<SwitchAccountModalComponent>,
    private authService: AuthService,
    library: FaIconLibrary
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.loadAccountsFromLocalStorage();
  }

  loadAccountsFromLocalStorage(): void {
    // this.accounts = this.authService.getStoredAccounts();
  }

  async switchAccount(account: any): Promise<void> {
    // try {
    //   await this.authService.switchAccount(account);
    //   this.close(); // Cierra el modal después de cambiar la cuenta
    // } catch (error) {
    //   console.error('Error al cambiar de cuenta:', error);
    // }
  }

  addNewAccount(): void {
    // Aquí puedes abrir el modal de login para agregar una nueva cuenta
    console.log('Agregar nueva cuenta');
  }

  close(): void {
    this.dialogRef.close();
  }
}
