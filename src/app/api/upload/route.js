import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request) {
  const formData = await request.formData();
  const files = formData.getAll('images'); // Get all files associated with the 'images' field

  if (!files || files.length === 0) {
    return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
  }

  const urls = [];
  const uploadsPath = path.join(process.cwd(), 'public/uploads');

  try {
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate a unique filename
      const filename = `${Date.now()}-${file.name}`;
      const filePath = path.join(uploadsPath, filename);

      await writeFile(filePath, buffer);
      urls.push(`/uploads/${filename}`);
    }
    return NextResponse.json({ success: true, urls: urls }, { status: 200 }); // Return an array of URLs
  } catch (error) {
    console.error('Error saving files:', error);
    return NextResponse.json({ success: false, message: 'Error saving files' }, { status: 500 });
  }
}