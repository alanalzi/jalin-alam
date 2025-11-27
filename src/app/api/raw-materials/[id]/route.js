// jalin-alam/src/app/api/raw-materials/[id]/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jalin_alam_db',
};

export async function PUT(req, { params }) {
  const { id } = params;
  const { name, stock_quantity } = await req.json();

  if (!id) {
    return NextResponse.json({ message: 'Raw material ID is required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'UPDATE raw_materials SET name = ?, stock_quantity = ? WHERE id = ?',
      [name, stock_quantity, id]
    );
    return NextResponse.json({ message: 'Raw material updated successfully' });
  } catch (error) {
    console.error('Database query failed during PUT:', error);
    return NextResponse.json({ message: 'Failed to update raw material', error: error.message }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function DELETE(req, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ message: 'Raw material ID is required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute('DELETE FROM raw_materials WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Raw material deleted successfully' });
  } catch (error) {
    console.error('Database query failed during DELETE:', error);
    return NextResponse.json({ message: 'Failed to delete raw material', error: error.message }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
