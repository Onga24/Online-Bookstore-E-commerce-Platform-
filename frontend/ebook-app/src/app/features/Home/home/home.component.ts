import { Component } from '@angular/core';
import { SwiperComponent } from '../swiper/swiper.component';
import { BrowseBooksComponent } from '../browse-books/browse-books.component';
import { FeaturedBooksComponent } from '../featured-books/featured-books.component';
import { FeaturedWriterComponent } from '../featured-writer/featured-writer.component';
import { FavoriteReadsComponent } from '../favorite-reads/favorite-reads.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SwiperComponent, BrowseBooksComponent,FeaturedBooksComponent, FeaturedWriterComponent, FavoriteReadsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

}
