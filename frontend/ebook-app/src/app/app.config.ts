import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

// This file is used to configure the Angular application.
// It sets up the application configuration, including the routes and client hydration.
// The `provideRouter` function is used to provide the application's routing configuration.
// The `provideClientHydration` function is used to enable client-side hydration for the application
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideClientHydration()]
};
