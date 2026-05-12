import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService, ContactMessage } from '../../../services/contact.service';

@Component({
  selector: 'app-admin-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-contacts.component.html',
  styleUrls: ['./admin-contacts.component.css']
})
export class AdminContactsComponent implements OnInit {
  messages: ContactMessage[] = [];
  filteredMessages: ContactMessage[] = [];
  loading = false;
  selectedStatus = '';
  searchTerm = '';
  newCount = 0;
  repliedCount = 0;
  totalCount = 0;

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'read', label: 'Read' },
    { value: 'replied', label: 'Replied' },
    { value: 'closed', label: 'Closed' }
  ];

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.loading = true;
    this.contactService.getAllMessages(this.selectedStatus).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.calculateCounts();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.loading = false;
      }
    });
  }

  calculateCounts(): void {
    this.totalCount = this.messages.length;
    this.newCount = this.messages.filter(m => m.status === 'new').length;
    this.repliedCount = this.messages.filter(m => m.status === 'replied').length;
  }

  applyFilters(): void {
    this.filteredMessages = this.messages.filter(message => {
      const matchesSearch = !this.searchTerm || 
        message.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        message.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        message.subject.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }

  onStatusChange(): void {
    this.loadMessages();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  updateMessageStatus(messageId: string, newStatus: string): void {
    this.contactService.updateMessageStatus(messageId, newStatus).subscribe({
      next: (updatedMessage) => {
        const index = this.messages.findIndex(m => m._id === messageId);
        if (index !== -1) {
          this.messages[index] = updatedMessage;
          this.calculateCounts();
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error updating message status:', error);
        alert('Failed to update message status');
      }
    });
  }

  deleteMessage(messageId: string): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.contactService.deleteMessage(messageId).subscribe({
        next: () => {
          this.messages = this.messages.filter(m => m._id !== messageId);
          this.calculateCounts();
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error deleting message:', error);
          alert('Failed to delete message');
        }
      });
    }
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'new': return 'status-new';
      case 'read': return 'status-read';
      case 'replied': return 'status-replied';
      case 'closed': return 'status-closed';
      default: return '';
    }
  }

  canChangeToStatus(currentStatus: string | undefined, targetStatus: string): boolean {
    if (!currentStatus) return false;
    
    switch (targetStatus) {
      case 'new':
        return currentStatus !== 'new';
      case 'read':
        return currentStatus !== 'read';
      case 'replied':
        return currentStatus !== 'replied';
      case 'closed':
        return currentStatus !== 'closed';
      default:
        return false;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}