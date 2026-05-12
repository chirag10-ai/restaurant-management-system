import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-orders">
      <h2>Manage Orders</h2>
      
      <div class="controls">
        <input 
          type="text" 
          placeholder="Search orders..." 
          class="search-input"
          [(ngModel)]="searchTerm"
          (input)="filterOrders()"
        >
        <select [(ngModel)]="statusFilter" (change)="filterOrders()" class="status-filter">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      
      <div class="orders-list" *ngIf="filteredOrders.length > 0; else noOrders">
        <div class="order-card" *ngFor="let order of filteredOrders">
          <div class="order-header">
            <div class="order-id">#{{ order._id }}</div>
            <div class="order-status" [class]="'status-' + order.status">{{ order.status | titlecase }}</div>
            <div class="order-date">{{ order.createdAt | date:'medium' }}</div>
          </div>
          
          <div class="order-details">
            <div class="customer-info">
              <strong>Customer:</strong> {{ order.userId?.name || 'Guest User' }}
            </div>
            <div class="customer-email">
              <strong>Email:</strong> {{ order.userId?.email || 'N/A' }}
            </div>
            <div class="order-items">
              <strong>Items:</strong>
              <ul *ngIf="order.items && order.items.length > 0; else noItems">
                <li *ngFor="let item of order.items">
                  {{ item.quantity }}x {{ item.name }} - ₹{{ item.price | number:'1.2-2' }}
                </li>
              </ul>
              <ng-template #noItems>
                <p>No items found</p>
              </ng-template>
            </div>
            <div class="order-total">
              <strong>Total:</strong> ₹{{ (order.totalPrice || 0) | number:'1.2-2' }}
            </div>
            <div class="table-number" *ngIf="order.tableNumber !== undefined">
              <strong>Table:</strong> {{ order.tableNumber === 0 ? 'Takeout' : order.tableNumber }}
            </div>
          </div>
          
          <div class="order-actions">
            <select 
              [(ngModel)]="order.status" 
              (change)="updateOrderStatus(order._id!, order.status)"
              class="status-select"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
      
      <ng-template #noOrders>
        <div class="no-orders">No orders found.</div>
      </ng-template>
      
      <div class="loading" *ngIf="loading">Loading orders...</div>
    </div>
  `,
  styles: [`
    .admin-orders {
      padding: 20px;
    }
    
    .controls {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .search-input, .status-filter, .status-select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .orders-list {
      display: grid;
      gap: 15px;
    }
    
    .order-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background-color: white;
    }
    
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .order-id {
      font-weight: bold;
      color: #333;
    }
    
    .order-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      font-weight: bold;
    }
    
    .status-pending { background-color: #fff3cd; color: #856404; }
    .status-confirmed { background-color: #d1ecf1; color: #0c5460; }
    .status-preparing { background-color: #cce5ff; color: #004085; }
    .status-ready { background-color: #d4edda; color: #155724; }
    .status-delivered { background-color: #d1e7dd; color: #0f5132; }
    .status-cancelled { background-color: #f8d7da; color: #721c24; }
    
    .order-details ul {
      list-style: none;
      padding: 0;
      margin: 5px 0;
    }
    
    .order-details li {
      margin: 2px 0;
    }
    
    .order-actions {
      margin-top: 15px;
      display: flex;
      justify-content: flex-end;
    }
    
    .no-orders {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .loading {
      text-align: center;
      padding: 20px;
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  searchTerm = '';
  statusFilter = '';

  constructor(
    private orderService: OrderService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.filteredOrders = orders;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
      }
    });
  }

  updateOrderStatus(orderId: string, newStatus: string): void {
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (updatedOrder) => {
        // Update the order in the list
        const index = this.orders.findIndex(o => o._id === orderId);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
          this.filterOrders(); // Reapply filters
        }
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        // Reload orders to revert the UI change
        this.loadOrders();
      }
    });
  }

  filterOrders(): void {
    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch = !this.searchTerm || 
        order._id?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (order.userId?.name || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (order.userId?.email || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || order.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }
}