# Household Goods Store

A full-featured online store for household goods with user authentication, product management, shopping cart functionality, and checkout process.

## Features

- User registration and authentication
- Product browsing and filtering by category
- Shopping cart functionality
- Checkout and order management
- Responsive design for all devices
- Admin dashboard for product and order management

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Bootstrap, EJS templating
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT, bcrypt

## Setup Instructions

1. **Install dependencies**

```bash
npm install
```

2. **Environment Variables**

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/household-goods-store
SESSION_SECRET=household-goods-secret-key
JWT_SECRET=household-goods-jwt-secret
```

3. **Start MongoDB**

Make sure MongoDB is installed and running on your system. If not installed, download and install from [MongoDB website](https://www.mongodb.com/try/download/community).

4. **Run the application**

```bash
npm start
```

5. **Access the application**

Open your browser and navigate to `http://localhost:3000`

## Project Structure

- **config/**: Database and application configuration
- **controllers/**: Business logic for routes
- **middlewares/**: Custom middleware functions
- **models/**: MongoDB schemas and models
- **public/**: Static assets (CSS, JS, images)
- **routes/**: API and page routes
- **views/**: EJS templates for rendering pages
- **server.js**: Main application entry point

## API Endpoints

### User

- `POST /api/users/register`: Register a new user
- `POST /api/users/login`: User login
- `POST /api/users/logout`: User logout
- `GET /api/users/profile`: Get user profile
- `PUT /api/users/profile`: Update user profile

### Products

- `GET /api/products`: Get all products
- `GET /api/products/:id`: Get product by ID
- `GET /api/products/featured`: Get featured products
- `POST /api/products`: Create a new product (admin only)
- `PUT /api/products/:id`: Update product (admin only)
- `DELETE /api/products/:id`: Delete product (admin only)

### Cart

- `GET /api/cart`: Get user's cart
- `POST /api/cart/add`: Add item to cart
- `PUT /api/cart/update`: Update cart item quantity
- `DELETE /api/cart/item/:id`: Remove item from cart
- `DELETE /api/cart/clear`: Clear the cart

### Checkout

- `POST /api/checkout`: Create a new order
- `GET /api/checkout/orders`: Get user's orders
- `GET /api/checkout/orders/:id`: Get order details
- `PUT /api/checkout/orders/:id/cancel`: Cancel an order

## Admin Routes

- `/admin/products`: Manage products
- `/admin/orders`: Manage orders
