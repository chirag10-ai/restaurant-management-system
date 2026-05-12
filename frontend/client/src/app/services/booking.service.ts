import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface Booking {
  _id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  numberOfGuests: number;
  tableNumbers: number[];
  tableType: 'indoor' | 'outdoor' | 'vip';
  specialRequests?: string;
  status?: 'pending' | 'confirm' | 'cancel';
  userId?: string;
  paymentAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeSlotAvailability {
  date: string;
  availableSlots: string[];
  bookedSlots: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://localhost:5000/api/bookings';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (isPlatformBrowser(this.platformId)) {
      // Get tab-specific token
      const tabId = this.getOrCreateTabId();
      const tokenKey = `token_${tabId}`;
      const token = sessionStorage.getItem(tokenKey);
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  private getOrCreateTabId(): string {
    if (typeof window !== 'undefined' && window.name && window.name.startsWith('tab_')) {
      return window.name;
    }
    const newTabId = 'tab_' + Math.random().toString(36).substr(2, 9);
    if (typeof window !== 'undefined') {
      window.name = newTabId;
    }
    return newTabId;
  }

  // Public methods
  createBooking(booking: Omit<Booking, '_id' | 'status' | 'userId' | 'createdAt' | 'updatedAt'>): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, booking, { headers: this.getAuthHeaders() });
  }

  getTimeSlotAvailability(date: string): Observable<TimeSlotAvailability> {
    return this.http.get<TimeSlotAvailability>(`${this.apiUrl}/availability/${date}`);
  }

  getAvailableTables(date: string, time: string, tableType: string): Observable<{ availableTables: number[] }> {
    return this.http.get<{ availableTables: number[] }>(`${this.apiUrl}/tables/available`, {
      params: { date, time, tableType }
    });
  }

  // Admin methods
  getAllBookings(status?: string, date?: string): Observable<Booking[]> {
    let params: any = {};
    if (status) params.status = status;
    if (date) params.date = date;
    
    return this.http.get<Booking[]>(this.apiUrl, { params });
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`);
  }

  updateBookingStatus(id: string, status: string): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiUrl}/${id}/status`, { status });
  }

  updateBooking(id: string, booking: Partial<Booking>): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiUrl}/${id}`, booking);
  }

  deleteBooking(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  getUserBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/user`);
  }
  
  cancelUserBooking(id: string): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiUrl}/${id}/cancel`, {});
  }
}