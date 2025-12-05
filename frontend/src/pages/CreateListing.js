import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsAPI, categoriesAPI, imagesAPI } from '../services/api';

function CreateListing() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    condition: ''
  });
  const [categories, setCategories] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file sizes
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }
    }

    // Limit to 5 images
    if (files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setImageFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    setError('');
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0');
      setLoading(false);
      return;
    }

    if (formData.description.length < 10) {
      setError('Description must be at least 10 characters');
      setLoading(false);
      return;
    }

    try {
      const listingData = {
        ...formData,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id)
      };

      // Upload images if provided
      if (imageFiles.length > 0) {
        setUploadingImage(true);
        try {
          const uploadedImages = [];
          for (const file of imageFiles) {
            const uploadResponse = await imagesAPI.upload(file);
            uploadedImages.push({ url: uploadResponse.data.url });
          }
          listingData.images = uploadedImages;
        } catch (uploadErr) {
          setError('Failed to upload images. Please try again.');
          setLoading(false);
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      const response = await listingsAPI.create(listingData);

      // Redirect to the new listing
      navigate(`/listings/${response.data.listing_id}`);
    } catch (err) {
      console.error('Create listing error:', err);
      console.error('Error response:', err.response?.data);

      // Handle validation errors
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors.map(e => e.msg).join(', ');
        setError(`Validation error: ${validationErrors}`);
      } else {
        setError(err.response?.data?.error || 'Failed to create listing. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 className="page-title">Create New Listing</h2>
      <p className="text-muted mb-3">
        Fill out the form below to list your item for sale
      </p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            type="text"
            name="title"
            className="form-input"
            placeholder="e.g., iPhone 12 64GB"
            value={formData.title}
            onChange={handleChange}
            required
            minLength="3"
            maxLength="200"
          />
          <small className="text-muted">Be specific and descriptive</small>
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            name="description"
            className="form-textarea"
            placeholder="Describe the condition, features, and any defects..."
            value={formData.description}
            onChange={handleChange}
            required
            minLength="10"
            rows="6"
          />
          <small className="text-muted">
            {formData.description.length} characters (minimum 10)
          </small>
        </div>

        {/* Price */}
        <div className="form-group">
          <label className="form-label">Price (USD) *</label>
          <input
            type="number"
            name="price"
            className="form-input"
            placeholder="0.00"
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
            <option value="">Select condition</option>
            <option value="new">New - Never used</option>
            <option value="like_new">Like New - Barely used</option>
            <option value="good">Good - Normal wear</option>
            <option value="fair">Fair - Visible wear</option>
            <option value="poor">Poor - Significant wear</option>
          </select>
        </div>

        {/* Image Upload (optional) */}
        <div className="form-group">
          <label className="form-label">Images (optional)</label>
          <input
            type="file"
            className="form-input"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          <small className="text-muted">
            Upload up to 5 images of your item (max 5MB each)
          </small>
          {imagePreviews.length > 0 && (
            <div className="mt-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {imagePreviews.map((preview, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: '150px',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: index === 0 ? '3px solid var(--primary-color)' : '1px solid var(--border-color)'
                    }}
                  />
                  {index === 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '5px',
                      left: '5px',
                      background: 'var(--primary-color)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      padding: '5px 10px',
                      minWidth: 'auto'
                    }}
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {uploadingImage ? `Uploading ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}...` : loading ? 'Creating...' : 'Create Listing'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateListing;