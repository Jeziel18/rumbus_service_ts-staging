import {HomeRoute} from './home/home';
import {DriverRoute} from './driver/driver';
import {TripRouteRoute} from './route/route'
import {VehicleRoute} from './vehicle/vehicle';
import {TripRoute} from "./trip/trip";
import {UserRoute} from "./user/user";
import {AnnouncementRoute} from "./announcement/announcement";
import {StopRoute} from "./stop/stop";
import { AdminIO } from "./sockets/admin/admin.socket"
import { CalendarRoute } from './calendar/calendar';
import { AgencyRoute } from './agency/agency';

export const ROUTES = [
    new HomeRoute(),
    new DriverRoute("/drivers"),
    new VehicleRoute("/vehicles"),
    // new DeviceRoute(),
    new TripRoute("/trips"),
    new TripRouteRoute("/routes"),
    new UserRoute("/users"),
    new AnnouncementRoute("/announcements"),
    new StopRoute("/stops"),
    new CalendarRoute("/calendar"),
    new AgencyRoute("/agency")
];

export const SOCKETSPACES = [
    AdminIO
];
