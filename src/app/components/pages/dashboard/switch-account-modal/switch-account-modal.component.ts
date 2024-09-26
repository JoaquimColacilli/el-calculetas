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
import { environment } from '../../../../environments/environment';
import {
  addDoc,
  setDoc,
  doc,
  getDoc,
  collection,
  Firestore,
} from '@angular/fire/firestore';
import { DefaultCategories } from '../../../../interfaces/category.interface';

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
    library: FaIconLibrary,
    private firestore: Firestore
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.accounts = JSON.parse(localStorage.getItem('accounts') || '[]');

    console.log(this.accounts);
  }

  async switchAccount(account: any): Promise<void> {
    try {
      const newAccessToken = await this.authService.refreshAccessToken(
        account.refreshToken
      );

      account.accessToken = newAccessToken;

      const apiKey = environment.apiKey;
      const authUserKey = `firebase:authUser:${apiKey}:[DEFAULT]`;

      const authUser = {
        uid: account.uid,
        email: account.email,
        emailVerified: true,
        displayName: account.displayName,
        isAnonymous: false,
        providerData: [
          {
            providerId: 'google.com',
            uid: account.uid,
            displayName: account.displayName,
            email: account.email,
            phoneNumber: null,
            photoURL: account.photoURL,
          },
        ],
        stsTokenManager: {
          refreshToken: account.refreshToken,
          accessToken: newAccessToken,
          expirationTime: Date.now() + 3600 * 1000,
        },
        createdAt: Date.now().toString(),
        lastLoginAt: Date.now().toString(),
        apiKey: apiKey,
        appName: '[DEFAULT]',
      };

      localStorage.setItem(authUserKey, JSON.stringify(authUser));

      console.log(`Cuenta cambiada a: ${account.displayName || account.email}`);
      this.dialogRef.close();
      window.location.reload();
    } catch (error: any) {
      console.error('Error al cambiar de cuenta:', error.message);
    }
  }

  addNewAccount(): void {
    const provider = new GoogleAuthProvider();
    this.authService
      .signInWithPopup(provider)
      .then(async (result) => {
        const user = result.user;
        const tokenResult = await user?.getIdTokenResult();

        if (!user || !tokenResult) {
          console.error('Error al obtener la información del usuario.');
          return;
        }

        const userRef = doc(this.firestore, `users/${user.uid}`);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
          });

          const categoriesCollection = collection(
            this.firestore,
            `users/${user.uid}/categories`
          );
          for (const category of DefaultCategories) {
            await addDoc(categoriesCollection, category);
          }
        }

        let accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        accounts.push({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          accessToken: tokenResult.token,
          idToken: tokenResult.token,
          refreshToken: user.refreshToken,
        });
        localStorage.setItem('accounts', JSON.stringify(accounts));
        this.loadAccounts();

        // Realiza el cambio de cuenta automáticamente a la nueva
        await this.switchAccount({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          refreshToken: user.refreshToken,
        });

        this.dialogRef.close();
      })
      .catch((err) => {
        console.error('Error al agregar nueva cuenta:', err.message);
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
