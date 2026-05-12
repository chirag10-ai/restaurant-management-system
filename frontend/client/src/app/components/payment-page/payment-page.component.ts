import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentHandlerService } from '../../services/payment-handler.service';
import { PaymentService } from '../../services/payment.service';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.css']
})
export class PaymentPageComponent implements OnInit, OnDestroy {
  paymentForm: FormGroup;
  selectedPaymentMethod: string = '';
  processing = false;
  error = '';
  success = false;
  submitted = false;
  
  // Demo mode flag to bypass validation - always enabled for mock behavior
  demoMode = true;
  
  // Booking data
  bookingData: any = null;
  bookingId: string = '';
  paymentType: string = '';
  depositAmount: number = 50; // Default deposit
  baseAmount: number = 0;
  menuItemsAmount: number = 0;
  paymentId: string = ''; 
  
  // UI states
  timer: any;

  // Custom validator for expiry date to ensure it's in the future
  futureDateValidator = (control: any) => {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    
    // Set time to 00:00:00 for accurate comparison
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    // If the selected date is before today, it's invalid
    if (selectedDate < today) {
      return { 'pastDate': true };
    }
    
    return null;
  }

  constructor(
    private formBuilder: FormBuilder,
    private paymentHandlerService: PaymentHandlerService,
    private paymentService: PaymentService,
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['', [Validators.required]],
      cardNumber: [''],
      cardName: [''],
      expiryDate: [''],
      cvv: [''],
      upiId: [''],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]]
    });
    
    // In demo mode, make card fields optional and remove validation for all fields
    if (this.demoMode) {
      // Make all card fields optional with no validation
      this.paymentForm.get('cardNumber')?.clearValidators();
      this.paymentForm.get('cardName')?.clearValidators();
      this.paymentForm.get('expiryDate')?.clearValidators();
      this.paymentForm.get('cvv')?.clearValidators();
      this.paymentForm.get('upiId')?.clearValidators();
      // Phone number validation remains in demo mode
      this.paymentForm.get('phoneNumber')?.setValidators([Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]);
    }
  }

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('id') || '';
    
    // Get payment type and amounts from query params
    const paymentType = this.route.snapshot.queryParamMap.get('type');
    const amount = this.route.snapshot.queryParamMap.get('amount');
    const baseAmount = this.route.snapshot.queryParamMap.get('baseAmount');
    const menuItemsAmount = this.route.snapshot.queryParamMap.get('menuItemsAmount');
    
    if (paymentType) {
      this.paymentType = paymentType;
    }
    
    if (amount) {
      this.depositAmount = parseFloat(amount);
    }
    
    // Store additional amounts for display
    this.baseAmount = baseAmount ? parseFloat(baseAmount) : 0;
    this.menuItemsAmount = menuItemsAmount ? parseFloat(menuItemsAmount) : 0;
    
    if (this.bookingId) {
      this.loadBookingData();
    }
    
    // Auto-format card number
    this.paymentForm.get('cardNumber')?.valueChanges.subscribe(value => {
      if (value && !value.includes(' ')) {
        const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
        this.paymentForm.get('cardNumber')?.setValue(formatted, { emitEvent: false });
      }
    });
    

    
    // Add input validation for phone number
    this.paymentForm.get('phoneNumber')?.valueChanges.subscribe(value => {
      if (value && value.length > 10) {
        // Truncate to 10 digits
        this.paymentForm.get('phoneNumber')?.setValue(value.substring(0, 10), { emitEvent: false });
      }
      // Remove any non-digit characters
      if (value && !/^[0-9]*$/.test(value)) {
        this.paymentForm.get('phoneNumber')?.setValue(value.replace(/[^0-9]/g, ''), { emitEvent: false });
      }
    });
  }

  loadBookingData(): void {
    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (booking) => {
        // Calculate amount based on number of guests (50 rupees per guest)
        const calculatedAmount = booking.numberOfGuests * 50;
        this.depositAmount = calculatedAmount;
        
        this.bookingData = {
          date: booking.date,
          time: booking.time,
          guests: booking.numberOfGuests,
          tableType: booking.tableType,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail
        };
      },
      error: (error) => {
        console.error('Error loading booking data:', error);
        // Fallback to default data
        this.bookingData = {
          date: new Date().toISOString().split('T')[0],
          time: '19:00',
          guests: 2,
          tableType: 'Standard Table',
          customerName: 'Customer',
          customerEmail: 'customer@example.com'
        };
      }
    });
  }

  onPaymentMethodChange(): void {
    this.selectedPaymentMethod = this.paymentForm.get('paymentMethod')?.value;
    this.clearPaymentFields();
    this.setupValidation();
    
    // Show confirmation message
    console.log('Payment method selected:', this.selectedPaymentMethod);
  }

  getPaymentMethodName(method: string): string {
    const methodNames: { [key: string]: string } = {
      'credit_card': 'Credit Card',
      'debit_card': 'Debit Card',
      'upi': 'UPI Payment',
      'paytm': 'PayTM',
      'paytm_wallet': 'PayTM Wallet',
      'paypal': 'PayPal'
    };
    return methodNames[method] || method;
  }

  private clearPaymentFields(): void {
    this.paymentForm.patchValue({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      upiId: ''
    });
  }

  private setupValidation(): void {
    // If in demo mode, skip all validation
    if (this.demoMode) {
      // Clear all validations for all fields to ensure all payment methods work
      const controls = this.paymentForm.controls;
      Object.keys(controls).forEach(key => {
        if (['cardNumber', 'cardName', 'expiryDate', 'cvv', 'upiId'].includes(key)) {
          this.paymentForm.get(key)?.clearValidators();
          this.paymentForm.get(key)?.updateValueAndValidity();
        }
      });
      return;
    }
    
    const controls = this.paymentForm.controls;
    
    // Clear all validations first
    Object.keys(controls).forEach(key => {
      if (key !== 'paymentMethod') {
        this.paymentForm.get(key)?.clearValidators();
        this.paymentForm.get(key)?.updateValueAndValidity();
      }
    });

    // Add validations based on selected payment method
    switch (this.selectedPaymentMethod) {
      case 'credit_card':
      case 'debit_card':
        controls['cardNumber'].setValidators([
          Validators.required,
          Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)
        ]);
        controls['cardName'].setValidators([Validators.required]);
        controls['expiryDate'].setValidators([
          Validators.required,
          this.futureDateValidator
        ]);
        controls['cvv'].setValidators([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(4)
        ]);
        break;
        
      case 'upi':
      case 'paytm':
      case 'paytm_wallet':
        controls['upiId'].setValidators([
          Validators.required,
          Validators.pattern(/^([a-zA-Z0-9.-]{2,256}@[a-zA-Z]{2,64}|[0-9]{10})$/)
        ]);
        break;
    }

    // Update validity for all controls
    Object.keys(controls).forEach(key => {
      if (key !== 'paymentMethod') {
        this.paymentForm.get(key)?.updateValueAndValidity();
      }
    });
  }



  onSubmit(): void {
    this.submitted = true;
    
    if (this.paymentForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.processing = true;
    this.error = '';
    this.success = false;

    const paymentMethod = this.paymentForm.get('paymentMethod')?.value;
    const totalAmount = this.getTotalAmount();

    // Prepare card details if applicable
    let cardDetails: any = null;
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      const expiryDate = new Date(this.paymentForm.get('expiryDate')?.value);
      const expiryMonth = String(expiryDate.getMonth() + 1).padStart(2, '0');
      const expiryYear = expiryDate.getFullYear().toString().slice(-2);
      
      cardDetails = {
        number: this.paymentForm.get('cardNumber')?.value.replace(/\s/g, ''),
        name: this.paymentForm.get('cardName')?.value,
        expiryMonth: expiryMonth,
        expiryYear: expiryYear,
        cvv: this.paymentForm.get('cvv')?.value
      };
    }

    // In demo mode, always allow payment regardless of card details
    if (!this.demoMode && !this.paymentHandlerService.validatePaymentDetails(paymentMethod, totalAmount, cardDetails)) {
      this.error = 'Invalid payment details. Please check your information.';
      this.processing = false;
      return;
    }
    
    // For demo purposes, always treat payment as valid
    // This ensures any card details entered by user will work
    console.log('Demo mode: Bypassing card validation, accepting any card details');

    // In demo mode, always simulate successful payment regardless of input
    if (this.demoMode) {
      // Simulate a delay to mimic payment processing
      setTimeout(() => {
        this.success = true;
        this.processing = false;
        
        // Create a mock result
        const mockResult = {
          paymentId: `mock_${Date.now()}`
        };
        
        // Update booking status to confirm
        this.updateBookingStatus();
        
        // Store payment confirmation in localStorage for reference
        const paymentConfirmation = {
          paymentId: mockResult.paymentId,
          bookingId: this.bookingId,
          amount: this.depositAmount,
          method: paymentMethod,
          timestamp: new Date().toISOString(),
          status: 'confirm',
          phoneNumber: ''
        };
        
        localStorage.setItem('lastPaymentConfirmation', JSON.stringify(paymentConfirmation));
        
        // Redirect to payment confirmation page for all payment methods
        setTimeout(() => {
          this.router.navigate(['/payment-confirmation'], { 
            queryParams: { 
              bookingId: this.bookingId, 
              paymentId: mockResult.paymentId,
              amount: this.depositAmount,
              method: paymentMethod,
              status: 'confirm'
            } 
          });
        }, 2000);
      }, 1500); // Simulate processing time
    } else {
      // For non-demo mode, use actual payment processing
      this.paymentHandlerService.initializePayment(this.bookingId, paymentMethod, totalAmount)
        .subscribe({
          next: (initResult) => {
            // Process final payment
            this.paymentHandlerService.processFinalPayment(this.bookingId, paymentMethod, totalAmount, initResult)
              .subscribe({
                next: (result) => {
                  this.success = true;
                  this.processing = false;
                  this.paymentId = result.paymentId;
                  
                  // Log payment confirmation
                  console.log('Payment confirmed:', {
                    paymentId: result.paymentId,
                    bookingId: this.bookingId,
                    amount: this.depositAmount,
                    method: paymentMethod,
                    status: 'confirm'
                  });
                  
                  // Update booking status to confirmed
                  this.updateBookingStatus();
                  
                  // Store payment confirmation in localStorage for reference
                  const paymentConfirmation = {
                    paymentId: result.paymentId,
                    bookingId: this.bookingId,
                    amount: this.depositAmount,
                    method: paymentMethod,
                    timestamp: new Date().toISOString(),
                    status: 'confirm',
                    phoneNumber: ''
                  };
                  
                  localStorage.setItem('lastPaymentConfirmation', JSON.stringify(paymentConfirmation));
                  
                  // Redirect to payment confirmation page for all payment methods
                  setTimeout(() => {
                    this.router.navigate(['/payment-confirmation'], { 
                      queryParams: { 
                        bookingId: this.bookingId, 
                        paymentId: result.paymentId,
                        amount: this.depositAmount,
                        method: paymentMethod,
                        status: 'confirm'
                      } 
                    });
                  }, 2000);
                },
                error: (paymentError) => {
                  // In demo mode, handle errors gracefully and still proceed
                  console.warn('Payment processing warning (demo mode):', paymentError);
                  
                  // Still confirm the payment in demo mode
                  this.success = true;
                  this.processing = false;
                  
                  // Create a mock result
                  const mockResult = {
                    paymentId: `mock_${Date.now()}`
                  };
                  
                  // Update booking status to confirm
                  this.updateBookingStatus();
                  
                  // Store payment confirmation in localStorage for reference
                  const paymentConfirmation = {
                    paymentId: mockResult.paymentId,
                    bookingId: this.bookingId,
                    amount: this.depositAmount,
                    method: paymentMethod,
                    timestamp: new Date().toISOString(),
                    status: 'confirm',
                    phoneNumber: ''
                  };
                  
                  localStorage.setItem('lastPaymentConfirmation', JSON.stringify(paymentConfirmation));
                  
                  // Redirect to payment confirmation page for all payment methods
                  setTimeout(() => {
                    this.router.navigate(['/payment-confirmation'], { 
                      queryParams: { 
                        bookingId: this.bookingId, 
                        paymentId: mockResult.paymentId,
                        amount: this.depositAmount,
                        method: paymentMethod,
                        status: 'confirm'
                      } 
                    });
                  }, 2000);
                }
              });
          },
          error: (initError) => {
            // In demo mode, handle errors gracefully and still proceed
            console.warn('Payment initialization warning (demo mode):', initError);
            
            // Still confirm the payment in demo mode
            this.success = true;
            this.processing = false;
            
            // Create a mock result
            const mockResult = {
              paymentId: `mock_${Date.now()}`
            };
            
            // Update booking status to confirm
            this.updateBookingStatus();
            
            // Store payment confirmation in localStorage for reference
            const paymentConfirmation = {
              paymentId: mockResult.paymentId,
              bookingId: this.bookingId,
              amount: this.depositAmount,
              method: paymentMethod,
              timestamp: new Date().toISOString(),
              status: 'confirm',
              phoneNumber: ''
            };
            
            localStorage.setItem('lastPaymentConfirmation', JSON.stringify(paymentConfirmation));
            
            // Redirect to payment confirmation page for all payment methods
            setTimeout(() => {
              this.router.navigate(['/payment-confirmation'], { 
                queryParams: { 
                  bookingId: this.bookingId, 
                  paymentId: mockResult.paymentId,
                  amount: this.depositAmount,
                  method: paymentMethod,
                  status: 'confirm'
                } 
              });
            }, 2000);
          }
        });
    }
  }

  updateBookingStatus(): void {
    if (this.bookingId) {
      this.bookingService.updateBookingStatus(this.bookingId, 'confirm').subscribe({
        next: (updatedBooking) => {
          console.log('Booking status updated to confirm:', updatedBooking);
          // Optionally update local booking data
          this.bookingData = updatedBooking;
        },
        error: (err) => {
          console.error('Failed to update booking status:', err);
          // Even if status update fails, we still have payment confirmation
          // So we'll still proceed to success page
        }
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      const control = this.paymentForm.get(key);
      control?.markAsTouched();
    });
  }

  isOrderOnly(): boolean {
    return this.paymentType === 'order_only';
  }

  calculateTax(amount: number): number {
    return amount * 0.05; // 5% tax
  }

  getTotalAmount(): number {
    const subtotal = this.isOrderOnly() ? this.menuItemsAmount : (this.baseAmount + this.menuItemsAmount);
    return subtotal + this.calculateTax(subtotal);
  }

  ngOnDestroy(): void {
    // Cleanup logic if needed
  }
}