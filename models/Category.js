const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên danh mục là bắt buộc'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Mô tả danh mục là bắt buộc']
  },
  slug: {
    type: String,
    required: [true, 'Slug danh mục là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware trước khi lưu để tạo slug nếu không được cung cấp
CategorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

// Hàm tĩnh để tìm ID danh mục từ tên
CategorySchema.statics.findIdByName = async function(name) {
  try {
    const category = await this.findOne({ name: name });
    if (category) {
      return category._id;
    }
    return null;
  } catch (error) {
    console.error('Error finding category by name:', error);
    return null;
  }
};

// Hàm tĩnh để đảm bảo category ID hợp lệ
CategorySchema.statics.ensureValidCategoryId = async function(categoryInput) {
  try {
    // Nếu đã là ObjectId hoặc string ID hợp lệ, trả về nó
    if (mongoose.Types.ObjectId.isValid(categoryInput)) {
      return categoryInput;
    }
    
    // Nếu là tên danh mục, tìm ID tương ứng
    if (typeof categoryInput === 'string') {
      const category = await this.findOne({ name: categoryInput });
      if (category) {
        return category._id;
      }
      
      // Nếu không tìm thấy, tạo danh mục mới
      const newCategory = await this.create({ 
        name: categoryInput,
        description: `Auto-generated category for ${categoryInput}`
      });
      return newCategory._id;
    }
    
    // Nếu không xử lý được, trả về ID của danh mục mặc định
    const defaultCategory = await this.findOne() || await this.create({ 
      name: 'Khác',
      description: 'Danh mục mặc định' 
    });
    return defaultCategory._id;
  } catch (error) {
    console.error('Error ensuring valid category ID:', error);
    return null;
  }
};

module.exports = mongoose.model('Category', CategorySchema);
