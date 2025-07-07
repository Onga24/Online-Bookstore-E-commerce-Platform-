import { Injectable } from '@angular/core';
// This service will handle book-related operations, such as fetching books from the backend API.
// It will use Angular's HttpClient to make HTTP requests to the backend server.
@Injectable({
  providedIn: 'root'
})
export class BookService {
private apiUrl = 'http://localhost:3000/api/books';
  constructor() { }
}
