"use client";
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-around', 
      padding: '1rem', 
      backgroundColor: '#333', 
      color: 'white' 
    }}>
      <Link href="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
        Dashboard
      </Link>
      <Link href="/product" style={{ color: 'white', textDecoration: 'none' }}>
        Product Development
      </Link>
      <Link href="/supplier" style={{ color: 'white', textDecoration: 'none' }}>
        Manage Raw Materials
      </Link>
    </nav>
  );
}