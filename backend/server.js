const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/payments', require('./routes/payments'));

// Basic route
app.get('/', (req, res) => {
  res.send('Restaurant Management System API');
});

// Test route for bookings
app.get('/api/test-bookings', async (req, res) => {
  try {
    const Booking = require('./models/Booking');
    const count = await Booking.countDocuments();
    res.json({ message: 'Booking system is working', totalBookings: count });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// Test route for contacts
app.get('/api/test-contacts', async (req, res) => {
  try {
    const Contact = require('./models/Contact');
    const count = await Contact.countDocuments();
    res.json({ message: 'Contact system is working', totalContacts: count });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// Test route for payments
app.get('/api/test-payments', async (req, res) => {
  try {
    const Payment = require('./models/Payment');
    const count = await Payment.countDocuments();
    res.json({ message: 'Payment system is working', totalPayments: count });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});