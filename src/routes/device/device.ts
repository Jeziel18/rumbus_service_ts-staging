import {Route} from '../routeInterface'
import {HttpServer} from '../httpServerInterface';
import {Next, Request, Response} from 'restify';
import {DeviceController} from './device.controller';
import {Server} from 'socket.io';
import errors from 'restify-errors'

export class DeviceRoute implements Route {
    deviceController: DeviceController;
    constructor(io: Server) {
        this.deviceController = new DeviceController(io);
    }
    // TODO: Del and put need to be implemented
    public initialize(httpServer: HttpServer): void {
        httpServer.post('/devices/verify', this.verifyDevice.bind(this));
        httpServer.get('/devices/search', this.searchDevice.bind(this));
        httpServer.get('/devices/:id', this.getDeviceWithId.bind(this));
        httpServer.get('/devices', this.getAllDevices.bind(this));
        httpServer.post('/devices', this.createDevices.bind(this));
        httpServer.post('/devices/testSocket', this.testSocketConnection.bind(this));


    }
    private async testSocketConnection(req: Request, res: Response, next: Next): Promise<void> {
        res.send(this.deviceController.testSocketEvent());
    }
    private async searchDevice(req: Request, res: Response, next: Next): Promise<void> {
        try {
            res.send(await this.deviceController.searchDevice(req.query));
        }
        catch (err) {
            // TODO: Add logger and pass complete err object
            return next(new errors.InternalServerError(err.code))
        }

    }
    private async getDeviceWithId(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new errors.BadRequestError("Need to provide an ID to look for."));
        }
        try {
            let result = await this.deviceController.searchDevice({ id: req.params.id });
            if (result.length < 1) {
                return next(new errors.NotFoundError("Device with id: " + req.params.id + " not found"));
            } else {
                res.send(result[0]);
                return next();
            }
        }
        catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async getAllDevices(req: Request, res: Response, next: Next): Promise<void> {
        try {
            res.send(await this.deviceController.getAllDevices(req.query));
            return next();
        }
        catch (err) {
            return next(new errors.InternalServerError(err.code));

        }
    }

    private async verifyDevice(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.body.otp || !req.body.imei)
            return next(new errors.BadRequestError("Need otp and imei to continue."));
        try {
            let result: boolean = await this.deviceController.verifyDevice(req.body.imei, req.body.otp);
            let status: number, message: string;
            if(result){
                status = 200;
                message = "Device was succesfully verified.";
            } else{
                status = 401;
                message = "The one time password is not valid.";
            }
            res.send(status, {"message": message});
            return next();
        }
        catch (err) {
            return next(new errors.InternalServerError(err.code));
        }

    }
    private async createDevices(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.body.name){
            return next(new errors.BadRequestError("Need to provide a name."));
        }
        try {
            res.send(201, await this.deviceController.createDevice(req.body));
            return next();
        }
        catch (err) {
            return next(new errors.InternalServerError(err.code));
        }

    }



}
