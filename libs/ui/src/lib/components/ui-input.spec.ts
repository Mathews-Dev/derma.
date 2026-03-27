import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiInput } from './ui-input';

describe('UiInput', () => {
  let component: UiInput;
  let fixture: ComponentFixture<UiInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiInput],
    }).compileComponents();

    fixture = TestBed.createComponent(UiInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
