require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Users
    const adminExists = await User.findOne({ email: 'admin@superstore.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@superstore.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('Admin created: admin@superstore.com / admin123');
    }

    const cashierExists = await User.findOne({ email: 'cashier@superstore.com' });
    if (!cashierExists) {
      await User.create({
        name: 'Cashier User',
        email: 'cashier@superstore.com',
        password: 'cashier123',
        role: 'cashier',
      });
      console.log('Cashier created: cashier@superstore.com / cashier123');
    }

    // Categories
    const categoryNames = ['Beverages', 'Bakery', 'Dairy', 'Snacks', 'Household', 'Personal Care'];
    const categories = {};
    for (const name of categoryNames) {
      let cat = await Category.findOne({ name });
      if (!cat) {
        cat = await Category.create({ name });
        console.log(`Category created: ${name}`);
      }
      categories[name] = cat._id;
    }

    // Walk-in Customer
    let walkIn = await Customer.findOne({ isWalkIn: true });
    if (!walkIn) {
      walkIn = await Customer.create({
        name: 'Walk-in Customer',
        phone: '',
        email: '',
        address: '',
        isWalkIn: true,
      });
      console.log('Walk-in customer created');
    }

    // Sample Products
    const sampleProducts = [
      { name: 'Pepsi 1.5L', sku: 'PEP-1500', barcode: '896400123', category: categories['Beverages'], costPrice: 180, sellingPrice: 220, stock: 100, lowStockLimit: 20 },
      { name: 'Coke 1.5L', sku: 'COK-1500', barcode: '896400124', category: categories['Beverages'], costPrice: 175, sellingPrice: 210, stock: 80, lowStockLimit: 20 },
      { name: 'White Bread', sku: 'BRD-WHT', barcode: '896400201', category: categories['Bakery'], costPrice: 150, sellingPrice: 200, stock: 50, lowStockLimit: 10 },
      { name: 'Milk 1L', sku: 'MLK-1L', barcode: '896400301', category: categories['Dairy'], costPrice: 220, sellingPrice: 280, stock: 60, lowStockLimit: 15 },
      { name: 'Lays Chips', sku: 'SNK-LAY', barcode: '896400401', category: categories['Snacks'], costPrice: 40, sellingPrice: 60, stock: 200, lowStockLimit: 30 },
      { name: 'Detergent 1kg', sku: 'HHD-DET', barcode: '896400501', category: categories['Household'], costPrice: 350, sellingPrice: 450, stock: 5, lowStockLimit: 10 },
      { name: 'Shampoo 400ml', sku: 'PC-SHP', barcode: '896400601', category: categories['Personal Care'], costPrice: 280, sellingPrice: 380, stock: 0, lowStockLimit: 5 },
    ];

    for (const p of sampleProducts) {
      const exists = await Product.findOne({ sku: p.sku });
      if (!exists) {
        await Product.create(p);
        console.log(`Product created: ${p.name}`);
      }
    }

    // Sample Supplier
    let supplier = await Supplier.findOne({ name: 'ABC Distributors' });
    if (!supplier) {
      supplier = await Supplier.create({
        name: 'ABC Distributors',
        phone: '03001234567',
        email: 'abc@distributors.com',
        address: '123 Main Street, City',
      });
      console.log('Supplier created: ABC Distributors');
    }

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();
