import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeaturedBooksComponent } from './featured-books.component';

describe('FeaturedBooksComponent', () => {
  let component: FeaturedBooksComponent;
  let fixture: ComponentFixture<FeaturedBooksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedBooksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FeaturedBooksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
