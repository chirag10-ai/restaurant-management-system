import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment } from './payment.service';

export interface RevenueSummary {
  totalRevenue: number;
  totalOrders: number;
  totalBookings: number;
  averageOrderValue: number;
  revenueByCategory: {
    tableBooking: number;
    menuItems: number;
  };
  dailyRevenue: {
    date: string;
    revenue: number;
  }[];
  monthlyRevenue?: {
    month: string;
    revenue: number;
    breakdown?: {
      menuItems: number;
      tableBooking: number;
    };
  }[];
  paymentMethods?: {
    method: string;
    count: number;
    revenue: number;
  }[];
  topCustomers?: {
    customerId: string;
    customerName: string;
    totalSpent: number;
    orderCount: number;
    bookingCount: number;
  }[];
  revenueGrowth?: {
    currentPeriod: number;
    previousPeriod: number;
    growthPercentage: number;
  };
}

export interface Transaction extends Payment {
  type?: 'payment' | 'booking';  // Distinguish between payment and booking transactions
}

@Injectable({
  providedIn: 'root'
})
export class RevenueService {
  private apiUrl = 'http://localhost:5000/api/payments';

  constructor(private http: HttpClient) {}

  getRevenueSummary(): Observable<RevenueSummary> {
    return this.http.get<RevenueSummary>(`${this.apiUrl}/revenue/report`);
  }

  getPayments(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/revenue/payments`);
  }

  getRevenueByDateRange(startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/revenue/date-range?startDate=${startDate}&endDate=${endDate}`);
  }
}