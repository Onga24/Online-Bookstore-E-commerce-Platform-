import { Component } from '@angular/core';
import { SearchComponent } from '../search/search.component';
import { BrowseBooksComponent } from '../../Home/browse-books/browse-books.component';
import { SimilarBooksComponent } from '../similar-books/similar-books.component';
import { TrendyBooksComponent } from '../trendy-books/trendy-books.component';
import { FavoriteReadsComponent } from '../../Home/favorite-reads/favorite-reads.component';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [SearchComponent, BrowseBooksComponent, SimilarBooksComponent, TrendyBooksComponent, FavoriteReadsComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css'
})
export class CategoryComponent {

}
