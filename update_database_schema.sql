-- Please run these DROP statements manually if you have the old tables in your database.
-- DROP TABLE IF EXISTS product_materials;
-- DROP TABLE IF EXISTS raw_materials;

-- Create the new table for product-specific required materials
CREATE TABLE product_required_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  material_name VARCHAR(255) NOT NULL,
  is_sourced BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
