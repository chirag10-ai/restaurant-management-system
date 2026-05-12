const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all bookings (Admin only)
router.get('/', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const { status, date } = req.query;
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    const bookings = await Booking.find(filter)
      .sort({ date: 1, time: 1 })
      .populate('userId', 'name email');
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get booking by ID (Admin only)
router.get('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new booking (Public)
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      date,
      time,
      numberOfGuests,
      tableType,
      tableNumbers,
      specialRequests
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !date || !time || !numberOfGuests || !tableType || !tableNumbers || !Array.isArray(tableNumbers)) {
      return res.status(400).json({ message: 'All required fields must be provided, and tableNumbers must be an array' });
    }

    // Check if any of the tables are already booked for that date and time
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      date: { $gte: bookingDate, $lte: endOfDay },
      time,
      tableType,
      tableNumbers: { $in: tableNumbers },
      status: { $ne: 'cancel' }
    });

    if (existingBookings.length > 0) {
      const bookedTables = existingBookings.flatMap(b => b.tableNumbers.filter(t => tableNumbers.includes(t)));
      return res.status(400).json({ message: `Table(s) ${bookedTables.join(', ')} in ${tableType} section are already booked for this time.` });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return res.status(400).json({ message: 'Booking date must be in the future' });
    }

    // Check if user is authenticated by trying to extract and verify token
    let userId = null;
    try {
      // Extract token from header
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      }
    } catch (err) {
      // Token not provided or invalid, continue without user ID
    }

    // Calculate payment amount (₹50 per guest)
    const paymentAmount = numberOfGuests * 50;
    
    const booking = new Booking({
      customerName,
      customerEmail,
      customerPhone,
      date: bookingDate,
      time,
      numberOfGuests,
      tableNumbers,
      tableType,
      specialRequests: specialRequests || '',
      userId: userId,
      paymentAmount,
      status: 'pending' // Always create booking as pending, admin needs to confirm
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'A booking with this email already exists for the selected date and time' });
    } else {
      res.status(400).json({ message: 'Error creating booking', error: error.message });
    }
  }
});

// Update booking status (Admin only or user can confirm their own booking)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirm', 'cancel'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find the booking
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is admin/manager or is the owner of the booking
    const isAdmin = req.userRole === 'admin' || req.userRole === 'manager';
    const isOwner = booking.userId && booking.userId.toString() === req.userId;
    
    // Allow admin/manager to update any booking, or allow user to confirm their own booking
    if (isAdmin || (isOwner && status === 'confirm')) {
      // Update the booking status
      const updatedBooking = await Booking.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      
      res.json(updatedBooking);
    } else {
      return res.status(403).json({ message: 'Access denied: You can only confirm your own booking' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update booking (Admin only)
router.put('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: 'Error updating booking', error: error.message });
  }
});

// Delete booking (Admin or booking owner)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user is admin/manager or the owner of the booking
    const isAdmin = req.userRole === 'admin' || req.userRole === 'manager';
    const isOwner = booking.userId && booking.userId.toString() === req.userId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own bookings.' });
    }
    
    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available time slots for a date
router.get('/availability/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all bookings for the date
    const bookings = await Booking.find({
      date: { $gte: date, $lte: endOfDay },
      status: { $ne: 'cancel' }
    });

    // Define all possible time slots (assuming restaurant hours)
    const allTimeSlots = [
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
    ];

    // Count bookings per time slot
    const bookedSlots = {};
    bookings.forEach(booking => {
      const time = booking.time;
      if (!bookedSlots[time]) {
        bookedSlots[time] = { totalGuests: 0, tables: [] };
      }
      bookedSlots[time].totalGuests += booking.numberOfGuests;
      booking.tableNumbers.forEach(num => {
        bookedSlots[time].tables.push({ 
          tableNumber: num, 
          tableType: booking.tableType 
        });
      });
    });

    // Assume max capacity per time slot is 50 guests (sum of all tables)
    const maxCapacity = 50;
    const availableSlots = allTimeSlots.filter(time => {
      const currentBookings = bookedSlots[time]?.totalGuests || 0;
      return currentBookings < maxCapacity;
    });

    res.json({
      date: req.params.date,
      availableSlots,
      bookedSlots
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available tables for a specific date, time and type
router.get('/tables/available', async (req, res) => {
  try {
    const { date, time, tableType } = req.query;

    if (!date || !time || !tableType) {
      return res.status(400).json({ message: 'Date, time, and tableType are required' });
    }

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all bookings for that date, time and table type
    const existingBookings = await Booking.find({
      date: { $gte: bookingDate, $lte: endOfDay },
      time: time,
      tableType: tableType,
      status: { $ne: 'cancel' }
    });

    const bookedTableNumbers = existingBookings.flatMap(b => b.tableNumbers);

    // Define max tables per type
    let maxTables = 0;
    if (tableType === 'indoor') maxTables = 20;
    else if (tableType === 'outdoor') maxTables = 20;
    else if (tableType === 'vip') maxTables = 10;

    const availableTables = [];
    for (let i = 1; i <= maxTables; i++) {
      if (!bookedTableNumbers.includes(i)) {
        availableTables.push(i);
      }
    }

    res.json({ availableTables });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bookings for the authenticated user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    console.log('=== GET USER BOOKINGS DEBUG ===');
    console.log('req.userId:', req.userId);
    console.log('req.userRole:', req.userRole);
    
    // Handle special admin user ID
    const userId = req.userId === 'admin-special-id' ? null : req.userId;
    
    if (!userId) {
      console.log('No valid userId found');
      return res.status(400).json({ message: 'User ID not found' });
    }
    
    // Fetch user to get their email
    const User = require('../models/User');
    const user = await User.findById(userId).select('email');
    const userEmail = user ? user.email : null;
    
    console.log('User found:', user ? 'YES' : 'NO');
    console.log('User email:', userEmail);
    
    // Find bookings by userId OR by customerEmail (for bookings made while not logged in)
    const query = userEmail 
      ? { $or: [{ userId: userId }, { customerEmail: userEmail }] }
      : { userId: userId };
    
    console.log('Query:', JSON.stringify(query));
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 }); // Sort by most recent first
    
    console.log('Bookings found:', bookings.length);
    console.log('===================');
    
    res.json(bookings);
  } catch (error) {
    console.error('Error in /user route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel booking by user (user can only cancel their own bookings)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if the booking belongs to the authenticated user
    // Check if the booking belongs to the authenticated user
    const reqUserId = req.userId === 'admin-special-id' ? null : req.userId;
    if (!reqUserId || booking.userId?.toString() !== reqUserId) {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }
    
    // Check if booking can be cancelled (not already cancelled)
    if (booking.status === 'cancel') {
      return res.status(400).json({ message: `Cannot cancel booking with status: ${booking.status}` });
    }
    
    // Update booking status to cancel
    booking.status = 'cancel';
    await booking.save();
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;