import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-confirmation.component.html',
  styleUrls: ['./payment-confirmation.component.css']
})
export class PaymentConfirmationComponent implements OnInit {
  paymentId: string = '';
  bookingId: string = '';
  amount: number = 0;
  method: string = '';
  status: string = '';
  transactionId: string = '';
  paymentType: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get payment details from query params
    this.paymentId = this.route.snapshot.queryParamMap.get('paymentId') || '';
    this.bookingId = this.route.snapshot.queryParamMap.get('bookingId') || '';
    const amountParam = this.route.snapshot.queryParamMap.get('amount');
    this.amount = amountParam ? parseFloat(amountParam) : 0;
    this.method = this.route.snapshot.queryParamMap.get('method') || '';
    this.status = this.route.snapshot.queryParamMap.get('status') || '';
    this.paymentType = this.route.snapshot.queryParamMap.get('type') || '';
    
    // Generate a mock transaction ID
    this.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  viewBooking(): void {
    this.router.navigate(['/payment-confirmation'], {
      queryParams: {
        bookingId: this.bookingId,
        paymentId: this.paymentId,
        amount: this.amount,
        method: this.method,
        status: this.status
      }
    });
  }

  backToHome(): void {
    this.router.navigate(['/']);
  }
  
  isOrderOnly(): boolean {
    return this.paymentType === 'order_only';
  }
  
  getPaymentMethodDisplay(method: string): string {
    // Normalize the method string by replacing underscores with spaces and capitalizing
    const normalizedMethod = method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const methodNames: { [key: string]: string } = {
      'Credit Card': 'Credit Card',
      'Debit Card': 'Debit Card',
      'Upi': 'UPI',
      'Paytm': 'PayTM',
      'Paytm Wallet': 'PayTM Wallet',
      'Paypal': 'PayPal',
      'Cash': 'Cash',
      'Bank Transfer': 'Bank Transfer'
    };
    
    // Check if we have a mapped name, otherwise normalize and return
    return methodNames[normalizedMethod] || normalizedMethod;
  }
  
  showGatewayInfo(): boolean {
    // Normalize the method for comparison
    const normalizedMethod = this.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    // Show gateway-specific info for digital payment methods
    return ['Upi', 'Paytm', 'Paytm Wallet', 'Paypal', 'Credit Card', 'Debit Card'].includes(normalizedMethod);
  }
  
  getGatewayTitle(method: string): string {
    const normalizedMethod = method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    switch (normalizedMethod) {
      case 'Paytm':
      case 'Paytm Wallet':
        return '📱 PayTM Transaction Details';
      case 'Paypal':
        return '💳 PayPal Transaction Details';
      case 'Credit Card':
      case 'Debit Card':
        return '💳 Card Transaction Details';
      case 'Upi':
        return '📲 UPI Transaction Details';
      default:
        return '💳 Transaction Details';
    }
  }
  
  getGatewaySecurityMessage(method: string): string {
    const normalizedMethod = method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    switch (normalizedMethod) {
      case 'Paytm':
      case 'Paytm Wallet':
        return 'Made secure with PayTM\'s trusted payment gateway';
      case 'Paypal':
        return 'Secured by PayPal\'s protection system';
      case 'Credit Card':
      case 'Debit Card':
        return 'Protected by 256-bit SSL encryption';
      case 'Upi':
        return 'Secured with NPCI\'s UPI standards';
      default:
        return 'Transaction secured with industry-standard encryption';
    }
  }
}