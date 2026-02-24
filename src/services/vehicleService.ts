import { supabase, EmergencyVehicle } from '../lib/supabase';

export const vehicleService = {
  async getActiveVehicles(): Promise<EmergencyVehicle[]> {
    const { data, error } = await supabase
      .from('emergency_vehicles')
      .select('*')
      .eq('is_active', true)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }

    return data || [];
  },

  async createVehicle(
    vehicleData: Omit<EmergencyVehicle, 'id' | 'created_at' | 'last_updated'>
  ): Promise<EmergencyVehicle | null> {
    const { data, error } = await supabase
      .from('emergency_vehicles')
      .insert([vehicleData])
      .select()
      .single();

    if (error) {
      console.error('Error creating vehicle:', error);
      return null;
    }

    return data;
  },

  async updateVehicleLocation(
    vehicleId: string,
    latitude: number,
    longitude: number,
    status?: 'available' | 'on_emergency'
  ): Promise<boolean> {
    const updateData: {
      latitude: number;
      longitude: number;
      last_updated: string;
      status?: 'available' | 'on_emergency';
    } = {
      latitude,
      longitude,
      last_updated: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    const { error } = await supabase
      .from('emergency_vehicles')
      .update(updateData)
      .eq('id', vehicleId);

    if (error) {
      console.error('Error updating vehicle location:', error);
      return false;
    }

    return true;
  },

  async deactivateVehicle(vehicleId: string): Promise<boolean> {
    const { error } = await supabase
      .from('emergency_vehicles')
      .update({ is_active: false })
      .eq('id', vehicleId);

    if (error) {
      console.error('Error deactivating vehicle:', error);
      return false;
    }

    return true;
  },

  subscribeToVehicles(
    callback: (vehicles: EmergencyVehicle[]) => void
  ) {
    const channel = supabase
      .channel('emergency_vehicles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_vehicles',
          filter: 'is_active=eq.true',
        },
        async () => {
          const vehicles = await this.getActiveVehicles();
          callback(vehicles);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
