import { ApplicationConfig, isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { MessageService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    MessageService,
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    providePrimeNG({
      theme: {
        preset: definePreset(Aura, {
          semantic: {
            primary: {
              50: '{rose.50}',
              100: '{rose.100}',
              200: '{rose.200}',
              300: '{rose.300}',
              400: '{rose.400}',
              500: '{rose.500}',
              600: '{rose.600}',
              700: '{rose.700}',
              800: '{rose.800}',
              900: '{rose.900}',
              950: '{rose.950}',
            },
          },
        }),
        options: {
          darkModeSelector: '.dark-mode',
        },
      },
    }),
    provideZonelessChangeDetection(),
  ],
};
