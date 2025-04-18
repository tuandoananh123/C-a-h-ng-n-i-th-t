const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get cart for a user
exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    let cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name price stock images category');
    
    if (!cart) {
      // Create empty cart if not exists
      cart = await Cart.create({
        user: userId,
        items: [],
        totalQuantity: 0,
        totalAmount: 0
      });
    } else {
      // Kiểm tra và loại bỏ triệt để các sản phẩm trùng lặp
      const uniqueProducts = new Map();
      
      // Đảm bảo mỗi sản phẩm chỉ xuất hiện một lần trong giỏ hàng
      const validItems = [];
      
      for (const item of cart.items) {
        // Bỏ qua các mục không hợp lệ
        if (!item.product || !item.product._id) continue;
        
        const productId = item.product._id.toString();
        
        if (!uniqueProducts.has(productId)) {
          uniqueProducts.set(productId, item);
          validItems.push(item);
        }
      }
      
      // Cập nhật lại giỏ hàng chỉ với các sản phẩm không trùng lặp
      if (cart.items.length !== validItems.length) {
        cart.items = validItems;
        
        // Tính toán lại tổng số lượng và tổng tiền
        cart.calculateTotals();
        await cart.save();
      }
    }
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ'
    });
  }
};

// Add item to cart
exports.addItemToCart = async (req, res) => {
  try {
    const { productId, quantity, color } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp ID sản phẩm và số lượng hợp lệ'
      });
    }
    
    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Check product stock
    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Sản phẩm không đủ số lượng trong kho'
      });
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [],
        totalQuantity: 0,
        totalAmount: 0
      });
    }
    
    // Loại bỏ sản phẩm này khỏi giỏ hàng nếu đã tồn tại (thay vì cập nhật)
    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    
    // Thêm sản phẩm mới vào giỏ hàng
    const selectedColor = color || 'Mặc định';
    
    cart.items.push({
      product: productId,
      quantity: quantity,
      color: selectedColor,
      price: product.price,
      totalPrice: quantity * product.price
    });
    
    // Calculate totals and save
    cart.calculateTotals();
    await cart.save();
    
    // Return cart with populated products
    cart = await Cart.findById(cart._id).populate('items.product');
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ'
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!itemId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp ID sản phẩm trong giỏ hàng và số lượng'
      });
    }
    
    // Find cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy giỏ hàng'
      });
    }
    
    // Find item in cart
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }
    
    // Get product to check stock
    const productId = cart.items[itemIndex].product;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Check if quantity is 0 (remove item)
    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      // Check product stock
      if (product.quantity < quantity) {
        return res.status(400).json({
          success: false,
          error: 'Sản phẩm không đủ số lượng trong kho'
        });
      }
      
      // Lấy thông tin item hiện tại
      const currentItem = cart.items[itemIndex];
      const currentProductId = currentItem.product.toString();
      
      // Tạo mảng mới chứa các item không trùng với sản phẩm hiện tại
      const uniqueItems = cart.items.filter((item, index) => 
        index === itemIndex || item.product.toString() !== currentProductId
      );
      
      // Cập nhật lại giỏ hàng với các item không trùng lặp
      cart.items = uniqueItems;
      
      // Cập nhật số lượng và giá của item hiện tại
      cart.items[cart.items.findIndex(item => item._id.toString() === itemId)].quantity = quantity;
      cart.items[cart.items.findIndex(item => item._id.toString() === itemId)].totalPrice = quantity * currentItem.price;
    }
    
    // Calculate totals and save
    cart.calculateTotals();
    await cart.save();
    
    // Return cart with populated products
    cart = await Cart.findById(cart._id).populate('items.product');
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ'
    });
  }
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;
    
    // Find cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy giỏ hàng'
      });
    }
    
    // Find item in cart
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }
    
    // Remove item
    cart.items.splice(itemIndex, 1);
    
    // Calculate totals and save
    cart.calculateTotals();
    await cart.save();
    
    // Return cart with populated products
    cart = await Cart.findById(cart._id).populate('items.product');
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ'
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy giỏ hàng'
      });
    }
    
    // Clear items
    cart.items = [];
    cart.totalQuantity = 0;
    cart.totalAmount = 0;
    
    await cart.save();
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ'
    });
  }
};
