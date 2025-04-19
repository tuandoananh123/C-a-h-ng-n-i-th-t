const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, admin } = require('../middlewares/authMiddleware');
router.get('/search', productController.searchProduct);

// Public routes
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:id', productController.getProductById);

// Admin routes - protected
router.post('/', protect, admin, productController.createProduct);
router.put('/:id', protect, admin, productController.updateProduct);
router.delete('/:id', protect, admin, productController.deleteProduct);
// API để lọc sản phẩm theo danh mục
router.get('/products', async (req, res) => {
    try {
        const categoryName = req.query.category;
        if (!categoryName) {
            return res.status(400).json({ message: 'Vui lòng cung cấp danh mục' });
        }

        // Tìm danh mục theo tên
        const category = await Category.findOne({ name: { $regex: new RegExp(categoryName, 'i') } });
        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        // Lọc sản phẩm theo ObjectId của danh mục
        const products = await Product.find({ category: category._id }).populate('category');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// API Tìm kiếm sản phẩm
router.get('/products', async (req, res) => {
    try {
        const { search, minPrice, maxPrice } = req.query;

        // Tạo điều kiện tìm kiếm
        const query = {};

        // Tìm kiếm theo tên
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Tìm kiếm theo khoảng giá
        if (minPrice && maxPrice) {
            query.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
        }

        const products = await Product.find(query);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get('/', async (req, res) => {
    const searchTerm = req.query.search;

    try {
        const products = searchTerm
            ? await Product.find({ name: new RegExp(searchTerm, 'i') })
            : await Product.find();

        res.json(products); // Trả về kết quả dưới dạng JSON
    } catch (error) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi khi tìm kiếm sản phẩm' });
    }
});

module.exports = router;
