# CineMatch Backend - Frontend Integration Guide

## New Comprehensive User Profile Endpoint

### Endpoint Details

- **URL**: `GET /users/{uid}/complete-profile`
- **Authentication**: JWT Bearer token required
- **Description**: Retrieves complete user profile data for visiting another user's profile page

### Response Structure

The endpoint returns a comprehensive object with the following structure:

```typescript
interface CompleteUserProfileResponse {
  user: {
    displayName: string;
    email: string;
    photoURL: string;
    bio?: string;
    birthdate?: string;
    followersCount: number;
    followingCount: number;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    // Note: Excludes private fields: settings, authProviders, emailVerified
  };
  stats: {
    totalFavorites: number;
    followersCount: number;
    followingCount: number;
    totalMoviesWatched: number;
    totalTvShowsWatched: number;
    totalViews: number;
    totalReviews: number;
    averageRating: number; // 0-5 scale
  };
  recentFavorites: Array<{
    tmdbId: number;
    title: string;
    mediaType: 'movie' | 'tv';
    posterPath: string;
    addedAt: string; // ISO date string
  }>; // Last 10, most recent first
  recentLogs: Array<{
    id: string;
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    rating?: number; // 1-5
    review?: string; // Truncated to 100 chars + "..." if longer
    watchedAt: string; // ISO date string
    hadSeenBefore: boolean;
  }>; // Last 10, most recent first
  recentReviews: Array<{
    id: string;
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    rating: number; // 1-5
    review: string; // Full review content
    reviewLang?: string;
    watchedAt: string; // ISO date string
    createdAt: string; // ISO date string
  }>; // Last 10 reviews only, most recent first
}
```

### Usage Examples

#### Fetch User Profile Data

```javascript
const fetchUserProfile = async (uid) => {
  try {
    const response = await fetch(`/api/users/${uid}/complete-profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found');
      }
      throw new Error('Failed to fetch user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};
```

#### React Component Example

```jsx
import React, { useEffect, useState } from 'react';

const UserProfilePage = ({ uid }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await fetchUserProfile(uid);
        setProfileData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      loadProfile();
    }
  }, [uid]);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profileData) return <div>Profile not found</div>;

  const { user, stats, recentFavorites, recentLogs, recentReviews } = profileData;

  return (
    <div className="user-profile">
      {/* User Info Section */}
      <div className="profile-header">
        <img src={user.photoURL} alt={user.displayName} />
        <h1>{user.displayName}</h1>
        <p>{user.bio}</p>
        <div className="follow-stats">
          <span>{user.followersCount} followers</span>
          <span>{user.followingCount} following</span>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="profile-stats">
        <div className="stat">
          <h3>{stats.totalMoviesWatched}</h3>
          <p>Movies Watched</p>
        </div>
        <div className="stat">
          <h3>{stats.totalTvShowsWatched}</h3>
          <p>TV Shows Watched</p>
        </div>
        <div className="stat">
          <h3>{stats.totalReviews}</h3>
          <p>Reviews Written</p>
        </div>
        <div className="stat">
          <h3>{stats.averageRating.toFixed(1)}</h3>
          <p>Avg Rating</p>
        </div>
      </div>

      {/* Recent Favorites */}
      <section className="recent-favorites">
        <h2>Recent Favorites</h2>
        <div className="favorites-grid">
          {recentFavorites.map((favorite) => (
            <div key={`${favorite.mediaType}-${favorite.tmdbId}`} className="favorite-item">
              <img
                src={`https://image.tmdb.org/t/p/w200${favorite.posterPath}`}
                alt={favorite.title}
              />
              <h3>{favorite.title}</h3>
              <p>Added {new Date(favorite.addedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {recentLogs.map((log) => (
            <div key={log.id} className="activity-item">
              <div className="activity-info">
                <span className="rating">★ {log.rating}/5</span>
                <span className="date">{new Date(log.watchedAt).toLocaleDateString()}</span>
              </div>
              {log.review && <p className="review-preview">{log.review}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Recent Reviews */}
      <section className="recent-reviews">
        <h2>Recent Reviews</h2>
        <div className="reviews-list">
          {recentReviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <span className="rating">★ {review.rating}/5</span>
                <span className="date">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="review-text">{review.review}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
```

### Data Handling Tips

#### 1. **Empty States**

```javascript
// Handle users with no activity
if (!recentLogs.length) {
  // Show "No recent activity" message
}

if (!recentReviews.length) {
  // Show "No reviews yet" message
}

if (!recentFavorites.length) {
  // Show "No favorites yet" message
}
```

#### 2. **Review Preview vs Full Review**

```javascript
// recentLogs contains previews (truncated to 100 chars)
const isPreview = log.review && log.review.endsWith('...');

// recentReviews contains full review content
const fullReview = review.review; // Complete text
```

#### 3. **Date Formatting**

```javascript
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return formatDate(dateString);
};
```

#### 4. **Rating Display**

```javascript
const StarRating = ({ rating, maxStars = 5 }) => {
  return (
    <div className="star-rating">
      {[...Array(maxStars)].map((_, index) => (
        <span key={index} className={index < rating ? 'star filled' : 'star empty'}>
          ★
        </span>
      ))}
    </div>
  );
};
```

### Error Handling

```javascript
const handleApiError = (response) => {
  switch (response.status) {
    case 404:
      return 'User not found';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access denied';
    case 500:
      return 'Server error, please try again later';
    default:
      return 'An unexpected error occurred';
  }
};
```

### Performance Considerations

1. **Caching**: Consider caching profile data for 5-10 minutes to reduce API calls
2. **Loading States**: Show skeleton loaders for each section while loading
3. **Lazy Loading**: Load images lazily, especially poster images
4. **Pagination**: For users with extensive activity, consider implementing "Load More" for sections

### Integration Checklist

- [ ] Add JWT authentication to all requests
- [ ] Handle 404 errors for non-existent users
- [ ] Implement loading states for better UX
- [ ] Add empty state components for users with no activity
- [ ] Format dates consistently across the application
- [ ] Implement responsive design for different screen sizes
- [ ] Add accessibility attributes for screen readers
- [ ] Test with users who have varying amounts of data (empty profiles, very active users)

---

## Media Log Manual Date Setting

### Updated Functionality

Both create and update operations now support manual `watchedAt` date setting.

#### Create Log with Custom Date

```javascript
const createLogWithDate = async (logData) => {
  const response = await fetch('/api/media-logs', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...logData,
      watchedAt: {
        _seconds: Math.floor(newDate.getTime() / 1000),
        _nanoseconds: 0,
      },
    }),
  });
};
```

#### Update Log Date

```javascript
const updateLogDate = async (logId, newDate) => {
  const response = await fetch(`/api/media-logs/${logId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      watchedAt: {
        seconds: Math.floor(newDate.getTime() / 1000),
        nanoseconds: 0,
      },
    }),
  });
};
```

### Important: Timestamp Format

**CRITICAL**: Use `{ seconds, nanoseconds }` format, NOT `{ _seconds, _nanoseconds }`

````javascript
### Important: Timestamp Format
**CRITICAL**: Use `{ _seconds, _nanoseconds }` format (Firebase native format)

```javascript
// ✅ CORRECT FORMAT (Firebase native)
const timestamp = {
  _seconds: Math.floor(date.getTime() / 1000),
  _nanoseconds: 0
};

// ❌ WRONG FORMAT (causes 500 error)
const timestamp = {
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0
};
````

```

---

This guide provides everything needed to integrate the new comprehensive user profile endpoint and the updated manual date functionality. The endpoint is optimized for single-request profile loading and includes all necessary data for rich user profile pages.
```
