import {Route} from "../routeInterface"
import {HttpServer} from "../httpServerInterface";
import {Next, Request, Response} from 'restify';
import {calendarController} from './calendar.controller';
import errors, {BadRequestError} from 'restify-errors'
import {GenericController} from "../generic.controller";
import { CalendarDatesRoute } from "./calendar_dates";

export class CalendarRoute implements Route {
    static CALENDAR_REQUIRED_BODY_PARAMS: string[] = ["id"];
    private CALENDAR_BASE_PATH: string;
    private calendarDatesRoute: Route;

    public constructor(base_path: string){
        this.CALENDAR_BASE_PATH = base_path;
        this.calendarDatesRoute = new CalendarDatesRoute(base_path);
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.CALENDAR_BASE_PATH, this.getAllServiceDates.bind(this));
        httpServer.get(this.CALENDAR_BASE_PATH + '/search', this.searchServiceDate.bind(this));
        httpServer.get(this.CALENDAR_BASE_PATH + '/:id', this.getServiceDateWithId.bind(this));
        httpServer.put(this.CALENDAR_BASE_PATH + '/:id', this.updateServiceDate.bind(this));
        httpServer.post(this.CALENDAR_BASE_PATH, this.createServiceDate.bind(this));
        httpServer.del(this.CALENDAR_BASE_PATH + '/:id',this.deleteServiceDate.bind(this));
        
        // this.calendarDatesRoute.initialize(httpServer);
    }

    private async getAllServiceDates(req: Request, res: Response, next: Next): Promise<void> {
        try {
            res.send(await calendarController.getAllServiceDates());
            return next();
        }
        catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async searchServiceDate(req: Request, res: Response, next: Next): Promise<void>{
        try{
            res.send(await calendarController.searchServiceDates(req.query))
        } catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async getServiceDateWithId(req: Request, res: Response, next: Next): Promise<void>{
        let id = req.params.id;
        if (!id) {
            return next(new errors.BadRequestError("Need to provide an ID to look for."));
        }
        try {
            let result = await calendarController.searchServiceDates({id: id});
            if(result.length < 1){
                return next(new errors.NotFoundError( "Service Date with id: "+ id + " not found"));
            } else{
                res.send(result[0]);
                return next();
            }
        } catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async updateServiceDate(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try{
            let id = req.params.id;
            res.status(204);
            res.send(await calendarController.updateServiceDate(id, req.body));
        }catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }
    private async createServiceDate(req: Request, res: Response, next: Next): Promise<void> {
        let missingParam = GenericController.verifyBodyParams(req.body, CalendarRoute.CALENDAR_REQUIRED_BODY_PARAMS);
        if (!missingParam) {
            try{
                res.send(201, await calendarController.createServiceDate(req.body));
                return next();
            } catch (err) {
                return next(new errors.InternalServerError(err.code))
            }
        }
        else {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }

    }

    private async deleteServiceDate(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try {
            res.status(204);
            res.send(await calendarController.deleteServiceDate(req.params.id))
        }catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

}
