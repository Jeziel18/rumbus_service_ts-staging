import {HttpServer} from '../httpServerInterface';
import {Next, Request, Response} from 'restify';
import {BadRequestError, InternalServerError, NotFoundError} from "restify-errors";
import {tripController} from "./trip.controller";
import {GenericController} from "../generic.controller";
import {Route} from "../routeInterface";


export class TripEventRoute implements Route{
    static TRIP_EVENT_REQUIRED_BODY_PARAMS: string[] = ["description", "type"];
    private TRIPS_BASE_PATH: string;

    public constructor(base_path: string){
        this.TRIPS_BASE_PATH = base_path;
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.TRIPS_BASE_PATH + '/:trip_id/events', this.getTripEventsByTripID.bind(this));
        httpServer.post(this.TRIPS_BASE_PATH + '/:trip_id/events', this.createTripEvent.bind(this));
    }

    private async getTripEventsByTripID(req: Request, res: Response, next: Next): Promise<void> {
        let trip_id = req.params.trip_id;
        if (!trip_id) {
            return next(new BadRequestError("Need to provide a trip ID."));
        }

        let result = await tripController.getTripWithId(trip_id);
        if(result.length == 0) {
            return next(new NotFoundError( "Trip with id: "+ trip_id + " not found"));
        }

        try{
            res.send(await tripController.getTripEventsByTripID(trip_id));
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

    private async createTripEvent(req: Request, res: Response, next: Next): Promise<void> {
        let trip_id = req.params.trip_id;
        if (!trip_id) {
            return next(new BadRequestError("Need to provide a trip ID."));
        }

        let result = await tripController.getTripWithId(trip_id);
        if(result.length == 0) {
            return next(new NotFoundError( "Trip with id: "+ trip_id + " not found"));
        }

        let missingParam = GenericController.verifyBodyParams(req.body, TripEventRoute.TRIP_EVENT_REQUIRED_BODY_PARAMS);
        if(missingParam) {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }

        try{
            await tripController.createTripEvent(trip_id, req.body);
            res.json(201,{message: "Trip event created!"});
            return next();
        } catch (err){
            return next(new InternalServerError(err.code));
        }
    }

}
