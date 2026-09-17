const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../ecommerce.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Promisified helpers for database operations
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Initialize schema and seed data
async function initDatabase() {
  try {
    // Enable Foreign Keys
    await db.runAsync('PRAGMA foreign_keys = ON;');

    // 1. Users Table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Categories Table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT
      );
    `);

    // 3. Products Table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER,
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        rating REAL DEFAULT 4.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
      );
    `);

    // 4. Cart Table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS cart (
        cart_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
        UNIQUE(user_id, product_id)
      );
    `);

    // 5. Orders Table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        shipping_address TEXT NOT NULL,
        payment_method TEXT DEFAULT 'Credit Card',
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `);

    // 6. OrderItems Table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS order_items (
        item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      );
    `);

    // Check if initial seeding is needed
    const userCount = await db.getAsync('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      console.log('Seeding initial data...');
      await seedData();
    }
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

async function seedData() {
  // Seed Users: Admin and standard User
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const userPasswordHash = await bcrypt.hash('user123', salt);

  await db.runAsync(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Store Admin', 'admin@example.com', adminPasswordHash, 'admin']
  );
  await db.runAsync(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Rahul Sharma', 'user@example.com', userPasswordHash, 'user']
  );

  // Seed Categories
  const categories = [
    { name: 'Laptops & Computers', slug: 'laptops-computers', description: 'High-performance laptops, ultrabooks, and workstations' },
    { name: 'Audio & Sound', slug: 'audio-sound', description: 'Noise-cancelling headphones, wireless earbuds, and speakers' },
    { name: 'Smartphones & Wearables', slug: 'smartphones-wearables', description: 'Smartwatches, fitness bands, and modern mobile accessories' },
    { name: 'Gaming & Accessories', slug: 'gaming-accessories', description: 'Mechanical keyboards, gaming mice, monitors, and gear' },
    { name: 'Smart Home & Tech', slug: 'smart-home-tech', description: 'Smart displays, intelligent lighting, and desk gadgets' }
  ];

  for (const cat of categories) {
    await db.runAsync(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [cat.name, cat.slug, cat.description]
    );
  }

  // Seed Products with Indian Rupee (INR) Pricing
  const products = [
    {
      name: 'TitanBook Pro 16" M3 Max',
      category_id: 1,
      description: 'Ultra-thin creator laptop with 3.5K OLED 120Hz display, 32GB unified RAM, 1TB NVMe SSD, and 18-hour battery life.',
      price: 189999,
      stock: 15,
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      rating: 4.9
    },
    {
      name: 'Zenith Aero 14 Ultrabook',
      category_id: 1,
      description: 'Lightweight business laptop weighing only 1.1kg. Intel Core Ultra 7, 16GB RAM, 512GB SSD, Thunderbolt 4.',
      price: 89999,
      stock: 22,
      image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
      rating: 4.7
    },
    {
      name: 'Apex Predator 15 Gaming Laptop',
      category_id: 1,
      description: 'Hardcore gaming beast with RTX 4070 GPU, AMD Ryzen 9 7945HX, 240Hz QHD display, RGB per-key keyboard.',
      price: 129999,
      stock: 8,
      image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
      rating: 4.8
    },
    {
      name: 'AcousticPulse ANC Headphones',
      category_id: 2,
      description: 'Flagship wireless over-ear headphones with adaptive noise cancellation, spatial audio, 40h battery, and plush memory foam.',
      price: 19999,
      stock: 35,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      rating: 4.8
    },
    {
      name: 'EchoPods Pro True Wireless',
      category_id: 2,
      description: 'Ergonomic in-ear buds with hybrid active noise cancellation, IPX5 water resistance, wireless charging case, and punchy bass.',
      price: 7999,
      stock: 45,
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
      rating: 4.6
    },
    {
      name: 'SoundWave 360 Bluetooth Speaker',
      category_id: 2,
      description: 'Rugged waterproof portable speaker delivering rich 360-degree stereo sound, 20h playtime, and party pairing mode.',
      price: 4499,
      stock: 19,
      image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
      rating: 4.5
    },
    {
      name: 'ChronoSync Smartwatch Ultra',
      category_id: 3,
      description: 'Titanium case smartwatch with dual-band GPS, AMOLED sapphire touch screen, ECG, SpO2 sensor, and 100m water resistance.',
      price: 24999,
      stock: 14,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      rating: 4.7
    },
    {
      name: 'FitPulse Active Tracker 5',
      category_id: 3,
      description: 'Slim health band with 24/7 heart rate monitoring, sleep staging score, 30+ sport modes, and 14-day standby.',
      price: 2999,
      stock: 50,
      image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80',
      rating: 4.4
    },
    {
      name: 'CyberKey RGB Mechanical Keyboard',
      category_id: 4,
      description: 'Hot-swappable tactile mechanical gaming keyboard with aluminum frame, PBT double-shot keycaps, and detachable braided cable.',
      price: 6499,
      stock: 28,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      rating: 4.8
    },
    {
      name: 'Velocity Ultra Wireless Mouse',
      category_id: 4,
      description: 'Featherlight 58g esports wireless mouse with 26,000 DPI optical sensor, optical switches, and zero latency wireless connection.',
      price: 4999,
      stock: 30,
      image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
      rating: 4.9
    },
    {
      name: 'UltraVision 27" 4K HDR Monitor',
      category_id: 4,
      description: 'IPS professional monitor with 99% DCI-P3 color gamut, 144Hz refresh rate, USB-C 90W power delivery, and ergonomic stand.',
      price: 34999,
      stock: 10,
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
      rating: 4.7
    },
    {
      name: 'Lumina Smart Desk Lamp & Charger',
      category_id: 5,
      description: 'Modern architect LED lamp with color temperature tuning, auto-dimming ambient light sensor, and integrated 15W Qi wireless charger.',
      price: 2499,
      stock: 25,
      image_url: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=800&q=80',
      rating: 4.6
    },
    {
      name: 'OmniHub Smart Home Display 8"',
      category_id: 5,
      description: 'Touchscreen voice assistant hub with Zigbee smart home bridge, HD camera for video calls, and stereo front speakers.',
      price: 8999,
      stock: 12,
      image_url: 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=800&q=80',
      rating: 4.5
    },
    {
      name: 'MagShield MagSafe PowerBank 10000mAh',
      category_id: 3,
      description: 'Compact magnetic wireless power bank with foldable kickstand, 20W PD fast charging, and pass-through capability.',
      price: 2199,
      stock: 40,
      image_url: 'https://images.unsplash.com/photo-1609592424300-ff9b02a9b470?auto=format&fit=crop&w=800&q=80',
      rating: 4.6
    }
  ];

  for (const prod of products) {
    await db.runAsync(
      `INSERT INTO products (name, category_id, description, price, stock, image_url, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [prod.name, prod.category_id, prod.description, prod.price, prod.stock, prod.image_url, prod.rating]
    );
  }

  // Seed a sample order for demonstration in INR
  await db.runAsync(
    `INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status)
     VALUES (?, ?, ?, ?, ?)`,
    [2, 22498, 'Plot 42, HSR Layout, Sector 2, Bengaluru, Karnataka 560102', 'UPI (Google Pay)', 'Processing']
  );
  await db.runAsync(
    `INSERT INTO order_items (order_id, product_id, quantity, price)
     VALUES (?, ?, ?, ?)`,
    [1, 4, 1, 19999]
  );
  await db.runAsync(
    `INSERT INTO order_items (order_id, product_id, quantity, price)
     VALUES (?, ?, ?, ?)`,
    [1, 12, 1, 2499]
  );

  console.log('Sample database seed complete!');
}

initDatabase();

module.exports = db;
