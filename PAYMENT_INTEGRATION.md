# Payment Integration for Table Booking System

## Overview
This document explains how the payment system is integrated with the table booking functionality in the restaurant management system.

## Payment Flow

### 1. Booking Creation
- User fills out the booking form with details (name, email, phone, date, time, guests, table type)
- Upon submission, a booking is created in the system
- User is redirected to the payment page with the booking ID

### 2. Payment Processing
- Payment page displays booking summary and payment options
- User selects payment method (Credit Card, Debit Card, UPI)
- Mobile number verification via OTP (simulated)
- Payment details collection based on selected method
- Payment processing through PaymentHandlerService

### 3. Payment Completion
- Successful payment creates a payment record in the database
- Booking status is updated to "confirmed"
- User is redirected to booking success page
- Success page displays booking and payment details

## Key Components

### Frontend Components
- **BookingComponent**: Handles table booking creation and redirects to payment
- **PaymentPageComponent**: Processes payments for bookings
- **BookingSuccessComponent**: Displays confirmation after successful payment

### Services
- **BookingService**: Manages booking CRUD operations
- **PaymentService**: Handles payment creation and management
- **PaymentHandlerService**: Processes different payment methods
- **OrderService**: Creates orders linked to bookings

### Backend Routes
- `/api/bookings`: Booking management endpoints
- `/api/payments`: Payment processing endpoints
- `/api/orders`: Order creation and management

## How to Test the Integration

### Prerequisites
1. Start the backend server: `cd backend && node server.js`
2. Start the frontend: `cd frontend/client && npm start`

### Test Flow
1. Navigate to Booking page (`/booking`)
2. Fill out the booking form with valid details
3. Submit the form
4. You'll be redirected to the payment page (`/secure-payment/:bookingId`)
5. Enter a 10-digit mobile number and click "Send OTP"
6. Select a payment method
7. Fill in payment details
8. Click "Pay" to complete the transaction
9. You'll be redirected to the booking success page

## Payment Methods Supported
- Credit Card
- Debit Card  
- UPI (Unified Payments Interface)

## Flexible Validation (Demo Mode)
- Any phone number will work for OTP verification
- Any OTP value will be accepted
- Any card number will be accepted (no validation)
- Payment validation completely bypassed
- All major payment methods are accepted regardless of card details
- Payment will always succeed regardless of user input

## Security Features
- Mobile number verification via OTP
- SSL encryption for payment data
- Token-based authentication
- Payment validation before processing

## Error Handling
- Form validation for all inputs
- Payment method-specific validation
- Graceful error messages
- Automatic retry mechanisms

## Customization Options
- Adjust deposit amounts in booking component
- Modify tax rates in payment components
- Add new payment methods by extending PaymentHandlerService
- Customize payment page UI/UX

## Troubleshooting
- Ensure backend server is running on port 5000
- Check browser console for JavaScript errors
- Verify all required environment variables are set
- Confirm MongoDB connection is established