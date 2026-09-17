# Project Report: AI E-Commerce Shopping Assistant

**Course**: Full Stack Web Development with AI  
**Assignment**: Assignment 3 – AI E-Commerce Shopping Assistant  
**Institution**: Skill Vedanth  
**Student Name**: Kashyap  
**Date**: September 2026  

---

## 1. Introduction

Modern e-commerce has evolved beyond static product lists and keyword matching. Contemporary consumers expect personalized, conversational, and instant guidance similar to having an attentive in-store technical specialist. This project, **NovaMart**, is a full-stack, AI-enhanced e-commerce application designed to deliver an end-to-end shopping journey. It combines catalog discovery, stock-validated cart and checkout workflows, and administrative CRUD operations with a conversational **AI Shopping Assistant** capable of interpreting natural language user requirements and grounding its recommendations in active store inventory.

---

## 2. Project Objectives

1. **Robust E-Commerce Core**: Implement user registration, JWT authentication, role-based authorization, catalog filtering, cart management, and multi-step checkout.
2. **Context-Aware AI Recommendation**: Integrate a conversational AI advisor that understands budget constraints, tech specifications, and intended use cases, returning actionable recommendation cards.
3. **Inventory Integrity & Real-Time Stock Validation**: Enforce stock limits during cart addition, checkout transactions, and automatic stock decrementing upon order placement.
4. **Order Status Lifecycle Tracking**: Provide customers with an interactive visual fulfillment progress stepper (`Pending` ➔ `Processing` ➔ `Shipped` ➔ `Delivered`).
5. **Administrative Management Portal**: Empower store administrators to execute full CRUD operations on products and categories while managing customer order statuses.
6. **Zero-Friction Portability**: Utilize SQLite with an automated schema initializer and realistic tech catalog seeder, guaranteeing 100% immediate functionality upon evaluation.

---

## 3. System Requirements & Specifications

### 3.1 Functional Requirements
- **User Authentication**: Secure registration and login using JWT tokens and bcrypt password hashing.
- **Product Catalog**: Multi-criteria search, category filters, max price slider, stock status badges, and sorting.
- **Shopping Cart**: Client-side drawer with quantity stepper, stock limits, and backend synchronization.
- **Checkout & Orders**: Address and payment selection, stock verification, automated stock deduction, and order history tracking.
- **AI Shopping Assistant**: Conversational chat interface, intent parsing, budget extraction, and clickable recommendation cards.
- **Admin Dashboard**: Revenue metrics, product CRUD modal, category management, and order status dropdowns.

### 3.2 Non-Functional Requirements
- **Performance**: Sub-100ms API response times for catalog queries using indexed SQLite.
- **Aesthetics & Usability**: Modern dark-mode glassmorphism design system using Google Fonts (Outfit & Plus Jakarta Sans).
- **Reliability & Fallback**: Seamless dual-mode AI engine that functions with live LLM APIs or an intelligent local catalog NLP matcher if no API key is provided.

---

## 4. System Architecture

The application follows a decoupled client-server architecture:

```
+-------------------------------------------------------------+
|                     React 19 Frontend                       |
|   (Catalog, Cart Drawer, AI Assistant Drawer, Admin Portal) |
+------------------------------+------------------------------+
                               | HTTP REST APIs / JSON
                               v
+-------------------------------------------------------------+
|                 Node.js + Express Backend                   |
|  +-------------------------------------------------------+  |
|  | Middleware: JWT Verify, Role Guard, Centralized Error |  |
|  +-------------------------------------------------------+  |
|  | Controllers: Auth, Products, Categories, Cart, Orders |  |
|  +-------------------------------------------------------+  |
|  | AI Engine: Gemini / OpenAI API + Local NLP Fallback   |  |
|  +-------------------------------------------------------+  |
+------------------------------+------------------------------+
                               | SQL Queries (sqlite3)
                               v
+-------------------------------------------------------------+
|             Relational Database (ecommerce.db)              |
|  (users, categories, products, cart, orders, order_items)   |
+-------------------------------------------------------------+
```

---

## 5. Module Descriptions

### 5.1 Authentication & Authorization Module
- Handled by `authController.js` and `authMiddleware.js`.
- Generates signed JWT tokens with 7-day expiration containing user ID, email, and role.
- Distinguishes standard `user` accounts from privileged `admin` accounts.
- Includes 1-Click Demo Login helpers for rapid assessment.

### 5.2 Product Catalog & Filter Module
- Handled by `productController.js` and `ProductFilter.jsx`.
- Supports parameterized SQL filtering across search keywords, category slugs, minimum/maximum prices, and in-stock conditions.
- Real-time stock status is visually highlighted with badges (*In Stock*, *Low Stock: ≤5 units*, *Out of Stock*).

