"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../product/product-development.module.css"; // Reusing styles for now
import { FaArrowLeft, FaEdit, FaTrash } from "react-icons/fa";

export default function RawMaterialPage() {
  const [materials, setMaterials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: "", stock_quantity: 0 });

  async function fetchMaterials() {
    try {
      const res = await fetch('/api/raw-materials');
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      } else {
        let errorMsg = `HTTP Error: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {
          // Error response was not valid JSON
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      alert(`Error fetching raw materials: ${error.message}`);
      setMaterials([]);
    }
  }

  useEffect(() => {
    fetchMaterials();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ id: null, name: "", stock_quantity: 0 });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, name, stock_quantity } = formData;
    const url = id ? `/api/raw-materials/${id}` : '/api/raw-materials';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, stock_quantity }),
      });

      if (res.ok) {
        await fetchMaterials();
        closeModal();
      } else {
        let errorMsg = `Failed to save raw material. Status: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {
          //
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error submitting raw material:", error);
      alert(error.message);
    }
  };

  const handleEdit = (material) => {
    setFormData(material);
    openModal();
  };

  const handleDelete = async (materialId) => {
    if (!confirm('Are you sure you want to delete this raw material?')) return;
    try {
      const res = await fetch(`/api/raw-materials/${materialId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchMaterials();
      } else {
        let errorMsg = `Failed to delete. Status: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          //
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Error in handleDelete:", err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.backButtonContainer}>
        <Link href="/dashboard" className={styles.backButton}><FaArrowLeft size={20} /><span>Back to Dashboard</span></Link>
      </div>
      <h1 className={styles.title}>Raw Material Management</h1>

      <div className={styles.toolbar}>
        <button onClick={openModal} className={styles.addButton}>Add Raw Material</button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.productTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => (
              <tr key={material.id}>
                <td>{material.name}</td>
                <td>{material.stock_quantity}</td>
                <td className={styles.actionButtons}>
                  <button onClick={() => handleEdit(material)}><FaEdit /></button>
                  <button onClick={() => handleDelete(material.id)}><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{formData.id ? "Edit Raw Material" : "Add New Raw Material"}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>Stock Quantity</label>
                <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleInputChange} required />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeModal} className={styles.cancelButton}>Cancel</button>
                <button type="submit" className={styles.saveButton}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
