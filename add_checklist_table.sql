-- Create the new table for product checklists
CREATE TABLE product_checklists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  task VARCHAR(255) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
