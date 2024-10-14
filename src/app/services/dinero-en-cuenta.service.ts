import { Injectable } from '@angular/core';
import { Firestore, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service'; // Importar AuthService
import { setDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class DineroEnCuentaService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  // Función para obtener el UID actual
  private async getCurrentUid(): Promise<string | null> {
    const userData = await this.authService.getUserData().toPromise();
    return userData?.uid || null;
  }

  async actualizarDineroARS(nuevoDinero: number): Promise<void> {
    try {
      const uid = await this.getCurrentUid();
      if (!uid) throw new Error('Usuario no autenticado');

      const docRef = doc(this.firestore, `users/${uid}/dineroEnCuenta`);
      await setDoc(docRef, { dineroEnCuentaARS: nuevoDinero }, { merge: true });
      console.log('Dinero en cuenta ARS actualizado correctamente');
      console.log(nuevoDinero);
    } catch (error) {
      console.error('Error al actualizar el dinero en cuenta ARS:', error);
      throw error;
    }
  }

  async actualizarDineroUSD(nuevoDinero: number): Promise<void> {
    try {
      const uid = await this.getCurrentUid();
      if (!uid) throw new Error('Usuario no autenticado');

      const docRef = doc(this.firestore, `users/${uid}/dineroEnCuenta`);
      await setDoc(docRef, { dineroEnCuentaUSD: nuevoDinero }, { merge: true });
      console.log('Dinero en cuenta USD actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el dinero en cuenta USD:', error);
      throw error;
    }
  }

  async obtenerDineroEnCuenta(): Promise<any> {
    const uid = await this.getCurrentUid();
    if (!uid) throw new Error('Usuario no autenticado');

    // Cambiamos a la colección de `users` directamente
    const docRef = doc(this.firestore, `users/${uid}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }
}
