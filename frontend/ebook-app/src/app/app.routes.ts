import { Routes } from '@angular/router';
import path from 'node:path';
import { HeaderComponent } from './shared/header/header.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { OrdersItemsComponent } from './features/shopping-cart/orders-items/orders-items.component';
import { PaymentSummaryComponent } from './features/shopping-cart/payment-summary/payment-summary.component';
import { CartComponent } from './features/shopping-cart/cart/cart.component';

export const routes: Routes = [
    {path: 'head' , component: HeaderComponent},
    {path: 'side' , component: SidebarComponent},
    {path: 'foot' , component: FooterComponent},
    {path: 'cart' , component: CartComponent},

  ];
