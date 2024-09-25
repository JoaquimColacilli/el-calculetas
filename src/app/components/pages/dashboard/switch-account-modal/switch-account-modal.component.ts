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
import { UserInterface } from '../../../../interfaces/user.interface';

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
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.accounts = this.authService.getAccountsFromLocalStorage();
  }

  switchAccount(account: UserInterface): void {
    this.authService.switchAccount(account).subscribe({
      next: () => {
        this.dialogRef.close();
      },
      error: (err) => console.error('Error al cambiar de cuenta:', err.message),
    });
  }

  addNewAccount(): void {
    console.log('Agregar nueva cuenta');
  }

  close(): void {
    this.dialogRef.close();
  }
}
