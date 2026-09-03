import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { listingsAPI, favoritesAPI, messagesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function ListingDetail() {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchListing();
    if (isAuthenticated) {
      checkFavorite();
    }
  }, [id, isAuthenticated]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await listingsAPI.getById(id);
      setListing(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load listing');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const response = await favoritesAPI.check(id);
      setIsFavorited(response.data.is_favorited);
    } catch (err) {
      console.error('Failed to check favorite:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isFavorited) {
        await favoritesAPI.remove(id);
        setIsFavorited(false);
      } else {
        await favoritesAPI.add(id);
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      alert('Failed to update favorite');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setSendingMessage(true);
    try {
      await messagesAPI.send({
        listing_id: listing.listing_id,
        receiver_id: listing.user_id,
        body: message
      });
      setMessage('');
      setMessageSuccess(true);
      setTimeout(() => setMessageSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await listingsAPI.delete(listing.listing_id);
      alert('Listing deleted successfully');
      navigate('/my-listings');
    } catch (err) {
      console.error('Failed to delete listing:', err);
      alert('Failed to delete listing');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="error-message">
        {error || 'Listing not found'}
      </div>
    );
  }

  const isOwner = user && user.UserID === listing.user_id;

  return (
    <div>
      <div className="card">
        {/* Header with title and favorite button */}
        <div className="flex-between mb-3">
          <h1 className="page-title">{listing.title}</h1>
          {!isOwner && (
            <button
              onClick={toggleFavorite}
              className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorited ? '❤️' : '🤍'}
            </button>
          )}
        </div>

        {/* Images */}
        {listing.images && listing.images.length > 0 ? (
          <div className="mb-3">
            {/* Main Image Display */}
            <div
              style={{
                width: '100%',
                height: '500px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setShowImageModal(true)}
            >
              <img
                src={listing.images[selectedImageIndex].url}
                alt={listing.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Thumbnail Gallery */}
            {listing.images.length > 1 && (
              <div className="flex gap-2" style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                {listing.images.map((img, idx) => (
                  <img
                    key={img.image_id}
                    src={img.url}
                    alt={`${listing.title} ${idx + 1}`}
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: selectedImageIndex === idx ? '3px solid var(--primary-color)' : '2px solid var(--border-color)',
                      flexShrink: 0,
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            )}
            <p className="text-muted mt-1" style={{ fontSize: '0.875rem' }}>
              Click on image to view full size • {listing.images.length} image{listing.images.length > 1 ? 's' : ''}
            </p>
          </div>
        ) : listing.primary_image_url ? (
          <div className="mb-3">
            <div
              style={{
                width: '100%',
                height: '500px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setShowImageModal(true)}
            >
              <img
                src={listing.primary_image_url}
                alt={listing.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
            <p className="text-muted mt-1" style={{ fontSize: '0.875rem' }}>
              Click on image to view full size
            </p>
          </div>
        ) : null}

        {/* Price */}
        <p className="listing-card-price" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          ${listing.price.toFixed(2)}
        </p>

        {/* Badges */}
        <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          <span className="badge badge-primary">{listing.category_name}</span>
          <span className="badge badge-success">{listing.condition.replace('_', ' ')}</span>
          <span className={`badge ${listing.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
            {listing.status}
          </span>
        </div>

        {/* Description */}
        <div className="mb-3">
          <h3>Description</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{listing.description}</p>
        </div>

        <hr style={{ margin: '2rem 0' }} />

        {/* Seller Information */}
        <div className="mb-3">
          <h3>Seller Information</h3>
          <p><strong>Name:</strong> {listing.seller_name}</p>
          {listing.created_at && (
            <p className="text-muted">
              Listed on: {new Date(listing.created_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex gap-2 mb-3">
            <Link
              to={`/edit-listing/${listing.listing_id}`}
              className="btn btn-primary"
            >
              Edit Listing
            </Link>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
            >
              Delete Listing
            </button>
          </div>
        )}

        {/* Contact Seller Form */}
        {isAuthenticated && !isOwner && listing.status === 'active' && (
          <div className="mt-4">
            <h3>Contact Seller</h3>
            {messageSuccess && (
              <div className="success-message">
                Message sent successfully!
              </div>
            )}
            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <textarea
                  className="form-textarea"
                  placeholder="Hi, is this item still available?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="4"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sendingMessage}
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        )}

        {/* Login prompt for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-4">
            <p className="text-center">
              <Link to="/login">Login</Link> to contact the seller or save this listing.
            </p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (listing.images?.length > 0 || listing.primary_image_url) && (
        <div
          onClick={() => setShowImageModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setShowImageModal(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001
            }}
          >
            ×
          </button>

          {/* Previous button */}
          {listing.images && listing.images.length > 1 && selectedImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(prev => prev - 1);
              }}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001
              }}
            >
              ‹
            </button>
          )}

          {/* Next button */}
          {listing.images && listing.images.length > 1 && selectedImageIndex < listing.images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(prev => prev + 1);
              }}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001
              }}
            >
              ›
            </button>
          )}

          {/* Image */}
          <img
            src={listing.images?.[selectedImageIndex]?.url || listing.primary_image_url}
            alt={listing.title}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain'
            }}
          />

          {/* Image counter */}
          {listing.images && listing.images.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '8px 16px',
                borderRadius: '20px',
                color: '#1e293b',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              {selectedImageIndex + 1} / {listing.images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ListingDetail;