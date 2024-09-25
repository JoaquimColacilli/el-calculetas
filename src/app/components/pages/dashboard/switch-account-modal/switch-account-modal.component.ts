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
import { User as FirebaseUser, GoogleAuthProvider } from 'firebase/auth';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-switch-account-modal',
  templateUrl: './switch-account-modal.component.html',
  styleUrls: ['./switch-account-modal.component.css'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
})
export class SwitchAccountModalComponent implements OnInit {
  accounts: FirebaseUser[] = [];

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
    this.accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  }

  switchAccount(account: any): void {
    this.authService
      .switchAccount(account)
      .then(() => {
        console.log(
          `Cuenta cambiada a: ${account.displayName || account.email}`
        );
        console.log(account);
        this.dialogRef.close();
      })
      .catch((err) => {
        console.error('Error al cambiar de cuenta:', err.message);
      });
  }

  // Añadir nueva cuenta utilizando el popup de Google
  addNewAccount(): void {
    const provider = new GoogleAuthProvider();
    this.authService
      .signInWithPopup(provider)
      .then((result) => {
        result.user?.getIdTokenResult().then((tokenResult) => {
          let accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
          accounts.push({
            uid: result.user?.uid,
            email: result.user?.email,
            displayName: result.user?.displayName,
            accessToken: tokenResult.token,
            idToken: tokenResult.token,
            refreshToken: result.user?.refreshToken,
          });
          localStorage.setItem('accounts', JSON.stringify(accounts));
          this.loadAccounts();
          this.dialogRef.close();
        });
      })
      .catch((err) => {
        console.error('Error al agregar nueva cuenta:', err.message);
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
