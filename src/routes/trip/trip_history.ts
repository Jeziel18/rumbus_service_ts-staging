import {HttpServer} from '../httpServerInterface';
import {Next, Request, Response} from 'restify';
import {BadRequestError, InternalServerError, NotFoundError} from "restify-errors";
import {tripController} from "./trip.controller";
import {GenericController} from "../generic.controller";
import {Route} from "../routeInterface";


export class TripHistoryRoute implements Route{
    static TRIP_HISTORY_REQUIRED_BODY_PARAMS: string[] = ["geopoints"];
    static GEOPOINTS_REQUIRED_PARAMS: string[] = ["lat", "lon", "timestamp", "accuracy", "bearing"];
    private TRIPS_BASE_PATH: string;

    public constructor(base_path: string){
        this.TRIPS_BASE_PATH = base_path;
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.TRIPS_BASE_PATH + '/:trip_id/history', this.getTripHistoryByTripID.bind(this));
        httpServer.post(this.TRIPS_BASE_PATH + '/:trip_id/history', this.createTripHistory.bind(this));
    }

    private async getTripHistoryByTripID(req: Request, res: Response, next: Next): Promise<void> {
        let trip_id = req.params.trip_id;
        if (!trip_id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }

        let result = await tripController.getTripWithId(trip_id);
        if(result.length == 0) {
            return next(new NotFoundError( "Trip with id: "+ trip_id + " not found"));
        }

        try {
            res.send(await tripController.getTripHistoryByTripID(trip_id));
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }

    }

    private async createTripHistory(req: Request, res: Response, next: Next): Promise<void> {
        let trip_id = req.params.trip_id;

        if (!trip_id) {
            return next(new BadRequestError("Need to provide a trip ID."));
        }

        let result = await tripController.getTripWithId(trip_id);
        if(result.length == 0) {
            return next(new NotFoundError( "Trip with id: "+ trip_id + " not found"));
        }

        let missingBodyParam = GenericController.verifyBodyParams(req.body, TripHistoryRoute.TRIP_HISTORY_REQUIRED_BODY_PARAMS);
        if(missingBodyParam) {
            return next(new BadRequestError("Missing required body param: " + missingBodyParam));
        }

        for(let item of req.body.geopoints){
            let missingGeopointsParam = GenericController.verifyBodyParams(item, TripHistoryRoute.GEOPOINTS_REQUIRED_PARAMS);
            if(missingGeopointsParam) {
                return next(new BadRequestError("A geopoint is missing required param: " + missingGeopointsParam));
            }
        }

        try{
            await tripController.createTripHistory(trip_id, req.body);
            res.send(201, {message: "Trip history was successfully created!"});
            return next();
        } catch (err){
    		return next(new InternalServerError(err.code));
        }
    }

}
