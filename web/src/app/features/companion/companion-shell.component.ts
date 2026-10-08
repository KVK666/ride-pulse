import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth.service';
import { ProfilePhotoService } from '../../core/profile-photo.service';

@Component({
  selector: 'app-companion-shell',
  standalone: true,
  imports: [LucideAngularModule, RouterLink, RouterOutlet],
  template: `
    <div class="app-shell">
      <a class="skip-link" href="#companion-content" (click)="skipToContent($event)">Skip to page content</a>
      <header class="mobile-shell-bar">
        <a class="shell-brand" routerLink="/app/home">
          <img src="/ridepulse-logo.png" alt="" />
          <span>RidePulse</span>
        </a>
        <button type="button" class="logout" (click)="logout()" aria-label="Log out of RidePulse">
          <lucide-icon name="log-out" size="18" /> Log out
        </button>
      </header>

      <aside class="sidebar" id="companion-menu">
        <a class="shell-brand" routerLink="/app/home">
          <img src="/ridepulse-logo.png" alt="" />
          <span>RidePulse</span>
        </a>
        <nav aria-label="Companion">
          @for (group of nav; track group.label) {
            <section class="nav-group">
              <p>{{ group.label }}</p>
              @for (item of group.items; track item.path) {
                <a [routerLink]="item.path" [class.active]="activeSection() === item.path" [attr.aria-current]="activeSection() === item.path ? 'page' : null">
                  <lucide-icon [name]="item.icon" size="18" />
                  <span class="nav-label">{{ item.label }}</span>
                </a>
              }
            </section>
          }
        </nav>
        <a class="sidebar-user" routerLink="/app/profile">
          <span class="shell-avatar">
            @if (photo.photoUrl()) {
              <img [src]="photo.photoUrl()" alt="" />
            } @else {
              {{ initials }}
            }
          </span>
          <span>
            <strong>{{ auth.user()?.name || 'Rider' }}</strong>
            <small>{{ auth.user()?.bikeModel || 'Motorcycle' }}</small>
          </span>
        </a>
        <button type="button" class="logout" (click)="logout()">
          <lucide-icon name="log-out" size="18" />
          Logout
        </button>
      </aside>

      <main #content class="app-main" id="companion-content" tabindex="-1">
        <header class="app-topbar">
          <div>
            <p>{{ pageEyebrow() }}</p>
          </div>
          <div class="app-actions">
            <a class="download-pill" href="https://github.com/KVK666/ride-pulse/releases/tag/latest" target="_blank" rel="noreferrer">
              <lucide-icon name="download" size="17" />
              Record in Android
            </a>
            <a class="top-avatar" routerLink="/app/profile" aria-label="Open profile">
              @if (photo.photoUrl()) {
                <img [src]="photo.photoUrl()" alt="" />
              } @else {
                {{ initials }}
              }
            </a>
          </div>
        </header>
        <router-outlet />
      </main>
      <nav class="mobile-bottom-nav" aria-label="Companion">
        @for (item of mobileNav; track item.path) {
          <a [routerLink]="item.path" [class.active]="activeSection() === item.path" [attr.aria-current]="activeSection() === item.path ? 'page' : null">
            <lucide-icon [name]="item.icon" size="21" />
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </div>
  `
})
export class CompanionShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly photo = inject(ProfilePhotoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('content') private content?: ElementRef<HTMLElement>;
  readonly activeSection = signal('/app/home');
  readonly pageEyebrow = signal('YOUR RIDEPULSE');
  private currentPath = '';
  readonly nav = [
    { label: 'RIDE', items: [
      { path: '/app/home', label: 'Home', icon: 'house', eyebrow: 'YOUR RIDEPULSE', aliases: [] },
      { path: '/app/plan', label: 'Plan', icon: 'navigation', eyebrow: 'PLAN YOUR RIDE', aliases: ['/app/navigate', '/app/places'] },
      { path: '/app/journal', label: 'Journal', icon: 'history', eyebrow: 'YOUR RIDE LIBRARY', aliases: ['/app/trips'] },
    ] },
    { label: 'REFLECT', items: [
      { path: '/app/analytics', label: 'Insights', icon: 'chart-column-increasing', eyebrow: 'RIDER PULSE', aliases: ['/app/reports'] },
      { path: '/app/profile', label: 'Account', icon: 'user', eyebrow: 'YOUR RIDEPULSE', aliases: ['/app/you'] },
    ] }
  ];
  readonly mobileNav = this.nav.flatMap((group) => group.items);

  get initials() {
    return (this.auth.user()?.name || 'Rider')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'R';
  }

  ngOnInit() {
    void this.photo.load();
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // The companion scrolls inside main, so window scroll restoration cannot reset it.
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        if (path !== this.currentPath) {
          this.content?.nativeElement.scrollTo({ top: 0, behavior: 'instant' });
        }
        this.updatePageHeader(event.urlAfterRedirects);
      }
    });
    this.updatePageHeader(this.router.url);
  }

  skipToContent(event: Event) {
    event.preventDefault();
    this.content?.nativeElement.focus();
  }

  private updatePageHeader(url: string) {
    const [path] = url.split(/[?#]/);
    this.currentPath = path;
    const section = this.mobileNav.find((item) =>
      [item.path, ...item.aliases].some((prefix) => path === prefix || path.startsWith(`${prefix}/`)),
    );
    this.pageEyebrow.set(section?.eyebrow || 'YOUR RIDEPULSE');
    this.activeSection.set(section?.path || '/app/home');
  }

  async logout() {
    this.auth.logout();
    this.photo.clear();
    await this.router.navigate(['/']);
  }
}
