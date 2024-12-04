import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownladItemComponent } from './downlad-item.component';

describe('DownladItemComponent', () => {
  let component: DownladItemComponent;
  let fixture: ComponentFixture<DownladItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownladItemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DownladItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
