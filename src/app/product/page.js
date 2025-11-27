"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./product-development.module.css";
import { FaArrowLeft, FaEdit, FaTrash, FaPlus } from "react-icons/fa";

// Helper function to format date strings for input fields
function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ProductDevelopmentPage() {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]); // Re-introduced rawMaterials state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, 
    name: "", 
    sku: "", 
    category: "", 
    description: "", 
    startDate: "", 
    deadline: "",
    requiredMaterials: []
  });
  const [sortOrder, setSortOrder] = useState('deadline-asc');
  
  // State for the new material input
  const [selectedMaterialId, setSelectedMaterialId] = useState(''); // Changed to selectedMaterialId
  const [newMaterialQuantity, setNewMaterialQuantity] = useState(1);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        let errorMsg = `HTTP Error: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {}
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      alert(`Error fetching products: ${error.message}`);
      setProducts([]);
    }
  }

  async function fetchRawMaterials() { // Re-introduced fetchRawMaterials
    try {
      const res = await fetch('/api/raw-materials');
      if (res.ok) {
        const data = await res.json();
        setRawMaterials(data);
      } else {
        let errorMsg = `HTTP Error: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {}
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      alert(`Error fetching raw materials: ${error.message}`);
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchRawMaterials(); // Fetch raw materials on mount
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ 
      id: null, 
      name: "", 
      sku: "", 
      category: "", 
      description: "", 
      startDate: "", 
      deadline: "",
      requiredMaterials: []
    });
    setSelectedMaterialId(''); // Reset selected material ID
    setNewMaterialQuantity(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMaterial = () => {
    if (!selectedMaterialId || newMaterialQuantity <= 0) {
      alert("Please select a material and specify a valid quantity.");
      return;
    }
    
    const materialToAdd = rawMaterials.find(m => m.id === parseInt(selectedMaterialId));
    if (!materialToAdd) {
        alert("Selected material not found in master list.");
        return;
    }

    // Check if material is already added to this product
    if (formData.requiredMaterials.some(m => m.material_id === materialToAdd.id)) {
        alert("This material has already been added to this product.");
        return;
    }

    setFormData(prev => ({
      ...prev,
      requiredMaterials: [
        ...prev.requiredMaterials,
        { 
          material_id: materialToAdd.id,
          material_name: materialToAdd.name, // Store name for display, ID for backend
          quantity_needed: parseInt(newMaterialQuantity)
        }
      ]
    }));
    setSelectedMaterialId(''); // Clear selection
    setNewMaterialQuantity(1);
  };

  const handleRemoveMaterial = (materialId) => { // Removed by ID now
    setFormData(prev => ({
      ...prev,
      requiredMaterials: prev.requiredMaterials.filter(m => m.material_id !== materialId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = formData.id ? `/api/products/${formData.id}` : '/api/products';
    const method = formData.id ? 'PUT' : 'POST';
    const payload = { ...formData };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchProducts();
        closeModal();
      } else {
        let errorMsg = `Failed to save product. Status: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonErr) {}
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      alert(error.message);
    }
  };

  const handleEdit = async (product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`);
      if(res.ok) {
        const data = await res.json();
        setFormData({
            ...data,
            startDate: formatDateForInput(data.startDate),
            deadline: formatDateForInput(data.deadline),
            requiredMaterials: data.requiredMaterials || []
        });
        openModal();
      } else {
        let errorMsg = `Failed to fetch product details. Status: ${res.status}`;
        try {
            const errorData = await res.json();
            errorMsg = errorData.message || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
      }
    } catch (error) {
        console.error("Error in handleEdit:", error);
        alert(error.message);
    }
  };

  const handleDelete = async (productId) => {
    console.log("Attempting to delete product with ID:", productId); // Added log
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchProducts();
      } else {
        let errorMsg = `Failed to delete. Status: ${res.status}`;
        try {
            const errorData = await res.json();
            errorMsg = errorData.message || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Error in handleDelete:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const [sortField, sortDirection] = sortOrder.split('-');
    const field = sortField === 'deadline' ? 'deadline' : 'startDate';
    const dateA = new Date(a[field]);
    const dateB = new Date(b[field]);
    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
  });
  
  return (
    <div className={styles.pageContainer}>
      <div className={styles.backButtonContainer}>
        <Link href="/dashboard" className={styles.backButton}><FaArrowLeft size={20} /><span>Back</span></Link>
      </div>
      <h1 className={styles.title}>Product Development</h1>
      
      <div className={styles.toolbar}>
        <div className={styles.sortContainer}>
          <label htmlFor="sort-select">Sort by:</label>
          <select id="sort-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={styles.sortSelect}>
            <option value="deadline-asc">Deadline (Soonest First)</option>
            <option value="deadline-desc">Deadline (Latest First)</option>
          </select>
        </div>
        <button onClick={openModal} className={styles.addButton}>Add Product</button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.productTable}>
          <thead>
            <tr>
              <th>Image</th><th>Product Name</th><th>SKU</th><th>Category</th><th>Start Date</th><th>Deadline</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/50'} 
                      alt={product.name} 
                      width={50} 
                      height={50} 
                      style={{objectFit: 'cover'}}
                    />
                  </td>
                  <td><Link href={`/product/${product.id}`}>{product.name}</Link></td>
                  <td>{product.sku}</td>
                  <td>{product.category}</td>
                  <td>{formatDateForInput(product.startDate)}</td>
                  <td>{formatDateForInput(product.deadline)}</td>
                  <td className={styles.actionButtons}>
                    <button onClick={() => handleEdit(product)}><FaEdit /></button>
                    <button onClick={() => handleDelete(product.id)}><FaTrash /></button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{formData.id ? "Edit Product" : "Add New Product"}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}><label>Product Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required /></div>
              <div className={styles.formGroup}><label>SKU</label><input type="text" name="sku" value={formData.sku} onChange={handleInputChange} required /></div>
              <div className={styles.formGroup}><label>Category</label><input type="text" name="category" value={formData.category} onChange={handleInputChange} /></div>
              <div className={styles.formGroup}><label>Description</label><textarea name="description" value={formData.description} onChange={handleInputChange}></textarea></div>
              <div className={styles.formGroup}><label>Start Date</label><input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required /></div>
              <div className={styles.formGroup}><label>Deadline</label><input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} required /></div>
              
              <div className={styles.formGroup}>
                <h3>Required Materials</h3>
                <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                  <select 
                    value={selectedMaterialId} 
                    onChange={e => setSelectedMaterialId(e.target.value)}
                    style={{flex: 2}}
                  >
                    <option value="">-- Select Material --</option>
                    {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <input 
                    type="number"
                    value={newMaterialQuantity}
                    onChange={e => setNewMaterialQuantity(e.target.value)}
                    min="1"
                    placeholder="Qty"
                    style={{flex: 1}}
                  />
                  <button type="button" onClick={handleAddMaterial} className={styles.addButton}><FaPlus/></button>
                </div>
                <ul>
                  {formData.requiredMaterials.map(m => (
                    <li key={m.material_id}>
                      {m.material_name} ({m.quantity_needed})
                      <button type="button" onClick={() => handleRemoveMaterial(m.material_id)} style={{marginLeft: '10px', color: 'red'}}><FaTrash/></button>
                    </li>
                  ))}
                </ul>
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