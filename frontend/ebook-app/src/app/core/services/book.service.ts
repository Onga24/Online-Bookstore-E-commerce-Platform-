// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// // This service will handle book-related operations, such as fetching books from the backend API.
// // It will use Angular's HttpClient to make HTTP requests to the backend server.
// @Injectable({
//   providedIn: 'root'
// })
// export class BookService {
// private apiUrl = 'http://localhost:5000/api/books';
//   constructor(private http: HttpClient) {}

// getBooks(page: number, limit: number): Observable<{ books: any[]; totalCount: number }> {
//     return this.http.get<{ books: any[]; totalCount: number }>(
//       `${this.apiUrl}?page=${page}&limit=${limit}`
//     );
//   }

// }



import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface Book {
  title: string;
  author: string;
  description: string;
  category: string;
  price: number;
  pdfUrl?: string;
  coverImage?: string;
}

interface PaginatedBooksResponse {
  books: Book[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:5000/api/books'; // Update if different

  constructor(private http: HttpClient) {}

  getBooks(page: number, limit: number): Observable<PaginatedBooksResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedBooksResponse>(this.apiUrl, { params });
  }
}
