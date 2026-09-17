const db = require('../config/db');

// @route   GET /api/categories
// @desc    Get all categories with product count
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await db.allAsync(`
      SELECT c.*, COUNT(p.product_id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
      GROUP BY c.category_id
      ORDER BY c.name ASC
    `);
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/categories/:id
// @desc    Get single category by ID
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await db.getAsync('SELECT * FROM categories WHERE category_id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/categories (Admin)
// @desc    Create a new category
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await db.getAsync('SELECT category_id FROM categories WHERE slug = ? OR name = ?', [slug, name]);
    if (existing) {
      return res.status(400).json({ message: 'Category with this name or slug already exists' });
    }

    const result = await db.runAsync(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name.trim(), slug, description || '']
    );

    const newCategory = await db.getAsync('SELECT * FROM categories WHERE category_id = ?', [result.lastID]);
    res.status(201).json(newCategory);
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/categories/:id (Admin)
// @desc    Update a category
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, slug, description } = req.body;
    const categoryId = req.params.id;

    const category = await db.getAsync('SELECT * FROM categories WHERE category_id = ?', [categoryId]);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const updatedName = name !== undefined ? name.trim() : category.name;
    const updatedSlug = slug !== undefined ? slug.trim() : category.slug;
    const updatedDescription = description !== undefined ? description : category.description;

    await db.runAsync(
      'UPDATE categories SET name = ?, slug = ?, description = ? WHERE category_id = ?',
      [updatedName, updatedSlug, updatedDescription, categoryId]
    );

    const updated = await db.getAsync('SELECT * FROM categories WHERE category_id = ?', [categoryId]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/categories/:id (Admin)
// @desc    Delete a category
exports.deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const category = await db.getAsync('SELECT * FROM categories WHERE category_id = ?', [categoryId]);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await db.runAsync('DELETE FROM categories WHERE category_id = ?', [categoryId]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};
