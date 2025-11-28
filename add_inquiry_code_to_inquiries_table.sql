-- jalin-alam/add_inquiry_code_to_inquiries_table.sql

ALTER TABLE inquiries
ADD COLUMN inquiry_code VARCHAR(255) UNIQUE AFTER id;
