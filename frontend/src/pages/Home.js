import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listingsAPI, categoriesAPI, favoritesAPI } from '../services/api';

function Home() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    condition: '',
    min_price: '',
    max_price: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchListings();
    fetchUserFavorites();
  }, []);

  const fetchUserFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // User not logged in

      const response = await favoritesAPI.getAll();
      const favoritedIds = new Set(response.data.map(fav => fav.listing_id));
      setFavorites(favoritedIds);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchListings = async (searchFilters = filters, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOffset(0);
      }
      setError(null);
      const params = Object.fromEntries(
        Object.entries(searchFilters).filter(([_, v]) => v !== '')
      );
      params.limit = LIMIT;
      params.offset = append ? offset : 0;
      const response = await listingsAPI.getAll(params);
      const { listings: newListings, total: totalCount } = response.data;

      if (append) {
        setListings(prev => [...prev, ...newListings]);
        setOffset(prev => prev + LIMIT);
      } else {
        setListings(newListings);
        setOffset(LIMIT);
      }
      setTotal(totalCount);
    } catch (err) {
      setError('Failed to load listings');
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchListings(filters, true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings(filters);
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
  };

  const toggleFavorite = async (e, listingId) => {
    e.preventDefault(); // Prevent navigation to listing detail
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const isFavorited = favorites.has(listingId);

      if (isFavorited) {
        await favoritesAPI.remove(listingId);
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(listingId);
          return newFavorites;
        });
      } else {
        await favoritesAPI.add(listingId);
        setFavorites(prev => new Set(prev).add(listingId));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Campus Marketplace</h1>
        <p className="page-subtitle">Buy and sell items with fellow students</p>
      </div>

      <div className="search-container">
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search listings..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <div className="search-filters">
          <select
            className="form-select"
            value={filters.category_id}
            onChange={(e) => handleFilterChange('category_id', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={filters.condition}
            onChange={(e) => handleFilterChange('condition', e.target.value)}
          >
            <option value="">Any Condition</option>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>

          <input
            type="number"
            className="form-input"
            placeholder="Min Price"
            value={filters.min_price}
            onChange={(e) => handleFilterChange('min_price', e.target.value)}
          />

          <input
            type="number"
            className="form-input"
            placeholder="Max Price"
            value={filters.max_price}
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state-title">No listings found</h2>
          <p className="empty-state-text">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <>
          <div className="listings-grid">
            {listings.map((listing) => (
              <Link
                key={listing.listing_id}
                to={`/listings/${listing.listing_id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card listing-card" style={{ position: 'relative' }}>
                  {listing.primary_image_url && (
                    <img
                      src={listing.primary_image_url}
                      alt={listing.title}
                      className="listing-card-image"
                    />
                  )}
                  <button
                    onClick={(e) => toggleFavorite(e, listing.listing_id)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      fontSize: '20px',
                      transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title={favorites.has(listing.listing_id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {favorites.has(listing.listing_id) ? '❤️' : '🤍'}
                  </button>
                  <h3 className="listing-card-title">{listing.title}</h3>
                  <p className="listing-card-price">${listing.price.toFixed(2)}</p>
                  <div className="listing-card-info">
                    <span className="badge badge-primary">{listing.category_name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {listings.length < total && (
            <div style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Showing {listings.length} of {total} listings
              </p>
              <button
                className="btn btn-primary"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
