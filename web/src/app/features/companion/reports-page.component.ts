import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { dateLabel, duration, km, kmh } from '../../core/format';
import { ReportResponse } from '../../core/models';
import { LoadingPulseComponent } from '../../shared/loading-pulse.component';

type Period = 'day' | 'month' | 'year';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [FormsModule, LoadingPulseComponent, RouterLink],
  template: `
    <section class="page-title">
      <p class="kicker">RIDER PULSE</p>
      <h1>Ride summaries</h1>
      <p>Reports are part of Insights: use them to review a period, open its rides, or export a printable summary.</p>
    </section>

    <nav class="insights-tabs" aria-label="Insights sections">
      <a routerLink="/app/analytics">Overview</a>
      <a routerLink="/app/analytics" fragment="trends">Trends</a>
      <a class="active" routerLink="/app/reports" aria-current="page">Reports</a>
    </nav>

    <div class="report-controls">
      <div class="filter-bar" aria-label="Report period">
        @for (item of periods; track item) {
          <button type="button" [class.active]="period() === item" [attr.aria-pressed]="period() === item" (click)="setPeriod(item)">{{ item }}</button>
        }
      </div>
      <label class="report-date">Date in period
        <input type="date" [ngModel]="selectedDate()" (ngModelChange)="setDate($event)" [max]="today" required />
      </label>
      @if (selectedDate() !== today) { <button type="button" class="secondary-action" (click)="setDate(today)">Back to today</button> }
    </div>
    <p class="report-period" aria-live="polite">{{ periodLabel() }}</p>

    @if (loading()) {
      <app-loading-pulse label="Loading ride report" />
    } @else if (report(); as current) {
      <div class="metric-grid">
        <article class="metric-card accent"><span>Distance</span><strong>{{ km(current.summary.distanceM) }}</strong></article>
        <article class="metric-card"><span>Rides</span><strong>{{ current.summary.rideCount }}</strong></article>
        <article class="metric-card"><span>Duration</span><strong>{{ duration(current.summary.durationS) }}</strong></article>
        <article class="metric-card"><span>Top speed</span><strong>{{ kmh(current.summary.topSpeedKmh) }}</strong></article>
      </div>

      <section class="content-section">
        <div class="section-head">
          <h2>Routes</h2>
          <button type="button" class="primary-action" (click)="exportReport(current)">Export / print</button>
        </div>
        <div class="ride-list">
          @for (route of current.routes; track route.rideId || route.startedAt) {
            <a class="ride-row" [routerLink]="route.rideId ? ['/app/journal', route.rideId] : null">
              <div><strong>{{ route.from }}</strong><span>{{ route.to }} · {{ dateLabel(route.startedAt) }}</span></div>
              <b>{{ km(route.distanceM) }}</b>
            </a>
          } @empty {
            <article class="empty-card">No routes in this report period.</article>
          }
        </div>
      </section>
    } @else {
      <article class="empty-card"><p>{{ error() || 'Report unavailable.' }}</p><button class="secondary-action" type="button" (click)="load()">Try again</button></article>
    }
  `
})
export class ReportsPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly period = signal<Period>('month');
  readonly today = this.localDate(new Date());
  readonly selectedDate = signal(this.today);
  private requestGeneration = 0;
  readonly report = signal<ReportResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly periods: Period[] = ['day', 'month', 'year'];
  readonly km = km;
  readonly kmh = kmh;
  readonly duration = duration;
  readonly dateLabel = dateLabel;

  ngOnInit() {
    void this.load();
  }

  setPeriod(period: Period) {
    if (this.period() === period) return;
    this.period.set(period);
    void this.load();
  }

  setDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || value > this.today) return;
    const date = new Date(`${value}T12:00:00`);
    if (!Number.isFinite(date.getTime()) || this.localDate(date) !== value || value === this.selectedDate()) return;
    this.selectedDate.set(value);
    void this.load();
  }

  periodLabel() {
    const date = new Date(`${this.selectedDate()}T12:00:00`);
    const options: Intl.DateTimeFormatOptions = this.period() === 'year'
      ? { year: 'numeric' }
      : this.period() === 'month' ? { month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }

  private localDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  async load() {
    const generation = ++this.requestGeneration;
    this.loading.set(true);
    this.error.set('');
    try {
      const report = await this.api.request<ReportResponse>(`/reports?period=${this.period()}&date=${this.selectedDate()}`);
      if (generation !== this.requestGeneration) return;
      this.report.set(report);
    } catch (error: unknown) {
      if (generation !== this.requestGeneration) return;
      this.error.set(error instanceof Error ? error.message : 'Unable to load report.');
      this.report.set(null);
    } finally {
      if (generation === this.requestGeneration) this.loading.set(false);
    }
  }

  exportReport(report: ReportResponse) {
    const rows = (report.routes || []).map((route) => `
      <tr>
        <td>${this.escape(dateLabel(route.startedAt))}</td>
        <td>${this.escape(route.from)}</td>
        <td>${this.escape(route.to)}</td>
        <td>${this.escape(km(route.distanceM))}</td>
        <td>${this.escape(duration(route.durationS))}</td>
        <td>${this.escape(kmh(route.topSpeedKmh))}</td>
      </tr>
    `).join('');
    const html = `
      <html>
        <head>
          <title>RidePulse ${this.escape(report.period)} report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 28px; }
            h1 { margin-bottom: 6px; }
            .summary { line-height: 1.8; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 22px; }
            th, td { border-bottom: 1px solid #ddd; padding: 9px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>RidePulse ${this.escape(report.period)} report</h1>
          <p>${this.escape(this.periodLabel())}</p>
          <div class="summary">
            <div>Ride count: ${report.summary.rideCount}</div>
            <div>Distance: ${this.escape(km(report.summary.distanceM))}</div>
            <div>Total duration: ${this.escape(duration(report.summary.durationS))}</div>
            <div>Average speed: ${this.escape(kmh(report.summary.averageSpeedKmh))}</div>
            <div>Top speed: ${this.escape(kmh(report.summary.topSpeedKmh))}</div>
          </div>
          <table>
            <thead><tr><th>Date</th><th>From</th><th>To</th><th>Distance</th><th>Duration</th><th>Top speed</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ridepulse-${report.period}-report.html`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private escape(value: unknown) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
