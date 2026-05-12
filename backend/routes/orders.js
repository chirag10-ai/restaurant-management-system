const express = require('express');
const Order = require('../models/Order');
const Menu = require('../models/Menu');
const Revenue = require('../models/Revenue');
const revenueController = require('../controllers/revenueController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all orders (Admin/Manager only, or user's own orders)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let orders;
    if (req.userRole === 'admin' || req.userRole === 'manager') {
      // Admins and managers can see all orders
      orders = await Order.find()
        .populate('userId', 'name email')
        .populate('items.menuId', 'name');
    } else {
      // Regular users can only see their own orders
      orders = await Order.find({ userId: req.userId })
        .populate('userId', 'name email')
        .populate('items.menuId', 'name');
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('items.menuId', 'name');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to view this order
    if (req.userRole !== 'admin' && req.userRole !== 'manager' && order.userId._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, tableNumber, notes } = req.body;

    // Calculate total price
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      // Get the menu item to verify price and availability
      const menuItem = await Menu.findById(item.menuId);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ message: `Menu item ${item.menuId} is not available` });
      }

      const orderItem = {
        menuId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity
      };

      orderItems.push(orderItem);
      totalPrice += menuItem.price * item.quantity;
    }

    const order = new Order({
      userId: req.userId,
      items: orderItems,
      totalPrice,
      tableNumber,
      notes
    });

    await order.save();
    const populatedOrder = await Order.findById(order._id)
      .populate('userId', 'name email')
      .populate('items.menuId', 'name');

    // Add order to revenue tracking
    await revenueController.addOrderToRevenue(order);
    console.log('Order revenue added to revenue tracking');

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status (Admin/Manager only)
router.put('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const allowedStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    )
    .populate('userId', 'name email')
    .populate('items.menuId', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete order (Admin or order owner)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is admin/manager or the owner of the order
    const isAdmin = req.userRole === 'admin' || req.userRole === 'manager';
    const isOwner = order.userId && order.userId.toString() === req.userId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own orders.' });
    }
    
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel order (User can cancel their own order)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to cancel this order
    // User can cancel their own order, admin/manager can cancel any order
    if (req.userRole !== 'admin' && req.userRole !== 'manager' && order.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied. You can only cancel your own orders.' });
    }

    // Only allow cancellation if order is not already delivered or cancelled
    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel a delivered order' });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    await order.save();

    const cancelledOrder = await Order.findById(order._id)
      .populate('userId', 'name email')
      .populate('items.menuId', 'name');

    res.json({ message: 'Order cancelled successfully', order: cancelledOrder });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;