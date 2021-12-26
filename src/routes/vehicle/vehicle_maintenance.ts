import {Route} from '../routeInterface'
import {HttpServer} from '../httpServerInterface';
import {Next, Request, Response} from 'restify';
import {vehicleController} from './vehicle.controller';
import {BadRequestError, InternalServerError, NotFoundError} from 'restify-errors';
import {GenericController} from "../generic.controller";

export class VehicleMaintenanceRoute implements Route {
    static VEHICLE_MAINTENANCE_BODY_REQUIRED_PARAMS: string[] = ["user_id", "maintenance_date", "type", "mileage", "cost", "details",
        "inspector"];
    private VEHICLES_BASE_PATH: string;

    public constructor(base_path: string){
        this.VEHICLES_BASE_PATH = base_path;
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.VEHICLES_BASE_PATH + '/:vehicle_id/vehicle_maintenance', this.getVehicleMaintenances.bind(this));
        httpServer.put(this.VEHICLES_BASE_PATH + '/vehicle_maintenance/:id', this.updateVehicleMaintenance.bind(this));
        httpServer.post(this.VEHICLES_BASE_PATH + '/:vehicle_id/vehicle_maintenance', this.createVehicleMaintenance.bind(this));
    }

    private async createVehicleMaintenance(req: Request, res: Response, next: Next): Promise<void> {
        let vehicle_id = req.params.vehicle_id;
        if (!vehicle_id) {
            return next(new BadRequestError("Need to provide a vehicle ID."));
        }

        let result = await vehicleController.searchVehicle({id: vehicle_id});
        if(result.length == 0) {
            return next(new NotFoundError( "Vehicle with id: "+ vehicle_id + " not found"));
        }

        let missingParam = GenericController.verifyBodyParams(req.body, VehicleMaintenanceRoute.VEHICLE_MAINTENANCE_BODY_REQUIRED_PARAMS);
        if(missingParam) {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }

        try{
            res.send(201, await vehicleController.createVehicleMaintenance(vehicle_id, req.body));
            return next();
        }
        catch (err){
            console.error(err);
            return next(new InternalServerError(err.code));
        }
    }

    private async updateVehicleMaintenance(req: Request, res: Response, next: Next): Promise<void> {
        let maintenance_id = req.params.id;
        if (!maintenance_id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }

        try{
            res.send(204, await vehicleController.updateVehicleMaintenance(maintenance_id, req.body));
            return next();
        } catch(err){
            return next(new InternalServerError(err.code));
        }
    }

    private async getVehicleMaintenances(req: Request, res: Response, next: Next): Promise<void> {
        let vehicle_id = req.params.vehicle_id;
        if (!vehicle_id) {
            return next(new BadRequestError("Need to provide a vehicle ID."));
        }

        let result = await vehicleController.searchVehicle({id: vehicle_id});
        if(result.length == 0) {
            return next(new NotFoundError( "Vehicle with id: "+ vehicle_id + " not found"));
        }

        try{
            res.send(await vehicleController.getVehicleMaintenancesByVehicleID(vehicle_id));
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }
}
