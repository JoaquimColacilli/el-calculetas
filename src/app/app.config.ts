import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth'; // Importa provideAuth y getAuth
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';

const firebaseConfig = {
  apiKey: 'AIzaSyArexJij981sVCmu8dcNKfQ1kBdlob5mIs',
  authDomain: 'el-calculetas.firebaseapp.com',
  projectId: 'el-calculetas',
  storageBucket: 'el-calculetas.appspot.com',
  messagingSenderId: '48218338812',
  appId: '1:48218338812:web:b166ec27532f14fb2a2e79',
  measurementId: 'G-J6642M87D8',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom([
      provideFirebaseApp(() => initializeApp(firebaseConfig)),
      provideFirestore(() => getFirestore()),
      provideAuth(() => getAuth()),
    ]),
    AuthService,
  ],
};
