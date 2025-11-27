// jalin-alam/src/app/api/products/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jalin_alam_db',
};

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT
        p.id,
        p.name,
        p.sku,
        p.category,
        p.description,
        p.start_date AS startDate,
        p.deadline,
        GROUP_CONCAT(pi.image_url ORDER BY pi.id ASC) AS images
      FROM
        products p
      LEFT JOIN
        product_images pi ON p.id = pi.product_id
      GROUP BY
        p.id, p.name, p.sku, p.category, p.description, p.start_date, p.deadline
      ORDER BY p.id DESC
    `);
    
    // Process rows to group images into an array for each product
    const products = rows.map(row => ({
      ...row,
      images: row.images ? row.images.split(',') : [],
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ message: 'Failed to fetch products', error: error.message }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function POST(req) {
  let connection;
  const { name, sku, category, description, startDate, deadline, requiredMaterials } = await req.json();

  try {
    if (!name || !sku) {
      return NextResponse.json({ message: 'Name and SKU are required' }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Insert new product
    const [productResult] = await connection.execute(
      `INSERT INTO products (name, sku, category, description, start_date, deadline) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, sku, category, description, startDate, deadline]
    );
    const productId = productResult.insertId;

    // Handle required materials with upsert logic
    if (requiredMaterials && requiredMaterials.length > 0) {
      for (const material of requiredMaterials) {
        // Find existing raw material (case-insensitive)
        const [existing] = await connection.execute(
          'SELECT id, stock_quantity FROM raw_materials WHERE LOWER(name) = LOWER(?)',
          [material.material_name]
        );

        let materialId;
        let currentStock = 0;
        if (existing.length > 0) {
          materialId = existing[0].id;
          currentStock = existing[0].stock_quantity;
        } else {
          // Insert new raw material if it doesn't exist
          const [newMaterial] = await connection.execute(
            'INSERT INTO raw_materials (name, stock_quantity) VALUES (?, ?)',
            [material.material_name, 0] // Default stock to 0 for new materials
          );
          materialId = newMaterial.insertId;
        }

        // Check for sufficient stock before linking
        if (currentStock < material.quantity_needed) {
            await connection.rollback();
            return NextResponse.json(
                { message: `Insufficient stock for material '${material.material_name}'. Needed: ${material.quantity_needed}, Available: ${currentStock}` },
                { status: 400 }
            );
        }

        // Decrement stock quantity in raw_materials
        await connection.execute(
            'UPDATE raw_materials SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [material.quantity_needed, materialId]
        );

        // Link product to the material
        await connection.execute(
          'INSERT INTO product_materials (product_id, material_id, quantity_needed) VALUES (?, ?, ?)',
          [productId, materialId, material.quantity_needed]
        );
      }
    }

    await connection.commit();
    return NextResponse.json({ message: 'Product added successfully', productId }, { status: 201 });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Failed to process POST request:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: `SKU '${sku}' already exists. Please use a different SKU.` }, { status: 409 });
    }

    return NextResponse.json({ message: 'Failed to add product', error: error.message }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

