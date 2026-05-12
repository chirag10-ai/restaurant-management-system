import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService, Booking } from '../../services/booking.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';


@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  bookingForm: FormGroup;
  submitted = false;
  loading = false;
  successMessage = '';
  errorMessage = '';
  availableTimeSlots: string[] = [];
  loadingSlots = false;
  availableTables: number[] = [];
  loadingTables = false;
  


  tableTypes = [
    { value: 'indoor', label: 'Indoor Seating' },
    { value: 'outdoor', label: 'Outdoor/Patio' },
    { value: 'vip', label: 'VIP Section' }
  ];

  paymentMethods = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'cash', label: 'Cash on Delivery' },
    { value: 'paypal', label: 'PayPal' }
  ];



  constructor(
    private formBuilder: FormBuilder,
    private bookingService: BookingService,
    private orderService: OrderService,
    public authService: AuthService,
    private router: Router,
    private cartService: CartService
  ) {
    this.bookingForm = this.formBuilder.group({
      customerName: ['', [Validators.required, Validators.minLength(2)]],
      customerEmail: ['', [Validators.required, Validators.email]],
      customerPhone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^[6-9]\d{9}$/)]],
      date: ['', [Validators.required]],
      time: ['', [Validators.required]],
      numberOfGuests: ['2', [Validators.required]],
      tableType: ['indoor', Validators.required],
      tableNumbers: [[], [Validators.required, Validators.minLength(1)]],
      specialRequests: [''],
      paymentMethod: ['credit_card', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Check if this is an order-only request
    const urlParams = new URLSearchParams(window.location.search);
    const orderOnly = urlParams.get('orderOnly');
    const totalPrice = urlParams.get('totalPrice');
      
    if (orderOnly === 'true' && totalPrice) {
      // This is an order-only request, bypass table booking
      this.handleOrderOnly(parseFloat(totalPrice));
      return;
    }
      
    // Set min date to tomorrow (normal booking flow)
    const tomorrow = new Date(); 
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    this.bookingForm.get('date')?.setValue(minDate);
      
    // Load initial time slots
    this.onDateChange();
      
    // Add input validation for phone number
    this.bookingForm.get('customerPhone')?.valueChanges.subscribe(value => {
      if (value && value.length > 10) {
        // Truncate to 10 digits
        this.bookingForm.get('customerPhone')?.setValue(value.substring(0, 10), { emitEvent: false });
      }
      // Remove any non-digit characters
      if (value && !/^[0-9]*$/.test(value)) {
        this.bookingForm.get('customerPhone')?.setValue(value.replace(/[^0-9]/g, ''), { emitEvent: false });
      }
    });

    // Update available tables when date, time, or table type changes
    this.bookingForm.get('date')?.valueChanges.subscribe(() => this.updateAvailableTables());
    this.bookingForm.get('time')?.valueChanges.subscribe(() => this.updateAvailableTables());
    this.bookingForm.get('tableType')?.valueChanges.subscribe(() => this.updateAvailableTables());
  }
    
  handleOrderOnly(totalPrice: number): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      // Store the order details in session storage so they persist after login
      sessionStorage.setItem('pendingOrderOnly', JSON.stringify({
        totalPrice: totalPrice
      }));
      
      // Redirect to login page with return URL
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/booking', orderOnly: 'true', totalPrice: totalPrice } 
      });
      return;
    }
    
    // Create an order directly without table booking
    const cartItems = this.cartService.getCartItems();
      
    if (cartItems.length === 0) {
      console.error('No items in cart for order-only request');
      this.router.navigate(['/menu']);
      return;
    }
      
    // Prepare order data
    const orderData = {
      items: cartItems.map(item => {
        // Ensure item has required properties
        if (!item.item) {
          throw new Error('Invalid cart item: missing item details');
        }
          
        return {
          menuId: item.item._id || '',
          name: item.item.name || '',
          price: item.item.price || 0,
          quantity: item.quantity || 1
        };
      }),
      totalPrice: totalPrice,
      status: 'pending' as const, // Default status for new orders
      tableNumber: 0, // No table needed for order-only
      notes: 'Online order without table booking'
    };
      
    // Create the order
    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        // Navigate to payment page for the created order
        // We'll use the secure payment page with order ID
        if (order && order._id) {
          this.router.navigate(['/secure-payment', order._id], {
            queryParams: { 
              amount: totalPrice,
              type: 'order_only',
              baseAmount: totalPrice,
              menuItemsAmount: totalPrice
            }
          });
        } else {
          console.error('Order creation failed: Invalid order response', order);
          this.errorMessage = 'Failed to create order. Please try again.';
          this.router.navigate(['/menu']);
        }
      },
      error: (error) => {
        console.error('Error creating order:', error);
        this.errorMessage = error?.error?.message || error?.message || 'An error occurred while creating the order. Please try again.';
        this.loading = false;
        this.router.navigate(['/menu']);
      }
    });
  }

  onDateChange(): void {
    const selectedDate = this.bookingForm.get('date')?.value;
    if (selectedDate) {
      this.loadingSlots = true;
      
      // Disable time field while loading
      this.bookingForm.get('time')?.disable();
      
      this.bookingService.getTimeSlotAvailability(selectedDate).subscribe({
        next: (data) => {
          this.availableTimeSlots = data.availableSlots;
          this.loadingSlots = false;
          
          // Re-enable time field after loading
          this.bookingForm.get('time')?.enable();
          
          // Reset time selection if current selection is no longer available
          const currentTime = this.bookingForm.get('time')?.value;
          if (currentTime && !this.availableTimeSlots.includes(currentTime)) {
            this.bookingForm.get('time')?.setValue('');
          }

          // Trigger table availability update
          this.updateAvailableTables();
        },
        error: (error) => {
          console.error('Error loading time slots:', error);
          this.availableTimeSlots = [];
          this.loadingSlots = false;
          
          // Re-enable time field even if there's an error
          this.bookingForm.get('time')?.enable();
        }
      });
    }
  }

  updateAvailableTables(): void {
    const date = this.bookingForm.get('date')?.value;
    const time = this.bookingForm.get('time')?.value;
    const tableType = this.bookingForm.get('tableType')?.value;

    if (date && time && tableType) {
      this.loadingTables = true;
      this.bookingService.getAvailableTables(date, time, tableType).subscribe({
        next: (data) => {
          this.availableTables = data.availableTables;
          this.loadingTables = false;
          
          // Filter selected tables if they are no longer available
          const currentTables = this.bookingForm.get('tableNumbers')?.value || [];
          const validSelectedTables = currentTables.filter((t: number) => this.availableTables.includes(t));
          if (currentTables.length !== validSelectedTables.length) {
            this.bookingForm.get('tableNumbers')?.setValue(validSelectedTables);
          }
        },
        error: (error) => {
          console.error('Error loading available tables:', error);
          this.availableTables = [];
          this.loadingTables = false;
        }
      });
    } else {
      this.availableTables = [];
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.bookingForm.valid) {
      this.loading = true;
      
      const rawBookingData = this.bookingForm.value;
      const bookingData = { ...rawBookingData };
      
      // Ensure tableNumbers is an array of numbers
      if (typeof bookingData.tableNumbers === 'string') {
        bookingData.tableNumbers = [parseInt(bookingData.tableNumbers)];
      } else if (Array.isArray(bookingData.tableNumbers)) {
        bookingData.tableNumbers = bookingData.tableNumbers.map((t: any) => parseInt(t));
      }
      
      // Map Family and Group to numbers for backend and amount calculation
      if (bookingData.numberOfGuests === 'Family') {
        bookingData.numberOfGuests = 5;
      } else if (bookingData.numberOfGuests === 'Group') {
        bookingData.numberOfGuests = 10;
      } else {
        bookingData.numberOfGuests = parseInt(bookingData.numberOfGuests);
      }
      
      this.bookingService.createBooking(bookingData).subscribe({
        next: (booking: Booking) => {
          this.submitted = false;
          
          // Calculate amount based on table type and number of guests
          const guestCount = bookingData.numberOfGuests;
          let amountPerGuest = 100; // Default for indoor
          
          switch(bookingData.tableType) {
            case 'indoor':
              amountPerGuest = 100;
              break;
            case 'outdoor':
              amountPerGuest = 150;
              break;
            case 'vip':
              amountPerGuest = 200;
              break;
          }
          
          // Calculate base booking amount
          const baseAmount = guestCount * amountPerGuest;
          
          // Calculate menu items amount
          const cartItems = this.cartService.getCartItems();
          const menuItemsAmount = cartItems.reduce((total, cartItem) => {
            // Ensure cartItem and its properties exist
            const price = cartItem.item?.price || 0;
            const quantity = cartItem.quantity || 1;
            return total + (price * quantity);
          }, 0);
          
          // Total amount = base booking + menu items
          const totalAmount = baseAmount + menuItemsAmount;
          
          // Navigate to payment page with booking ID and total amount
          this.router.navigate(['/secure-payment', booking._id], {
            queryParams: { 
              amount: totalAmount,
              type: 'booking_with_menu',
              baseAmount: baseAmount,
              menuItemsAmount: menuItemsAmount
            }
          });
        },
        error: (error) => {
          console.error('Booking error:', error);
          this.errorMessage = error?.error?.message || error?.message || 'Failed to create booking. Please try again.';
          this.loading = false;
        }
      });
    }
  }

  get f() {
    return this.bookingForm.controls;
  }



  resetForm(): void {
    this.bookingForm.reset({
      numberOfGuests: '2',
      tableType: 'indoor'
    });
    this.successMessage = '';
    this.errorMessage = '';
    this.submitted = false;
    
    // Reset date to tomorrow
    const tomorrow = new Date(); 
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.bookingForm.get('date')?.setValue(tomorrow.toISOString().split('T')[0]);
  }
  
  // Getter to access cart service from template
  getCartItems() {
    return this.cartService.getCartItems();
  }
  
  getCartTotal() {
    return this.cartService.getCartTotal();
  }
}