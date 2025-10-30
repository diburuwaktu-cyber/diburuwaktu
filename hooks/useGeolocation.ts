
import { useState, useEffect, useCallback } from 'react';
import { GeolocationState } from '../types';

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const getLocation = useCallback(() => {
    setLoading(true);
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: "Geolocation is not supported by your browser." }));
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        });
        setLoading(false);
      },
      (error) => {
        setLocation(prev => ({ ...prev, error: `Geolocation error: ${error.message}` }));
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return { location, loading, refreshLocation: getLocation };
};
