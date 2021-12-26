import config from '../configs/localEnvSetup';
import {Stop} from "../models/stop.model";

const axios = require('axios');

export interface OSRMParams {
    service: string,
    version: string,
    profile: string,
    coordinates: Array<Stop>,
    options?: Object
}


export class OSRM {

    public static async osrm(params: OSRMParams): Promise<any> {
        let url = `${config.osrm_endpoint}/${ params.service }/${ params.version }/${ params.profile }/`;
        for (let i=0; i < params.coordinates.length; i++) {
            let lat = params.coordinates[i].lat;
            let lon = params.coordinates[i].lon;
            if (i < params.coordinates.length-1) {
                url += `${lon},${lat};`;
            } else {
                url += `${lon},${lat}`;
            }
        }
        // Attach options parameters
        if (params.options) {
            let keys = Object.keys(params.options);
            let values = Object.values(params.options);
            for (let i=0; i < keys.length; i++) {
                if (i == 0) {
                    url += `?${keys[i]}=${values[i]}`;
                } else {
                    url += `&${keys[i]}=${values[i]}`;
                }
            }
        }
        try {
            let res = await axios.get(url).catch((error: any)=>{
                console.log(error)
            });
            return res.data;
        } catch (err) {
            throw err;
        }
    }

    public static extractWaypoints(data: any) {
        let waypoints = [];
        for (let waypoint in data.waypoints) {
            waypoints.push(data.waypoints[waypoint].location);
        }
        return waypoints;
    }

    public static extractGeometry(data: any) {
        let geometries = [];
        for (let trip in data.trips) {
            geometries.push(data.trips[trip].geometry)
        }
        return geometries;
    }

    public static verifyOSRMProperty(obj: Object, key: string, value: any) {
        for (let x=0; x < Object.keys(obj).length; x++) {
            if (Object.keys(obj)[x] === key && Object.values(obj)[x] === value) {
                return true;
            }
        }
        return false;
    }
}
