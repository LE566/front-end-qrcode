import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileAppPage } from './mobile-app.page';

describe('MobileAppPage', () => {
  let component: MobileAppPage;
  let fixture: ComponentFixture<MobileAppPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MobileAppPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
