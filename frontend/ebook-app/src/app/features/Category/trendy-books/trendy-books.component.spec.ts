import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendyBooksComponent } from './trendy-books.component';

describe('TrendyBooksComponent', () => {
  let component: TrendyBooksComponent;
  let fixture: ComponentFixture<TrendyBooksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendyBooksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TrendyBooksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
