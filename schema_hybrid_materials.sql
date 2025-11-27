-- Please run these statements manually to update your database schema.

-- Drop the table from the previous "Google Form-like" approach
DROP TABLE IF EXISTS product_required_materials;

-- Create or re-create the master raw_materials table
CREATE TABLE IF NOT EXISTS raw_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  stock_quantity INT NOT NULL DEFAULT 0
);

-- Create or re-create the table for linking products and raw materials
CREATE TABLE IF NOT EXISTS product_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  material_id INT NOT NULL,
  quantity_needed INT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
);
