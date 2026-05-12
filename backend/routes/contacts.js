const express = require('express');
const Contact = require('../models/Contact');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Create new contact message (Public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message
    });

    await contact.save();
    res.status(201).json({ 
      message: 'Message sent successfully! We will contact you soon.',
      contactId: contact._id 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all contact messages (Admin only)
router.get('/', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get contact message by ID (Admin only)
router.get('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }
    
    // Mark as read if it's new
    if (contact.status === 'new') {
      contact.status = 'read';
      await contact.save();
    }
    
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update contact message status (Admin only)
router.put('/:id/status', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'read', 'replied', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reply to contact message (Admin only)
router.post('/:id/reply', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const { replyMessage } = req.body;
    
    if (!replyMessage) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'replied',
        replied: true 
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    // In a real app, you would send an email here
    console.log(`Reply to ${contact.email}: ${replyMessage}`);
    
    res.json({ 
      message: 'Reply sent successfully',
      contact 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete contact message (Admin only)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;