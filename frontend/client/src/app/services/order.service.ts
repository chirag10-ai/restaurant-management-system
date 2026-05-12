import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id?: string;
  id?: string;
  userId?: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  tableNumber?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:5000/api/orders';

  constructor(private http: HttpClient) { }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  createOrder(order: Omit<Order, '_id' | 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${id}`, { status });
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Process payment for order
  processPayment(orderId: string, paymentMethod: string, amount?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${orderId}/payment`, { paymentMethod, amount });
  }

  // Cancel order (for users to cancel their own orders)
  cancelOrder(orderId: string): Observable<{ message: string; order: Order }> {
    return this.http.put<{ message: string; order: Order }>(`${this.apiUrl}/${orderId}/cancel`, {});
  }
}