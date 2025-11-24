import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, listingsAPI } from '../services/api';

function AdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await listingsAPI.getAll();
      setListings(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (listingId, title) => {
    if (!window.confirm(`Are you sure you want to remove the listing "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(listingId);
      await adminAPI.deleteListing(listingId);
      // Remove from local state
      setListings(listings.filter(listing => listing.listing_id !== listingId));
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert('Failed to delete listing. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'sold': return 'badge-primary';
      case 'removed': return 'badge-danger';
      default: return 'badge-warning';
    }
  };

  const filteredListings = filter === 'all'
    ? listings
    : listings.filter(listing => listing.status === filter);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Listing Moderation</h1>
          <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
        <p>Loading listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Listing Moderation</h1>
          <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Listing Moderation</h1>
          <p className="page-subtitle">{filteredListings.length} listings</p>
        </div>
        <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      <div className="card mb-2">
        <div className="flex gap-1">
          <button
            className={`btn btn-small ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
          >
            All ({listings.length})
          </button>
          <button
            className={`btn btn-small ${filter === 'active' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('active')}
          >
            Active ({listings.filter(l => l.status === 'active').length})
          </button>
          <button
            className={`btn btn-small ${filter === 'sold' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('sold')}
          >
            Sold ({listings.filter(l => l.status === 'sold').length})
          </button>
        </div>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Seller</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Price</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Listed</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredListings.map(listing => (
              <tr key={listing.listing_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <Link
                    to={`/listings/${listing.listing_id}`}
                    style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {listing.title}
                  </Link>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                  {listing.seller_name || listing.seller_email || 'Unknown'}
                </td>
                <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                  ${listing.price}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className="badge badge-primary">{listing.category_name}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${getStatusBadgeClass(listing.status)}`}>
                    {listing.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                  {new Date(listing.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div className="flex gap-1">
                    <Link
                      to={`/listings/${listing.listing_id}`}
                      className="btn btn-small btn-secondary"
                    >
                      View
                    </Link>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(listing.listing_id, listing.title)}
                      disabled={actionLoading === listing.listing_id}
                    >
                      {actionLoading === listing.listing_id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredListings.length === 0 && (
          <div className="empty-state">
            <p>No listings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminListings;
