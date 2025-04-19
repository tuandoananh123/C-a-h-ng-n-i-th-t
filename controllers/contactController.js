const Contact = require('../models/Contact');

/**
 * @desc    Tạo tin nhắn liên hệ mới
 * @route   POST /api/contact
 * @access  Public
 */
exports.createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Tạo tin nhắn liên hệ mới
    const contact = await Contact.create({
      name,
      email,
      subject,
      message
    });

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Cảm ơn bạn đã liên hệ với chúng tôi'
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi, vui lòng thử lại sau'
    });
  }
};

/**
 * @desc    Lấy tất cả tin nhắn liên hệ
 * @route   GET /api/contact
 * @access  Private/Admin
 */
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi, vui lòng thử lại sau'
    });
  }
};

/**
 * @desc    Lấy tin nhắn liên hệ theo ID
 * @route   GET /api/contact/:id
 * @access  Private/Admin
 */
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn liên hệ'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error getting contact by id:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi, vui lòng thử lại sau'
    });
  }
};

/**
 * @desc    Cập nhật trạng thái tin nhắn liên hệ
 * @route   PUT /api/contact/:id
 * @access  Private/Admin
 */
exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Kiểm tra trạng thái hợp lệ
    if (!status || !['unread', 'read'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn liên hệ'
      });
    }

    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi, vui lòng thử lại sau'
    });
  }
};

/**
 * @desc    Xóa tin nhắn liên hệ
 * @route   DELETE /api/contact/:id
 * @access  Private/Admin
 */
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn liên hệ'
      });
    }

    await contact.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tin nhắn liên hệ đã được xóa'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi, vui lòng thử lại sau'
    });
  }
};

/**
 * @desc    Hiển thị trang quản lý tin nhắn liên hệ cho admin
 * @route   GET /admin/contacts
 * @access  Private/Admin
 */
exports.getContactsPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    let query = {};
    
    // Tìm kiếm theo tên, email hoặc tiêu đề
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Đếm tổng số tin nhắn và số tin nhắn chưa đọc
    const totalCount = await Contact.countDocuments(query);
    const unreadCount = await Contact.countDocuments({ ...query, status: 'unread' });
    
    // Lấy danh sách tin nhắn theo trang
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    // Tính tổng số trang
    const totalPages = Math.ceil(totalCount / limit);
    
    res.render('admin/contacts', {
      title: 'Quản Lý Tin Nhắn Liên Hệ',
      contacts,
      currentPage: page,
      totalPages,
      totalCount,
      unreadCount,
      search,
      user: req.session.user || null,
      status: req.query.status || '',
      message: req.query.message || ''
    });
  } catch (error) {
    console.error('Error rendering contacts page:', error);
    res.status(500).render('error', {
      title: 'Lỗi Server',
      message: 'Có lỗi xảy ra khi tải trang quản lý tin nhắn liên hệ',
      error,
      user: req.session.user || null
    });
  }
}; 