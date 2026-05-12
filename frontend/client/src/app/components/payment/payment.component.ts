import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentHandlerService } from '../../services/payment-handler.service';
import { PaymentService } from '../../services/payment.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, OnDestroy {
  @Input() orderTotal: number = 0;
  @Input() orderId: string = '';
  
  paymentForm: FormGroup;
  selectedPaymentMethod: string = '';
  processing = false;
  error = '';
  success = false;

  constructor(
    private formBuilder: FormBuilder,
    private paymentHandlerService: PaymentHandlerService,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {
    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['', [Validators.required]],
      cardNumber: [''],
      cardName: [''],
      expiryDate: [''],
      cvv: [''],
      upiId: [''],
      paypalEmail: ['']
    });
  }

  ngOnInit(): void {
    // Set default order total if not provided
    if (!this.orderTotal) {
      this.orderTotal = 50; // Default deposit amount
    }
  }

  onPaymentMethodChange(): void {
    this.selectedPaymentMethod = this.paymentForm.get('paymentMethod')?.value;
    this.clearPaymentFields();
    this.setupValidation();
  }

  private clearPaymentFields(): void {
    this.paymentForm.patchValue({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      upiId: '',
      paypalEmail: ''
    });
  }

  private setupValidation(): void {
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
          Validators.pattern(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/)
        ]);
        controls['cardName'].setValidators([Validators.required]);
        controls['expiryDate'].setValidators([
          Validators.required,
          Validators.pattern(/^\d{2}\/\d{2}$/)
        ]);
        controls['cvv'].setValidators([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(4)
        ]);
        break;
        
      case 'upi':
        controls['upiId'].setValidators([
          Validators.required,
          Validators.pattern(/^[a-zA-Z0-9.-]{2,256}@[a-zA-Z]{2,64}$/)
        ]);
        break;
        
      case 'paypal':
        controls['paypalEmail'].setValidators([
          Validators.required,
          Validators.email
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
      cardDetails = {
        number: this.paymentForm.get('cardNumber')?.value,
        name: this.paymentForm.get('cardName')?.value,
        expiryMonth: this.paymentForm.get('expiryDate')?.value.split('/')[0],
        expiryYear: '20' + this.paymentForm.get('expiryDate')?.value.split('/')[1],
        cvv: this.paymentForm.get('cvv')?.value
      };
    }

    // Skip validation for dummy payment system - always proceed
    console.log('Skipping payment validation for dummy system');

    // Initialize payment through the handler
    this.paymentHandlerService.initializePayment(this.orderId, paymentMethod, totalAmount)
      .subscribe({
        next: (initResult) => {
          // Process final payment
          this.paymentHandlerService.processFinalPayment(this.orderId, paymentMethod, totalAmount, initResult)
            .subscribe({
              next: (result) => {
                this.success = true;
                this.processing = false;
                
                // Redirect after success
                setTimeout(() => {
                  this.router.navigate(['/booking/success'], { 
                    queryParams: { orderId: this.orderId, paymentId: result.paymentId } 
                  });
                }, 2000);
              },
              error: (paymentError) => {
                this.error = paymentError.error?.message || 'Payment processing failed. Please try again.';
                this.processing = false;
              }
            });
        },
        error: (initError) => {
          this.error = initError.error?.message || 'Payment initialization failed. Please try again.';
          this.processing = false;
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      const control = this.paymentForm.get(key);
      control?.markAsTouched();
    });
  }

  calculateTax(amount: number): number {
    // Assuming 5% tax rate
    return amount * 0.05;
  }

  getTotalAmount(): number {
    return this.orderTotal + this.calculateTax(this.orderTotal);
  }

  ngOnDestroy(): void {
    // Cleanup logic if needed
  }
}