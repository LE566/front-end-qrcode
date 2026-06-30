import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebPortalPage } from './web-portal.page';

describe('WebPortalPage', () => {
  let component: WebPortalPage;
  let fixture: ComponentFixture<WebPortalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WebPortalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
