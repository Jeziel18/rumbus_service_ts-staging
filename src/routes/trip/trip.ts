import {Route} from '../routeInterface'
import {HttpServer} from '../httpServerInterface';
import {Next, Request, Response} from 'restify';
import errors, {BadRequestError, InternalServerError, NotFoundError} from "restify-errors";
import {tripController} from "./trip.controller";
import {GenericController} from "../generic.controller";
import {TripEventRoute} from "./trip_event";
import {TripHistoryRoute} from "./trip_history";


export class TripRoute implements Route {
    static TRIP_REQUIRED_BODY_PARAMS: string[] = ["trip_number", "driver_id", "vehicle_id", "user_id",
        "applicant", "faculty", "purpose", "departure_time"];
    private TRIPS_BASE_PATH: string;
    private tripEventRoute: Route;
    private tripHistoryRoute: Route;

    public constructor(base_path: string){
        this.TRIPS_BASE_PATH = base_path;
        this.tripEventRoute = new TripEventRoute(base_path);
        this.tripHistoryRoute = new TripHistoryRoute(base_path);
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.TRIPS_BASE_PATH + '/active', this.getAllActiveTrips.bind(this));
        httpServer.get(this.TRIPS_BASE_PATH + '/search', this.searchTrip.bind(this));
        httpServer.get(this.TRIPS_BASE_PATH + '/:id', this.getTripWithId.bind(this));
        httpServer.put(this.TRIPS_BASE_PATH + '/end-trip/:id', this.endTrip.bind(this));
        httpServer.post(this.TRIPS_BASE_PATH, this.createTrip.bind(this));
        httpServer.put(this.TRIPS_BASE_PATH + '/:id', this.updateTripWithId.bind(this));
        httpServer.del(this.TRIPS_BASE_PATH + '/:id', this.deleteTrip.bind(this));
        httpServer.post(this.TRIPS_BASE_PATH + '/:id/cancel', this.cancelTrip.bind(this));
        httpServer.put(this.TRIPS_BASE_PATH + '/:id/cancel', this.updateCancelledTrip.bind(this));

        this.tripEventRoute.initialize(httpServer);
        this.tripHistoryRoute.initialize(httpServer);
    }

    private async getAllActiveTrips(req: Request, res: Response, next: Next): Promise<void> {
        try{
            res.send(await tripController.getAllActiveTrips());
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

    private async getTripWithId(req: Request, res: Response, next: Next): Promise<void> {
        let id = req.params.id;
        if (!id) {
            return next(new errors.BadRequestError("Need to provide an ID to look for."));
        }
        try {
            let result = await tripController.getTripWithId(id);
            if(result.length < 1){
                return next(new errors.NotFoundError( "Trip with id: "+ id + " not found"));
            } else{
                res.send(result[0]);
                return next();
            }
        } catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async searchTrip(req: Request, res: Response, next: Next): Promise<void> {
        try{
            res.send(await tripController.searchTrip(req.query))
        } catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async updateTripWithId(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }else if(!req.query.public || (req.query.public != "0" && req.query.public != "1")){
            return next(new BadRequestError("Need to provide query param 'public' (0 or 1)."));
        }
        try{
            let id: string = req.params.id;
            let isPublic: boolean = req.query.public == "1";
            res.send(204, await tripController.updateTrip(id, req.body, isPublic));
        }catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async endTrip(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try{
            let id = req.params.id;
            res.send(204, await tripController.endTrip(id));
        }catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async createTrip(req: Request, res: Response, next: Next): Promise<void> {
        let missingParam;
        switch (req.body.public) {
            case undefined:
                missingParam = "public";
                break;
            case "1":
                missingParam = GenericController.verifyBodyParams(req.body, TripRoute.TRIP_REQUIRED_BODY_PARAMS.concat(["route_id"]));
                break;
            case "0":
                missingParam = GenericController.verifyBodyParams(req.body, TripRoute.TRIP_REQUIRED_BODY_PARAMS.concat(["destination", "type"]));
                break;
        }
        if (!missingParam) {
            try{
                res.send(201, await tripController.createTrip(req.body));
                return next();
            } catch (err) {
                return next(new errors.InternalServerError(err.code))
            }
        }
        else {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }
    }

    private async deleteTrip(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try {
            res.send(204, await tripController.deleteTrip(req.params.id))
        }catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async cancelTrip(req: Request, res: Response, next: Next): Promise<void> {
        let trip_id = req.params.id;
        if (!trip_id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        if (!req.body || !req.body.purpose){
            return next(new BadRequestError("Missing param in body: Need to provide 'purpose'."));
        }

        let result = await tripController.getTripWithId(trip_id);
        if(result.length == 0) {
            return next(new NotFoundError( "Trip with id: "+ trip_id + " not found"));
        }

        let body = {trip_id:trip_id, purpose:req.body.purpose};
        try {
            res.send(204, await tripController.cancelTrip(body));
            return next();
        }catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async updateCancelledTrip(req: Request, res: Response, next: Next): Promise<void> {
        let trip_id = req.params.id;
        if (!trip_id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }

        let result = await tripController.getTripWithId(trip_id);
        if(result.length == 0) {
            return next(new NotFoundError( "Trip with id: "+ trip_id + " not found"));
        }

        try {
            res.send(204, await tripController.updateCancelledTrip(trip_id, req.body));
            return next();
        }catch (err) {
            return next(new errors.InternalServerError(err.code));
        }
    }
}
