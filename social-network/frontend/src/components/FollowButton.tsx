'use client';
import React, { useState, useEffect } from 'react';

interface FollowButtonProps {
  userId: number;
  onFollow?: () => void;
  onUnfollow?: () => void;
}

function FollowButton({ userId, onFollow, onUnfollow }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkFollowStatus() {
      try {
        const response = await fetch(`http://localhost:8080/api/relationships/check?userId=${userId}`);

        if (response.status === 200) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
      } catch (error) {
        console.error('Failed to check follow status:', error);
      }
    }

    checkFollowStatus();
  }, [userId]);

  const handleFollow = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8080/api/relationships/follow?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
         
     
      if (response.status === 200) {
        setIsFollowing(true);
        if (onFollow) {
          onFollow();
        }
      } else {
        setError('Failed to follow user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
      setError('Failed to follow user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8080/api/relationships/unfollow?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.status === 200) {
        setIsFollowing(false);
        if (onUnfollow) {
          onUnfollow();
        }
      } else {
        setError('Failed to unfollow user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      setError('Failed to unfollow user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!isLoading && (
        <button onClick={isFollowing ? handleUnfollow : handleFollow} disabled={isLoading}>
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );
}

export default FollowButton;