const Product = require('../models/Product');
const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

exports.getProducts = async (req, res) => {
  const query = {};
  const { search, minPrice, maxPrice, category, sort } = req.query;

  // Tìm kiếm theo tên
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  // Lọc theo giá
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Lọc theo danh mục
  if (category) {
    query.category = Array.isArray(category) ? { $in: category } : category;
  }

  // Sắp xếp
  let sortOption = {};
  switch (sort) {
    case 'price-asc':
      sortOption.price = 1;
      break;
    case 'price-desc':
      sortOption.price = -1;
      break;
    case 'name-asc':
      sortOption.name = 1;
      break;
    case 'name-desc':
      sortOption.name = -1;
      break;
    default:
      sortOption.createdAt = -1;
  }

  const products = await Product.find(query).sort(sortOption);
  app.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1; // Mặc định là trang 1
    const category = req.query.category || 'all'; // Lấy danh mục từ query string, mặc định là 'all'
    const pageSize = 10; // Số mục mỗi trang
    const totalItems = getTotalItemsForCategory(category); // Lấy tổng số sản phẩm trong danh mục
    const totalPages = Math.ceil(totalItems / pageSize); // Tính tổng số trang

    // Lấy các mục cho trang hiện tại và danh mục
    const items = getItemsForPageAndCategory(page, category, pageSize); // Thay thế hàm này với dữ liệu thực tế

    // Trả về view với dữ liệu cần thiết
    res.render('products', {
      items,
      totalPages,
      currentPage: page,
      category, // Truyền danh mục vào view
      query: req.query // Truyền tất cả query vào view
    });
  });


};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    // Tìm danh mục theo slug
    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
    }

    // Lấy sản phẩm thuộc danh mục này
    const products = await Product.find({ category: category._id }).populate('category');

    res.render('products', { products, category });
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo danh mục:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  const { search, minPrice, maxPrice, category, sort, page = 1 } = req.query;
  const limit = 9;
  const skip = (page - 1) * limit;

  let query = {};

  // Xử lý tìm kiếm theo tên sản phẩm
  if (search) {
    query.name = { $regex: search, $options: 'i' }; // Không phân biệt hoa thường
  }

  // Xử lý lọc theo giá
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Lọc theo danh mục
  if (category) {
    query.category = Array.isArray(category) ? { $in: category } : category;
  }

  // Xử lý sắp xếp
  let sortOption = {};
  if (sort === 'price-asc') sortOption.price = 1;
  if (sort === 'price-desc') sortOption.price = -1;
  if (sort === 'name-asc') sortOption.name = 1;
  if (sort === 'name-desc') sortOption.name = -1;
  if (sort === 'newest') sortOption.createdAt = -1;

  const products = await Product.find(query).sort(sortOption).skip(skip).limit(limit);
  const totalProducts = await Product.countDocuments(query);

  res.render('product', {
    products,
    currentPage: Number(page),
    totalPages: Math.ceil(totalProducts / limit),
    query,
    paginationUrl: `search=${search || ''}&minPrice=${minPrice || ''}&maxPrice=${maxPrice || ''}&category=${category || ''}&sort=${sort || ''}`
  });
};

// helpers/queryHelper.js
const buildQuery = (req) => {
  const { search, minPrice, maxPrice, category } = req.query;
  const query = {};

  if (search) query.name = { $regex: search, $options: 'i' };
  if (minPrice && maxPrice) query.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
  if (category) query.category = category;

  return query;
};

// controllers/productController.js
exports.searchProduct = async (req, res) => {
  try {
    const query = buildQuery(req);
    const products = await Product.find(query).populate('category', 'name');

    if (!products.length) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm nào.' });
    }

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const categoryId = req.query.category;
    const search = req.query.search;
    let query = {};

    // Add category filter if provided
    if (categoryId && categoryId !== 'all') {
      query.category = categoryId;
    }

    // Add search filter if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ',
      message: error.message
    });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await Product.find({ featured: true })
      .populate('category', 'name slug')
      .limit(6);

    res.status(200).json({
      success: true,
      count: featuredProducts.length,
      data: featuredProducts
    });
  } catch (error) {
    console.error('Error getting featured products:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ',
      message: error.message
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('reviews.user');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Lấy 4 sản phẩm liên quan cùng danh mục
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id }
    })
      .limit(4)
      .populate('category');

    res.render('product-detail', {
      product,
      relatedProducts,
      title: product.name
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const { name, description, price, stock, category, colors } = req.body;
    const featured = req.body.featured ? true : false;

    // Xử lý danh sách màu sắc
    const colorList = colors ? colors.split(',').map(color => color.trim()) : [];

    // Xử lý tải lên nhiều hình ảnh
    let images = [];

    // Kiểm tra thư mục images trong public
    const imagesDir = path.join(__dirname, '../public/images');

    // Đảm bảo thư mục images tồn tại
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
      console.log('Created images directory:', imagesDir);
    }

    if (req.files && req.files.images) {
      console.log('Processing image uploads...');
      // Chuyển đổi thành mảng nếu chỉ có 1 file
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

      console.log(`Found ${imageFiles.length} image files to upload`);

      // Xử lý từng file ảnh
      for (const file of imageFiles) {
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const uploadPath = path.join(imagesDir, fileName);

        console.log(`Moving file to: ${uploadPath}`);
        await file.mv(uploadPath);

        // Lưu đường dẫn tương đối cho images - QUAN TRỌNG: sử dụng /images/ thay vì /uploads/
        images.push(`/images/${fileName}`);
      }

      console.log('Uploaded images:', images);
    } else {
      console.log('No image files found in request');
    }

    // Sử dụng ảnh mặc định nếu không có ảnh được tải lên
    if (images.length === 0) {
      images = ['/images/default-product.jpg'];
      console.log('Using default product image');
    }

    // Tạo sản phẩm mới
    const newProduct = new Product({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      colors: colorList,
      images,
      featured
    });

    const savedProduct = await newProduct.save();
    console.log(`Đã thêm sản phẩm mới: ${name} với ${images.length} ảnh, ID: ${savedProduct._id}`);

    res.redirect('/admin/products?success=Đã thêm sản phẩm mới thành công');
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).render('error', {
      title: 'Lỗi',
      message: 'Có lỗi xảy ra khi thêm sản phẩm mới',
      error,
      user: req.session.user || null
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id, name, description, price, stock, category, colors } = req.body;
    const featured = req.body.featured ? true : false;

    // Tìm sản phẩm cần cập nhật
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).render('error', {
        title: 'Lỗi',
        message: 'Không tìm thấy sản phẩm',
        error: { status: 404 },
        user: req.session.user || null
      });
    }

    // Cập nhật thông tin sản phẩm
    product.name = name;
    product.description = description;
    product.price = parseFloat(price);
    product.stock = parseInt(stock);
    product.category = category;
    product.featured = featured;

    // Xử lý danh sách màu sắc
    if (colors) {
      product.colors = colors.split(',').map(color => color.trim());
    }

    // Xử lý tải lên hình ảnh mới (nếu có)
    if (req.files && req.files.images) {
      // Chuyển đổi thành mảng nếu chỉ có 1 file
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

      // Xử lý từng file ảnh
      let newImages = [];

      // Kiểm tra thư mục images trong public
      const imagesDir = path.join(__dirname, '../public/images');

      // Đảm bảo thư mục images tồn tại
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
        console.log('Created images directory:', imagesDir);
      }

      for (const file of imageFiles) {
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const uploadPath = path.join(imagesDir, fileName);

        await file.mv(uploadPath);
        newImages.push(`/images/${fileName}`);
      }

      // Chỉ cập nhật ảnh nếu có ảnh mới được tải lên
      if (newImages.length > 0) {
        product.images = newImages;
      }
    }

    await product.save();

    console.log(`Đã cập nhật sản phẩm: ${name}`);

    res.redirect('/admin/products?success=Đã cập nhật sản phẩm thành công');
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).render('error', {
      title: 'Lỗi',
      message: 'Có lỗi xảy ra khi cập nhật sản phẩm',
      error,
      user: req.session.user || null
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.body;

    // Tìm và xóa sản phẩm
    await Product.findByIdAndDelete(id);

    res.redirect('/admin/products?success=Đã xóa sản phẩm thành công');
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).render('error', {
      message: 'Có lỗi xảy ra khi xóa sản phẩm',
      error
    });
  }
};

// Admin: Hiển thị trang quản lý sản phẩm
exports.getAdminProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Đếm tổng số sản phẩm
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    // Lấy danh sách sản phẩm phân trang
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Lấy danh sách danh mục
    const categories = await Category.find().distinct('name');

    res.render('admin/products', {
      title: 'Quản Trị - Quản Lý Sản Phẩm',
      products,
      categories,
      currentPage: page,
      totalPages,
      message: req.query.success ? { type: 'success', text: req.query.success } : undefined,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).render('error', {
      message: 'Có lỗi xảy ra khi tải trang quản lý sản phẩm',
      error
    });
  }
};
