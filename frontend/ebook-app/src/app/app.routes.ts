import { Routes } from '@angular/router';
import path from 'node:path';
import { HeaderComponent } from './shared/header/header.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { FooterComponent } from './shared/footer/footer.component';

export const routes: Routes = [
    {path: 'head' , component: HeaderComponent},
    {path: 'side' , component: SidebarComponent},
    {path: 'foot' , component: FooterComponent}

];
