import { Routes } from '@angular/router';
import { HomeComponent } from './features/Home/home/home.component';
import { CategoryComponent } from './features/Category/category/category.component';
import { WishlistComponent } from './features/wishlist/wishlist.component';
import { CartComponent } from './features/shopping-cart/cart/cart.component';


export const routes: Routes = [
    {path: '' , component: HomeComponent},
    {path: 'home' , component: HomeComponent},
    {path: 'category' , component: CategoryComponent},
    {path: 'wishlist' , component: WishlistComponent},
    {path: 'cart' , component: CartComponent},
    {path: '**' , component: HomeComponent}
  ]
