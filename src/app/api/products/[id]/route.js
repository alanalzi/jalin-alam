// jalin-alam/src/app/api/products/[id]/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jalin_alam_db',
};


export async function GET(request, context) {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Fetch product details
    const [productRows] = await connection.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (productRows.length === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    const product = productRows[0];

    // Fetch product images
    const [imageRows] = await connection.execute('SELECT image_url FROM product_images WHERE product_id = ?', [id]);
    product.images = imageRows.map(row => row.image_url);

    // Fetch product checklist
    const [checklistRows] = await connection.execute('SELECT * FROM product_checklists WHERE product_id = ?', [id]);
    product.checklist = checklistRows;

    // Fetch required materials
    const [materialRows] = await connection.execute(`
        SELECT 
            pm.material_id, 
            rm.name as material_name, 
            pm.quantity_needed,
            rm.stock_quantity
        FROM product_materials pm
        JOIN raw_materials rm ON pm.material_id = rm.id
        WHERE pm.product_id = ?
    `, [id]);
    product.requiredMaterials = materialRows;

    return NextResponse.json(product);

  } catch (error) {
    console.error('Database query failed during GET:', error);
    return NextResponse.json({ message: 'Failed to fetch product', error: error.message }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function PUT(request, context) {
    const { id } = context.params;
    let { name, sku, category, description, startDate, deadline, checklist, requiredMaterials } = await request.json();

    // Helper to convert undefined or empty string to null for SQL bind parameters
    const toNullIfEmptyOrUndefined = (value) => (value === undefined || value === '' ? null : value);

    if (!id) {
        return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // Fetch current product data to get existing values for fields not provided in the request
        const [currentProductRows] = await connection.execute('SELECT * FROM products WHERE id = ?', [id]);
        if (currentProductRows.length === 0) {
            await connection.rollback();
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }
        const currentProduct = currentProductRows[0];

        // Prepare fields for update, using current values if not provided in the request
        const updatedName = toNullIfEmptyOrUndefined(name !== undefined ? name : currentProduct.name);
        const updatedSku = toNullIfEmptyOrUndefined(sku !== undefined ? sku : currentProduct.sku);
        const updatedCategory = toNullIfEmptyOrUndefined(category !== undefined ? category : currentProduct.category);
        const updatedDescription = toNullIfEmptyOrUndefined(description !== undefined ? description : currentProduct.description);
        const updatedStartDate = toNullIfEmptyOrUndefined(startDate !== undefined ? startDate : currentProduct.start_date);
        const updatedDeadline = toNullIfEmptyOrUndefined(deadline !== undefined ? deadline : currentProduct.deadline);


        // Update product details
        await connection.execute(
            'UPDATE products SET name = ?, sku = ?, category = ?, description = ?, start_date = ?, deadline = ? WHERE id = ?',
            [updatedName, updatedSku, updatedCategory, updatedDescription, updatedStartDate, updatedDeadline, id]
        );

        // Update checklist items (delete all and re-insert)
        // Only update if checklist array is explicitly provided in the request body
        if (checklist !== undefined) {
            await connection.execute('DELETE FROM product_checklists WHERE product_id = ?', [id]);
            if (Array.isArray(checklist) && checklist.length > 0) {
                const checklistValues = checklist.map(item => [id, item.task, item.is_completed]);
                await connection.query(
                    'INSERT INTO product_checklists (product_id, task, is_completed) VALUES ?',
                    [checklistValues]
                );
            }
        }
        
        // --- Stock Adjustment for Materials ---
        // Only update if requiredMaterials array is explicitly provided in the request body
        if (requiredMaterials !== undefined) {
            // 1. Get old materials linked to this product to restore stock
            const [oldProductMaterials] = await connection.execute(
                `SELECT pm.material_id, pm.quantity_needed FROM product_materials pm WHERE pm.product_id = ?`,
                [id]
            );

            // 2. Restore stock for old materials
            for (const oldMat of oldProductMaterials) {
                await connection.execute(
                    'UPDATE raw_materials SET stock_quantity = stock_quantity + ? WHERE id = ?',
                    [oldMat.quantity_needed, oldMat.material_id]
                );
            }

            // 3. Delete old product_materials links
            await connection.execute('DELETE FROM product_materials WHERE product_id = ?', [id]);

            // 4. Process new required materials (Upsert & Decrement Stock)
            if (Array.isArray(requiredMaterials) && requiredMaterials.length > 0) {
                for (const material of requiredMaterials) {
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
            
                    await connection.execute(
                        'INSERT INTO product_materials (product_id, material_id, quantity_needed) VALUES (?, ?, ?)',
                        [id, materialId, material.quantity_needed]
                    );
                }
            }
        }

        await connection.commit();
        return NextResponse.json({ message: 'Product updated successfully' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Database query failed during PUT:', error);
        return NextResponse.json({ message: 'Failed to update product', error: error.message }, { status: 500 });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

export async function DELETE(request, context) {
  const { id } = context.params;
  
  if (!id) {
    return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    await connection.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
    await connection.execute('DELETE FROM product_checklists WHERE product_id = ?', [id]);
    await connection.execute('DELETE FROM product_materials WHERE product_id = ?', [id]);
    const [result] = await connection.execute('DELETE FROM products WHERE id = ?', [id]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Database query failed during DELETE:', error);
    return NextResponse.json({ message: 'Failed to delete product', error: error.message }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}