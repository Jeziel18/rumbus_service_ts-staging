import {Route} from "../routeInterface"
import {HttpServer} from "../httpServerInterface";
import {Next, Request, Response} from 'restify';
import {agencyController} from './agency.controller';
import errors, {BadRequestError} from 'restify-errors'
import {GenericController} from "../generic.controller";


export class AgencyRoute implements Route {
    static AGENCY_REQUIRED_BODY_PARAMS: string[] = ["name", "url", "timezone"];
    private AGENCY_BASE_PATH: string;

    public constructor(base_path: string){
        this.AGENCY_BASE_PATH = base_path;
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.AGENCY_BASE_PATH, this.getAllAgencies.bind(this));
        httpServer.get(this.AGENCY_BASE_PATH + '/search', this.searchAgency.bind(this));
        httpServer.get(this.AGENCY_BASE_PATH + '/:id', this.getAgencyWithId.bind(this));
        httpServer.put(this.AGENCY_BASE_PATH + '/:id', this.updateAgency.bind(this));
        httpServer.post(this.AGENCY_BASE_PATH, this.createAgency.bind(this));
        httpServer.del(this.AGENCY_BASE_PATH + '/:id',this.deleteAgency.bind(this));
    }

    private async getAllAgencies(req: Request, res: Response, next: Next): Promise<void> {
        try {
            res.send(await agencyController.getAllAgencies());
            return next();
        }
        catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async searchAgency(req: Request, res: Response, next: Next): Promise<void>{
        try{
            res.send(await agencyController.searchAgency(req.query))
        } catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async getAgencyWithId(req: Request, res: Response, next: Next): Promise<void>{
        let id = req.params.id;
        if (!id) {
            return next(new errors.BadRequestError("Need to provide an ID to look for."));
        }
        try {
            let result = await agencyController.searchAgency({id: id});
            if(result.length < 1){
                return next(new errors.NotFoundError( "Agency with id: "+ id + " not found"));
            } else{
                res.send(result[0]);
                return next();
            }
        } catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async updateAgency(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try{
            let id = req.params.id;
            res.status(204);
            res.send(await agencyController.updateAgency(id, req.body));
        }catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async createAgency(req: Request, res: Response, next: Next): Promise<void> {
        let missingParam = GenericController.verifyBodyParams(req.body, AgencyRoute.AGENCY_REQUIRED_BODY_PARAMS);
        if (!missingParam) {
            try{
                res.send(201, await agencyController.createAgency(req.body));
                return next();
            } catch (err) {
                return next(new errors.InternalServerError(err.code))
            }
        }
        else {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }

    }

    private async deleteAgency(req: Request, res: Response, next: Next): Promise<void> {
        if (!req.params.id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try {
            res.status(204);
            res.send(await agencyController.deleteAgency(req.params.id))
        }catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

}