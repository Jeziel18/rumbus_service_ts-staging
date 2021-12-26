import {Route} from "../routeInterface"
import {HttpServer} from "../httpServerInterface";
import {Next, Request, Response} from 'restify';
import {calendarDatesController} from './calendar_dates.controller';
import errors, {BadRequestError} from 'restify-errors'
import {GenericController} from "../generic.controller";
import { CalendarRoute } from "./calendar";
import { calendarController } from "./calendar.controller";


export class CalendarDatesRoute implements Route {
    static CALENDARDATES_REQUIRED_BODY_PARAMS: string[] = ["id"];
    private CALENDARDATES_BASE_PATH: string;

    public constructor(base_path: string){
        this.CALENDARDATES_BASE_PATH = base_path;
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.post(this.CALENDARDATES_BASE_PATH, this.createException.bind(this));
        httpServer.del(this.CALENDARDATES_BASE_PATH + '/:id',this.deleteException.bind(this));
    }


    private async createException(req: Request, res: Response, next: Next): Promise<void> {
        let missingParam = GenericController.verifyBodyParams(req.body, CalendarDatesRoute.CALENDARDATES_REQUIRED_BODY_PARAMS);
        if (!missingParam) {
            try{
                res.send(201, await calendarDatesController.createException(req.body));
                return next();
            } catch (err) {
                return next(new errors.InternalServerError(err.code))
            }
        }
        else {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }

    }

    
    private async deleteException(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try {
            res.status(204);
            res.send(await calendarDatesController.deleteException(req.params.id))
        }catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

}
