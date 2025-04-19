const express = require('express');
const router = express.Router();
const { createContact, getContacts, getContactById, updateContactStatus, deleteContact } = require('../controllers/contactController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Route cho người dùng gửi tin nhắn liên hệ
router.post('/', createContact);

// Routes cho admin quản lý tin nhắn liên hệ
router.get('/', protect, authorize('admin'), getContacts);
router.get('/:id', protect, authorize('admin'), getContactById);
router.put('/:id', protect, authorize('admin'), updateContactStatus);
router.delete('/:id', protect, authorize('admin'), deleteContact);

module.exports = router; 