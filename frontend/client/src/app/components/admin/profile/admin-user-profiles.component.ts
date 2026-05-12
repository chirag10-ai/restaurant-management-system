import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { UserService, User as AdminUser } from '../../../services/user.service';
import { AuthService, PasswordChangeLog } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-user-profiles',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="user-profiles">
      <div class="header">
        <h2>User Profiles</h2>
        <input class="search" type="text" placeholder="Search by name or email" (input)="onSearch($event)">
      </div>
      <div class="layout">
        <aside class="users-list">
          <div 
            class="user-item" 
            *ngFor="let u of filteredUsers()" 
            [class.active]="u._id === selectedId()" 
            (click)="select(u._id)">
            <div class="avatar">{{ (u.name || u.email || 'U').charAt(0).toUpperCase() }}</div>
            <div class="meta">
              <div class="name">{{ u.name }}</div>
              <div class="email">{{ u.email }}</div>
            </div>
          </div>
        </aside>
        <section class="detail" *ngIf="selectedUser() as su; else empty">
          <h3>Profile Detail</h3>
          <ul class="detail-list">
            <li><strong>ID:</strong> {{ su._id }}</li>
            <li><strong>Name:</strong> {{ su.name }}</li>
            <li><strong>Email:</strong> {{ su.email }}</li>
            <li><strong>Role:</strong> {{ su.role }}</li>
            <li><strong>Status:</strong> {{ su.isActive ? 'Active' : 'Inactive' }}</li>
            <li><strong>Created:</strong> {{ su.createdAt | date:'short' }}</li>
            <li><strong>Updated:</strong> {{ su.updatedAt | date:'short' }}</li>
          </ul>
          <h3>Password Change Activity</h3>
          <table *ngIf="userLogs().length > 0; else noLogs">
            <thead>
              <tr>
                <th>Email</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of userLogs()">
                <td>{{ l.email }}</td>
                <td>{{ l.createdAt | date:'short' }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noLogs>
            <p>No password changes for this user.</p>
          </ng-template>
        </section>
        <ng-template #empty>
          <section class="detail empty">
            <p>Select a user to see details</p>
          </section>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .user-profiles { background:#fff; padding:1rem; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08); }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; }
    .search { border:1px solid #ddd; border-radius:8px; padding:.5rem .75rem; width:260px; }
    .layout { display:flex; gap:1rem; }
    .users-list { width:320px; max-height:70vh; overflow:auto; border-right:1px solid #eee; padding-right:.5rem; }
    .user-item { display:flex; gap:.6rem; padding:.5rem; border-radius:8px; cursor:pointer; align-items:center; }
    .user-item:hover { background:#f7f8fa; }
    .user-item.active { background:#eef2ff; }
    .avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#f1c40f,#f39c12); display:flex; align-items:center; justify-content:center; font-weight:800; color:#1a1a1a; }
    .meta .name { font-weight:600; }
    .meta .email { color:#6b7280; font-size:.85rem; }
    .detail { flex:1; }
    .detail-list { list-style:none; padding:0; columns:2; }
    table { width:100%; border-collapse:collapse; margin-top:.5rem; }
    th, td { text-align:left; padding:.5rem; border-bottom:1px solid #eee; }
    .empty { display:flex; align-items:center; justify-content:center; color:#6b7280; height:200px; }
  `]
})
export class AdminUserProfilesComponent implements OnInit {
  users = signal<AdminUser[]>([]);
  logs = signal<PasswordChangeLog[]>([]);
  selectedId = signal<string | null>(null);
  query = signal<string>('');

  filteredUsers = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  selectedUser = computed(() => this.users().find(u => u._id === this.selectedId()) || null);

  userLogs = computed(() => {
    const su = this.selectedUser();
    if (!su) return [];
    return this.logs().filter(l => (l.userId?._id === su._id) || (l.email === su.email));
  });

  constructor(private userService: UserService, private auth: AuthService) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe({
      next: (u) => { 
        this.users.set(u || []); 
        // Intentionally do not pre-select any user; wait for explicit click
        this.selectedId.set(null);
      },
      error: () => {}
    });
    this.auth.getPasswordChangeLogs().subscribe({
      next: (l) => this.logs.set(l || []),
      error: () => {}
    });
  }

  select(id: string) {
    const current = this.selectedId();
    this.selectedId.set(current === id ? null : id);
  }
  onSearch(e: Event) { this.query.set((e.target as HTMLInputElement).value); }
}
