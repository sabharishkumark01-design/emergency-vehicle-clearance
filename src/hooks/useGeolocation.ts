import { useState, useEffect } from 'react';
import { geolocationService, Coordinates } from '../services/geolocationService';

export function useGeolocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    geolocationService
      .getCurrentPosition()
      .then((coords) => {
        setLocation(coords);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to get location');
        setLoading(false);
      });
  }, []);

  return { location, error, loading };
}
