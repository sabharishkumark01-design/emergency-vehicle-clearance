import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { EmergencyVehicle } from '../lib/supabase';
import { Coordinates } from '../services/geolocationService';
import 'leaflet/dist/leaflet.css';

interface EmergencyMapProps {
  vehicles: EmergencyVehicle[];
  userLocation: Coordinates | null;
}

export interface EmergencyMapRef {
  flyToLocation: (location: Coordinates) => void;
}

function MapController({
  userLocation,
  vehicles,
  mapRef,
}: EmergencyMapProps & { mapRef: React.MutableRefObject<any> }) {
  const map = useMap();
  const hasSetInitialView = useRef(false);

  useImperativeHandle(mapRef, () => ({
    flyToLocation: (location: Coordinates) => {
      map.flyTo([location.latitude, location.longitude], 15, {
        duration: 1.5,
      });
    },
  }));

  useEffect(() => {
    if (!hasSetInitialView.current && userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 13);
      hasSetInitialView.current = true;
    }
  }, [userLocation, map]);

  useEffect(() => {
    if (vehicles.length > 0 && userLocation) {
      const bounds = L.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        ...vehicles.map((v) => [v.latitude, v.longitude] as [number, number]),
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [vehicles, userLocation, map]);

  return null;
}

const createVehicleIcon = (type: 'ambulance' | 'fire', status: string) => {
  const emoji = type === 'ambulance' ? '🚑' : '🚒';
  const pulse = status === 'on_emergency' ? 'animate-pulse' : '';

  return L.divIcon({
    className: `custom-vehicle-marker ${pulse}`,
    html: `
      <div class="relative">
        <div class="text-4xl drop-shadow-lg">${emoji}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="relative">
        <div class="w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-lg"></div>
        <div class="absolute top-0 left-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-75"></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

export const EmergencyMap = forwardRef<EmergencyMapRef, EmergencyMapProps>(
  ({ vehicles, userLocation }, ref) => {
    const defaultCenter: [number, number] = [40.7128, -74.006];
    const internalMapRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      flyToLocation: (location: Coordinates) => {
        if (internalMapRef.current && internalMapRef.current.flyToLocation) {
          internalMapRef.current.flyToLocation(location);
        }
      },
    }));

    return (
      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          vehicles={vehicles}
          userLocation={userLocation}
          mapRef={internalMapRef}
        />

      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={createUserIcon()}
        >
          <Popup>
            <div className="text-sm font-medium">Your Location</div>
          </Popup>
        </Marker>
      )}

      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.latitude, vehicle.longitude]}
          icon={createVehicleIcon(vehicle.vehicle_type, vehicle.status)}
        >
          <Popup>
            <div className="space-y-1">
              <div className="font-bold text-base capitalize">
                {vehicle.vehicle_type} {vehicle.vehicle_number}
              </div>
              {vehicle.driver_name && (
                <div className="text-sm text-gray-600">
                  Driver: {vehicle.driver_name}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    vehicle.status === 'on_emergency'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {vehicle.status === 'on_emergency' ? 'On Emergency' : 'Available'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {new Date(vehicle.last_updated).toLocaleTimeString()}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      </MapContainer>
    );
  }
);

EmergencyMap.displayName = 'EmergencyMap';
