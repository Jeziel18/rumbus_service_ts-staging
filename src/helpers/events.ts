const EventEmitter = require('events');

// Event Emitters
export const announcementEmitter = new EventEmitter();
export const deviceEmitter = new EventEmitter();
export const tripEmitter = new EventEmitter();
export const vehicleEmitter = new EventEmitter();
export const userEmitter = new EventEmitter();

// EVENTS
// Announcement Events
export const NEW_ANNOUNCEMENT = "new-announcement";

// Device Events
export const DEVICE_OTP_VERIFIED = "device-otp-verified";
export const DEVICE_OTP_NOT_VERIFIED = "device-otp-verified:unsuccessful";
export const DEVICE_REGISTERED = "device-registered";
export const DEVICE_NOT_REGISTERED = "device-registered:canceled";

// Trip Events
export const TRIP_CREATED = "trip:created";
export const TRIP_STARTED = "trip:started";
export const TRIP_CANCELED = "trip:canceled";
export const TRIP_ENDED = "trip:ended";
export const TRIP_STATUS_ENDED = "trip-status-changed:ended";
export const TRIP_DATETIME_ASSIGNED = "trip-datetime:assigned";
export const TRIP_DATETIME_NOW = "trip-datetime:now";
export const TRIP_DATETIME_NOT_NOW = "trip-datetime:not-now";
export const TRIP_END_DATETIME_NOW = "trip-end-datetime:now";
export const TRIP_ACTIVE_UPDATED = "trip-active:updated";

// Vehicle Events
// TODO: Add "x distance has been traveled since last location" event.
export const VEHICLE_ARRIVED_STOP = "vehicle-arrived:stop";
export const VEHICLE_LOCATION_AVAILABLE = "vehicle-location:available";
export const VEHICLE_LOCATION_CHANGED = "vehicle-location:received";
export const VEHICLE_STATUS_CHANGED = "vehicle-status:changed";
export const VEHICLE_STATUS_AVAILABLE = "vehicle-status:available";
export const VEHICLE_NEW_ETA = "vehicle-eta:available";

// User Events
export const USER_STARTS_TRIP = "user-starts:trip";
export const USER_CHANGE_TRIP_STATUS = "user-changes:trip-status";
export const USER_CANCELS_TRIP = "user-cancels:trip";
export const USER_CREATES_ANNOUNCEMENT = "user-creates:announcement";
export const USER_REGISTERS_DEVICE = "user-registers:new-device";
