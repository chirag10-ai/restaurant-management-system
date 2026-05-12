import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactMessage {
  _id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: 'new' | 'read' | 'replied' | 'closed';
  replied?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'http://localhost:5000/api/contacts';

  constructor(private http: HttpClient) { }

  // Public method
  sendMessage(contact: Omit<ContactMessage, '_id' | 'status' | 'replied' | 'userId' | 'createdAt' | 'updatedAt'>): Observable<{ message: string, contactId: string }> {
    return this.http.post<{ message: string, contactId: string }>(this.apiUrl, contact);
  }

  // Admin methods
  getAllMessages(status?: string): Observable<ContactMessage[]> {
    let params: any = {};
    if (status) params.status = status;
    
    return this.http.get<ContactMessage[]>(this.apiUrl, { params });
  }

  getMessageById(id: string): Observable<ContactMessage> {
    return this.http.get<ContactMessage>(`${this.apiUrl}/${id}`);
  }

  updateMessageStatus(id: string, status: string): Observable<ContactMessage> {
    return this.http.put<ContactMessage>(`${this.apiUrl}/${id}/status`, { status });
  }

  replyToMessage(id: string, replyMessage: string): Observable<{ message: string, contact: ContactMessage }> {
    return this.http.post<{ message: string, contact: ContactMessage }>(`${this.apiUrl}/${id}/reply`, { replyMessage });
  }

  deleteMessage(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}