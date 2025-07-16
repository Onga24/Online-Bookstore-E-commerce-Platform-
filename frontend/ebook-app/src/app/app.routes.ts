import { Routes } from '@angular/router';
import path from 'node:path';
import { HeaderComponent } from './shared/header/header.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { HomeComponent } from './features/Home/home/home.component';
import { FeaturedBooksComponent } from './features/Home/featured-books/featured-books.component';
import { FeaturedWriterComponent } from './features/Home/featured-writer/featured-writer.component';
import { FavoriteReadsComponent } from './features/Home/favorite-reads/favorite-reads.component';
import { CategoryComponent } from './features/Category/category/category.component';
import { WishlistComponent } from './features/wishlist/wishlist.component';


export const routes: Routes = [
    {path: '' , component: HomeComponent},
    {path: 'home' , component: HomeComponent},
    {path: 'category' , component: CategoryComponent},
    {path: 'wishlist' , component: WishlistComponent},
    
    {path: '**' , component: HomeComponent},


];
