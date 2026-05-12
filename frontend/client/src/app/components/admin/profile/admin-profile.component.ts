import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService, PasswordChangeLog, User } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="admin-profile" *ngIf="user() as u">
      <div class="header">
        <div class="avatar">{{ (u.name || u.email || 'A').charAt(0).toUpperCase() }}</div>
        <div>
          <h2>{{ u.name }}</h2>
          <p>{{ u.email }}</p>
          <span class="badge">ADMIN</span>
        </div>
      </div>

      <section class="logs">
        <h3>Password Change Activity</h3>
        <div *ngIf="error()" class="error">{{ error() }}</div>
        <table *ngIf="logs().length > 0; else empty">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let l of logs()">
              <td>{{ l.userId?.name || 'Unknown' }}</td>
              <td>{{ l.email }}</td>
              <td>{{ l.createdAt | date:'short' }}</td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <p>No password changes recorded yet.</p>
        </ng-template>
      </section>
    </div>
  `,
  styles: [`
    .admin-profile { background:#fff; padding:1.5rem; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08); }
    .header { display:flex; gap:1rem; align-items:center; border-bottom:1px solid #eee; padding-bottom:1rem; margin-bottom:1rem; }
    .avatar { width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg,#f1c40f,#f39c12); display:flex; align-items:center; justify-content:center; font-weight:800; color:#1a1a1a; }
    .badge { background:#2c3e50; color:#fff; padding:2px 8px; border-radius:6px; font-size:.75rem; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:.6rem; border-bottom:1px solid #eee; text-align:left; }
    .error { color:#c0392b; margin:.5rem 0; }
  `]
})
export class AdminProfileComponent implements OnInit {
  user = signal<User | null>(null);
  logs = signal<PasswordChangeLog[]>([]);
  error = signal<string | null>(null);

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.user.set(this.auth.getCurrentUser());
    this.auth.getPasswordChangeLogs().subscribe({
      next: (data) => this.logs.set(data || []),
      error: (err) => this.error.set(err?.error?.message || 'Failed to load password change logs')
    });
  }
}

