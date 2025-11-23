import connectDB from '@/app/lib/db';
import User from '@/app/models/User';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (role !== 'direktur') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  const { id } = params;
  await connectDB(); // Use the new connectDB function

  try {
    const body = await request.json();
    const { role: newRole } = body;

    const user = await User.findByIdAndUpdate(id, { role: newRole }, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
