import { Route } from "../routeInterface"
import { HttpServer } from "../httpServerInterface";
import { Request, Response, Next } from 'restify';
import {routeController} from './route.controller';
import {BadRequestError, InternalServerError, NotFoundError} from 'restify-errors';
import {GenericController} from "../generic.controller";


export class TripRouteRoute implements Route {
    static TRIPROUTE_REQUIRED_BODY_PARAMS: string[] = ["name", "description", "stops"];
    private readonly TRIPROUTE_BASE_PATH: string;

    public constructor(base_path: string) {
        this.TRIPROUTE_BASE_PATH = base_path;
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.TRIPROUTE_BASE_PATH, this.getAllRoutes.bind(this));
        httpServer.get(this.TRIPROUTE_BASE_PATH + '/:id', this.getRouteWithId.bind(this));
        httpServer.get(this.TRIPROUTE_BASE_PATH + '/search', this.searchRoute.bind(this));
        httpServer.post(this.TRIPROUTE_BASE_PATH, this.createRoute.bind(this));
        httpServer.put(this.TRIPROUTE_BASE_PATH + '/:id', this.updateRouteWithID.bind(this));
        httpServer.del(this.TRIPROUTE_BASE_PATH + '/:id', this.deleteRouteWithId.bind(this));

    }


    private async getAllRoutes(req: Request, res: Response, next: Next): Promise<void> {
        try {
            res.send(await routeController.getAllRoutes(req.query));
            return next()
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

    private async searchRoute(req: Request, res: Response, next: Next): Promise<void> {
        try {
            res.send(200, await routeController.searchRoute(req.query));
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

    private async getRouteWithId(req: Request, res: Response, next: Next): Promise<void> {
        let id = req.params.id;
        let merged_params = {...req.params, ...req.query};
        if (!id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try {
            let result = await routeController.searchRoute(merged_params);
            if (result.length < 1) {
                return next(new NotFoundError("TripRoute with id " + id + " not found."));
            } else {
                res.send(result.pop());
                return next();
            }
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

    private async createRoute(req: Request, res: Response, next: Next): Promise<void> {
        let missingParam = GenericController.verifyBodyParams(req.body, TripRouteRoute.TRIPROUTE_REQUIRED_BODY_PARAMS);
        if (!missingParam) {
            try {
                let route_id = await routeController.createRoute(req.body);
                res.status(201);
                res.json({message: "TripRoute was successfully created!", route_id: route_id});
                return next();
            } catch (err) {
                return next(new InternalServerError(err.code));
            }
        } else {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }
    }

    private async updateRouteWithID(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try {
            res.status(204);
            res.send(await routeController.updateRoute(req.params.id, req.body));
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

    private async deleteRouteWithId(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try {
            res.status(204);
            res.send(await routeController.deleteRouteWithId(req.params.id));
            return next();
        } catch (err) {
            return next(new InternalServerError(err.code));
        }
    }

}
