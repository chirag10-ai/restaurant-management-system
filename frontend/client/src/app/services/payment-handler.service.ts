import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PaymentService } from './payment.service';
import { OrderService } from './order.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentHandlerService {
  private paymentGateways = {
    stripe: {
      name: 'Stripe',
      logo: 'assets/images/stripe-logo.png',
      supportedMethods: ['credit_card', 'debit_card', 'paypal']
    },
    razorpay: {
      name: 'Razorpay',
      logo: 'assets/images/razorpay-logo.png',
      supportedMethods: ['credit_card', 'debit_card', 'upi', 'net_banking']
    },
    paytm: {
      name: 'PayTM',
      logo: 'assets/images/paytm-logo.png',
      supportedMethods: ['upi', 'paytm_wallet']
    },
    paypal: {
      name: 'PayPal',
      logo: 'assets/images/paypal-logo.png',
      supportedMethods: ['paypal', 'credit_card', 'debit_card']
    },
    manual: {
      name: 'Manual',
      logo: '',
      supportedMethods: ['cash', 'bank_transfer']
    }
  };

  constructor(
    private http: HttpClient,
    private paymentService: PaymentService,
    private orderService: OrderService
  ) {}

  // Initialize payment based on selected method
  initializePayment(orderId: string, paymentMethod: string, amount: number): Observable<any> {
    // Determine the appropriate payment gateway based on method
    const gateway = this.determinePaymentGateway(paymentMethod);
    
    switch (gateway) {
      case 'stripe':
        return this.initializeStripePayment(orderId, paymentMethod, amount);
      case 'razorpay':
        return this.initializeRazorpayPayment(orderId, paymentMethod, amount);
      case 'paytm':
        return this.initializePayTM_PAYMENT(orderId, paymentMethod, amount);
      case 'paypal':
        return this.initializePayPalPayment(orderId, paymentMethod, amount);
      default:
        // For manual payment methods like cash
        return this.processManualPayment(orderId, paymentMethod, amount);
    }
  }

  private determinePaymentGateway(paymentMethod: string): string {
    // Map payment methods to appropriate gateways
    const methodToGatewayMap: { [key: string]: string } = {
      'credit_card': 'stripe',
      'debit_card': 'stripe',
      'paypal': 'paypal',
      'upi': 'razorpay',
      'paytm': 'paytm',
      'paytm_wallet': 'paytm',
      'cash': 'manual',
      'bank_transfer': 'manual'
    };
    
    return methodToGatewayMap[paymentMethod] || 'manual';
  }

  private initializeStripePayment(orderId: string, paymentMethod: string, amount: number): Observable<any> {
    // Stripe integration would happen here
    // This is a simplified simulation
    return of({
      success: true,
      gateway: 'stripe',
      orderId,
      amount,
      paymentIntentId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }

  private initializeRazorpayPayment(orderId: string, paymentMethod: string, amount: number): Observable<any> {
    // Razorpay integration would happen here
    // This is a simplified simulation
    return of({
      success: true,
      gateway: 'razorpay',
      orderId,
      amount,
      razorpayOrderId: `rzp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }

  private initializePayTM_PAYMENT(orderId: string, paymentMethod: string, amount: number): Observable<any> {
    // PayTM integration would happen here
    // This is a simplified simulation
    return of({
      success: true,
      gateway: 'paytm',
      orderId,
      amount,
      paytmOrderId: `paytm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      callbackUrl: `${window.location.origin}/payment-callback/paytm`
    });
  }

  private initializePayPalPayment(orderId: string, paymentMethod: string, amount: number): Observable<any> {
    // PayPal integration would happen here
    // This is a simplified simulation
    return of({
      success: true,
      gateway: 'paypal',
      orderId,
      amount,
      paymentId: `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }

  private processManualPayment(orderId: string, paymentMethod: string, amount: number): Observable<any> {
    // For cash or bank transfer, just create the payment record
    return this.paymentService.createPayment(orderId, paymentMethod, amount);
  }

  // Process final payment after user completes payment at gateway
  processFinalPayment(orderId: string, paymentMethod: string, amount: number, gatewayResponse?: any): Observable<any> {
    // Create payment record in our system
    return this.paymentService.createPayment(orderId, paymentMethod, amount).pipe(
      map(payment => ({
        success: true,
        paymentId: payment._id,
        status: payment.paymentStatus,
        gatewayResponse
      })),
      catchError(error => {
        throw error;
      })
    );
  }

  getSupportedGateways(): any {
    return this.paymentGateways;
  }

  validatePaymentDetails(paymentMethod: string, amount: number, cardDetails?: any): boolean {
    // Dummy payment system - always succeed regardless of input
    console.log('Dummy payment validation: Always returning true');
    return true;
  }

  private validateCardDetails(cardDetails: any): boolean {
    // Dummy payment system - skip all card validation
    console.log('Dummy card validation: Skipping all checks');
    return true;
  }
}