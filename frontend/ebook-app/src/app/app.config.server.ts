import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';

// This file is used to configure the server-side rendering for the Angular application.
// It merges the application configuration with server-specific providers.
// It includes the HttpClientModule for making HTTP requests on the server side.
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(), provideHttpClient()],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
