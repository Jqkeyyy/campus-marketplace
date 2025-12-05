import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listingsAPI, categoriesAPI, imagesAPI } from '../services/api';
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

  // Image management
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchListing();
    fetchImages();
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

  const fetchImages = async () => {
    try {
      const response = await imagesAPI.getByListing(id);
      setExistingImages(response.data || []);
    } catch (err) {
      console.error('Failed to fetch images:', err);
    }
  };

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file sizes
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }
    }

    // Calculate total images after adding new ones
    const totalImages = existingImages.length - imagesToDelete.length + newImageFiles.length + files.length;
    if (totalImages > 10) {
      setError(`Maximum 10 images allowed. You currently have ${existingImages.length - imagesToDelete.length} existing images and ${newImageFiles.length} new images.`);
      return;
    }

    setNewImageFiles(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews(prev => [...prev, ...previews]);
    setError('');
  };

  const removeExistingImage = (imageId) => {
    setImagesToDelete(prev => [...prev, imageId]);
  };

  const undoRemoveExistingImage = (imageId) => {
    setImagesToDelete(prev => prev.filter(id => id !== imageId));
  };

  const removeNewImage = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = async (imageId) => {
    try {
      await imagesAPI.setPrimary(imageId);
      await fetchImages();
    } catch (err) {
      console.error('Failed to set primary image:', err);
      setError('Failed to set primary image');
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
      // Update listing details
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        condition: formData.condition,
        status: formData.status
      };

      await listingsAPI.update(id, updateData);

      // Delete images marked for deletion
      if (imagesToDelete.length > 0) {
        for (const imageId of imagesToDelete) {
          try {
            await imagesAPI.delete(imageId);
          } catch (err) {
            console.error(`Failed to delete image ${imageId}:`, err);
          }
        }
      }

      // Upload new images
      if (newImageFiles.length > 0) {
        setUploadingImages(true);
        for (const file of newImageFiles) {
          try {
            // Upload to cloudinary/storage
            const uploadResponse = await imagesAPI.upload(file);
            // Add to listing
            await imagesAPI.add({
              listing_id: parseInt(id),
              url: uploadResponse.data.url,
              is_primary: false
            });
          } catch (err) {
            console.error('Failed to upload image:', err);
          }
        }
        setUploadingImages(false);
      }

      // Redirect to the listing detail page
      navigate(`/listings/${id}`);
    } catch (err) {
      console.error('Update listing error:', err);
      setError(err.response?.data?.error || 'Failed to update listing');
    } finally {
      setSaving(false);
      setUploadingImages(false);
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

        {/* Image Management */}
        <div className="form-group">
          <label className="form-label">Images</label>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="mb-2">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Current Images ({existingImages.filter(img => !imagesToDelete.includes(img.ImageID)).length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {existingImages.map((image) => (
                  <div key={image.ImageID} style={{ position: 'relative', opacity: imagesToDelete.includes(image.ImageID) ? 0.5 : 1 }}>
                    <img
                      src={image.URL}
                      alt="Listing"
                      style={{
                        width: '150px',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: image.is_primary ? '3px solid var(--primary-color)' : '1px solid var(--border-color)'
                      }}
                    />
                    {image.is_primary && (
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
                    {imagesToDelete.includes(image.ImageID) ? (
                      <button
                        type="button"
                        className="btn btn-small btn-secondary"
                        style={{
                          position: 'absolute',
                          bottom: '5px',
                          right: '5px',
                          padding: '5px 10px',
                          minWidth: 'auto'
                        }}
                        onClick={() => undoRemoveExistingImage(image.ImageID)}
                      >
                        Undo
                      </button>
                    ) : (
                      <>
                        {!image.is_primary && (
                          <button
                            type="button"
                            className="btn btn-small btn-primary"
                            style={{
                              position: 'absolute',
                              bottom: '5px',
                              left: '5px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              minWidth: 'auto'
                            }}
                            onClick={() => setPrimaryImage(image.ImageID)}
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            padding: '5px 10px',
                            minWidth: 'auto'
                          }}
                          onClick={() => removeExistingImage(image.ImageID)}
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images Preview */}
          {newImagePreviews.length > 0 && (
            <div className="mb-2">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                New Images to Upload ({newImagePreviews.length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {newImagePreviews.map((preview, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
                      style={{
                        width: '150px',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '5px',
                      left: '5px',
                      background: 'var(--success-color)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      NEW
                    </span>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        padding: '5px 10px',
                        minWidth: 'auto'
                      }}
                      onClick={() => removeNewImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div className="mt-2">
            <input
              type="file"
              className="form-input"
              accept="image/*"
              multiple
              onChange={handleNewImageChange}
            />
            <small className="text-muted">
              Upload up to 10 images total (max 5MB each).
              Currently: {existingImages.length - imagesToDelete.length} existing + {newImageFiles.length} new = {existingImages.length - imagesToDelete.length + newImageFiles.length} total
            </small>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={saving || uploadingImages}
          >
            {uploadingImages ? `Uploading ${newImageFiles.length} image${newImageFiles.length > 1 ? 's' : ''}...` : saving ? 'Saving...' : 'Save Changes'}
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