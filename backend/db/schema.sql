
-- Users table
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (role IN ('admin', 'staff', 'pharmacist'))
);

-- Suppliers
CREATE TABLE suppliers (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(150),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

-- Medicines
CREATE TABLE medicines (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  generic_name VARCHAR(200),
  category_id CHAR(36),
  supplier_id CHAR(36),
  dosage VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'tablet',
  purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity_in_stock INT NOT NULL DEFAULT 0,
  reorder_level INT DEFAULT 10,
  expiry_date DATE,
  batch_number VARCHAR(100),
  description TEXT,
  requires_prescription TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Sales (removed customer_id)
CREATE TABLE sales (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  user_id CHAR(36),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(30) DEFAULT 'cash',
  status VARCHAR(20) DEFAULT 'completed',
  prescription_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (payment_method IN ('cash', 'card', 'insurance', 'mobile')),
  CHECK (status IN ('completed', 'pending', 'cancelled', 'refunded'))
);

-- Sale Items
CREATE TABLE sale_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sale_id CHAR(36),
  medicine_id CHAR(36),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL
);

-- Purchase Orders
CREATE TABLE purchase_orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  supplier_id CHAR(36),
  user_id CHAR(36),
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,

  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (status IN ('pending', 'received', 'partial', 'cancelled'))
);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36),
  medicine_id CHAR(36),
  quantity_ordered INT NOT NULL,
  quantity_received INT DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,

  FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL
);

-- Seed Data
INSERT IGNORE INTO categories (id, name, description) VALUES
(UUID(), 'Antibiotics', 'Medicines that fight bacterial infections'),
(UUID(), 'Analgesics', 'Pain relief medications'),
(UUID(), 'Antihypertensives', 'Blood pressure medications'),
(UUID(), 'Vitamins & Supplements', 'Nutritional supplements'),
(UUID(), 'Antidiabetics', 'Diabetes management medications'),
(UUID(), 'Antihistamines', 'Allergy relief medications'),
(UUID(), 'Antacids', 'Stomach acid reducers'),
(UUID(), 'Cardiovascular', 'Heart and circulation medications');

INSERT IGNORE INTO users (id, name, email, password_hash, role)
VALUES (
  UUID(),
  'Admin User',
  'admin@pharmacy.com',
  '$2a$12$iINkVXuH9yNtjapPKu0KkOL1HkifhRb1K6Pa4f/oldngXPsOyqvRy',
  'admin'
);
-- Default password: Admin@123