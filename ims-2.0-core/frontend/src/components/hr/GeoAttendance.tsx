// ============================================================================
// IMS 2.0 - Geo-Fenced Attendance Component
// ============================================================================
// Attendance check-in/out with location verification

import { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogIn,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';

interface StoreLocation {
  storeId: string;
  storeName: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime?: string;
  checkInLocation?: { lat: number; lng: number };
  checkInVerified: boolean;
  checkOutTime?: string;
  checkOutLocation?: { lat: number; lng: number };
  checkOutVerified: boolean;
  workHours?: number;
  status: 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT';
}

interface GeoAttendanceProps {
  userId: string;
  userName: string;
  storeLocation: StoreLocation;
  todayRecord?: AttendanceRecord;
  onCheckIn: (location: { lat: number; lng: number }) => Promise<boolean>;
  onCheckOut: (location: { lat: number; lng: number }) => Promise<boolean>;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function GeoAttendance({
  userId,
  userName,
  storeLocation,
  todayRecord,
  onCheckIn,
  onCheckOut,
}: GeoAttendanceProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  // Get current location
  const fetchLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(loc);

        // Calculate distance from store
        const dist = calculateDistance(
          loc.lat, loc.lng,
          storeLocation.lat, storeLocation.lng
        );
        setDistance(dist);
        setIsLoadingLocation(false);
      },
      (error) => {
        let msg = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out';
            break;
        }
        setLocationError(msg);
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Fetch location on mount
  useEffect(() => {
    fetchLocation();
  }, []);

  const isWithinRange = distance !== null && distance <= storeLocation.radiusMeters;
  const status = todayRecord?.status || 'NOT_CHECKED_IN';

  const handleCheckIn = async () => {
    if (!currentLocation || !isWithinRange) return;

    setIsProcessing(true);
    await onCheckIn(currentLocation);
    setIsProcessing(false);
  };

  const handleCheckOut = async () => {
    if (!currentLocation || !isWithinRange) return;

    setIsProcessing(true);
    await onCheckOut(currentLocation);
    setIsProcessing(false);
  };

  const formatTime = (time?: string) => {
    if (!time) return '--:--';
    return time;
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
          <p className="text-sm text-gray-500">{storeLocation.storeName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          <p className="text-2xl font-bold text-gray-900">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Location Status */}
      <div className={clsx(
        'p-4 rounded-lg mb-4',
        locationError && 'bg-red-50 border border-red-200',
        isLoadingLocation && 'bg-gray-50 border border-gray-200',
        currentLocation && isWithinRange && 'bg-green-50 border border-green-200',
        currentLocation && !isWithinRange && 'bg-yellow-50 border border-yellow-200'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center',
              locationError && 'bg-red-100',
              isLoadingLocation && 'bg-gray-100',
              currentLocation && isWithinRange && 'bg-green-100',
              currentLocation && !isWithinRange && 'bg-yellow-100'
            )}>
              <MapPin className={clsx(
                'w-5 h-5',
                locationError && 'text-red-600',
                isLoadingLocation && 'text-gray-600 animate-pulse',
                currentLocation && isWithinRange && 'text-green-600',
                currentLocation && !isWithinRange && 'text-yellow-600'
              )} />
            </div>
            <div>
              {isLoadingLocation && (
                <>
                  <p className="font-medium text-gray-700">Detecting Location...</p>
                  <p className="text-sm text-gray-500">Please wait</p>
                </>
              )}
              {locationError && (
                <>
                  <p className="font-medium text-red-700">Location Error</p>
                  <p className="text-sm text-red-600">{locationError}</p>
                </>
              )}
              {currentLocation && isWithinRange && (
                <>
                  <p className="font-medium text-green-700">Location Verified</p>
                  <p className="text-sm text-green-600">
                    You are within {Math.round(distance!)}m of {storeLocation.storeName}
                  </p>
                </>
              )}
              {currentLocation && !isWithinRange && (
                <>
                  <p className="font-medium text-yellow-700">Outside Store Range</p>
                  <p className="text-sm text-yellow-600">
                    You are {Math.round(distance!)}m away (max: {storeLocation.radiusMeters}m)
                  </p>
                </>
              )}
            </div>
          </div>

          <button
            onClick={fetchLocation}
            disabled={isLoadingLocation}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-5 h-5', isLoadingLocation && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Today's Status */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={clsx(
          'p-4 rounded-lg border text-center',
          todayRecord?.checkInTime ? 'border-green-200 bg-green-50' : 'border-gray-200'
        )}>
          <LogIn className={clsx(
            'w-8 h-8 mx-auto mb-2',
            todayRecord?.checkInTime ? 'text-green-600' : 'text-gray-400'
          )} />
          <p className="text-sm text-gray-500">Check In</p>
          <p className="text-xl font-bold text-gray-900">{formatTime(todayRecord?.checkInTime)}</p>
          {todayRecord?.checkInVerified !== undefined && (
            <span className={clsx(
              'text-xs',
              todayRecord.checkInVerified ? 'text-green-600' : 'text-red-600'
            )}>
              {todayRecord.checkInVerified ? '✓ Geo verified' : '✗ Not verified'}
            </span>
          )}
        </div>

        <div className={clsx(
          'p-4 rounded-lg border text-center',
          todayRecord?.checkOutTime ? 'border-green-200 bg-green-50' : 'border-gray-200'
        )}>
          <LogOut className={clsx(
            'w-8 h-8 mx-auto mb-2',
            todayRecord?.checkOutTime ? 'text-green-600' : 'text-gray-400'
          )} />
          <p className="text-sm text-gray-500">Check Out</p>
          <p className="text-xl font-bold text-gray-900">{formatTime(todayRecord?.checkOutTime)}</p>
          {todayRecord?.checkOutVerified !== undefined && (
            <span className={clsx(
              'text-xs',
              todayRecord.checkOutVerified ? 'text-green-600' : 'text-red-600'
            )}>
              {todayRecord.checkOutVerified ? '✓ Geo verified' : '✗ Not verified'}
            </span>
          )}
        </div>
      </div>

      {/* Work Hours */}
      {todayRecord?.workHours !== undefined && (
        <div className="p-3 bg-gray-50 rounded-lg mb-4 text-center">
          <p className="text-sm text-gray-500">Work Hours</p>
          <p className="text-2xl font-bold text-gray-900">
            {Math.floor(todayRecord.workHours)}h {Math.round((todayRecord.workHours % 1) * 60)}m
          </p>
        </div>
      )}

      {/* Action Button */}
      <div>
        {status === 'NOT_CHECKED_IN' && (
          <button
            onClick={handleCheckIn}
            disabled={!isWithinRange || isProcessing}
            className={clsx(
              'w-full py-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-colors',
              isWithinRange
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Check In
              </>
            )}
          </button>
        )}

        {status === 'CHECKED_IN' && (
          <button
            onClick={handleCheckOut}
            disabled={!isWithinRange || isProcessing}
            className={clsx(
              'w-full py-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-colors',
              isWithinRange
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                Check Out
              </>
            )}
          </button>
        )}

        {status === 'CHECKED_OUT' && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-600 font-medium">Attendance completed for today</p>
          </div>
        )}
      </div>

      {/* Warning for outside range */}
      {currentLocation && !isWithinRange && status !== 'CHECKED_OUT' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            You must be within {storeLocation.radiusMeters}m of the store to mark attendance.
            Please move closer to the store and refresh your location.
          </p>
        </div>
      )}
    </div>
  );
}

export default GeoAttendance;
