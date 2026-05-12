import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { BookingService, Booking } from '../../services/booking.service';
import { OrderService, Order } from '../../services/order.service';
import { HttpClient } from '@angular/common/http';
import { take, delay } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="profile-page" *ngIf="user() as u; else loginMsg">
      <header class="profile-header">
        <div class="avatar">{{ initial() }}</div>
        <div class="info">
          <h2>{{ u.name }}</h2>
          <p>{{ u.email }}</p>
          <span class="role">{{ u.role | uppercase }}</span>
        </div>
      </header>

      <section class="details">
        <h3>Profile Details</h3>
        <ul>
          <li><strong>ID:</strong> {{ u.id || u._id }}</li>
          <li><strong>Name:</strong> {{ u.name }}</li>
          <li><strong>Email:</strong> {{ u.email }}</li>
          <li><strong>Role:</strong> {{ u.role }}</li>
        </ul>
      </section>

      <section class="quick-links">
        <h3>Quick Links</h3>
        <ul class="links">
          <li><a routerLink="/home">Home</a></li>
          <li><a routerLink="/menu">Menu</a></li>
          <li><a routerLink="/booking">Book a Table</a></li>
          <li><a routerLink="/contact">Contact</a></li>
          <li *ngIf="u.role === 'admin'"><a routerLink="/admin/dashboard">Admin Panel</a></li>
        </ul>
      </section>

      <section class="my-bookings">
        <h3>📅 My Bookings & Orders</h3>
        
        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn" [class.active]="activeTab() === 'bookings'" (click)="setTab('bookings')">
            📅 Bookings ({{ bookings().length }})
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'orders'" (click)="setTab('orders')">
            🛒 Orders ({{ orders().length }})
          </button>
        </div>

        <!-- Bookings Tab -->
        <div *ngIf="activeTab() === 'bookings'">
          <div *ngIf="loadingBookings()" class="loading">
            <div class="spinner"></div>
            <p>Loading your bookings...</p>
          </div>

          <div *ngIf="!loadingBookings() && bookings().length === 0" class="no-bookings">
            <p>No bookings found. <a routerLink="/booking">Book a table now!</a></p>
          </div>

          <div *ngIf="!loadingBookings() && bookings().length > 0" class="bookings-list">
            <div class="booking-card" *ngFor="let booking of bookings()" [class]="'status-' + (booking.status || 'pending')">
              <div class="booking-header">
                <div>
                  <span class="booking-type">📅 TABLE BOOKING</span>
                  <span class="booking-id">#{{ (booking._id || '').slice(-8).toUpperCase() }}</span>
                </div>
                <span class="booking-status" [class]="getStatusClass(booking.status || 'pending')">
                  {{ getStatusLabel(booking.status || 'pending') }}
                </span>
              </div>
              <div class="booking-details">
                <div class="detail-row">
                  <span class="icon">📅</span>
                  <span>{{ booking.date | date:'mediumDate' }} at {{ booking.time }}</span>
                </div>
                <div class="detail-row">
                  <span class="icon">👥</span>
                  <span>{{ booking.numberOfGuests }} guests</span>
                </div>
                <div class="detail-row">
                  <span class="icon">🍽️</span>
                  <span>{{ booking.tableType | titlecase }} - Table {{ (booking.tableNumbers || []).join(', ') }}</span>
                </div>
                <div class="detail-row" *ngIf="booking.paymentAmount">
                  <span class="icon">💰</span>
                  <span>₹{{ booking.paymentAmount }}</span>
                </div>
              </div>
              <div class="booking-actions">
                <button *ngIf="canCancelBooking(booking)" class="cancel-btn" (click)="cancelBooking(booking._id!)" [disabled]="cancellingId() === booking._id">
                  {{ cancellingId() === booking._id ? 'Cancelling...' : '❌ Cancel' }}
                </button>
                <button class="delete-btn" (click)="deleteBooking(booking._id!)" [disabled]="deletingId() === booking._id">
                  {{ deletingId() === booking._id ? 'Deleting...' : '🗑️ Delete' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Orders Tab -->
        <div *ngIf="activeTab() === 'orders'">
          <div *ngIf="loadingOrders()" class="loading">
            <div class="spinner"></div>
            <p>Loading your orders...</p>
          </div>

          <div *ngIf="!loadingOrders() && orders().length === 0" class="no-bookings">
            <p>No orders found. <a routerLink="/menu">Order food now!</a></p>
          </div>

          <div *ngIf="!loadingOrders() && orders().length > 0" class="bookings-list">
            <div class="booking-card" *ngFor="let order of orders()" [class]="'status-' + (order.status || 'pending')">
              <div class="booking-header">
                <div>
                  <span class="booking-type">🛒 FOOD ORDER</span>
                  <span class="booking-id">#{{ (order._id || '').slice(-8).toUpperCase() }}</span>
                </div>
                <span class="booking-status" [class]="getOrderStatusClass(order.status || 'pending')">
                  {{ getOrderStatusLabel(order.status || 'pending') }}
                </span>
              </div>
              <div class="booking-details">
                <div class="detail-row">
                  <span class="icon">📅</span>
                  <span>{{ order.createdAt | date:'mediumDate' }}</span>
                </div>
                <div class="detail-row">
                  <span class="icon">🍽️</span>
                  <span>Table {{ order.tableNumber === 0 ? 'Takeout' : order.tableNumber }}</span>
                </div>
                <div class="order-items">
                  <div class="item" *ngFor="let item of order.items">
                    <span>{{ item.quantity }}x {{ item.name }}</span>
                    <span>₹{{ item.price * item.quantity }}</span>
                  </div>
                </div>
                <div class="detail-row total">
                  <span class="icon">💰</span>
                  <span><strong>Total: ₹{{ order.totalPrice }}</strong></span>
                </div>
              </div>
              <div class="booking-actions">
                <button *ngIf="canCancelOrder(order)" class="cancel-btn" (click)="cancelOrder(order._id!)" [disabled]="cancellingOrderId() === order._id">
                  {{ cancellingOrderId() === order._id ? 'Cancelling...' : '❌ Cancel' }}
                </button>
                <button class="delete-btn" (click)="deleteOrder(order._id!)" [disabled]="deletingOrderId() === order._id">
                  {{ deletingOrderId() === order._id ? 'Deleting...' : '🗑️ Delete' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="password">
        <h3>Change Password</h3>
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
          <div class="form-field">
            <label>Current Password</label>
            <input formControlName="currentPassword" type="password" placeholder="Current password">
          </div>
          <div class="form-field">
            <label>New Password</label>
            <input formControlName="newPassword" type="password" placeholder="New password">
          </div>
          <div class="form-field">
            <label>Confirm New Password</label>
            <input formControlName="confirmPassword" type="password" placeholder="Confirm new password">
          </div>
          <div class="error" *ngIf="passwordForm.errors?.['mismatch']">Passwords do not match</div>
          <div class="error" *ngIf="error()">{{ error() }}</div>
          <div class="success" *ngIf="success()">{{ success() }}</div>
          <button type="submit" [disabled]="passwordForm.invalid || loading()"> {{ loading() ? 'Updating...' : 'Update Password' }}</button>
        </form>
      </section>
    </div>

    <ng-template #loginMsg>
      <div class="not-logged">
        <p>Please login to view your profile.</p>
        <a routerLink="/login" class="login-btn">Go to Login</a>
      </div>
    </ng-template>
  `,
  styles: [`
    .profile-page { max-width: 800px; margin: 2rem auto; padding: 1.5rem; background: #fff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .profile-header { display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg,#f1c40f,#f39c12); display:flex; align-items:center; justify-content:center; color:#1a1a1a; font-weight:800; font-size: 1.5rem; }
    .info h2 { margin: 0; }
    .role { background: #2c3e50; color: #fff; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; }
    .details { margin-top: 1.5rem; }
    .details ul { list-style: none; padding: 0; }
    .details li { margin: .35rem 0; }
    .password { margin-top: 2rem; }
    .quick-links { margin-top: 2rem; }
    .links { list-style:none; padding:0; display:flex; gap:.75rem; flex-wrap:wrap; }
    .links a { display:inline-block; padding:.5rem .75rem; border:1px solid #dcdfe3; border-radius:8px; text-decoration:none; color:#2c3e50; transition:all .2s; }
    .links a:hover { background:#eef2ff; border-color:#bfc6d8; }
    
    .my-bookings { margin-top: 2rem; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 2px solid #e9ecef; }
    .tab-btn { padding: 0.75rem 1.5rem; background: none; border: none; cursor: pointer; font-weight: 500; color: #666; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab-btn.active { color: #667eea; border-bottom-color: #667eea; }
    .tab-btn:hover { color: #667eea; }
    .loading { text-align: center; padding: 1rem; }
    .spinner { width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .no-bookings { text-align: center; padding: 1rem; color: #666; }
    .no-bookings a { color: #667eea; text-decoration: none; }
    .bookings-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
    .booking-card { background: #f8f9fa; border-radius: 8px; padding: 1rem; border-left: 4px solid #667eea; }
    .booking-card.status-confirm { border-left-color: #27ae60; }
    .booking-card.status-pending { border-left-color: #f39c12; }
    .booking-card.status-cancel { border-left-color: #e74c3c; opacity: 0.7; }
    .booking-card.status-confirmed { border-left-color: #27ae60; }
    .booking-card.status-delivered { border-left-color: #1abc9c; }
    .booking-card.status-ready { border-left-color: #9b59b6; }
    .booking-card.status-preparing { border-left-color: #3498db; }
    .booking-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .booking-type { display: block; font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .booking-id { font-weight: bold; color: #2c3e50; font-family: monospace; font-size: 0.9rem; }
    .booking-status { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
    .status-confirmed { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    .status-preparing { background: #cce5ff; color: #004085; }
    .status-ready { background: #d4edda; color: #155724; }
    .status-delivered { background: #d1e7dd; color: #0f5132; }
    .booking-details { margin: 0.5rem 0; }
    .detail-row { display: flex; align-items: center; gap: 0.5rem; margin: 0.25rem 0; color: #555; }
    .detail-row .icon { font-size: 1rem; }
    .detail-row.total { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #ddd; }
    .order-items { margin: 0.5rem 0; padding: 0.5rem; background: white; border-radius: 4px; }
    .order-items .item { display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem; }
    .booking-actions { margin-top: 0.75rem; display: flex; gap: 0.5rem; }
    .cancel-btn { padding: 0.4rem 0.8rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .cancel-btn:hover:not(:disabled) { background: #c0392b; }
    .cancel-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .delete-btn { padding: 0.4rem 0.8rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .delete-btn:hover:not(:disabled) { background: #5a6268; }
    .delete-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .form-field { display: flex; flex-direction: column; gap: .35rem; margin-bottom: .75rem; }
    input { padding: .6rem .8rem; border: 1px solid #dcdfe3; border-radius: 8px; }
    button { padding: .6rem 1rem; border: none; background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; border-radius: 8px; cursor: pointer; }
    .error { color: #c0392b; margin: .5rem 0; }
    .success { color: #27ae60; margin: .5rem 0; }
    .not-logged { text-align: center; padding: 2rem; }
    .login-btn { display:inline-block; margin-top: .5rem; padding: .5rem .8rem; background:#2c3e50; color:#fff; border-radius:8px; text-decoration:none; }
  `]
})
export class ProfileComponent implements OnInit {
  user = signal<User | null>(null);
  initial = computed(() => {
    const u = this.user();
    if (!u) return '';
    const src = u.email || u.name || u.id || '';
    return src.trim().charAt(0).toUpperCase();
  });

  passwordForm!: FormGroup;

  error = signal<string | null>(null);
  success = signal<string | null>(null);
  loading = signal<boolean>(false);
  
  bookings = signal<Booking[]>([]);
  loadingBookings = signal<boolean>(false);
  cancellingId = signal<string | null>(null);
  deletingId = signal<string | null>(null);
  
  orders = signal<Order[]>([]);
  loadingOrders = signal<boolean>(false);
  cancellingOrderId = signal<string | null>(null);
  deletingOrderId = signal<string | null>(null);
  
  activeTab = signal<'bookings' | 'orders'>('bookings');

  constructor(private auth: AuthService, private fb: FormBuilder, private http: HttpClient, private bookingService: BookingService, private orderService: OrderService) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: (group) => {
      const n = group.get('newPassword')?.value;
      const c = group.get('confirmPassword')?.value;
      return n && c && n !== c ? { mismatch: true } : null;
    } });
  }

  ngOnInit(): void {
    // Subscribe to current user observable to handle async auth state
    // Add small delay to allow auth service to restore user from sessionStorage
    this.auth.currentUser$.pipe(take(1), delay(100)).subscribe(current => {
      console.log('Profile ngOnInit - current user:', current);
      if (current) {
        this.user.set(current);
        this.loadBookings();
        this.loadOrders();
      } else {
        // Try fetch from backend profile
        this.auth.getProfile().subscribe({
          next: u => {
            this.user.set(u);
            this.loadBookings();
            this.loadOrders();
          },
          error: () => this.error.set('Failed to load profile')
        });
      }
    });
  }
  
  setTab(tab: 'bookings' | 'orders') {
    this.activeTab.set(tab);
  }
  
  loadBookings(): void {
    this.loadingBookings.set(true);
    this.bookingService.getUserBookings().subscribe({
      next: (bookings) => {
        console.log('Bookings loaded:', bookings);
        this.bookings.set(bookings);
        this.loadingBookings.set(false);
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.loadingBookings.set(false);
      }
    });
  }
  
  getStatusClass(status: string): string {
    switch(status) {
      case 'confirm': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancel': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'confirm': return '✅ Confirmed';
      case 'pending': return '⏳ Pending';
      case 'cancel': return '❌ Cancelled';
      default: return '⏳ Pending';
    }
  }
  
  canCancelBooking(booking: Booking): boolean {
    return ['pending', 'confirm'].includes(booking.status || 'pending');
  }
  
  cancelBooking(bookingId: string): void {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    this.cancellingId.set(bookingId);
    this.bookingService.cancelUserBooking(bookingId).subscribe({
      next: (updatedBooking) => {
        const updated = this.bookings().map(b => b._id === bookingId ? updatedBooking : b);
        this.bookings.set(updated);
        this.cancellingId.set(null);
        alert('Booking cancelled successfully!');
      },
      error: (err) => {
        console.error('Error cancelling booking:', err);
        this.cancellingId.set(null);
        alert(err?.error?.message || 'Failed to cancel booking');
      }
    });
  }
  
  deleteBooking(bookingId: string): void {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;
    
    this.deletingId.set(bookingId);
    this.bookingService.deleteBooking(bookingId).subscribe({
      next: () => {
        const updated = this.bookings().filter(b => b._id !== bookingId);
        this.bookings.set(updated);
        this.deletingId.set(null);
        alert('Booking deleted successfully!');
      },
      error: (err) => {
        console.error('Error deleting booking:', err);
        this.deletingId.set(null);
        alert(err?.error?.message || 'Failed to delete booking');
      }
    });
  }
  
  loadOrders(): void {
    this.loadingOrders.set(true);
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        console.log('Orders loaded:', orders);
        this.orders.set(orders);
        this.loadingOrders.set(false);
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loadingOrders.set(false);
      }
    });
  }
  
  getOrderStatusClass(status: string): string {
    switch(status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'preparing': return 'status-preparing';
      case 'ready': return 'status-ready';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  getOrderStatusLabel(status: string): string {
    switch(status) {
      case 'confirmed': return '✅ Confirmed';
      case 'pending': return '⏳ Pending';
      case 'preparing': return '👨‍🍳 Preparing';
      case 'ready': return '🍽️ Ready';
      case 'delivered': return '📦 Delivered';
      case 'cancelled': return '❌ Cancelled';
      default: return '⏳ Pending';
    }
  }
  
  canCancelOrder(order: Order): boolean {
    return ['pending', 'confirmed', 'preparing'].includes(order.status || 'pending');
  }
  
  cancelOrder(orderId: string): void {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    this.cancellingOrderId.set(orderId);
    this.orderService.cancelOrder(orderId).subscribe({
      next: (response) => {
        const updated = this.orders().map(o => o._id === orderId ? response.order : o);
        this.orders.set(updated);
        this.cancellingOrderId.set(null);
        alert('Order cancelled successfully!');
      },
      error: (err) => {
        console.error('Error cancelling order:', err);
        this.cancellingOrderId.set(null);
        alert(err?.error?.message || 'Failed to cancel order');
      }
    });
  }
  
  deleteOrder(orderId: string): void {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    
    this.deletingOrderId.set(orderId);
    this.orderService.deleteOrder(orderId).subscribe({
      next: () => {
        const updated = this.orders().filter(o => o._id !== orderId);
        this.orders.set(updated);
        this.deletingOrderId.set(null);
        alert('Order deleted successfully!');
      },
      error: (err) => {
        console.error('Error deleting order:', err);
        this.deletingOrderId.set(null);
        alert(err?.error?.message || 'Failed to delete order');
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const { currentPassword, newPassword } = this.passwordForm.value;
    this.auth.changePassword(currentPassword!, newPassword!).subscribe({
      next: res => {
        this.loading.set(false);
        this.success.set(res?.message || 'Password updated successfully');
        this.passwordForm.reset();
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Password update failed');
      }
    });
  }
}
