import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngresarSueldoComponent } from './ingresar-sueldo.component';

describe('IngresarSueldoComponent', () => {
  let component: IngresarSueldoComponent;
  let fixture: ComponentFixture<IngresarSueldoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngresarSueldoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IngresarSueldoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
