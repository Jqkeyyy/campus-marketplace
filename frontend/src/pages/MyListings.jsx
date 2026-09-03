import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listingsAPI } from '../services/api';

function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        setLoading(true);
        const response = await listingsAPI.getMyListings();
        console.log('Fetched listings response:', response); // Debug log
        // Extract data from axios response
        const data = response.data;
        console.log('Fetched listings data:', data); // Debug log
        // Ensure data is always an array
        setListings(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching my listings:', err);
        setError('Failed to load your listings. Please try again.');
        setListings([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">My Listings</h1>
          <Link to="/create-listing" className="btn btn-primary">
            Create New Listing
          </Link>
        </div>
        <p>Loading your listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">My Listings</h1>
          <Link to="/create-listing" className="btn btn-primary">
            Create New Listing
          </Link>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Listings</h1>
        <Link to="/create-listing" className="btn btn-primary">
          Create New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any listings yet.</p>
          <Link to="/create-listing" className="btn btn-primary">
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map((listing) => (
            <div key={listing.listing_id} className="card listing-card">
              <h3 className="listing-card-title">{listing.title}</h3>
              <p className="listing-card-price">${listing.price}</p>
              <div className="flex-between">
                <span className="badge badge-primary">{listing.category_name}</span>
                <span className={`badge ${listing.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {listing.status}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Link to={`/edit-listing/${listing.listing_id}`} className="btn btn-small btn-secondary">
                  Edit
                </Link>
                <button className="btn btn-small btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyListings;