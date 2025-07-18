import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// This service will handle book-related operations, such as fetching books from the backend API.
// It will use Angular's HttpClient to make HTTP requests to the backend server.
@Injectable({
  providedIn: 'root'
})
export class BookService {
private apiUrl = 'http://localhost:5000/api/books';
  constructor(private http: HttpClient) { }

  getBooks(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
