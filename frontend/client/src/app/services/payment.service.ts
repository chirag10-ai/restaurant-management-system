import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Payment {
  _id?: string;
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'cash' | 'paypal' | 'paytm' | 'paytm_wallet';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentGateway: 'stripe' | 'razorpay' | 'paypal' | 'manual' | 'paytm';
  currency: string;
  createdAt?: string;
  updatedAt?: string;
  orderDetails?: {
    totalPrice: number;
    status: string;
    tableNumber: number;
    items?: Array<{
      menuId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    bookingDate?: string;
    bookingTime?: string;
    numberOfGuests?: number;
    tableType?: string;
  };
  userDetails?: {
    name: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:5000/api/payments';

  constructor(private http: HttpClient) { }

  // Get all payments (Admin only)
  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.apiUrl);
  }

  // Get payment by ID
  getPaymentById(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`);
  }

  // Create payment for an order
  createPayment(orderId: string, paymentMethod: string, amount?: number): Observable<Payment> {
    return this.http.post<Payment>(this.apiUrl, { orderId, paymentMethod, amount });
  }

  // Update payment status (Admin only)
  updatePaymentStatus(id: string, status: string): Observable<Payment> {
    return this.http.put<Payment>(`${this.apiUrl}/${id}/status`, { status });
  }

  // Process refund (Admin only)
  processRefund(id: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/${id}/refund`, {});
  }
}