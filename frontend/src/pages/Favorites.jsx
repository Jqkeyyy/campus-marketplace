import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoritesAPI } from '../services/api';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await favoritesAPI.getAll();
        console.log('Fetched favorites response:', response); // Debug log
        // Extract data from axios response
        const data = response.data;
        console.log('Fetched favorites data:', data); // Debug log
        // Ensure data is always an array
        setFavorites(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError('Failed to load your favorites. Please try again.');
        setFavorites([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="page-title">My Favorites</h1>
        <p>Loading your favorites...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="page-title">My Favorites</h1>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">My Favorites</h1>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state-title">No favorites yet</h2>
          <p className="empty-state-text">Start browsing to save items!</p>
          <Link to="/" className="btn btn-primary">Browse Listings</Link>
        </div>
      ) : (
        <div className="listings-grid">
          {favorites.map((listing) => (
            <Link key={listing.listing_id} to={`/listings/${listing.listing_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card listing-card">
                {listing.primary_image_url && (
                  <img
                    src={listing.primary_image_url}
                    alt={listing.title}
                    className="listing-card-image"
                  />
                )}
                <h3 className="listing-card-title">{listing.title}</h3>
                <p className="listing-card-price">${listing.price.toFixed(2)}</p>
                <div className="listing-card-info">
                  <span className="badge badge-primary">{listing.category_name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;