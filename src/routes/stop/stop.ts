import { Route } from "../routeInterface";
import { HttpServer } from "../httpServerInterface";
import {Next, Request, Response} from "restify";
import {BadRequestError, ConflictError, InternalServerError, NotFoundError} from "restify-errors";
import {StopController, stopController} from "./stop.controller";
import {GenericController} from "../generic.controller";


export class StopRoute implements Route {
    static STOP_REQUIRED_PARAMS: string[] = ["name", "lat", "lon"];
    static STOP_UPDATE_PARAMS: string[] = ["name"];
    private readonly STOPS_BASE_PATH: string;

    public constructor(base_path: string) {
        this.STOPS_BASE_PATH = base_path;
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.STOPS_BASE_PATH, this.getAllStops.bind(this));
        httpServer.get(this.STOPS_BASE_PATH + "/:lat/:lon", this.getStopByLatLon.bind(this));
        httpServer.get(this.STOPS_BASE_PATH + "/search", this.searchStop.bind(this));
        httpServer.post(this.STOPS_BASE_PATH, this.createStop.bind(this));
        httpServer.put(this.STOPS_BASE_PATH + "/:lat/:lon", this.updateStopByLatLon.bind(this));
        httpServer.del(this.STOPS_BASE_PATH + "/:lat/:lon", this.deleteStopbyLatLon.bind(this));
    }

    private async getAllStops(req: Request, res: Response, next: Next): Promise<void> {
        try {
            res.send(await stopController.getAllStops());
            return next();
        } catch (err) {
            console.log(err);
            return next(new InternalServerError(err.code));
        }
    }

    private async searchStop(req: Request, res: Response, next: Next): Promise<void> {
        try {
            res.send(200, await stopController.searchStop(req.query));
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

    private async getStopByLatLon(req: Request, res: Response, next: Next): Promise<void> {
        let lat = req.params.lat;
        let lon = req.params.lon;
        if (!(lat && lon) || (isNaN(+lat) || isNaN(+lon))) {
            return next(new BadRequestError("Need to provide both coordinates (lat, lon) as numeric values."));
        } else {
            try {
                let stop = await stopController.searchStop(req.params);
                if (stop.length > 0) {
                    res.send(200, stop.pop());
                    return next();
                } else {
                    return next(new NotFoundError('Stop with lat=' + lat +' and lon='+ lon +' was not found.'))
                }
            } catch (err) {
                return next(new InternalServerError(err.code, err.message));
            }
        }
    }

    private async createStop(req: Request, res: Response, next: Next): Promise<void> {
        let missingParam = GenericController.verifyBodyParams(req.body, StopRoute.STOP_REQUIRED_PARAMS);
        if (!missingParam) {
            try {
                let stop_name = await stopController.createStop(req.body);
                res.status(201);
                res.json({message: "Stop was successfully created!", stop_name: stop_name});
                return next();
            } catch (err) {
                if (err.code === 'ConditionalCheckFailedException') {
                    return next(new ConflictError('This stop already exists. To properly change the contents of this stop, ' +
                        'use the update route instead (PUT).'));
                } else {
                    return next(new InternalServerError(err.code));
                }
            }
        } else {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }
    }

    private async updateStopByLatLon(req: Request, res: Response, next: Next): Promise<void> {
        let lat = req.params.lat;
        let lon = req.params.lon;
        if (!(lat && lon) || (isNaN(+lat) || isNaN(+lon))) {
            return next(new BadRequestError("Need to provide both coordinates (lat, lon) as numeric values."));
        }
        try {
            res.send(204, await stopController.updateStop(+lat, +lon, req.body));
            return next();
        } catch (err) {
            if (err.code === 'ConditionalCheckFailedException') {
                return next(new NotFoundError('Stop with lat=' + lat +' and lon='+ lon +' was not found.'));
            }
            return next(new InternalServerError(err.code));
        }
    }

    private async deleteStopbyLatLon(req: Request, res: Response, next: Next): Promise<void> {
        let lat = req.params.lat;
        let lon = req.params.lon;
        if (!(lat && lon) || (isNaN(+lat) || isNaN(+lon))) {
            return next(new BadRequestError("Need to provide both coordinates (lat, lon) as numeric values."));
        }
        try {
            res.send(204, await stopController.deleteStop(+lat, +lon));
            return next();
        } catch (err) {
            if (err.code === 'ConditionalCheckFailedException') {
                return next(new NotFoundError('Stop with lat=' + lat +' and lon='+ lon +' was not found.'));
            } else {
                return next(new InternalServerError(err.code));
            }
        }
    }

}
