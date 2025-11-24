"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./product-development.module.css";
import { FaArrowLeft, FaEdit, FaTrash } from "react-icons/fa";

export default function ProductDevelopmentPage() {
  const [products, setProducts] = useState([]); // Initialize with empty array
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: "", sku: "", category: "", description: "", images: [], startDate: "", deadline: "" });
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        // Fallback to initialProducts or empty array if API fails
        setProducts([]);
      }
    }
    fetchProducts();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ id: null, name: "", sku: "", category: "", description: "", images: [], startDate: "", deadline: "" });
    setImagePreviews([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newImagePreviews = files.map(file => URL.createObjectURL(file));
      
      setFormData((prev) => ({ ...prev, images: files }));
      setImagePreviews(newImagePreviews);
    } else {
      setFormData((prev) => ({ ...prev, images: [] }));
      setImagePreviews([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create a single FormData object for everything
    const data = new FormData();
    data.append('name', formData.name);
    data.append('sku', formData.sku);
    data.append('category', formData.category);
    data.append('description', formData.description);
    data.append('startDate', formData.startDate);
    data.append('deadline', formData.deadline);

    // Append all selected files
    for (const image of formData.images) {
      if (image instanceof File) {
        data.append('images', image);
      }
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        // The 'Content-Type' header is automatically set by the browser
        // to 'multipart/form-data' when the body is a FormData object.
        // Do NOT set it manually.
        body: data,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      // Re-fetch products to update the list with the new entry
      const fetchRes = await fetch('/api/products');
      const updatedProducts = await fetchRes.json();
      setProducts(updatedProducts);

    } catch (error) {
      console.error("Error adding product:", error);
      alert(`Failed to add product: ${error.message}`);
    }

    closeModal();
  };

  const handleEdit = (product) => {
    setFormData(product);
    setImagePreviews(product.images || []);
    openModal();
  };

  const handleDelete = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.backButtonContainer}>
        <Link href="/dashboard" className={styles.backButton}>
          <FaArrowLeft size={20} />
          <span>Kembali</span>
        </Link>
      </div>
      <h1 className={styles.title}>Product Development</h1>

      <div className={styles.toolbar}>
        <button onClick={openModal} className={styles.addButton}>
          Tambah Produk
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.productTable}>
          <thead>
            <tr>
              <th>Gambar</th>
              <th>Nama Produk</th>
              <th>SKU</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Tanggal Mulai</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const today = new Date();
              const deadlineDate = new Date(product.deadline);
              const isLate = deadlineDate < today;
              const status = isLate ? "Late" : "Ongoing";

              return (
                <tr key={product.id}>
                  <td>
                    <div className={styles.productImageContainer}>
                      {product.images && product.images.map((imgSrc, index) => (
                        <Image key={index} src={imgSrc} alt={`${product.name} ${index + 1}`} width={50} height={50} className={styles.productImage} unoptimized={true} />
                      ))}
                    </div>
                  </td>
                  <td>{product.name}</td>
                  <td>{product.sku}</td>
                  <td>{product.category}</td>
                  <td>{product.description}</td>
                  <td>{product.startDate}</td>
                  <td>{product.deadline}</td>
                  <td>
                    <span className={`${styles.status} ${isLate ? styles.late : styles.ongoing}`}>
                      {status}
                    </span>
                  </td>
                  <td className={styles.actionButtons}>
                    <button onClick={() => handleEdit(product)}><FaEdit /></button>
                    <button onClick={() => handleDelete(product.id)}><FaTrash /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{formData.id ? "Edit Produk" : "Tambah Produk Baru"}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nama Produk</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>SKU</label>
                <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>Kategori</label>
                <input type="text" name="category" value={formData.category} onChange={handleInputChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>Deskripsi</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"></textarea>
              </div>
              <div className={styles.formGroup}>
                <label>Tanggal Mulai</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>Deadline</label>
                <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>Gambar Produk</label>
                <input type="file" name="images" onChange={handleFileChange} multiple />
                <div className={styles.imagePreviewContainer}>
                  {imagePreviews.map((previewUrl, index) => (
                    <Image key={index} src={previewUrl} alt={`Preview ${index + 1}`} width={100} height={100} style={{ marginTop: '10px', marginRight: '10px' }} unoptimized={true} />
                  ))}
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeModal} className={styles.cancelButton}>Batal</button>
                <button type="submit" className={styles.saveButton}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}