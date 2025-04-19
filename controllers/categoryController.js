const Category = require('../models/Category');
const Product = require('../models/Product');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ',
      message: error.message
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy danh mục'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin danh mục:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ',
      message: error.message
    });
  }
};

// Get category by slug
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy danh mục'
      });
    }

    // Get products in this category
    const products = await Product.find({ category: category._id })
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      data: {
        category,
        products
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin danh mục theo slug:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ',
      message: error.message
    });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, slug } = req.body;

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Danh mục với tên này đã tồn tại'
      });
    }

    // Create category
    const category = await Category.create({
      name,
      description,
      slug
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Lỗi khi tạo danh mục:', error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages,
        details: error.errors
      });
    }

    // Duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Danh mục với slug này đã tồn tại'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ',
      message: error.message
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy danh mục'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật danh mục:', error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages,
        details: error.errors
      });
    }

    // Duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Danh mục với tên hoặc slug này đã tồn tại'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ',
      message: error.message
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    // Check if there are products using this category
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Không thể xóa danh mục này vì có ${productsCount} sản phẩm đang sử dụng`
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy danh mục'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Lỗi khi xóa danh mục:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ',
      message: error.message
    });
  }
};
