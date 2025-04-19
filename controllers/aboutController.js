const About = require('../models/About');

// Dữ liệu mặc định khi không có dữ liệu trong database
const defaultAboutData = {
  title: 'Household Goods Store - Đồ dùng gia đình chất lượng cao',
  description: 'Chúng tôi là cửa hàng chuyên cung cấp các sản phẩm đồ dùng gia đình chất lượng cao, đa dạng mẫu mã với giá cả hợp lý. Sứ mệnh của chúng tôi là mang đến những sản phẩm tiện ích, an toàn và thân thiện với môi trường cho mọi gia đình Việt.',
  image: '/images/banner-about.jpg',
  links: ['https://web.facebook.com/oantuan.83755/']
};

// Get About data
exports.getAboutData = async (req, res) => {
  try {
    // Thông tin mặc định sẽ được trả về nếu không tìm thấy dữ liệu
    return defaultAboutData;
  } catch (error) {
    console.error('Error fetching about data:', error);
    // Trả về dữ liệu mặc định trong trường hợp có lỗi
    return defaultAboutData;
  }
};

// Admin: Create or update About data (for future use)
exports.updateAboutData = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      image, 
      links
    } = req.body;

    // Check if about data already exists
    let aboutData = await About.findOne();

    if (aboutData) {
      // Update existing data
      aboutData.title = title || aboutData.title;
      aboutData.description = description || aboutData.description;
      aboutData.image = image || aboutData.image;
      
      if (links && Array.isArray(links)) {
        aboutData.links = links;
      }
      
      aboutData.updatedAt = new Date();
      await aboutData.save();
    } else {
      // Create new data
      aboutData = await About.create({
        title,
        description,
        image,
        links: links || [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: aboutData
    });
  } catch (error) {
    console.error('Error updating about data:', error);
    res.status(500).json({
      success: false,
      error: 'Có lỗi xảy ra khi cập nhật thông tin About'
    });
  }
};
