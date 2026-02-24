import { useState, useRef } from 'react';
import { EmergencyMap, EmergencyMapRef } from '../components/EmergencyMap';
import { useVehicles } from '../hooks/useVehicles';
import { useGeolocation } from '../hooks/useGeolocation';
import { Ambulance, AlertCircle, MapPin, Locate } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'driver') => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { location: userLocation, loading: locationLoading } = useGeolocation();
  const [showUserLocation, setShowUserLocation] = useState(true);
  const mapRef = useRef<EmergencyMapRef>(null);

  const ambulanceCount = vehicles.filter((v) => v.vehicle_type === 'ambulance').length;
  const fireCount = vehicles.filter((v) => v.vehicle_type === 'fire').length;
  const emergencyCount = vehicles.filter((v) => v.status === 'on_emergency').length;

  return (
    <div className="relative w-full h-screen">
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-2">
            Emergency Vehicle Clearance
          </h1>
          <p className="text-sm md:text-base text-white/90 drop-shadow">
            Real-time emergency vehicle tracking
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
              <span className="text-2xl">🚑</span>
              <div>
                <div className="text-xs text-gray-600">Ambulances</div>
                <div className="font-bold text-lg">{ambulanceCount}</div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
              <span className="text-2xl">🚒</span>
              <div>
                <div className="text-xs text-gray-600">Fire Trucks</div>
                <div className="font-bold text-lg">{fireCount}</div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-xs text-gray-600">Active Emergencies</div>
                <div className="font-bold text-lg text-red-600">{emergencyCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(vehiclesLoading || locationLoading) && (
        <div className="absolute inset-0 z-[999] bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading map...</p>
          </div>
        </div>
      )}

      {!userLocation && !locationLoading && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-[1000] bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <div className="text-sm">
              Please enable location services to see your position
            </div>
          </div>
        </div>
      )}

      <EmergencyMap
        ref={mapRef}
        vehicles={vehicles}
        userLocation={showUserLocation ? userLocation : null}
      />

      <button
        onClick={() => {
          setShowUserLocation(true);
          if (userLocation && mapRef.current) {
            mapRef.current.flyToLocation(userLocation);
          }
        }}
        disabled={!userLocation}
        className="fixed bottom-6 left-6 z-[1000] bg-white hover:bg-gray-50 text-gray-700 font-semibold p-3 rounded-full shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Show my location"
      >
        <Locate className="w-5 h-5" />
      </button>

      <button
        onClick={() => onNavigate('driver')}
        className="fixed bottom-6 right-6 z-[1000] bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105"
      >
        <Ambulance className="w-5 h-5" />
        <span>Driver Mode</span>
      </button>
    </div>
  );
}
