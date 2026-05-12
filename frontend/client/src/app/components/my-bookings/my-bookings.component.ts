import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { BookingService, Booking } from '../../services/booking.service';
import { take, delay } from 'rxjs/operators';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="my-bookings-page">
      <header class="page-header">
        <h1>📅 My Booking History</h1>
        <p class="subtitle">View and manage all your table reservations</p>
      </header>

      <div *ngIf="!isLoggedIn()" class="not-logged">
        <p>Please login to view your bookings.</p>
        <a routerLink="/login" class="login-btn">Go to Login</a>
      </div>

      <div *ngIf="isLoggedIn()" class="bookings-content">
        <div class="stats-bar">
          <div class="stat-card">
            <span class="stat-number">{{ totalBookings() }}</span>
            <span class="stat-label">Total Bookings</span>
          </div>
          <div class="stat-card confirmed">
            <span class="stat-number">{{ confirmedCount() }}</span>
            <span class="stat-label">Confirmed</span>
          </div>
          <div class="stat-card pending">
            <span class="stat-number">{{ pendingCount() }}</span>
            <span class="stat-label">Pending</span>
          </div>
          <div class="stat-card cancelled">
            <span class="stat-number">{{ cancelledCount() }}</span>
            <span class="stat-label">Cancelled</span>
          </div>
        </div>

        <div *ngIf="loadingBookings()" class="loading">
          <div class="spinner"></div>
          <p>Loading your bookings...</p>
        </div>

        <div *ngIf="!loadingBookings() && bookings().length === 0" class="no-bookings">
          <div class="empty-icon">📭</div>
          <h3>No bookings found</h3>
          <p>You haven't made any table reservations yet.</p>
          <a routerLink="/booking" class="book-now-btn">Book a Table Now</a>
        </div>

        <div *ngIf="!loadingBookings() && bookings().length > 0" class="bookings-list">
          <div class="booking-card" *ngFor="let booking of bookings()" [class]="'status-' + (booking.status || 'pending')">
            <div class="booking-header">
              <div class="booking-id">
                <span class="label">Booking ID</span>
                <span class="value">#{{ (booking._id || '').slice(-8).toUpperCase() }}</span>
              </div>
              <div class="booking-status" [class]="getStatusClass(booking.status || 'pending')">
                {{ getStatusLabel(booking.status || 'pending') }}
              </div>
            </div>
            
            <div class="booking-body">
              <div class="info-row">
                <div class="info-item">
                  <span class="icon">📅</span>
                  <div>
                    <span class="label">Date</span>
                    <span class="value">{{ booking.date | date:'fullDate' }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <span class="icon">🕐</span>
                  <div>
                    <span class="label">Time</span>
                    <span class="value">{{ booking.time }}</span>
                  </div>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-item">
                  <span class="icon">👥</span>
                  <div>
                    <span class="label">Guests</span>
                    <span class="value">{{ booking.numberOfGuests }} people</span>
                  </div>
                </div>
                <div class="info-item">
                  <span class="icon">🍽️</span>
                  <div>
                    <span class="label">Table Type</span>
                    <span class="value">{{ booking.tableType | titlecase }}</span>
                  </div>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-item">
                  <span class="icon">🔢</span>
                  <div>
                    <span class="label">Table Numbers</span>
                    <span class="value">{{ (booking.tableNumbers || []).join(', ') }}</span>
                  </div>
                </div>
                <div class="info-item" *ngIf="booking.paymentAmount">
                  <span class="icon">💰</span>
                  <div>
                    <span class="label">Amount Paid</span>
                    <span class="value">₹{{ booking.paymentAmount }}</span>
                  </div>
                </div>
              </div>

              <div class="special-requests" *ngIf="booking.specialRequests">
                <span class="label">Special Requests:</span>
                <p>{{ booking.specialRequests }}</p>
              </div>
            </div>

            <div class="booking-footer">
              <span class="booked-on">Booked on {{ booking.createdAt | date:'mediumDate' }}</span>
              <div class="booking-actions" *ngIf="canCancelBooking(booking)">
                <button class="cancel-btn" (click)="cancelBooking(booking._id!)" [disabled]="cancellingBookingId() === booking._id">
                  {{ cancellingBookingId() === booking._id ? 'Cancelling...' : '❌ Cancel Booking' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions-bar">
        <a routerLink="/profile" class="btn btn-secondary">← Back to Profile</a>
        <a routerLink="/booking" class="btn btn-primary">+ New Booking</a>
      </div>
    </div>
  `,
  styles: [`
    .my-bookings-page {
      max-width: 1000px;
      margin: 2rem auto;
      padding: 1.5rem;
    }

    .page-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2rem;
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #666;
      margin: 0;
    }

    .stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
    }

    .stat-card.confirmed {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
    }

    .stat-card.pending {
      background: linear-gradient(135deg, #f39c12, #f1c40f);
    }

    .stat-card.cancelled {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
    }

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: bold;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .no-bookings {
      text-align: center;
      padding: 4rem 2rem;
      background: #f8f9fa;
      border-radius: 16px;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .no-bookings h3 {
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
    }

    .no-bookings p {
      color: #666;
      margin: 0 0 1.5rem 0;
    }

    .book-now-btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .book-now-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .bookings-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .booking-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
      border-left: 4px solid #667eea;
    }

    .booking-card.status-confirm {
      border-left-color: #27ae60;
    }

    .booking-card.status-pending {
      border-left-color: #f39c12;
    }

    .booking-card.status-cancel {
      border-left-color: #e74c3c;
      opacity: 0.8;
    }

    .booking-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .booking-id .label {
      display: block;
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
    }

    .booking-id .value {
      font-weight: bold;
      color: #2c3e50;
      font-family: monospace;
    }

    .booking-status {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-confirmed {
      background: #d4edda;
      color: #155724;
    }

    .status-pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-cancelled {
      background: #f8d7da;
      color: #721c24;
    }

    .booking-body {
      padding: 1.5rem;
    }

    .info-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .info-item .icon {
      font-size: 1.25rem;
    }

    .info-item .label {
      display: block;
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
    }

    .info-item .value {
      display: block;
      font-weight: 500;
      color: #2c3e50;
    }

    .special-requests {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .special-requests .label {
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
    }

    .special-requests p {
      margin: 0.25rem 0 0 0;
      color: #444;
    }

    .booking-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .booked-on {
      font-size: 0.85rem;
      color: #666;
    }

    .cancel-btn {
      padding: 0.5rem 1rem;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }

    .cancel-btn:hover:not(:disabled) {
      background: #c0392b;
    }

    .cancel-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e9ecef;
    }

    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #e9ecef;
      color: #495057;
    }

    .btn-secondary:hover {
      background: #dee2e6;
    }

    .not-logged {
      text-align: center;
      padding: 4rem 2rem;
      background: #f8f9fa;
      border-radius: 16px;
    }

    .not-logged p {
      color: #666;
      margin: 0 0 1rem 0;
    }

    .login-btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #2c3e50;
      color: white;
      text-decoration: none;
      border-radius: 8px;
    }
  `]
})
export class MyBookingsComponent implements OnInit {
  user = signal<User | null>(null);
  isLoggedIn = computed(() => this.user() !== null);
  
  bookings = signal<Booking[]>([]);
  loadingBookings = signal<boolean>(false);
  cancellingBookingId = signal<string | null>(null);

  // Statistics
  totalBookings = computed(() => this.bookings().length);
  confirmedCount = computed(() => this.bookings().filter(b => b.status === 'confirm').length);
  pendingCount = computed(() => this.bookings().filter(b => b.status === 'pending' || !b.status).length);
  cancelledCount = computed(() => this.bookings().filter(b => b.status === 'cancel').length);

  constructor(
    private auth: AuthService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user observable
    this.auth.currentUser$.pipe(take(1), delay(100)).subscribe(current => {
      if (current) {
        this.user.set(current);
        this.loadUserBookings();
      } else {
        // Try fetch from backend profile
        this.auth.getProfile().subscribe({
          next: u => {
            this.user.set(u);
            this.loadUserBookings();
          },
          error: () => {
            this.user.set(null);
          }
        });
      }
    });
  }

  loadUserBookings(): void {
    const currentUser = this.auth.getCurrentUser();
    
    if (!currentUser) {
      console.log('No user logged in, skipping bookings load');
      return;
    }
    
    console.log('Loading user bookings for userId:', currentUser.id || currentUser._id);
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
    // User can cancel if booking is pending or confirm
    // Cannot cancel if already cancelled
    return ['pending', 'confirm'].includes(booking.status || 'pending');
  }

  cancelBooking(bookingId: string): void {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    this.cancellingBookingId.set(bookingId);
    
    this.bookingService.cancelUserBooking(bookingId).subscribe({
      next: (updatedBooking) => {
        console.log('Booking cancelled:', updatedBooking);
        // Update the booking in the list
        const updatedBookings = this.bookings().map(b => 
          b._id === bookingId ? updatedBooking : b
        );
        this.bookings.set(updatedBookings);
        this.cancellingBookingId.set(null);
        alert('Booking cancelled successfully!');
      },
      error: (err) => {
        console.error('Error cancelling booking:', err);
        this.cancellingBookingId.set(null);
        alert(err?.error?.message || 'Failed to cancel booking. Please try again.');
      }
    });
  }
}
