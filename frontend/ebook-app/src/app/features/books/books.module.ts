import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BooksRoutingModule } from './books-routing.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BooksRoutingModule
  ]
})
export class BooksModule { }
export interface Book {
  _id?: string; // Optional, as it's only present after saving to DB
  title: string;
  author: string;
  description: string;
  category: string;
  price: number;
  publisher?: string; // Optional in model, though required by your form validators
  publicationDate?: string; // Optional in model, though required by your form validators
  pdfUrl?: string; // Optional: The URL to the PDF file (if you store it)
  coverImage?: string; // Optional: The URL to the cover image
  createdAt?: string; // Mongoose timestamps
  updatedAt?: string; // Mongoose timestamps
}