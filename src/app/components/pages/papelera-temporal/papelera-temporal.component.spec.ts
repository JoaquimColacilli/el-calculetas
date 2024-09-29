import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PapeleraTemporalComponent } from './papelera-temporal.component';

describe('PapeleraTemporalComponent', () => {
  let component: PapeleraTemporalComponent;
  let fixture: ComponentFixture<PapeleraTemporalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PapeleraTemporalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PapeleraTemporalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
