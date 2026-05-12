const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const Booking = require('../models/Booking'); // Import Booking model
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Get revenue summary
router.get('/summary', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    // Get all completed payments
    const payments = await Payment.find({ paymentStatus: 'completed' })
      .populate('userId', 'name email')
      .populate('orderId', 'items totalPrice tableNumber status');

    // Get all confirmed or pending bookings with payment amounts
    const bookings = await Booking.find({ 
      status: { $in: ['confirm', 'pending'] },
      paymentAmount: { $gt: 0 } // Only bookings with actual payment amounts
    })
      .populate('userId', 'name email');

    if ((!payments || payments.length === 0) && (!bookings || bookings.length === 0)) {
      return res.status(200).json({
        totalRevenue: 0,
        totalOrders: 0,
        totalBookings: 0,
        averageOrderValue: 0,
        revenueByCategory: {
          tableBooking: 0,
          menuItems: 0
        },
        dailyRevenue: [],
        paymentMethods: [],
        topCustomers: []
      });
    }

    // Calculate total revenue from payments (menu items/orders)
    const totalPaymentRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate total revenue from bookings
    const totalBookingRevenue = bookings.reduce((sum, booking) => sum + booking.paymentAmount, 0);
    
    // Calculate total combined revenue
    const totalRevenue = totalPaymentRevenue + totalBookingRevenue;
    
    // Calculate total orders and bookings
    const totalOrders = payments.length;
    const totalBookings = bookings.length;
    
    // Calculate average order value (based on total revenue divided by total transactions)
    const totalTransactions = totalOrders + totalBookings;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Calculate revenue by category
    const revenueByCategory = {
      tableBooking: totalBookingRevenue,
      menuItems: totalPaymentRevenue
    };

    // Get daily revenue for the last 30 days combining both payments and bookings
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get payments for the last 30 days
    const dailyPayments = await Payment.find({
      paymentStatus: 'completed',
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    // Get bookings for the last 30 days
    const dailyBookings = await Booking.find({
      status: { $in: ['confirm', 'pending'] },
      paymentAmount: { $gt: 0 },
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    // Combine and aggregate daily revenue
    const dailyRevenue = [];
    const currentDate = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(currentDate.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Filter payments for this date
      const dayPayments = dailyPayments.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate.toISOString().split('T')[0] === dateString;
      });
      
      // Filter bookings for this date
      const dayBookings = dailyBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate.toISOString().split('T')[0] === dateString;
      });
      
      // Calculate revenue for this day (from both payments and bookings)
      const dayPaymentRevenue = dayPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const dayBookingRevenue = dayBookings.reduce((sum, booking) => sum + booking.paymentAmount, 0);
      const dayRevenue = dayPaymentRevenue + dayBookingRevenue;
      
      dailyRevenue.push({
        date: dateString,
        revenue: dayRevenue
      });
    }

    // Get monthly revenue for the last 6 months combining both payments and bookings
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    // Get payments for the last 6 months
    const monthlyPayments = await Payment.find({
      paymentStatus: 'completed',
      createdAt: { $gte: sixMonthsAgo }
    });

    // Get bookings for the last 6 months
    const monthlyBookings = await Booking.find({
      status: 'confirm',
      paymentAmount: { $gt: 0 },
      createdAt: { $gte: sixMonthsAgo }
    });

    // Combine and aggregate monthly revenue
    const monthlyRevenueMap = {};

    // Process monthly payments
    monthlyPayments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      const monthYear = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyRevenueMap[monthYear]) {
        monthlyRevenueMap[monthYear] = { menuItems: 0, tableBooking: 0 };
      }
      monthlyRevenueMap[monthYear].menuItems += payment.amount;
    });

    // Process monthly bookings
    monthlyBookings.forEach(booking => {
      const bookingDate = new Date(booking.createdAt);
      const monthYear = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyRevenueMap[monthYear]) {
        monthlyRevenueMap[monthYear] = { menuItems: 0, tableBooking: 0 };
      }
      monthlyRevenueMap[monthYear].tableBooking += booking.paymentAmount;
    });

    const monthlyRevenue = Object.keys(monthlyRevenueMap)
      .map(month => ({
        month: month,
        revenue: monthlyRevenueMap[month].menuItems + monthlyRevenueMap[month].tableBooking,
        breakdown: monthlyRevenueMap[month] // Include breakdown by category
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Get payment methods breakdown from payments
    const paymentMethodsMap = {};
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      if (!paymentMethodsMap[method]) {
        paymentMethodsMap[method] = {
          method: method,
          count: 0,
          revenue: 0
        };
      }
      paymentMethodsMap[method].count++;
      paymentMethodsMap[method].revenue += payment.amount;
    });

    const paymentMethods = Object.values(paymentMethodsMap);

    // Get top customers considering both payments and bookings
    const customerSpendingMap = {};
    
    // Process payments to get customer spending
    payments.forEach(payment => {
      if (!payment.userId) return; // Skip if no user associated
      
      const userId = payment.userId._id.toString();
      const userName = payment.userId.name;
      
      if (!customerSpendingMap[userId]) {
        customerSpendingMap[userId] = {
          customerId: userId,
          customerName: userName,
          totalSpent: 0,
          orderCount: 0,
          bookingCount: 0
        };
      }
      customerSpendingMap[userId].totalSpent += payment.amount;
      customerSpendingMap[userId].orderCount++;
    });

    // Process bookings to get customer spending
    bookings.forEach(booking => {
      if (!booking.userId) return; // Skip if no user associated
      
      const userId = booking.userId._id.toString();
      const userName = booking.userId.name || booking.customerName; // Use booking name if no user
      
      if (!customerSpendingMap[userId]) {
        customerSpendingMap[userId] = {
          customerId: userId,
          customerName: userName,
          totalSpent: 0,
          orderCount: 0,
          bookingCount: 0
        };
      }
      customerSpendingMap[userId].totalSpent += booking.paymentAmount;
      customerSpendingMap[userId].bookingCount++;
    });

    const topCustomers = Object.values(customerSpendingMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10); // Top 10 customers

    // Calculate revenue growth (comparing last 30 days vs previous 30 days) for both payments and bookings
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    // Current period payments and bookings
    const currentPeriodPayments = await Payment.find({
      paymentStatus: 'completed',
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    const currentPeriodBookings = await Booking.find({
      status: 'confirm',
      paymentAmount: { $gt: 0 },
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Previous period payments and bookings
    const previousPeriodPayments = await Payment.find({
      paymentStatus: 'completed',
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    
    const previousPeriodBookings = await Booking.find({
      status: 'confirm',
      paymentAmount: { $gt: 0 },
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    
    // Calculate current and previous period revenues
    const currentPeriodRevenue = 
      currentPeriodPayments.reduce((sum, payment) => sum + payment.amount, 0) +
      currentPeriodBookings.reduce((sum, booking) => sum + booking.paymentAmount, 0);
      
    const previousPeriodRevenue = 
      previousPeriodPayments.reduce((sum, payment) => sum + payment.amount, 0) +
      previousPeriodBookings.reduce((sum, booking) => sum + booking.paymentAmount, 0);
    
    const revenueGrowth = {
      currentPeriod: currentPeriodRevenue,
      previousPeriod: previousPeriodRevenue,
      growthPercentage: previousPeriodRevenue > 0 
        ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
        : currentPeriodRevenue > 0 ? 100 : 0
    };

    const revenueSummary = {
      totalRevenue,
      totalOrders,
      totalBookings,
      averageOrderValue,
      revenueByCategory,
      dailyRevenue,
      monthlyRevenue,
      paymentMethods,
      topCustomers,
      revenueGrowth
    };

    res.json(revenueSummary);
  } catch (error) {
    console.error('Error fetching revenue summary:', error);
    res.status(500).json({ message: 'Server error while fetching revenue data' });
  }
});

// Get all payments for revenue reporting
router.get('/payments', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('userId', 'name email')
      .populate('orderId', 'items totalPrice tableNumber status')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to last 100 payments

    // Format payments to have consistent structure with bookings
    const formattedPayments = payments.map(payment => ({
      _id: payment._id,
      orderId: payment.orderId?._id || payment.orderId,
      userId: payment.userId?._id || payment.userId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      orderDetails: {
        totalPrice: payment.amount,
        status: payment.orderId?.status || 'completed',
        tableNumber: payment.orderId?.tableNumber || 0,
        items: payment.orderId?.items || []
      },
      userDetails: payment.userId ? { name: payment.userId.name, email: payment.userId.email } : { name: 'N/A', email: 'N/A' },
      type: 'payment' // Distinguish as regular payment
    }));

    // Also get all bookings (both confirmed and pending) for complete view
    const bookings = await Booking.find({ 
      status: { $in: ['confirm', 'pending', 'confirmed'] }
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to last 100 bookings

    // Format bookings to match payment structure for unified display
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      orderId: booking._id, // Use booking ID as order ID for bookings
      userId: booking.userId?._id || booking.userId,
      amount: booking.paymentAmount,
      paymentMethod: 'booking_fee', // Distinguish as booking payment
      paymentStatus: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      orderDetails: {
        totalPrice: booking.paymentAmount,
        status: booking.status,
        tableNumber: null, // Bookings don't have table numbers in this context
        bookingDate: booking.date,
        bookingTime: booking.time,
        numberOfGuests: booking.numberOfGuests,
        tableType: booking.tableType
      },
      userDetails: booking.userId ? { name: booking.userId.name, email: booking.userId.email } : { name: booking.customerName, email: booking.customerEmail },
      type: 'booking' // Distinguish from regular payments
    }));

    // Combine and sort payments and bookings by date
    const allTransactions = [...formattedPayments, ...formattedBookings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 100); // Take the most recent 100 transactions

    res.json(allTransactions);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
});

// Get revenue by date range
router.get('/date-range', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of the day

    // Get payments in date range
    const payments = await Payment.find({
      paymentStatus: 'completed',
      createdAt: { $gte: start, $lte: end }
    })
      .populate('userId', 'name email')
      .populate('orderId', 'items totalPrice tableNumber status');

    // Get bookings in date range
    const bookings = await Booking.find({
      status: { $in: ['confirm', 'pending'] },
      paymentAmount: { $gt: 0 },
      createdAt: { $gte: start, $lte: end }
    })
      .populate('userId', 'name email');

    // Calculate combined revenue
    const totalPaymentRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalBookingRevenue = bookings.reduce((sum, booking) => sum + booking.paymentAmount, 0);
    const totalRevenue = totalPaymentRevenue + totalBookingRevenue;
    
    const totalOrders = payments.length;
    const totalBookings = bookings.length;
    const totalTransactions = totalOrders + totalBookings;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    res.json({
      totalRevenue,
      totalPaymentRevenue,
      totalBookingRevenue,
      totalOrders,
      totalBookings,
      totalTransactions,
      averageOrderValue,
      payments,
      bookings
    });
  } catch (error) {
    console.error('Error fetching revenue by date range:', error);
    res.status(500).json({ message: 'Server error while fetching revenue data by date range' });
  }
});

module.exports = router;