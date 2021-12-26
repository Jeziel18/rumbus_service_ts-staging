import {Route} from "../routeInterface"
import {HttpServer} from "../httpServerInterface";
import {Next, Request, Response} from 'restify';
import errors, {BadRequestError} from 'restify-errors'
import {GenericController} from "../generic.controller";
import {announcementController} from "./announcement.controller";

export class AnnouncementRoute implements Route {
    static ANNOUNCEMENT_REQUIRED_BODY_PARAMS: string[] = ["user_id", "content", "headline", "expire_at"];
    private ANNOUNCEMENT_BASE_PATH: string;

    public constructor(base_path: string){
        this.ANNOUNCEMENT_BASE_PATH = base_path;
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.ANNOUNCEMENT_BASE_PATH, this.getAllAnnouncements.bind(this));
        httpServer.get(this.ANNOUNCEMENT_BASE_PATH + '/search', this.searchAnnouncement.bind(this));
        httpServer.get(this.ANNOUNCEMENT_BASE_PATH + '/:id', this.getAnnouncementWithId.bind(this));
        httpServer.put(this.ANNOUNCEMENT_BASE_PATH + '/:id', this.updateAnnouncement.bind(this));
        httpServer.post(this.ANNOUNCEMENT_BASE_PATH, this.createAnnouncement.bind(this));
        httpServer.del(this.ANNOUNCEMENT_BASE_PATH + '/:id',this.deleteAnnouncement.bind(this));
    }

    private async getAllAnnouncements(req: Request, res: Response, next: Next): Promise<void> {
        try {
            res.send(await announcementController.getAllAnnouncements());
            return next();
        }
        catch (err) {
            return next(new errors.InternalServerError(err.code));
        }
    }

    private async searchAnnouncement(req: Request, res: Response, next: Next): Promise<void>{
        try{
            res.send(await announcementController.searchAnnouncement(req.query));
            return next();
        } catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async getAnnouncementWithId(req: Request, res: Response, next: Next): Promise<void>{
        let id = req.params.id;
        if (!id) {
            return next(new errors.BadRequestError("Need to provide an ID to look for."));
        }
        try {
            let result = await announcementController.searchAnnouncement({id: id});
            if(result.length < 1){
                return next(new errors.NotFoundError( "Announcement with id: "+ id + " not found"));
            } else{
                res.send(result[0]);
                return next();
            }
        } catch (err) {
            return next(new errors.InternalServerError(err.code));
        }
    }

    private async updateAnnouncement(req: Request, res: Response, next: Next): Promise<void> {
        let id = req.params.id;
        if (!id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try{
            res.send(204, await announcementController.updateAnnouncement(id, req.body));
            return next();
        }catch (err) {
            return next(new errors.InternalServerError(err.code));
        }
    }

    private async createAnnouncement(req: Request, res: Response, next: Next): Promise<void> {
        let missingParam = GenericController.verifyBodyParams(req.body, AnnouncementRoute.ANNOUNCEMENT_REQUIRED_BODY_PARAMS);
        if (!missingParam) {
            try{
                res.send(201, await announcementController.createAnnouncement(req.body));
                return next();
            } catch (err) {
                return next(new errors.InternalServerError(err.code));
            }
        }
        else {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }
    }

    private async deleteAnnouncement(req: Request, res: Response, next: Next): Promise<void> {
        let id = req.params.id;
        if (!id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try {
            res.send(204, await announcementController.deleteAnnouncement(id));
            return next();
        }catch (err) {
            return next(new errors.InternalServerError(err.code));
        }
    }
}
