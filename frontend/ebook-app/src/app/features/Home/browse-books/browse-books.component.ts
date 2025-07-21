import { Component, OnInit } from '@angular/core';
import { BookService } from '../../../core/services/book.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-browse-books',
  standalone: true,
  imports: [CommonModule],

  templateUrl: './browse-books.component.html',
  styleUrls: ['./browse-books.component.css']
})
export class BrowseBooksComponent implements OnInit {
  books: any[] = [];
  totalBooks = 0;
  currentPage = 1;
  pageSize = 4;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBooks(this.currentPage);
  }

 loadBooks(page: number): void {
  console.log('Loading books for page:', page); // 👈 Debug line
  this.bookService.getBooks(page, this.pageSize).subscribe(
    (data) => {
      console.log('Books loaded:', data.books); // 👈 Debug line
      this.books = data.books;
      this.totalBooks = data.totalCount;
      this.currentPage = page;
    },
    (err) => {
      console.error('Error loading books:', err);
    }
  );
}


onPageChange(page: number): void {
  if (page >= 1 && page <= this.totalPages.length && page !== this.currentPage) {
    this.loadBooks(page);
  }
}


  get totalPages(): number[] {
    const pages = Math.ceil(this.totalBooks / this.pageSize);
    return Array.from({ length: pages }, (_, i) => i + 1);
  }
}

