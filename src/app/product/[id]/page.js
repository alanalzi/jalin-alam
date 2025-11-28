"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaPlus, FaSave, FaTrash } from 'react-icons/fa';
import styles from './product-detail.module.css'; // Import the CSS module

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

// Helper function to format date strings for input fields (Copy from product/page.js)
function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Ensure the date is valid before formatting
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
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
      alert(`Error fetching product: ${String(error.message)}`);
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
        console.error(errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      alert(String(error.message));
    }
  };

  // Helper function to determine the status (Ongoing/Late) based solely on deadline
  const getStatus = (deadline) => {
    if (!deadline) return 'Ongoing'; // No deadline, assume ongoing

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

    const deadlineDate = new Date(deadline);
    // Ensure the deadlineDate is a valid date object before comparison
    if (isNaN(deadlineDate.getTime())) {
      // If deadline is invalid, fall back to default or a specific error status
      // For now, let's assume 'Ongoing' if the date is invalid and cannot be compared.
      return 'Ongoing'; 
    }
    deadlineDate.setHours(0, 0, 0, 0); // Normalize deadline date to start of day
    
    if (deadlineDate < today) {
      return 'Late';
    }
    return 'Ongoing';
  };

  // Helper to get CSS class for status
  const getStatusClassName = (deadline) => { // Removed productStatus
    const status = getStatus(deadline); // Removed productStatus
    if (status === 'Late') {
      return styles.statusLate;
    } else if (status === 'Ongoing') {
      return styles.statusOngoing;
    }
    return '';
  };

  // Helper to get display text for status
  const getDisplayStatus = (deadline) => { // Removed productStatus
    return getStatus(deadline); // Removed productStatus
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <div className={styles.container}>
      <Link href="/product" className={styles.backLink}>
        <FaArrowLeft />
        <span>Back to Product Development</span>
      </Link>
      
      <h1 className={styles.productName}>{product.name}</h1>
      <div className={styles.imageGallery}>
        {product.images && product.images.length > 0 ? (
          product.images.map((image, index) => (
            <img 
              key={index} 
              src={image} 
              alt={`${product.name} image ${index + 1}`} 
              width={150} 
              height={150} 
              className={styles.productImage} 
            />
          ))
        ) : (
          <img 
            src="https://via.placeholder.com/150" 
            alt="No Product Image" 
            width={150} 
            height={150} 
            className={styles.productImage} 
          />
        )}
      </div>
      <p className={styles.productInfo}><strong>SKU:</strong> {product.sku}</p>
      <p className={styles.productInfo}><strong>Category:</strong> {product.category}</p>
      <p className={styles.productInfo}><strong>Start Date:</strong> {formatDateForInput(product.start_date)}</p>
      <p className={styles.productInfo}><strong>Deadline:</strong> {formatDateForInput(product.deadline)}</p>
      <p className={styles.productInfo}>
        <strong>Status:</strong> <span className={getStatusClassName(product.deadline)}>{getDisplayStatus(product.deadline)}</span>
      </p>
      <p className={styles.productInfo}><strong>Description:</strong> {product.description}</p>
      
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Supplier</h2>
        {requiredMaterials.length > 0 ? (
          <table className={styles.supplierTable}>
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Supplier Description</th>
                <th>Contact Info</th>
              </tr>
            </thead>
            <tbody>
              {requiredMaterials.map((material) => (
                <tr key={material.material_id}>
                  <td>{material.material_name}</td>
                  <td>{material.supplier_description}</td>
                  <td>{material.contact_info_text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.noMaterials}>No raw materials required for this product.</p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Production Checklist</h2>
        
        <div className={styles.checklist}>
          {checklist.map((task) => (
            <div key={task.id} className={styles.checklistTask}>
              <input
                type="checkbox"
                checked={task.is_completed}
                onChange={() => handleChecklistChange(task.id)}
                className={styles.checklistCheckbox}
              />
              <span className={`${styles.checklistText} ${task.is_completed ? styles.completed : ''}`}>
                {task.task}
              </span>
              <button onClick={() => handleDeleteTask(task.id)} className={styles.deleteButton}>
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.addTaskForm}>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add new production task"
            className={styles.addTaskInput}
          />
          <button onClick={handleAddTask} className={styles.addTaskButton}>
            <FaPlus /> Add Task
          </button>
        </div>
      </div>
      
      <div className={styles.section}>
        <button onClick={handleSaveChanges} className={styles.saveButton}>
          <FaSave /> Save Checklist Changes
        </button>
      </div>
    </div>
  );
}
