export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const geolocationService = {
  getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        }
      );
    });
  },

  watchPosition(
    callback: (coords: Coordinates) => void,
    errorCallback?: (error: GeolocationPositionError) => void
  ): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      errorCallback,
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  },

  clearWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  },
};
