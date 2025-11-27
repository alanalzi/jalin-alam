// jalin-alam/src/app/product/[id]/page.js
"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import useRouter
import Link from 'next/link';
import { FaArrowLeft, FaPlus, FaSave, FaTrash } from 'react-icons/fa';

// Helper function to format date strings for database (YYYY-MM-DD)
function formatDateForDatabase(dateString) {
  if (!dateString) return null; // Convert empty or null to null
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null; // Invalid date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter(); // Initialize useRouter
  const [product, setProduct] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [requiredMaterials, setRequiredMaterials] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchProduct() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        setChecklist(data.checklist || []);
        setRequiredMaterials(data.requiredMaterials || []);
      } else {
        let errorMsg = `HTTP Error: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {}
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
      alert(`Error fetching product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleChecklistChange = (taskId) => {
    setChecklist(
      checklist.map((task) =>
        task.id === taskId ? { ...task, is_completed: !task.is_completed } : task
      )
    );
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      const newTaskObj = {
        id: `temp-${Date.now()}`,
        product_id: id,
        task: newTask.trim(),
        is_completed: false,
      };
      setChecklist([...checklist, newTaskObj]);
      setNewTask('');
    }
  };

  const handleDeleteTask = (taskId) => {
    setChecklist(checklist.filter((task) => task.id !== taskId));
  };

  const handleSaveChanges = async () => {
    try {
      // On this page, we only save changes to the production checklist
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        // We now only send the checklist from this page.
        // The requiredMaterials are read-only on this page, and their stock is managed elsewhere.
        body: JSON.stringify({
          id: product.id, // Explicitly send ID for backend PUT
          checklist,
          requiredMaterials: requiredMaterials.map(material => ({
            material_id: material.material_id,
            material_name: material.material_name,
            quantity_needed: material.quantity_needed
          }))
        }),
      });

      if (res.ok) {
        alert('Changes saved successfully!');
        router.push('/product'); // Redirect to product development page
      } else {
        let errorMsg = `Failed to save changes. Status: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      alert(error.message);
    }
  };

  const areAllMaterialsInStock = requiredMaterials.every(
    (material) => material.stock_quantity >= material.quantity_needed
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <Link href="/product" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <FaArrowLeft />
        <span>Back to Product Development</span>
      </Link>
      
      <h1>{product.name}</h1>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
        {product.images && product.images.length > 0 ? (
          product.images.map((image, index) => (
            <img 
              key={index} 
              src={image} 
              alt={`${product.name} image ${index + 1}`} 
              width={150} 
              height={150} 
              style={{ objectFit: 'cover', borderRadius: '5px' }} 
            />
          ))
        ) : (
          <img 
            src="https://via.placeholder.com/150" 
            alt="No Product Image" 
            width={150} 
            height={150} 
            style={{ objectFit: 'cover', borderRadius: '5px' }} 
          />
        )}
      </div>
      <p><strong>SKU:</strong> {product.sku}</p>
      <p><strong>Category:</strong> {product.category}</p>
      <p><strong>Description:</strong> {product.description}</p>
      
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Required Raw Materials</h2>
        {requiredMaterials.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Material</th>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Needed</th>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>In Stock</th>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {requiredMaterials.map((material) => (
                <tr key={material.material_id}>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{material.material_name}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{material.quantity_needed}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{material.stock_quantity}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {material.stock_quantity >= material.quantity_needed ? (
                      <span style={{ color: 'green' }}>Available</span>
                    ) : (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>Insufficient</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No raw materials required for this product.</p>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Production Checklist</h2>
        
        {!areAllMaterialsInStock && requiredMaterials.length > 0 && (
          <p style={{ color: 'red', fontWeight: 'bold' }}>
            Production checklist is disabled until all required materials are in stock.
          </p>
        )}

        <div style={{ marginBottom: '1rem' }}>
          {checklist.map((task) => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={task.is_completed}
                onChange={() => handleChecklistChange(task.id)}
                disabled={!areAllMaterialsInStock}
              />
              <span style={{ textDecoration: task.is_completed ? 'line-through' : 'none' }}>
                {task.task}
              </span>
              <button onClick={() => handleDeleteTask(task.id)} style={{ color: 'red' }} disabled={!areAllMaterialsInStock}>
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add new production task"
            style={{ flexGrow: 1, padding: '0.5rem' }}
            disabled={!areAllMaterialsInStock}
          />
          <button onClick={handleAddTask} style={{ padding: '0.5rem 1rem' }} disabled={!areAllMaterialsInStock}>
            <FaPlus /> Add Task
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <button onClick={handleSaveChanges} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px' }}>
          <FaSave /> Save Checklist Changes
        </button>
      </div>
    </div>
  );
}
