import { TestBed } from '@angular/core/testing';

import { UploaddataService } from './uploaddata.service';

describe('UploaddataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UploaddataService = TestBed.get(UploaddataService);
    expect(service).toBeTruthy();
  });
});
