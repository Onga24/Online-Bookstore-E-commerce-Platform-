import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoriteReadsComponent } from './favorite-reads.component';

describe('FavoriteReadsComponent', () => {
  let component: FavoriteReadsComponent;
  let fixture: ComponentFixture<FavoriteReadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoriteReadsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FavoriteReadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
