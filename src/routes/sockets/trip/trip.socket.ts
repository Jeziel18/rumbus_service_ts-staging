import { Socket, Server, Namespace } from 'socket.io';
import * as os from 'os';
import {StopController} from "../../stop/stop.controller";
import {OSRM, OSRMParams} from "../../../helpers/osrm";
export const STOP_PROXIMITY_THRESHOLD = 10;
export const CONNECTION_SOCKET_EVENT = "connect";
export const LOCATION_CHANGED_SOCKET_EVENT = "location_changed";
export class TripIO {
    private ioTrip: Namespace;

    constructor(io: Server) {
        this.ioTrip = io.of('/socket/trip');

        this.ioTrip.use((socket, next) => {
            // ensure the user has sufficient rights
            next();
        });

        this.ioTrip.on(CONNECTION_SOCKET_EVENT, (socket:Socket) => {
            console.log("Socket connected!")
            let data = {
                "server_hostname": os.hostname()
            }
            this.ioTrip.emit("initial_data", data);
            socket.on(LOCATION_CHANGED_SOCKET_EVENT,
                (location:any) => this.handleLocationReceivedEvent(location, socket))
    });
    }
    async handleLocationReceivedEvent(location:any, socket:Socket){
        // TODO: Send Location Changed event to SSE
        console.log(LOCATION_CHANGED_SOCKET_EVENT + ": " + location["lat"] + ", " + location["lon"]);
        let stops:any[];
        stops = await StopController.getAllStops();
        if(stops.length > 0){
            stops.unshift(location);
            let options = {sources: "0;0", annotations: "distance"}
            let osrm_params: OSRMParams = {
                service: "table",
                version: "v1",
                profile: "driving",
                coordinates: stops,
                options: options
            };
            let osrm_data = await OSRM.osrm(osrm_params);
            for(let i=1; i<stops.length;i++){
                if(osrm_data['distances'][0][i] < STOP_PROXIMITY_THRESHOLD){
                    console.log("Close to stop: " + stops[i]["name"] + " " + location["lat"] + "," + location["lon"]);
                    socket.emit("near_stop", stops[i]);
                    break;
                }
            }
        }
    }


}

