import { useState, useEffect } from 'react';
import { vehicleService } from '../services/vehicleService';
import { EmergencyVehicle } from '../lib/supabase';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<EmergencyVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initVehicles = async () => {
      try {
        const activeVehicles = await vehicleService.getActiveVehicles();
        setVehicles(activeVehicles);
        setLoading(false);

        unsubscribe = vehicleService.subscribeToVehicles((updatedVehicles) => {
          setVehicles(updatedVehicles);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vehicles');
        setLoading(false);
      }
    };

    initVehicles();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { vehicles, loading, error };
}
