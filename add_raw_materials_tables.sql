-- Create the new table for raw materials
CREATE TABLE raw_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  stock_quantity INT NOT NULL DEFAULT 0
);

-- Create the new table for linking products and raw materials
CREATE TABLE product_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  material_id INT NOT NULL,
  quantity_needed INT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
);
