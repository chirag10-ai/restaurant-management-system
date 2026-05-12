const Revenue = require('../models/Revenue');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Booking = require('../models/Booking');

const revenueController = {
  // Get current revenue
  getCurrentRevenue: async (req, res) => {
    try {
      // Get all completed payments for total revenue calculation
      const payments = await Payment.find({ paymentStatus: 'completed' });
      
      // Get all confirmed bookings with payment amounts
      const bookings = await Booking.find({ 
        status: 'confirm',
        paymentAmount: { $gt: 0 } // Only bookings with actual payment amounts
      });
      
      // Calculate total revenue from payments (menu items/orders)
      const totalPaymentRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Calculate total revenue from bookings
      const totalBookingRevenue = bookings.reduce((sum, booking) => sum + booking.paymentAmount, 0);
      
      // Calculate total combined revenue
      const totalRevenue = totalPaymentRevenue + totalBookingRevenue;
      
      // Return current calculated revenue
      const currentRevenue = {
        totalRevenue: totalRevenue,
        totalPaymentRevenue: totalPaymentRevenue,
        totalBookingRevenue: totalBookingRevenue,
        paymentCount: payments.length,
        bookingCount: bookings.length,
        lastUpdated: new Date()
      };
      
      res.json(currentRevenue);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Add payment amount to revenue
  addPaymentToRevenue: async (payment) => {
    try {
      // Get the latest revenue record
      let revenue = await Revenue.findOne().sort({ createdAt: -1 });
      
      if (!revenue) {
        // Create initial revenue record if it doesn't exist with base value of 42000
        revenue = await Revenue.create({ totalRevenue: 42000 });
      }
      
      // Add the payment amount to total revenue
      const newTotalRevenue = revenue.totalRevenue + payment.amount;
      
      // Add the transaction to the list
      revenue.transactions.push({
        paymentId: payment._id,
        amount: payment.amount,
        type: payment.type || 'payment',
        paymentMethod: payment.paymentMethod || 'order',
        description: payment.description || 'Payment transaction',
        date: payment.createdAt || new Date()
      });
      
      // Update the total revenue and last updated time
      revenue.totalRevenue = newTotalRevenue;
      revenue.lastUpdated = new Date();
      
      // Save the updated revenue record
      await revenue.save();
      
      console.log(`Added payment of ${payment.amount} to revenue. New total: ${newTotalRevenue}`);
    } catch (error) {
      console.error('Error adding payment to revenue:', error.message);
    }
  },

  // Add order amount to revenue
  addOrderToRevenue: async (order) => {
    try {
      // Get the latest revenue record
      let revenue = await Revenue.findOne().sort({ createdAt: -1 });
      
      if (!revenue) {
        // Create initial revenue record if it doesn't exist with base value of 42000
        revenue = await Revenue.create({ totalRevenue: 42000 });
      }
      
      // Add the order amount to total revenue
      const newTotalRevenue = revenue.totalRevenue + order.totalPrice;
      
      // Add the transaction to the list
      revenue.transactions.push({
        orderId: order._id,
        amount: order.totalPrice,
        type: 'order',
        description: 'Order revenue',
        date: order.createdAt || new Date()
      });
      
      // Update the total revenue and last updated time
      revenue.totalRevenue = newTotalRevenue;
      revenue.lastUpdated = new Date();
      
      // Save the updated revenue record
      await revenue.save();
      
      console.log(`Added order of ${order.totalPrice} to revenue. New total: ${newTotalRevenue}`);
    } catch (error) {
      console.error('Error adding order to revenue:', error.message);
    }
  },

  // Deduct refund amount from revenue
  deductRefundFromRevenue: async (payment) => {
    try {
      // Get the latest revenue record
      let revenue = await Revenue.findOne().sort({ createdAt: -1 });
      
      if (!revenue) {
        // If no revenue record exists, create one with initial value of 42000
        revenue = await Revenue.create({ totalRevenue: 42000 });
      }
      
      // Subtract the refund amount from total revenue
      const newTotalRevenue = Math.max(0, revenue.totalRevenue - payment.amount); // Ensure non-negative
      
      // Add the refund transaction to the list
      revenue.transactions.push({
        paymentId: payment._id,
        amount: -payment.amount, // Negative amount for refund
        type: 'refund',
        description: 'Refund transaction',
        date: new Date()
      });
      
      // Update the total revenue and last updated time
      revenue.totalRevenue = newTotalRevenue;
      revenue.lastUpdated = new Date();
      
      // Save the updated revenue record
      await revenue.save();
      
      console.log(`Deducted refund of ${payment.amount} from revenue. New total: ${newTotalRevenue}`);
    } catch (error) {
      console.error('Error deducting refund from revenue:', error.message);
    }
  },

  // Get revenue report
  getRevenueReport: async (req, res) => {
    try {
      // Get counts for orders and bookings
      const totalOrders = await Order.countDocuments({});
      const totalBookings = await Booking.countDocuments({});
      
      // Calculate average order value
      let averageOrderValue = 0;
      if (totalOrders > 0) {
        const ordersAggregate = await Order.aggregate([
          { $group: { _id: null, avgValue: { $avg: '$totalPrice' } } }
        ]);
        averageOrderValue = ordersAggregate.length > 0 ? ordersAggregate[0].avgValue : 0;
      }
      
      // Get all completed payments for total revenue calculation
      const payments = await Payment.find({ paymentStatus: 'completed' })
        .populate('orderId', 'items totalPrice tableNumber status');
      
      // Get all confirmed bookings with payment amounts
      const bookings = await Booking.find({ 
        status: 'confirm',
        paymentAmount: { $gt: 0 } // Only bookings with actual payment amounts
      });
      
      // Calculate total revenue from payments (menu items/orders)
      const totalPaymentRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Calculate total revenue from bookings
      const totalBookingRevenue = bookings.reduce((sum, booking) => sum + booking.paymentAmount, 0);
      
      // Calculate total combined revenue
      const totalRevenue = totalPaymentRevenue + totalBookingRevenue;
      
      const report = {
        totalRevenue: totalRevenue,
        totalOrders: totalOrders,
        totalBookings: totalBookings,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        revenueByCategory: {
          tableBooking: totalBookingRevenue,
          menuItems: totalPaymentRevenue
        },
        transactionCount: payments.length + bookings.length,
        // Just return the counts and averages for now - can expand with more details if needed
        lastUpdated: new Date()
      };
      
      res.json(report);
    } catch (error) {
      console.error('Revenue report error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = revenueController;