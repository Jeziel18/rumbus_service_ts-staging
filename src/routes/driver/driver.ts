import {Route} from "../routeInterface"
import {HttpServer} from "../httpServerInterface";
import {Next, Request, Response} from 'restify';
import {driverController} from './driver.controller';
import errors, {BadRequestError} from 'restify-errors'
import {GenericController} from "../generic.controller";


export class DriverRoute implements Route {
    static DRIVER_REQUIRED_BODY_PARAMS: string[] = ["full_name", "license"];
    private DRIVERS_BASE_PATH: string;

    public constructor(base_path: string){
        this.DRIVERS_BASE_PATH = base_path;
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.DRIVERS_BASE_PATH, this.getAllDrivers.bind(this));
        httpServer.get(this.DRIVERS_BASE_PATH + '/search', this.searchDriver.bind(this));
        httpServer.get(this.DRIVERS_BASE_PATH + '/:id', this.getDriverWithId.bind(this));
        httpServer.put(this.DRIVERS_BASE_PATH + '/:id', this.updateDriver.bind(this));
        httpServer.post(this.DRIVERS_BASE_PATH, this.createDriver.bind(this));
        httpServer.del(this.DRIVERS_BASE_PATH + '/:id',this.deleteDriver.bind(this));
    }

    private async getAllDrivers(req: Request, res: Response, next: Next): Promise<void> {
        try {
            res.send(await driverController.getAllDrivers());
            return next();
        }
        catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async searchDriver(req: Request, res: Response, next: Next): Promise<void>{
        try{
            res.send(await driverController.searchDriver(req.query))
        } catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async getDriverWithId(req: Request, res: Response, next: Next): Promise<void>{
        let id = req.params.id;
        if (!id) {
            return next(new errors.BadRequestError("Need to provide an ID to look for."));
        }
        try {
            let result = await driverController.searchDriver({id: id});
            if(result.length < 1){
                return next(new errors.NotFoundError( "Driver with id: "+ id + " not found"));
            } else{
                res.send(result[0]);
                return next();
            }
        } catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async updateDriver(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try{
            let id = req.params.id;
            res.status(204);
            res.send(await driverController.updateDriver(id, req.body));
        }catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }
    private async createDriver(req: Request, res: Response, next: Next): Promise<void> {
        let missingParam = GenericController.verifyBodyParams(req.body, DriverRoute.DRIVER_REQUIRED_BODY_PARAMS);
        if (!missingParam) {
            try{
                res.send(201, await driverController.createDriver(req.body));
                return next();
            } catch (err) {
                return next(new errors.InternalServerError(err.code))
            }
        }
        else {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }

    }

    private async deleteDriver(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try {
            res.status(204);
            res.send(await driverController.deleteDriver(req.params.id))
        }catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

}
