import {Route} from '../routeInterface'
import {HttpServer} from '../httpServerInterface';
import {Next, Request, Response} from 'restify';
import {vehicleController} from './vehicle.controller';
import {BadRequestError, InternalServerError, NotFoundError} from 'restify-errors';
import {GenericController} from "../generic.controller";
import {VehicleUsageRoute} from "./vehicle_usage";
import {VehicleMaintenanceRoute} from "./vehicle_maintenance";

export class VehicleRoute implements Route {
    static VEHICLE_REQUIRED_BODY_PARAMS: string[] = ["property_number", "plate", "model", "brand", "capacity",
        "handicap_enabled", "mileage", "ownership"];
    private VEHICLES_BASE_PATH: string;
    private vehicleUsageRoute: Route;
    private vehicleMaintenanceRoute: Route;

    public constructor(base_path: string){
        this.VEHICLES_BASE_PATH = base_path;
        this.vehicleUsageRoute = new VehicleUsageRoute(base_path);
        this.vehicleMaintenanceRoute = new VehicleMaintenanceRoute(base_path);
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.VEHICLES_BASE_PATH, this.getAllVehicles.bind(this));
        httpServer.get(this.VEHICLES_BASE_PATH + '/:id', this.getVehicleWithId.bind(this));
        httpServer.get(this.VEHICLES_BASE_PATH + '/search', this.searchVehicle.bind(this));
        httpServer.post(this.VEHICLES_BASE_PATH, this.createVehicle.bind(this));
        httpServer.put(this.VEHICLES_BASE_PATH + '/:id', this.updateVehicleWithId.bind(this));
        httpServer.del(this.VEHICLES_BASE_PATH + '/:id', this.deleteVehicleWithId.bind(this));
        this.vehicleUsageRoute.initialize(httpServer);
        this.vehicleMaintenanceRoute.initialize(httpServer);
    }

    private async getAllVehicles(req: Request, res: Response, next: Next): Promise<void> {
        try{
            res.send(await vehicleController.getAllVehicles());
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

    private async getVehicleWithId(req: Request, res: Response, next: Next): Promise<void> {
        let id = req.params.id;
        if (!id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try{
            let result = await vehicleController.searchVehicle({ id: id });
            if(result.length < 1){
                return next(new NotFoundError( "Vehicle with id: "+ id + " not found"));
            } else{
                res.send(result[0]);
                return next();
            }
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

    private async searchVehicle(req: Request, res: Response, next: Next): Promise<void> {
        try{
            res.send(await vehicleController.searchVehicle(req.query));
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

    private async updateVehicleWithId(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try{
            res.send(204, await vehicleController.updateVehicle(req.params.id, req.body));
            return next();
        } catch(err){
            return next(new InternalServerError(err.code));
        }
    }

    private async deleteVehicleWithId(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try{
            res.send(204, await vehicleController.deleteVehicle(req.params.id));
            return next();
        } catch (err){
            console.error(err);
            return next(new InternalServerError(err.code));
        }
    }

    private async createVehicle(req: Request, res: Response, next: Next): Promise<void> {
        let missingParam = GenericController.verifyBodyParams(req.body, VehicleRoute.VEHICLE_REQUIRED_BODY_PARAMS);
        if(!missingParam) {
            try{
                res.send(201, await vehicleController.createVehicle(req.body));
                return next();
            } catch (err){
                return next(new InternalServerError(err.code));
            }
        }
        else {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }
    }

}
