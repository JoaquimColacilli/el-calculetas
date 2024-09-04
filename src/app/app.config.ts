import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth'; // Importa provideAuth y getAuth
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom([
      provideFirebaseApp(() => initializeApp(environment)),
      provideFirestore(() => getFirestore()),
      provideAuth(() => getAuth()),
    ]),
    AuthService,
  ],
};
