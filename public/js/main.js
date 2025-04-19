/**
 * Main JavaScript file for Household Goods Store
 * Handles all client-side interactions and functionality
 */

// Utility functions
const utils = {
  // Format price with thousands separator
  formatPrice: (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  },
  
  // Show alert message
  showAlert: (message, type = 'success', container = '.alert-container', timeout = 3000) => {
    const alertContainer = document.querySelector(container);
    if (!alertContainer) return;
    
    // Clear previous alerts
    alertContainer.innerHTML = '';
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    alertContainer.appendChild(alertDiv);
    
    // Auto dismiss
    if (timeout > 0) {
      setTimeout(() => {
        const alert = new bootstrap.Alert(alertDiv);
        alert.close();
      }, timeout);
    }
  },
  
  // Handle API errors
  handleApiError: (error) => {
    console.error('API Error:', error);
    utils.showAlert('Đã xảy ra lỗi. Vui lòng thử lại sau.', 'danger');
  }
};

// Cart functions
const cart = {
  // Add product to cart
  addToCart: (productId, quantity = 1) => {
    fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId, quantity })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Update cart count
        cart.updateCartCount(data.data.totalQuantity);
        utils.showAlert('Sản phẩm đã được thêm vào giỏ hàng!', 'success');
      } else {
        utils.showAlert(data.error || 'Đã xảy ra lỗi khi thêm vào giỏ hàng.', 'danger');
      }
    })
    .catch(utils.handleApiError);
  },
  
  // Update cart item quantity
  updateCartItem: (itemId, quantity) => {
    fetch('/api/cart/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemId, quantity })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Refresh cart page if exists
        if (window.location.pathname === '/cart') {
          window.location.reload();
        } else {
          cart.updateCartCount(data.data.totalQuantity);
        }
      } else {
        utils.showAlert(data.error || 'Đã xảy ra lỗi khi cập nhật giỏ hàng.', 'danger');
      }
    })
    .catch(utils.handleApiError);
  },
  
  // Remove item from cart
  removeCartItem: (itemId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      return;
    }
    
    fetch(`/api/cart/item/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        utils.showAlert('Sản phẩm đã được xóa khỏi giỏ hàng!', 'success');
        
        // Refresh cart page
        if (window.location.pathname === '/cart') {
          window.location.reload();
        } else {
          cart.updateCartCount(data.data.totalQuantity);
        }
      } else {
        utils.showAlert(data.error || 'Đã xảy ra lỗi khi xóa sản phẩm.', 'danger');
      }
    })
    .catch(utils.handleApiError);
  },
  
  // Clear cart
  clearCart: () => {
    if (!confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
      return;
    }
    
    fetch('/api/cart/clear', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        utils.showAlert('Giỏ hàng đã được xóa!', 'success');
        
        // Refresh cart page
        if (window.location.pathname === '/cart') {
          window.location.reload();
        } else {
          cart.updateCartCount(0);
        }
      } else {
        utils.showAlert(data.error || 'Đã xảy ra lỗi khi xóa giỏ hàng.', 'danger');
      }
    })
    .catch(utils.handleApiError);
  },
  
  // Update cart count in navbar
  updateCartCount: (count) => {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = count;
    }
  },
  
  // Initialize cart page functionality
  initCartPage: () => {
    // Quantity input changes
    document.querySelectorAll('.cart-quantity input').forEach(input => {
      input.addEventListener('change', function() {
        const itemId = this.getAttribute('data-id');
        const quantity = parseInt(this.value);
        
        if (quantity > 0) {
          cart.updateCartItem(itemId, quantity);
        } else if (quantity === 0) {
          cart.removeCartItem(itemId);
        }
      });
    });
    
    // Remove buttons
    document.querySelectorAll('.cart-remove').forEach(button => {
      button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-id');
        cart.removeCartItem(itemId);
      });
    });
    
    // Clear cart button
    const clearCartButton = document.getElementById('clear-cart');
    if (clearCartButton) {
      clearCartButton.addEventListener('click', cart.clearCart);
    }
  }
};

// Product functions
const product = {
  // Initialize product details page
  initProductPage: () => {
    const addToCartForm = document.getElementById('add-to-cart-form');
    
    if (addToCartForm) {
      addToCartForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productId = this.getAttribute('data-id');
        const quantityInput = document.getElementById('product-quantity');
        const quantity = parseInt(quantityInput.value);
        
        if (productId && quantity > 0) {
          cart.addToCart(productId, quantity);
        }
      });
      
      // Quantity buttons
      const decreaseBtn = document.querySelector('.quantity-decrease');
      const increaseBtn = document.querySelector('.quantity-increase');
      const quantityInput = document.getElementById('product-quantity');
      
      if (decreaseBtn && increaseBtn && quantityInput) {
        decreaseBtn.addEventListener('click', function() {
          const currentValue = parseInt(quantityInput.value);
          if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
          }
        });
        
        increaseBtn.addEventListener('click', function() {
          const currentValue = parseInt(quantityInput.value);
          const max = parseInt(quantityInput.getAttribute('max') || 99);
          if (currentValue < max) {
            quantityInput.value = currentValue + 1;
          }
        });
      }
    }
  },
  
  // Initialize product listing page
  initProductListPage: () => {
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
      button.addEventListener('click', function() {
        const productId = this.getAttribute('data-id');
        cart.addToCart(productId, 1);
      });
    });
    
    // Filter functionality
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
      filterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Build query string from form data
        const formData = new FormData(this);
        const searchParams = new URLSearchParams(formData);
        
        // Redirect to filtered URL
        window.location.href = `/products?${searchParams.toString()}`;
      });
    }
    
    // Sort dropdown
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', function() {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('sort', this.value);
        window.location.href = currentUrl.toString();
      });
    }
  }
};

// Authentication functions
const auth = {
  // Login form submission
  initLoginForm: () => {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            utils.showAlert('Đăng nhập thành công!', 'success');
            
            // Redirect to previous page or home
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/';
            window.location.href = redirectUrl;
          } else {
            utils.showAlert(data.error || 'Đăng nhập thất bại!', 'danger');
          }
        })
        .catch(utils.handleApiError);
      });
    }
  },
  
  // Register form submission
  initRegisterForm: () => {
    const registerForm = document.getElementById('register-form');
    
    if (registerForm) {
      registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const userData = {
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          password: formData.get('password'),
          phoneNumber: formData.get('phoneNumber'),
          address: {
            street: formData.get('street'),
            ward: formData.get('ward'),
            district: formData.get('district'),
            city: formData.get('city')
          }
        };
        
        // Check password confirmation
        if (formData.get('password') !== formData.get('confirmPassword')) {
          utils.showAlert('Mật khẩu xác nhận không khớp!', 'danger');
          return;
        }
        
        fetch('/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            utils.showAlert('Đăng ký thành công!', 'success');
            
            // Redirect to login page
            setTimeout(() => {
              window.location.href = '/login';
            }, 1500);
          } else {
            utils.showAlert(Array.isArray(data.error) ? data.error[0] : data.error, 'danger');
          }
        })
        .catch(utils.handleApiError);
      });
    }
  },
  
  // Logout functionality
  initLogout: () => {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        fetch('/api/users/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(res => {
          if (res.ok) {
            window.location.href = '/';
          } else {
            utils.showAlert('Đã xảy ra lỗi khi đăng xuất.', 'danger');
          }
        })
        .catch(utils.handleApiError);
      });
    }
  }
};

// Checkout functions
const checkout = {
  // Initialize checkout page
  initCheckoutPage: () => {
    const checkoutForm = document.getElementById('checkout-form');
    
    if (checkoutForm) {
      // Copy user address data
      const useProfileAddressCheckbox = document.getElementById('use-profile-address');
      
      if (useProfileAddressCheckbox) {
        useProfileAddressCheckbox.addEventListener('change', function() {
          if (this.checked) {
            // Get user data from data attributes
            const addressData = this.dataset;
            
            document.getElementById('fullName').value = addressData.fullName || '';
            document.getElementById('phoneNumber').value = addressData.phone || '';
            document.getElementById('street').value = addressData.street || '';
            document.getElementById('ward').value = addressData.ward || '';
            document.getElementById('district').value = addressData.district || '';
            document.getElementById('city').value = addressData.city || '';
          }
        });
      }
      
      // Payment method selection
      const paymentMethods = document.querySelectorAll('.payment-method');
      
      if (paymentMethods.length > 0) {
        paymentMethods.forEach(method => {
          method.addEventListener('click', function() {
            // Remove active class from all
            paymentMethods.forEach(m => m.classList.remove('active'));
            
            // Add active class to selected
            this.classList.add('active');
            
            // Set hidden input value
            document.getElementById('payment-method').value = this.dataset.method;
          });
        });
      }
      
      // Form submission
      checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const orderData = {
          shippingAddress: {
            fullName: formData.get('fullName'),
            phoneNumber: formData.get('phoneNumber'),
            street: formData.get('street'),
            ward: formData.get('ward'),
            district: formData.get('district'),
            city: formData.get('city')
          },
          paymentMethod: formData.get('paymentMethod')
        };
        
        fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            utils.showAlert('Đặt hàng thành công!', 'success');
            
            // Redirect to order confirmation page
            setTimeout(() => {
              window.location.href = `/orders/${data.data._id}`;
            }, 1500);
          } else {
            utils.showAlert(data.error || 'Đã xảy ra lỗi khi đặt hàng.', 'danger');
          }
        })
        .catch(utils.handleApiError);
      });
    }
  }
};

// Profile functions
const profile = {
  // Initialize profile page
  initProfilePage: () => {
    const profileForm = document.getElementById('profile-form');
    
    if (profileForm) {
      profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const userData = {
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          phoneNumber: formData.get('phoneNumber'),
          address: {
            street: formData.get('street'),
            ward: formData.get('ward'),
            district: formData.get('district'),
            city: formData.get('city')
          }
        };
        
        // Add password if provided
        const password = formData.get('password');
        if (password) {
          // Check password confirmation
          if (password !== formData.get('confirmPassword')) {
            utils.showAlert('Mật khẩu xác nhận không khớp!', 'danger');
            return;
          }
          
          userData.password = password;
        }
        
        fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            utils.showAlert('Cập nhật thông tin thành công!', 'success');
            
            // Clear password fields
            document.getElementById('password').value = '';
            document.getElementById('confirmPassword').value = '';
          } else {
            utils.showAlert(Array.isArray(data.error) ? data.error[0] : data.error, 'danger');
          }
        })
        .catch(utils.handleApiError);
      });
    }
    
    // Order cancellation
    document.querySelectorAll('.cancel-order-btn').forEach(button => {
      button.addEventListener('click', function() {
        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
          return;
        }
        
        const orderId = this.getAttribute('data-id');
        
        fetch(`/api/checkout/orders/${orderId}/cancel`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            utils.showAlert('Đơn hàng đã được hủy thành công!', 'success');
            
            // Reload page
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            utils.showAlert(data.error || 'Đã xảy ra lỗi khi hủy đơn hàng.', 'danger');
          }
        })
        .catch(utils.handleApiError);
      });
    });
  }
};

// Admin functions
const admin = {
  // Initialize admin product management
  initProductManagement: () => {
    // Product form submission
    const productForm = document.getElementById('product-form');
    
    if (productForm) {
      productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const productData = {
          name: formData.get('name'),
          description: formData.get('description'),
          price: parseFloat(formData.get('price')),
          quantity: parseInt(formData.get('quantity')),
          category: formData.get('category'),
          featured: formData.get('featured') === 'on'
        };
        
        // Check if editing or creating
        const productId = formData.get('productId');
        const method = productId ? 'PUT' : 'POST';
        const url = productId ? `/api/products/${productId}` : '/api/products';
        
        fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            utils.showAlert(`Sản phẩm đã được ${productId ? 'cập nhật' : 'tạo'} thành công!`, 'success');
            
            // Redirect to products list
            setTimeout(() => {
              window.location.href = '/admin/products';
            }, 1500);
          } else {
            utils.showAlert(Array.isArray(data.error) ? data.error[0] : data.error, 'danger');
          }
        })
        .catch(utils.handleApiError);
      });
    }
    
    // Delete product buttons
    document.querySelectorAll('.delete-product-btn').forEach(button => {
      button.addEventListener('click', function() {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
          return;
        }
        
        const productId = this.getAttribute('data-id');
        
        fetch(`/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            utils.showAlert('Sản phẩm đã được xóa thành công!', 'success');
            
            // Remove product from list
            const productRow = document.getElementById(`product-${productId}`);
            if (productRow) {
              productRow.remove();
            }
          } else {
            utils.showAlert(data.error || 'Đã xảy ra lỗi khi xóa sản phẩm.', 'danger');
          }
        })
        .catch(utils.handleApiError);
      });
    });
  },
  
  // Initialize admin order management
  initOrderManagement: () => {
    // Update order status
    document.querySelectorAll('.update-order-status').forEach(select => {
      select.addEventListener('change', function() {
        const orderId = this.getAttribute('data-id');
        const status = this.value;
        
        fetch(`/api/checkout/admin/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ orderStatus: status })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            utils.showAlert('Trạng thái đơn hàng đã được cập nhật!', 'success');
          } else {
            utils.showAlert(data.error || 'Đã xảy ra lỗi khi cập nhật trạng thái.', 'danger');
            // Reset to previous value
            this.value = this.getAttribute('data-original');
          }
        })
        .catch(err => {
          utils.handleApiError(err);
          // Reset to previous value
          this.value = this.getAttribute('data-original');
        });
      });
    });
    
    // Update payment status
    document.querySelectorAll('.update-payment-status').forEach(select => {
      select.addEventListener('change', function() {
        const orderId = this.getAttribute('data-id');
        const status = this.value;
        
        fetch(`/api/checkout/admin/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ paymentStatus: status })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            utils.showAlert('Trạng thái thanh toán đã được cập nhật!', 'success');
          } else {
            utils.showAlert(data.error || 'Đã xảy ra lỗi khi cập nhật trạng thái.', 'danger');
            // Reset to previous value
            this.value = this.getAttribute('data-original');
          }
        })
        .catch(err => {
          utils.handleApiError(err);
          // Reset to previous value
          this.value = this.getAttribute('data-original');
        });
      });
    });
  }
};

// Initialize all necessary functionality based on page
document.addEventListener('DOMContentLoaded', function() {
  // Initialize auth functionality
  auth.initLogout();
  
  if (window.location.pathname === '/login') {
    auth.initLoginForm();
  } else if (window.location.pathname === '/register') {
    auth.initRegisterForm();
  } else if (window.location.pathname === '/cart') {
    cart.initCartPage();
  } else if (window.location.pathname.startsWith('/products/')) {
    product.initProductPage();
  } else if (window.location.pathname === '/products') {
    product.initProductListPage();
  } else if (window.location.pathname === '/checkout') {
    checkout.initCheckoutPage();
  } else if (window.location.pathname === '/profile' || window.location.pathname === '/orders') {
    profile.initProfilePage();
  } else if (window.location.pathname === '/admin/products' || window.location.pathname === '/admin/products/edit') {
    admin.initProductManagement();
  } else if (window.location.pathname === '/admin/orders') {
    admin.initOrderManagement();
  }
  
  // Load cart count for authenticated users
  if (document.getElementById('cart-count')) {
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          cart.updateCartCount(data.data.totalQuantity);
        }
      })
      .catch(err => console.error('Error loading cart count:', err));
  }
});
