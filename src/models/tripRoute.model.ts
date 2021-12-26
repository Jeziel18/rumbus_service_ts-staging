import {Stop} from "./stop.model";

export interface TripRoute{
    id: string;
    name: string;
    description: string;
    stops: Array<Stop> | null;
    geometry: string | Array<Array<number>> | null;
    created_on: Date;
    updated_on: Date;
}
