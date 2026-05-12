import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrderService, Order } from '../../../services/order.service';
import { UserService, User } from '../../../services/user.service';
import { BookingService, Booking } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats = {
    totalUsers: 0,
    pendingOrders: 0,
    revenue: 0
  };

  recentUsers: User[] = [];
  pendingBookings: Booking[] = [];
  loading = true;

  constructor(
    private orderService: OrderService,
    private userService: UserService,
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Validate token before loading data
    this.authService.validateToken().subscribe({
      next: (isValid) => {
        if (isValid) {
          this.loadDashboardData();
        } else {
          // Token is invalid, redirect to login
          this.router.navigate(['/login']);
        }
      },
      error: () => {
        // Validation failed, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }

  loadDashboardData(): void {
    // Load all bookings to calculate revenue
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        // Calculate total revenue from confirmed bookings
        this.stats.revenue = bookings
          .filter(booking => booking.status === 'confirm')
          .reduce((total, booking) => total + (booking.paymentAmount || 0), 0);
      },
      error: (error) => {
        console.error('Error loading bookings for revenue calculation:', error);
      }
    });
    
    // Load orders data
    this.orderService.getOrders().subscribe({
      next: (orders) => {

        
        // Calculate order stats
        this.stats.pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing').length;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
      }
    });
    
    // Load users data
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.stats.totalUsers = users.length;
        // Get 5 most recent users
        this.recentUsers = users.slice(0, 5);
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
    
    // Load pending bookings
    this.bookingService.getAllBookings('pending').subscribe({
      next: (bookings) => {
        this.pendingBookings = bookings;
        // Update pending orders count to include pending bookings
        this.stats.pendingOrders = bookings.length;
      },
      error: (error) => {
        console.error('Error loading pending bookings:', error);
      }
    });
    
    // Finalize loading after both data sets are loaded
    setTimeout(() => {
      this.loading = false;
    }, 500);
  }
  getStatusClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'delivered':
        return 'status-delivered';
      case 'preparing':
        return 'status-preparing';
      case 'pending':
        return 'status-pending';
      case 'ready':
        return 'status-ready';
      case 'confirm':
        return 'status-confirmed';
      case 'cancel':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getUserRoleClass(role: string): string {
    switch(role.toLowerCase()) {
      case 'admin':
        return 'role-admin';
      case 'manager':
        return 'role-manager';
      case 'customer':
        return 'role-customer';
      default:
        return '';
    }
  }

  navigateToUsers(): void {
    this.router.navigate(['/admin/users']);
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          console.log('User deleted successfully');
          this.loadDashboardData(); // Refresh the user count
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Failed to delete user');
        }
      });
    }
  }

  // Open user management page with delete confirmation
  // Open user management page
  openUserManagement(): void {
    this.router.navigate(['/admin/users']);
  }

  navigateToBookings(): void {
    this.router.navigate(['/admin/bookings']);
  }

  navigateToRevenue(): void {
    this.router.navigate(['/admin/revenue']);
  }

  confirmBooking(bookingId: string): void {
    if (confirm('Are you sure you want to confirm this booking?')) {
      // Get the booking to access its payment amount
      this.bookingService.getBookingById(bookingId).subscribe({
        next: (booking) => {
          this.bookingService.updateBookingStatus(bookingId, 'confirm').subscribe({
            next: (updatedBooking) => {
              console.log('Booking confirmed:', updatedBooking);
              // Remove from pending bookings list
              this.pendingBookings = this.pendingBookings.filter(b => b._id !== bookingId);
              this.stats.pendingOrders = this.pendingBookings.length;
              
              // Add payment amount to revenue
              if (booking.paymentAmount !== undefined && booking.paymentAmount > 0) {
                this.stats.revenue += booking.paymentAmount;
              }
            },
            error: (error) => {
              console.error('Error confirming booking:', error);
              alert('Failed to confirm booking');
            }
          });
        },
        error: (error) => {
          console.error('Error fetching booking details:', error);
          // Proceed with confirmation even if we can't fetch payment amount
          this.bookingService.updateBookingStatus(bookingId, 'confirm').subscribe({
            next: (updatedBooking) => {
              console.log('Booking confirmed:', updatedBooking);
              // Remove from pending bookings list
              this.pendingBookings = this.pendingBookings.filter(b => b._id !== bookingId);
              this.stats.pendingOrders = this.pendingBookings.length;
            },
            error: (error) => {
              console.error('Error confirming booking:', error);
              alert('Failed to confirm booking');
            }
          });
        }
      });
    }
  }

  rejectBooking(bookingId: string): void {
    if (confirm('Are you sure you want to reject this booking?')) {
      // Get the booking to access its payment amount
      this.bookingService.getBookingById(bookingId).subscribe({
        next: (booking) => {
          this.bookingService.updateBookingStatus(bookingId, 'cancel').subscribe({
            next: (updatedBooking) => {
              console.log('Booking rejected:', updatedBooking);
              // Remove from pending bookings list
              this.pendingBookings = this.pendingBookings.filter(b => b._id !== bookingId);
              this.stats.pendingOrders = this.pendingBookings.length;
              
              // Subtract payment amount from revenue if it was confirmed
              if (booking.status === 'confirm' && booking.paymentAmount !== undefined && booking.paymentAmount > 0) {
                this.stats.revenue -= booking.paymentAmount;
              }
            },
            error: (error) => {
              console.error('Error rejecting booking:', error);
              alert('Failed to reject booking');
            }
          });
        },
        error: (error) => {
          console.error('Error fetching booking details:', error);
          // Proceed with rejection even if we can't fetch payment amount
          this.bookingService.updateBookingStatus(bookingId, 'cancel').subscribe({
            next: (updatedBooking) => {
              console.log('Booking rejected:', updatedBooking);
              // Remove from pending bookings list
              this.pendingBookings = this.pendingBookings.filter(b => b._id !== bookingId);
              this.stats.pendingOrders = this.pendingBookings.length;
            },
            error: (error) => {
              console.error('Error rejecting booking:', error);
              alert('Failed to reject booking');
            }
          });
        }
      });
    }
  }

  deleteAllUsers(): void {
    if (confirm('Are you sure you want to delete ALL users? This action cannot be undone.')) {
      // This would call the UserService to delete all users in a real implementation
      // For security reasons, this is typically not implemented directly
      alert('Bulk user deletion would be implemented in production');
    }
  }
}