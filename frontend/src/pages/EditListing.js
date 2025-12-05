import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listingsAPI, categoriesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function EditListing() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    condition: '',
    status: 'active'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchListing();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await listingsAPI.getById(id);
      const listing = response.data;

      // Check if user owns this listing
      if (listing.user_id !== user.UserID) {
        setError('You do not have permission to edit this listing');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      setFormData({
        title: listing.title,
        description: listing.description,
        price: listing.price.toString(),
        category_id: listing.category_id.toString(),
        condition: listing.condition,
        status: listing.status
      });
      setError('');
    } catch (err) {
      console.error('Failed to fetch listing:', err);
      setError('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Validation
    if (parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0');
      setSaving(false);
      return;
    }

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        condition: formData.condition,
        status: formData.status
      };

      await listingsAPI.update(id, updateData);
      
      // Redirect to the listing detail page
      navigate(`/listings/${id}`);
    } catch (err) {
      console.error('Update listing error:', err);
      setError(err.response?.data?.error || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error && !formData.title) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 className="page-title">Edit Listing</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            type="text"
            name="title"
            className="form-input"
            value={formData.title}
            onChange={handleChange}
            required
            minLength="3"
            maxLength="200"
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            name="description"
            className="form-textarea"
            value={formData.description}
            onChange={handleChange}
            required
            minLength="10"
            rows="6"
          />
        </div>

        {/* Price */}
        <div className="form-group">
          <label className="form-label">Price (USD) *</label>
          <input
            type="number"
            name="price"
            className="form-input"
            value={formData.price}
            onChange={handleChange}
            required
            min="0.01"
            step="0.01"
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">Category *</label>
          <select
            name="category_id"
            className="form-select"
            value={formData.category_id}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div className="form-group">
          <label className="form-label">Condition *</label>
          <select
            name="condition"
            className="form-select"
            value={formData.condition}
            onChange={handleChange}
            required
          >
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        {/* Status */}
        <div className="form-group">
          <label className="form-label">Status *</label>
          <select
            name="status"
            className="form-select"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="active">Active - Visible to buyers</option>
            <option value="sold">Sold - Mark as sold</option>
            <option value="removed">Removed - Hide from listings</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(`/listings/${id}`)}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditListing;