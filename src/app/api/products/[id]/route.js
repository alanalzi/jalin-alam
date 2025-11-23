import connectDB from '@/app/lib/db';
import Product from '@/app/models/Product';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request, { params }) {
  const { id } = params;
  await connectDB();

  try {
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (role !== 'admin' && role !== 'direktur') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  const { id } = params;
  await connectDB();

  try {
    const body = await request.json();
    const product = await Product.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (role !== 'admin' && role !== 'direktur') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  const { id } = params;
  await connectDB();

  try {
    const deletedProduct = await Product.deleteOne({ _id: id });
    if (deletedProduct.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
