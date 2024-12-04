import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadlistComponent } from './downloadlist.component';

describe('DownloadlistComponent', () => {
  let component: DownloadlistComponent;
  let fixture: ComponentFixture<DownloadlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadlistComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DownloadlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
