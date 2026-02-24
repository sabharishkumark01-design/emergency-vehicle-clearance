import { useState, useEffect, useRef } from 'react';
import { vehicleService } from '../services/vehicleService';
import { geolocationService } from '../services/geolocationService';
import { Power, AlertCircle, ArrowLeft } from 'lucide-react';

interface DriverDashboardProps {
  onNavigate: (page: 'landing' | 'driver') => void;
}

export function DriverDashboard({ onNavigate }: DriverDashboardProps) {
  const [vehicleType, setVehicleType] = useState<'ambulance' | 'fire'>('ambulance');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [status, setStatus] = useState<'available' | 'on_emergency'>('available');
  const [isActive, setIsActive] = useState(false);
  const [currentVehicleId, setCurrentVehicleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startSharing = async () => {
    try {
      setError(null);
      const position = await geolocationService.getCurrentPosition();

      const vehicle = await vehicleService.createVehicle({
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        driver_name: driverName || null,
        latitude: position.latitude,
        longitude: position.longitude,
        status,
        is_active: true,
      });

      if (!vehicle) {
        throw new Error('Failed to create vehicle record');
      }

      setCurrentVehicleId(vehicle.id);
      setIsActive(true);
      setLastUpdate(new Date());

      watchIdRef.current = geolocationService.watchPosition(
        async (coords) => {
          if (vehicle.id) {
            const success = await vehicleService.updateVehicleLocation(
              vehicle.id,
              coords.latitude,
              coords.longitude,
              status
            );
            if (success) {
              setLastUpdate(new Date());
            }
          }
        },
        (err) => {
          console.error('Location tracking error:', err);
          setError('Location tracking error. Please check your GPS settings.');
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start sharing location');
    }
  };

  const stopSharing = async () => {
    if (watchIdRef.current !== null) {
      geolocationService.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (currentVehicleId) {
      await vehicleService.deactivateVehicle(currentVehicleId);
    }

    setIsActive(false);
    setCurrentVehicleId(null);
    setLastUpdate(null);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        geolocationService.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isActive && currentVehicleId) {
      vehicleService.updateVehicleLocation(
        currentVehicleId,
        0,
        0,
        status
      );
    }
  }, [status, isActive, currentVehicleId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <button
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Map
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Driver Dashboard</h1>
            <p className="text-blue-100">Share your live location with the emergency network</p>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-red-800">{error}</div>
              </div>
            )}

            {!isActive ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vehicle Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setVehicleType('ambulance')}
                      className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        vehicleType === 'ambulance'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">🚑</span>
                      <span className="font-semibold">Ambulance</span>
                    </button>
                    <button
                      onClick={() => setVehicleType('fire')}
                      className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        vehicleType === 'fire'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">🚒</span>
                      <span className="font-semibold">Fire Service</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g., AMB-001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Driver Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setStatus('available')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        status === 'available'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">Available</div>
                      <div className="text-xs mt-1">Ready for emergencies</div>
                    </button>
                    <button
                      onClick={() => setStatus('on_emergency')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        status === 'on_emergency'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">On Emergency</div>
                      <div className="text-xs mt-1">Responding to call</div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={startSharing}
                  disabled={!vehicleNumber.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  <Power className="w-5 h-5" />
                  Start Sharing Location
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <span className="text-4xl animate-pulse">📍</span>
                  </div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">Location Sharing Active</h3>
                  <p className="text-green-700">Your location is being shared in real-time</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Vehicle Type:</span>
                    <span className="font-semibold capitalize">
                      {vehicleType === 'ambulance' ? '🚑' : '🚒'} {vehicleType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Vehicle Number:</span>
                    <span className="font-semibold">{vehicleNumber}</span>
                  </div>
                  {driverName && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Driver:</span>
                      <span className="font-semibold">{driverName}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        status === 'on_emergency'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {status === 'on_emergency' ? 'On Emergency' : 'Available'}
                    </span>
                  </div>
                  {lastUpdate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Last Update:</span>
                      <span className="text-sm text-gray-500">
                        {lastUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Update Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setStatus('available')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        status === 'available'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">Available</div>
                    </button>
                    <button
                      onClick={() => setStatus('on_emergency')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        status === 'on_emergency'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">On Emergency</div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={stopSharing}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Power className="w-5 h-5" />
                  Stop Sharing Location
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Important Notes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Keep this app open while on duty</li>
            <li>• Ensure GPS is enabled for accurate tracking</li>
            <li>• Update your status when responding to emergencies</li>
            <li>• Stop sharing when going off duty</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