### 5.3 Cart & Stock Validation Module
- Handled by `cartController.js` and `CartContext.jsx`.
- Enforces strict quantity boundaries matching current product stock.
- Automatically calculates subtotal, 8% sales tax, and free shipping for orders exceeding $99.

### 5.4 Order Placement & Fulfillment Module
- Handled by `orderController.js` and `OrderTimeline.jsx`.
- Executes an atomic transactional sequence upon checkout:
  1. Validates that every cart item has adequate stock.
  2. Creates the parent order record.
  3. Inserts each line item into `order_items`.
  4. Decrements `products.stock` accordingly.
  5. Clears the user's active cart.
- Visual stepper illustrates order status updates in real time.

### 5.5 AI Shopping Assistant Module
- Handled by `aiController.js` and `AiShoppingAssistant.jsx`.
- Evaluates user intent, keywords, and budget constraints (e.g. `under $1000`).
- Dynamically injects available catalog data into the prompt/context to ensure recommended items correspond to active products in the store.
- Returns conversational guidance paired with structured recommendation cards.

### 5.6 Admin Management Module
- Handled by `AdminDashboardPage.jsx`.
- Provides an executive metrics overview (Total Products, Total Revenue, Total Orders, Low Stock Alerts).
- Includes modals for creating and updating products with instant table updates.
- Enables immediate modification of order fulfillment status.

---

## 6. Database Design (Entity-Relationship)

```
+---------------+         +----------------+
|     users     | 1     * |     orders     |
+---------------+---------+----------------+
| user_id (PK)  |         | order_id (PK)  |
| name          |         | user_id (FK)   |
| email (UQ)    |         | total_amount   |
| password_hash |         | status         |
| role          |         | shipping_addr  |
+-------+-------+         +-------+--------+
        | 1                       | 1
        |                         |
        | *                       | *
+-------+-------+         +-------+--------+
|     cart      |         |  order_items   |
+---------------+         +----------------+
| cart_id (PK)  |         | item_id (PK)   |
| user_id (FK)  |         | order_id (FK)  |
| product_id(FK)|         | product_id(FK) |
| quantity      |         | quantity, price|
+-------+-------+         +-------+--------+
        | *                       | *
        +------------+------------+
                     |
                     v
             +---------------+         +----------------+
             |   products    | *     1 |   categories   |
             +---------------+---------+----------------+
             |product_id (PK)|         |category_id (PK)|
             |category_id(FK)|         |name (UQ)       |
             |name, price    |         |slug (UQ)       |
             |stock, rating  |         |description     |
             +---------------+         +----------------+
```

---

## 7. AI Integration & Recommendation Engine Workflow

The AI recommendation pipeline follows a 4-step lifecycle:
1. **Query Ingestion**: The user submits a prompt (e.g. *"Show me a high-performance laptop for coding under 1000"*).
2. **Catalog Injection**: The backend queries the current database for in-stock products with their categories, prices, ratings, and descriptions.
3. **Intent & Budget Parsing**:
   - If an external API key (`GEMINI_API_KEY` or `OPENAI_API_KEY`) is configured, the model receives a strict JSON-schema prompt requiring conversational text and an array of valid catalog IDs.
   - If no key is set or the service is unreachable, our intelligent local NLP matcher extracts budget thresholds (e.g., regex `under \$?(\d+)`), tokenizes technical keywords (`rtx`, `coding`, `anc`, `wireless`), calculates relevance scores, and ranks products.
4. **Structured Delivery**: The frontend renders the AI's explanation alongside clickable mini-cards with direct "Add to Cart" and "View Details" capabilities.

---

## 8. Testing, Validation & Verification

### 8.1 Automated API Tests
All endpoints were verified via programmatic test scripts:
- `GET /api/health` ➔ Status 200 OK
- `GET /api/products` ➔ Loaded 14 seeded products
- `POST /api/auth/login` ➔ Valid JWT issued for both admin and user
- `POST /api/ai/chat` ➔ Successfully parsed "laptop under 1000" and returned Zenith Aero 14 Ultrabook ($999.00)

### 8.2 End-to-End Browser Testing
Using automated browser subagent tooling, the entire workflow was executed and recorded:
- Catalog browsing, category filtering, and keyword search.
- AI Assistant drawer prompt execution and recommendation card interaction.
- Product details inspection and cart drawer updates.
- 1-Click Demo Login and checkout submission with confetti celebration.
- Order placement verification and visual status timeline progression.
- Admin Portal overview metrics, product table inspection, and order status update from `Pending` to `Processing`.

---

## 9. Conclusion

The **NovaMart AI E-Commerce Shopping Assistant** successfully fulfills all functional, technical, and architectural requirements outlined in the Assignment 3 brief. By coupling a production-ready Express + SQLite backend with a responsive React frontend and a catalog-grounded AI shopping assistant, the platform bridges the gap between conventional e-commerce stores and intelligent conversational commerce.
