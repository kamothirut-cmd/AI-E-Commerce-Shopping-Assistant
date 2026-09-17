# NovaMart REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register New User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "name": "Alex Johnson",
    "email": "user@example.com",
    "password": "user123"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "Registration successful",
    "user": {
      "user_id": 2,
      "name": "Alex Johnson",
      "email": "user@example.com",
      "role": "user",
      "created_at": "2026-09-14 18:00:00"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
  ```

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "user123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Login successful",
    "user": {
      "user_id": 2,
      "name": "Alex Johnson",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
  ```

### 1.3 Get Current Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: Bearer Token required
- **Success Response (200 OK)**:
  ```json
  {
    "user": {
      "user_id": 2,
      "name": "Alex Johnson",
      "email": "user@example.com",
      "role": "user",
      "created_at": "2026-09-14 18:00:00"
    }
  }
  ```

---

## 2. Product Catalog Endpoints (`/api/products`)

### 2.1 Get Products (Catalog & Search)
- **Method**: `GET`
- **Path**: `/api/products`
- **Query Parameters**:
  - `search`: Keyword for product name or description
  - `category`: Category ID or slug
  - `minPrice`: Minimum price filter
  - `maxPrice`: Maximum price filter
  - `inStock`: `'true'` to only return products with stock > 0
  - `sort`: `'price-asc'`, `'price-desc'`, `'rating-desc'`, or `'newest'`
- **Success Response (200 OK)**:
  ```json
  [
    {
      "product_id": 1,
      "name": "TitanBook Pro 16\" M3 Max",
      "category_id": 1,
      "category_name": "Laptops & Computers",
      "description": "Ultra-thin creator laptop with 3.5K OLED 120Hz display...",
      "price": 1899.99,
      "stock": 15,
      "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8...",
      "rating": 4.9,
      "created_at": "2026-09-14 18:00:00"
    }
  ]
  ```

### 2.2 Get Product Details
- **Method**: `GET`
- **Path**: `/api/products/:id`
- **Auth**: Public

### 2.3 Create Product (Admin Only)
- **Method**: `POST`
- **Path**: `/api/products`
- **Auth**: Bearer Token with `role: "admin"`
- **Request Body**:
  ```json
  {
    "name": "Wireless Pro Mouse",
    "category_id": 4,
    "description": "Ergonomic precision mouse",
    "price": 79.99,
    "stock": 25,
    "image_url": "https://images.unsplash.com/...",
    "rating": 4.8
  }
  ```

### 2.4 Update Product (Admin Only)
- **Method**: `PUT`
- **Path**: `/api/products/:id`
- **Auth**: Bearer Token with `role: "admin"`

### 2.5 Delete Product (Admin Only)
- **Method**: `DELETE`
- **Path**: `/api/products/:id`
- **Auth**: Bearer Token with `role: "admin"`

---

## 3. Category Endpoints (`/api/categories`)

### 3.1 Get Categories
- **Method**: `GET`
- **Path**: `/api/categories`
- **Success Response (200 OK)**:
  ```json
  [
    {
      "category_id": 1,
      "name": "Laptops & Computers",
      "slug": "laptops-computers",
      "description": "High-performance laptops...",
      "product_count": 3
    }
  ]
  ```

### 3.2 Create Category (Admin Only)
- **Method**: `POST`
- **Path**: `/api/categories`
- **Auth**: Bearer Token with `role: "admin"`

### 3.3 Update / Delete Category (Admin Only)
- **Method**: `PUT` / `DELETE`
- **Path**: `/api/categories/:id`
- **Auth**: Bearer Token with `role: "admin"`

---

## 4. Shopping Cart Endpoints (`/api/cart`)

*All Cart endpoints require a valid user Bearer Token.*

### 4.1 Get User Cart
- **Method**: `GET`
- **Path**: `/api/cart`
- **Success Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "cart_id": 1,
        "product_id": 2,
        "name": "Zenith Aero 14 Ultrabook",
        "price": 999.00,
        "quantity": 1,
        "stock": 22,
        "image_url": "https://images.unsplash.com/...",
        "item_total": 999.00
      }
    ],
    "totalItems": 1,
    "subtotal": 999.00
  }
  ```

### 4.2 Add to Cart
- **Method**: `POST`
- **Path**: `/api/cart`
- **Request Body**:
  ```json
  {
    "product_id": 2,
    "quantity": 1
  }
  ```

### 4.3 Update Cart Quantity
- **Method**: `PUT`
- **Path**: `/api/cart/:productId`
- **Request Body**:
  ```json
  {
    "quantity": 2
  }
  ```

### 4.4 Remove Item from Cart
- **Method**: `DELETE`
- **Path**: `/api/cart/:productId`

### 4.5 Clear Cart
- **Method**: `DELETE`
- **Path**: `/api/cart`

---

## 5. Orders Endpoints (`/api/orders`)

*All Order endpoints require a valid Bearer Token.*

### 5.1 Place Order
- **Method**: `POST`
- **Path**: `/api/orders`
- **Description**: Validates that all cart items have sufficient stock, inserts the order and order items, decrements product inventory, and clears user cart.
- **Request Body**:
  ```json
  {
    "shipping_address": "742 Evergreen Terrace, Springfield, OR 97477",
    "payment_method": "Credit Card"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "Order placed successfully!",
    "order": {
      "order_id": 2,
      "user_id": 2,
      "total_amount": 999.00,
      "shipping_address": "742 Evergreen Terrace...",
      "status": "Pending",
      "created_at": "2026-09-14 18:30:00",
      "items": [
        {
          "item_id": 2,
          "product_id": 2,
          "name": "Zenith Aero 14 Ultrabook",
          "quantity": 1,
          "price": 999.00
        }
      ]
    }
  }
  ```

### 5.2 Get User Orders History
- **Method**: `GET`
- **Path**: `/api/orders/my-orders`
- **Description**: Returns all orders placed by the currently logged-in user with item details and tracking status.

### 5.3 Get All Orders (Admin Only)
- **Method**: `GET`
- **Path**: `/api/orders`
- **Auth**: Bearer Token with `role: "admin"`

### 5.4 Update Order Status (Admin Only)
- **Method**: `PUT`
- **Path**: `/api/orders/:id/status`
- **Auth**: Bearer Token with `role: "admin"`
- **Request Body**:
  ```json
  {
    "status": "Shipped"
  }
  ```
  *(Valid statuses: `'Pending'`, `'Processing'`, `'Shipped'`, `'Delivered'`, `'Cancelled'`)*

---

## 6. AI Shopping Assistant Endpoints (`/api/ai`)

### 6.1 Conversational Catalog Recommendations
- **Method**: `POST`
- **Path**: `/api/ai/chat`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "message": "Find me a gaming laptop with high performance under $1500"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "reply": "I've analyzed our catalog for you! Based on your request (\"Find me a gaming laptop with high performance under $1500\"), here are my top recommended picks: Each selection is tailored to match your budget target of under $1500.",
    "recommendations": [
      {
        "product_id": 3,
        "name": "Apex Predator 15 Gaming Laptop",
        "price": 1450.00,
        "stock": 8,
        "rating": 4.8,
        "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302...",
        "category_name": "Laptops & Computers",
        "reason": "High precision build designed for responsiveness, durability, and comfort."
      }
    ]
  }
  ```
