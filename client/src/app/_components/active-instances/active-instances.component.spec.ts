import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveInstancesComponent } from './active-instances.component';

describe('ActiveInstancesComponent', () => {
  let component: ActiveInstancesComponent;
  let fixture: ComponentFixture<ActiveInstancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveInstancesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActiveInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
