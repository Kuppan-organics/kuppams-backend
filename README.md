# Kuppams Organic E-commerce Backend

A comprehensive Node.js/Express/MongoDB backend for an organic products e-commerce platform.

## Features

- **Authentication**: Register, Login, Profile management
- **Products**: Full CRUD operations with categories, pricing, and discounts
- **Cart**: Shopping cart management
- **Orders**: Order creation and management
- **Admin Panel**: Admin-only product management
- **API Documentation**: Swagger/OpenAPI documentation for Orval integration

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Swagger/OpenAPI

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string and JWT secret.

4. Run the server:
```bash
npm run dev
```

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/api-docs`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Cart
- `GET /api/cart` - Get user's cart (protected)
- `POST /api/cart` - Add item to cart (protected)
- `PUT /api/cart/:itemId` - Update cart item (protected)
- `DELETE /api/cart/:itemId` - Remove item from cart (protected)
- `DELETE /api/cart` - Clear cart (protected)

### Orders
- `GET /api/orders` - Get user's orders (protected)
- `GET /api/orders/:id` - Get single order (protected)
- `POST /api/orders` - Create order from cart (protected)

### Admin
- `GET /api/admin/products` - Get all products (admin)
- `GET /api/admin/orders` - Get all orders (admin)
- `GET /api/admin/users` - Get all users (admin)
