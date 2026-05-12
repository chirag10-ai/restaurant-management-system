const express = require('express');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Revenue = require('../models/Revenue');
const revenueController = require('../controllers/revenueController');
const { authenticateToken, authorizeRole, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get revenue report (Admin only) - Consolidated from revenue.js logic
router.get('/revenue/report', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    // Get all orders that are not cancelled to count as revenue
    const orders = await Order.find({ status: { $ne: 'cancelled' } })
      .populate('userId', 'name email');

    // Get all confirmed or pending bookings
    const bookings = await Booking.find({ 
      status: { $in: ['confirm', 'pending', 'confirmed'] }
    })
      .populate('userId', 'name email');

    // Get all orders/bookings for total counts
    const allOrdersCount = await Order.countDocuments({});
    const allBookingsCount = await Booking.countDocuments({});

    if ((!orders || orders.length === 0) && (!bookings || bookings.length === 0)) {
      return res.status(200).json({
        totalRevenue: 0,
        totalOrders: allOrdersCount,
        totalBookings: allBookingsCount,
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

    // Calculate total revenue from orders
    const totalOrderRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    
    // Calculate total revenue from bookings
    const totalBookingRevenue = bookings.reduce((sum, booking) => sum + (booking.paymentAmount || 0), 0);
    
    // Calculate total combined revenue
    const totalRevenue = totalOrderRevenue + totalBookingRevenue;
    
    // Total transactions for average calculation
    const totalTransactions = orders.length + bookings.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const revenueByCategory = {
      tableBooking: totalBookingRevenue,
      menuItems: totalOrderRevenue
    };

    // 30 Days Daily Revenue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyOrders = await Order.find({
      status: { $ne: 'cancelled' },
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    const dailyBookings = await Booking.find({
      status: { $in: ['confirm', 'pending', 'confirmed'] },
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    const dailyRevenue = [];
    const currentDate = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(currentDate.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayOrderRevenue = dailyOrders
        .filter(o => new Date(o.createdAt).toISOString().split('T')[0] === dateString)
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      
      const dayBookingRevenue = dailyBookings
        .filter(b => new Date(b.createdAt).toISOString().split('T')[0] === dateString)
        .reduce((sum, b) => sum + (b.paymentAmount || 0), 0);
      
      dailyRevenue.push({
        date: dateString,
        revenue: dayOrderRevenue + dayBookingRevenue
      });
    }

    // Monthly Revenue (6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    const monthlyOrders = await Order.find({
      status: { $ne: 'cancelled' },
      createdAt: { $gte: sixMonthsAgo }
    });

    const monthlyBookings = await Booking.find({
      status: { $in: ['confirm', 'pending', 'confirmed'] },
      createdAt: { $gte: sixMonthsAgo }
    });

    const monthlyRevenueMap = {};
    
    // Process orders for monthly revenue
    monthlyOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyRevenueMap[monthYear]) {
        monthlyRevenueMap[monthYear] = { menuItems: 0, tableBooking: 0 };
      }
      monthlyRevenueMap[monthYear].menuItems += (order.totalPrice || 0);
    });

    // Process bookings for monthly revenue
    monthlyBookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyRevenueMap[monthYear]) {
        monthlyRevenueMap[monthYear] = { menuItems: 0, tableBooking: 0 };
      }
      monthlyRevenueMap[monthYear].tableBooking += (booking.paymentAmount || 0);
    });

    const monthlyRevenue = Object.keys(monthlyRevenueMap)
      .map(month => ({
        month,
        revenue: monthlyRevenueMap[month].menuItems + monthlyRevenueMap[month].tableBooking,
        breakdown: monthlyRevenueMap[month]
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Top Customers
    const customerSpendingMap = {};
    
    // Process orders for top customers
    orders.forEach(order => {
      const user = order.userId;
      const userId = user?._id?.toString() || 'unknown';
      const userName = user?.name || 'Guest';
      
      if (!customerSpendingMap[userId]) {
        customerSpendingMap[userId] = {
          customerId: userId,
          customerName: userName,
          totalSpent: 0,
          orderCount: 0,
          bookingCount: 0
        };
      }
      customerSpendingMap[userId].totalSpent += (order.totalPrice || 0);
      customerSpendingMap[userId].orderCount++;
    });

    // Process bookings for top customers
    bookings.forEach(booking => {
      const user = booking.userId;
      const userId = user?._id?.toString() || (booking.customerEmail ? `guest_${booking.customerEmail}` : 'unknown_b');
      const userName = user?.name || booking.customerName || 'Guest';
      
      if (!customerSpendingMap[userId]) {
        customerSpendingMap[userId] = {
          customerId: userId,
          customerName: userName,
          totalSpent: 0,
          orderCount: 0,
          bookingCount: 0
        };
      }
      customerSpendingMap[userId].totalSpent += (booking.paymentAmount || 0);
      customerSpendingMap[userId].bookingCount++;
    });

    const topCustomers = Object.values(customerSpendingMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    res.json({
      totalRevenue,
      totalOrders: allOrdersCount,
      totalBookings: allBookingsCount,
      averageOrderValue,
      revenueByCategory,
      dailyRevenue,
      monthlyRevenue,
      topCustomers
    });
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all revenue transactions (Admin only)
router.get('/revenue/payments', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    console.log('Fetching all revenue transactions...');
    
    // Get all orders (not just payments) to show all consumer activity
    const orders = await Order.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    console.log(`Found ${orders.length} orders`);

    const formattedOrders = orders.map(order => ({
      _id: order._id ? order._id.toString() : 'N/A',
      amount: order.totalPrice || 0,
      paymentMethod: 'order',
      paymentStatus: order.status || 'pending',
      createdAt: order.createdAt || new Date(),
      orderDetails: {
        items: order.items || [],
        tableNumber: order.tableNumber || 0
      },
      userDetails: order.userId ? { name: order.userId.name || 'User', email: order.userId.email || 'N/A' } : { name: 'Guest', email: 'N/A' },
      type: 'payment'
    }));

    // Get all bookings
    const bookings = await Booking.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    console.log(`Found ${bookings.length} bookings`);

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id ? booking._id.toString() : 'N/A',
      amount: booking.paymentAmount || 0,
      paymentMethod: 'booking_fee',
      paymentStatus: booking.status || 'pending',
      createdAt: booking.createdAt || new Date(),
      orderDetails: {
        bookingDate: booking.date,
        bookingTime: booking.time,
        numberOfGuests: booking.numberOfGuests,
        tableType: booking.tableType
      },
      userDetails: booking.userId ? { name: booking.userId.name || 'User', email: booking.userId.email || 'N/A' } : { name: booking.customerName || 'Guest', email: booking.customerEmail || 'N/A' },
      type: 'booking'
    }));

    // Combine and sort by date safely
    const allTransactions = [...formattedOrders, ...formattedBookings]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 100);

    console.log(`Returning ${allTransactions.length} total transactions`);
    res.json(allTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current revenue
router.get('/revenue/current', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const revenue = await Revenue.findOne().sort({ createdAt: -1 }) || { totalRevenue: 0 };
    res.json(revenue);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all payments (Regular admin list)
router.get('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('orderId', 'totalPrice status tableNumber')
      .populate('userId', 'name email');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('orderId', 'totalPrice status tableNumber items')
      .populate('userId', 'name email');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check if user is authorized to view this payment
    if (req.userRole !== 'admin' && payment.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create payment for an order (Dummy payment system - always succeed)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderId, paymentMethod, amount } = req.body;
    
    console.log('Processing dummy payment for order:', orderId);
    console.log('Payment method:', paymentMethod);
    console.log('Amount:', amount);
    
    // Verify order exists and belongs to user (or user is admin)
    const order = await Order.findById(orderId);
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (req.userRole !== 'admin' && order.userId.toString() !== req.userId) {
      console.log('Access denied for user:', req.userId);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
      console.log('Payment already exists for order:', orderId);
      return res.status(400).json({ message: 'Payment already exists for this order' });
    }
    
    // Determine payment gateway based on payment method
    let paymentGateway = 'dummy_system';
    if (paymentMethod === 'paytm' || paymentMethod === 'paytm_wallet') {
      paymentGateway = 'paytm';
    } else if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      paymentGateway = 'stripe';
    } else if (paymentMethod === 'upi') {
      paymentGateway = 'razorpay';
    } else if (paymentMethod === 'paypal') {
      paymentGateway = 'paypal';
    }
    
    // Create payment - dummy system always succeeds
    const payment = new Payment({
      orderId,
      userId: req.userId,
      amount: amount || order.totalPrice,
      paymentMethod,
      paymentStatus: 'completed', // Always mark as completed for dummy system
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentGateway
    });
    
    const savedPayment = await payment.save();
    console.log('Payment created successfully:', savedPayment._id);
    
    // Check if this payment is for an order that already contributed to revenue
    // To avoid double counting, we should only add payments that aren't for orders already counted
    // For now, we'll skip adding to revenue if this payment is for an order
    // since the order revenue is already tracked when the order is created
    if (!savedPayment.orderId) {
      // Only add to revenue if this is not associated with an order
      await revenueController.addPaymentToRevenue(savedPayment);
      console.log('Payment added to revenue tracking');
    } else {
      console.log('Payment is for an order, skipping revenue addition (order revenue already tracked)');
    }
    
    // Update order status to confirmed after payment
    order.status = 'confirmed';
    await order.save();
    console.log('Order status updated to confirmed');
    
    // Populate references before sending response
    await savedPayment.populate('orderId', 'totalPrice status tableNumber');
    await savedPayment.populate('userId', 'name email');
    
    res.status(201).json(savedPayment);
  } catch (error) {
    console.error('Payment processing error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment status (Admin only)
router.put('/:id/status', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: status },
      { new: true }
    ).populate('orderId', 'totalPrice status tableNumber')
     .populate('userId', 'name email');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Process refund (Admin only)
router.post('/:id/refund', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    if (payment.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'Cannot refund non-completed payment' });
    }
    
    payment.paymentStatus = 'refunded';
    const refundedPayment = await payment.save();
    
    // Update order status
    const order = await Order.findById(payment.orderId);
    if (order) {
      order.status = 'cancelled';
      await order.save();
    }
    
    // Deduct refund from revenue tracking
    await revenueController.deductRefundFromRevenue(refundedPayment);
    console.log('Refund amount deducted from revenue tracking');
    
    await refundedPayment.populate('orderId', 'totalPrice status tableNumber');
    await refundedPayment.populate('userId', 'name email');
    
    res.json(refundedPayment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;