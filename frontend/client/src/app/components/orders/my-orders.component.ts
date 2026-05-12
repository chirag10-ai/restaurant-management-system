import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { OrderService, Order } from '../../services/order.service';
import { take, delay } from 'rxjs/operators';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="my-orders-page">
      <header class="page-header">
        <h1>🛒 My Order History</h1>
        <p class="subtitle">View and manage all your food orders</p>
      </header>

      <div *ngIf="!isLoggedIn()" class="not-logged">
        <p>Please login to view your orders.</p>
        <a routerLink="/login" class="login-btn">Go to Login</a>
      </div>

      <div *ngIf="isLoggedIn()" class="orders-content">
        <div class="stats-bar">
          <div class="stat-card">
            <span class="stat-number">{{ totalOrders() }}</span>
            <span class="stat-label">Total Orders</span>
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

        <div *ngIf="loadingOrders()" class="loading">
          <div class="spinner"></div>
          <p>Loading your orders...</p>
        </div>

        <div *ngIf="!loadingOrders() && orders().length === 0" class="no-orders">
          <div class="empty-icon">🛒</div>
          <h3>No orders found</h3>
          <p>You haven't placed any food orders yet.</p>
          <a routerLink="/menu" class="order-now-btn">Order Food Now</a>
        </div>

        <div *ngIf="!loadingOrders() && orders().length > 0" class="orders-list">
          <div class="order-card" *ngFor="let order of orders()" [class]="'status-' + (order.status || 'pending')">
            <div class="order-header">
              <div class="order-id">
                <span class="label">Order ID</span>
                <span class="value">#{{ (order._id || '').slice(-8).toUpperCase() }}</span>
              </div>
              <div class="order-status" [class]="getStatusClass(order.status || 'pending')">
                {{ getStatusLabel(order.status || 'pending') }}
              </div>
            </div>
            
            <div class="order-body">
              <div class="info-row">
                <div class="info-item">
                  <span class="icon">📅</span>
                  <div>
                    <span class="label">Order Date</span>
                    <span class="value">{{ order.createdAt | date:'mediumDate' }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <span class="icon">🍽️</span>
                  <div>
                    <span class="label">Table</span>
                    <span class="value">{{ order.tableNumber === 0 ? 'Takeout' : 'Table ' + order.tableNumber }}</span>
                  </div>
                </div>
              </div>
              
              <div class="order-items">
                <h4>Items Ordered:</h4>
                <ul>
                  <li *ngFor="let item of order.items">
                    <span class="item-qty">{{ item.quantity }}x</span>
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-price">₹{{ item.price * item.quantity }}</span>
                  </li>
                </ul>
              </div>

              <div class="special-requests" *ngIf="order.notes">
                <span class="label">Special Notes:</span>
                <p>{{ order.notes }}</p>
              </div>
            </div>

            <div class="order-footer">
              <div class="order-total">
                <span class="label">Total Amount:</span>
                <span class="value">₹{{ order.totalPrice }}</span>
              </div>
              <div class="order-actions" *ngIf="canCancelOrder(order)">
                <button class="cancel-btn" (click)="cancelOrder(order._id!)" [disabled]="cancellingOrderId() === order._id">
                  {{ cancellingOrderId() === order._id ? 'Cancelling...' : '❌ Cancel Order' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions-bar">
        <a routerLink="/profile" class="btn btn-secondary">← Back to Profile</a>
        <a routerLink="/menu" class="btn btn-primary">+ Order More</a>
      </div>
    </div>
  `,
  styles: [`
    .my-orders-page {
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

    .no-orders {
      text-align: center;
      padding: 4rem 2rem;
      background: #f8f9fa;
      border-radius: 16px;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .no-orders h3 {
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
    }

    .no-orders p {
      color: #666;
      margin: 0 0 1.5rem 0;
    }

    .order-now-btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .order-now-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .order-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
      border-left: 4px solid #667eea;
    }

    .order-card.status-confirmed {
      border-left-color: #27ae60;
    }

    .order-card.status-pending {
      border-left-color: #f39c12;
    }

    .order-card.status-cancelled {
      border-left-color: #e74c3c;
      opacity: 0.8;
    }

    .order-card.status-preparing {
      border-left-color: #3498db;
    }

    .order-card.status-ready {
      border-left-color: #9b59b6;
    }

    .order-card.status-delivered {
      border-left-color: #1abc9c;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .order-id .label {
      display: block;
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
    }

    .order-id .value {
      font-weight: bold;
      color: #2c3e50;
      font-family: monospace;
    }

    .order-status {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-confirmed {
      background: #d1ecf1;
      color: #0c5460;
    }

    .status-preparing {
      background: #cce5ff;
      color: #004085;
    }

    .status-ready {
      background: #d4edda;
      color: #155724;
    }

    .status-delivered {
      background: #d1e7dd;
      color: #0f5132;
    }

    .status-cancelled {
      background: #f8d7da;
      color: #721c24;
    }

    .order-body {
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

    .order-items {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .order-items h4 {
      margin: 0 0 0.75rem 0;
      color: #2c3e50;
      font-size: 0.9rem;
    }

    .order-items ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .order-items li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .order-items li:last-child {
      border-bottom: none;
    }

    .item-qty {
      background: #667eea;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: bold;
    }

    .item-name {
      flex: 1;
      color: #2c3e50;
    }

    .item-price {
      font-weight: bold;
      color: #27ae60;
    }

    .special-requests {
      margin-top: 1rem;
      padding: 1rem;
      background: #fff3cd;
      border-radius: 8px;
    }

    .special-requests .label {
      font-size: 0.75rem;
      color: #856404;
      text-transform: uppercase;
      font-weight: bold;
    }

    .special-requests p {
      margin: 0.25rem 0 0 0;
      color: #444;
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .order-total .label {
      font-size: 0.85rem;
      color: #666;
    }

    .order-total .value {
      font-size: 1.25rem;
      font-weight: bold;
      color: #2c3e50;
      margin-left: 0.5rem;
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
export class MyOrdersComponent implements OnInit {
  user = signal<User | null>(null);
  isLoggedIn = computed(() => this.user() !== null);
  
  orders = signal<Order[]>([]);
  loadingOrders = signal<boolean>(false);
  cancellingOrderId = signal<string | null>(null);

  // Statistics
  totalOrders = computed(() => this.orders().length);
  confirmedCount = computed(() => this.orders().filter(o => o.status === 'confirmed').length);
  pendingCount = computed(() => this.orders().filter(o => o.status === 'pending').length);
  cancelledCount = computed(() => this.orders().filter(o => o.status === 'cancelled').length);

  constructor(
    private auth: AuthService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user observable
    this.auth.currentUser$.pipe(take(1), delay(100)).subscribe(current => {
      if (current) {
        this.user.set(current);
        this.loadUserOrders();
      } else {
        // Try fetch from backend profile
        this.auth.getProfile().subscribe({
          next: u => {
            this.user.set(u);
            this.loadUserOrders();
          },
          error: () => {
            this.user.set(null);
          }
        });
      }
    });
  }

  loadUserOrders(): void {
    const currentUser = this.auth.getCurrentUser();
    
    if (!currentUser) {
      console.log('No user logged in, skipping orders load');
      return;
    }
    
    console.log('Loading user orders for userId:', currentUser.id || currentUser._id);
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

  canCancelOrder(order: Order): boolean {
    // User can cancel if order is pending, confirmed, or preparing
    // Cannot cancel if already delivered, cancelled, or ready
    return ['pending', 'confirmed', 'preparing'].includes(order.status);
  }

  cancelOrder(orderId: string): void {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    this.cancellingOrderId.set(orderId);
    
    this.orderService.cancelOrder(orderId).subscribe({
      next: (response) => {
        console.log('Order cancelled:', response);
        // Update the order in the list
        const updatedOrders = this.orders().map(o => 
          o._id === orderId ? response.order : o
        );
        this.orders.set(updatedOrders);
        this.cancellingOrderId.set(null);
        alert('Order cancelled successfully!');
      },
      error: (err) => {
        console.error('Error cancelling order:', err);
        this.cancellingOrderId.set(null);
        alert(err?.error?.message || 'Failed to cancel order. Please try again.');
      }
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'preparing': return 'status-preparing';
      case 'ready': return 'status-ready';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'pending': return '⏳ Pending';
      case 'confirmed': return '✅ Confirmed';
      case 'preparing': return '👨‍🍳 Preparing';
      case 'ready': return '🍽️ Ready';
      case 'delivered': return '📦 Delivered';
      case 'cancelled': return '❌ Cancelled';
      default: return '⏳ Pending';
    }
  }
}
