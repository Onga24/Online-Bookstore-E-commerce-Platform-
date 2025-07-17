import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../../core/services/book.service';

@Component({
  selector: 'app-browse-books',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './browse-books.component.html',
  styleUrls: ['./browse-books.component.css',
              '../../../../assets/css/booksto.min.css',
              '../../../../assets/css/custom.min.css',
              '../../../../assets/css/customizer.min.css',
              '../../../../assets/css/flaticon.css',
              '../../../../assets/css/font-awesome.min.css',
              '../../../../assets/css/ionicons.min.css',
              '../../../../assets/css/line-awesome.min.css',
              '../../../../assets/css/libs.min.css',
              '../../../../assets/css/remixicon.css',
              '../../../../assets/css/style.css',
              '../../../../assets/css/rtl.min.css',
              '../../../../assets/css/style_1.css',
              '../../../../assets/css/style_2.css',
              '../../../../assets/css/webfont.css'
  ],
  encapsulation: ViewEncapsulation.None,
  
})
export class BrowseBooksComponent implements OnInit {
  books: any[] = [];

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.bookService.getBooks().subscribe((data: any[]) => {
      this.books = data;
    });
  }
}
