import {HttpServer} from '../httpServerInterface';
import {Next, Request, Response} from 'restify';
import {BadRequestError, InternalServerError, NotFoundError} from "restify-errors";
import {tripController} from "../trip/trip.controller";
import {Route} from "../routeInterface";
import {vehicleController} from "./vehicle.controller";

export class VehicleUsageRoute implements Route{
    static VEHICLE_USAGE_REQUIRED_BODY_PARAMS: string[] = ["trip_id", "start_mileage", "end_mileage", "start_gas",
        "end_gas", "gas_expense"];
    private VEHICLES_BASE_PATH: string;

    public constructor(base_path: string){
        this.VEHICLES_BASE_PATH = base_path;
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.VEHICLES_BASE_PATH + '/:vehicle_id/vehicle_usages', this.getVehicleUsagesByVehicleID.bind(this));
        httpServer.get(this.VEHICLES_BASE_PATH + '/vehicle_usages/:trip_id', this.getVehicleUsageByTripID.bind(this));
        httpServer.put(this.VEHICLES_BASE_PATH + '/vehicle_usages/:trip_id', this.updateVehicleUsageByTripID.bind(this));
    }

    private async getVehicleUsageByTripID(req: Request, res: Response, next: Next): Promise<void> {
        let trip_id = req.params.trip_id;
        if (!trip_id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }

        let result = await tripController.getTripWithId(trip_id);
        if(result.length == 0) {
            return next(new NotFoundError( "Trip with id: "+ trip_id + " not found"));
        }

        try{
            let result = await vehicleController.getVehicleUsageByTripID(trip_id);
            res.send(result[0]);
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

    private async updateVehicleUsageByTripID(req: Request, res: Response, next: Next): Promise<void> {
        let trip_id = req.params.trip_id;
        if (!trip_id) {
            return next(new BadRequestError("Need to provide a trip ID."));
        }

        try{
            res.send(204, await vehicleController.updateVehicleUsage(trip_id, req.body));
            return next();
        } catch(err){
            return next(new InternalServerError(err.code));
        }
    }

    private async getVehicleUsagesByVehicleID(req: Request, res: Response, next: Next): Promise<void> {
        let vehicle_id = req.params.vehicle_id;
        if (!vehicle_id) {
            return next(new BadRequestError("Need to provide a vehicle ID."));
        }

        let result = await vehicleController.searchVehicle({id: vehicle_id});
        if(result.length == 0) {
            return next(new NotFoundError( "Vehicle with id: "+ vehicle_id + " not found"));
        }

        try{
            res.send(await vehicleController.getVehicleUsagesByVehicleID(vehicle_id));
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }
}
