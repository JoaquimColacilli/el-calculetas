import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../../../../services/auth.service';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthCredential, GoogleAuthProvider } from '@angular/fire/auth'; // Importa AuthCredential aquí
import { environment } from '../../../../../environments/environment';
import {
  addDoc,
  setDoc,
  doc,
  getDoc,
  collection,
  Firestore,
} from '@angular/fire/firestore';
import { DefaultCategories } from '../../../../../interfaces/category.interface';

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
      const credentialData = account.credential;

      if (!credentialData) {
        console.error('No se encontró la credencial para esta cuenta.');
        return;
      }

      const credential = GoogleAuthProvider.credential(
        credentialData.idToken,
        credentialData.accessToken
      );

      await this.authService.signInWithCredential(credential);

      console.log(`Cuenta cambiada a: ${account.displayName || account.email}`);
      this.dialogRef.close();
    } catch (error: any) {
      console.error('Error al cambiar de cuenta:', error.message);
    }
  }

  addNewAccount(): void {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    this.authService
      .signInWithPopup(provider)
      .then(async (result) => {
        const user = result.user;
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const tokenResult = await user?.getIdTokenResult();

        if (!user || !tokenResult || !credential) {
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
          credential: {
            accessToken: credential.accessToken,
            idToken: credential.idToken,
          },
        });
        localStorage.setItem('accounts', JSON.stringify(accounts));
        this.loadAccounts();

        // Cambiar a la nueva cuenta
        await this.switchAccount(accounts[accounts.length - 1]);
      })
      .catch((err) => {
        console.error('Error al agregar nueva cuenta:', err.message);
      });
  }

  deleteAccount(account: any, event: Event): void {
    event.stopPropagation();

    const confirmation = confirm(
      `¿Eliminar la cuenta ${account.displayName || account.email}?`
    );
    if (!confirmation) {
      return;
    }

    this.accounts = this.accounts.filter((acc) => acc.uid !== account.uid);

    localStorage.setItem('accounts', JSON.stringify(this.accounts));

    console.log(`Cuenta eliminada: ${account.displayName || account.email}`);
  }

  close(): void {
    this.dialogRef.close();
  }
}
