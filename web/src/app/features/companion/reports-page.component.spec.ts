import { TestBed } from '@angular/core/testing';
import { ApiService } from '../../core/api.service';
import { ReportResponse } from '../../core/models';
import { ReportsPageComponent } from './reports-page.component';

describe('ReportsPageComponent historical periods', () => {
  const report = { period: 'month', summary: { rideCount: 1 }, routes: [] } as unknown as ReportResponse;

  function setup(request = vi.fn().mockResolvedValue(report)) {
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: { request } }] });
    return { component: TestBed.runInInjectionContext(() => new ReportsPageComponent()), request };
  }

  it('sends a date-only anchor accepted by the existing reports API', () => {
    const { component, request } = setup();
    component.setDate('2024-02-29');
    expect(request).toHaveBeenLastCalledWith('/reports?period=month&date=2024-02-29');
    component.setPeriod('year');
    expect(request).toHaveBeenLastCalledWith('/reports?period=year&date=2024-02-29');
    expect(component.periodLabel()).toBe('2024');
  });

  it('rejects empty, impossible, and future dates without sending requests', () => {
    const { component, request } = setup();
    for (const value of ['', 'invalid', '2025-02-29', '2026-13-01', '9999-01-01']) component.setDate(value);
    expect(request).not.toHaveBeenCalled();
    expect(component.selectedDate()).toBe(component.today);
  });

  it('keeps the newest selection when an older request fails late', async () => {
    let rejectFirst!: (reason: Error) => void;
    const first = new Promise<ReportResponse>((_, reject) => { rejectFirst = reject; });
    const request = vi.fn().mockReturnValueOnce(first).mockResolvedValueOnce(report);
    const { component } = setup(request);
    const previous = component.load();
    component.selectedDate.set('2024-02-29');
    await component.load();
    rejectFirst(new Error('Old request failed'));
    await previous;
    expect(component.report()).toBe(report);
    expect(component.error()).toBe('');
    expect(component.loading()).toBe(false);
  });

  it('keeps the newest selection when an older response arrives late', async () => {
    let finishFirst!: (value: ReportResponse) => void;
    const first = new Promise<ReportResponse>((resolve) => { finishFirst = resolve; });
    const request = vi.fn().mockReturnValueOnce(first).mockResolvedValueOnce(report);
    const { component } = setup(request);
    const previous = component.load();
    component.selectedDate.set('2024-02-29');
    await component.load();
    finishFirst({ ...report, period: 'day' });
    await previous;
    expect(component.report()).toBe(report);
  });
});
