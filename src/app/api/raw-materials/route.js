// jalin-alam/src/app/api/raw-materials/route.js
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
    const [rows] = await connection.execute('SELECT * FROM raw_materials ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ message: 'Failed to fetch raw materials', error: error.message }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function POST(req) {
  let connection;
  const { name, stock_quantity } = await req.json();

  try {
    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO raw_materials (name, stock_quantity) VALUES (?, ?)`,
      [name, stock_quantity || 0]
    );
    
    return NextResponse.json({ message: 'Raw material added successfully' }, { status: 201 });

  } catch (error) {
    console.error('Failed to process POST request:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: `Raw material '${name}' already exists.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to add raw material', error: error.message }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
