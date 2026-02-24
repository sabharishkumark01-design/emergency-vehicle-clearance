import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface EmergencyVehicle {
  id: string;
  vehicle_type: 'ambulance' | 'fire';
  vehicle_number: string;
  driver_name: string | null;
  latitude: number;
  longitude: number;
  status: 'available' | 'on_emergency';
  is_active: boolean;
  last_updated: string;
  created_at: string;
}
