import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService, Booking } from '../../../services/booking.service';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-bookings.component.html',
  styleUrls: ['./admin-bookings.component.css']
})
export class AdminBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  loading = false;
  selectedStatus = '';
  selectedDate = '';
  searchTerm = '';
  pendingCount = 0;
  confirmedCount = 0;
  totalCount = 0;

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirm', label: 'Confirmed' },
    { value: 'cancel', label: 'Cancelled' }
  ];

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.bookingService.getAllBookings(this.selectedStatus, this.selectedDate).subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.calculateCounts();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.loading = false;
      }
    });
  }

  calculateCounts(): void {
    this.totalCount = this.bookings.length;
    this.pendingCount = this.bookings.filter(b => b.status === 'pending').length;
    this.confirmedCount = this.bookings.filter(b => b.status === 'confirm').length;
  }

  applyFilters(): void {
    this.filteredBookings = this.bookings.filter(booking => {
      const matchesSearch = !this.searchTerm || 
        booking.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        booking.customerEmail.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }

  onStatusChange(): void {
    this.loadBookings();
  }

  onDateChange(): void {
    this.loadBookings();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  updateBookingStatus(bookingId: string, newStatus: string): void {
    if (confirm(`Are you sure you want to ${newStatus} this booking?`)) {
      this.bookingService.updateBookingStatus(bookingId, newStatus).subscribe({
        next: (updatedBooking) => {
          const index = this.bookings.findIndex(b => b._id === bookingId);
          if (index !== -1) {
            this.bookings[index] = updatedBooking;
            this.calculateCounts();
            this.applyFilters();
          }
        },
        error: (error) => {
          console.error('Error updating booking status:', error);
          alert('Failed to update booking status');
        }
      });
    }
  }

  deleteBooking(bookingId: string): void {
    if (confirm('Are you sure you want to delete this booking?')) {
      this.bookingService.deleteBooking(bookingId).subscribe({
        next: () => {
          this.bookings = this.bookings.filter(b => b._id !== bookingId);
          this.calculateCounts();
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error deleting booking:', error);
          alert('Failed to delete booking');
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirm': return 'status-confirmed';
      case 'cancel': return 'status-cancelled';
      default: return '';
    }
  }

  canChangeToStatus(currentStatus: string | undefined, targetStatus: string): boolean {
    if (!currentStatus) return false;
    
    switch (targetStatus) {
      case 'confirm':
        return currentStatus === 'pending';
      case 'cancel':
        return currentStatus === 'pending' || currentStatus === 'confirm';
      default:
        return false;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}