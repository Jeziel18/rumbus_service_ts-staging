import {Route} from "../routeInterface"
import {HttpServer} from "../httpServerInterface";
import {Next, Request, Response} from 'restify';
import errors, {BadRequestError} from 'restify-errors'
import {GenericController} from "../generic.controller";
import {userController} from "./user.controller";

export class UserRoute implements Route {
    static USER_REQUIRED_BODY_PARAMS: string[] = ["full_name", "email"];
    private USERS_BASE_PATH: string;

    public constructor(base_path: string){
        this.USERS_BASE_PATH = base_path;
    }

    public initialize(httpServer: HttpServer): void {
        httpServer.get(this.USERS_BASE_PATH, this.getAllUsers.bind(this));
        httpServer.get(this.USERS_BASE_PATH + '/search', this.searchUser.bind(this));
        httpServer.get(this.USERS_BASE_PATH + '/:id', this.getUserWithId.bind(this));
        httpServer.put(this.USERS_BASE_PATH + '/:id', this.updateUser.bind(this));
        httpServer.post(this.USERS_BASE_PATH, this.createUser.bind(this));
        httpServer.del(this.USERS_BASE_PATH + '/:id',this.deleteUser.bind(this));
    }

    private async getAllUsers(req: Request, res: Response, next: Next): Promise<void> {
        try {
            res.send(await userController.getAllUsers());
            return next();
        }
        catch (err) {
            return next(new errors.InternalServerError(err.code));
        }
    }

    private async searchUser(req: Request, res: Response, next: Next): Promise<void>{
        try{
            res.send(await userController.searchUser(req.query));
            return next();
        } catch (err) {
            return next(new errors.InternalServerError(err.code))
        }
    }

    private async getUserWithId(req: Request, res: Response, next: Next): Promise<void>{
        let id = req.params.id;
        if (!id) {
            return next(new errors.BadRequestError("Need to provide an ID to look for."));
        }
        try {
            let result = await userController.searchUser({id: id});
            if(result.length < 1){
                return next(new errors.NotFoundError( "User with id: "+ id + " not found"));
            } else{
                res.send(result[0]);
                return next();
            }
        } catch (err) {
            return next(new errors.InternalServerError(err.code));
        }
    }

    private async updateUser(req: Request, res: Response, next: Next): Promise<void> {
        let id = req.params.id;
        if (!id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try{
            res.send(204, await userController.updateUser(id, req.body));
            return next();
        }catch (err) {
            return next(new errors.InternalServerError(err.code));
        }
    }

    private async createUser(req: Request, res: Response, next: Next): Promise<void> {
        let missingParam = GenericController.verifyBodyParams(req.body, UserRoute.USER_REQUIRED_BODY_PARAMS);
        if (!missingParam) {
            try{
                res.send(201, await userController.createUser(req.body));
                return next();
            } catch (err) {
                return next(new errors.InternalServerError(err.code));
            }
        }
        else {
            return next(new BadRequestError("Missing required param: " + missingParam));
        }
    }

    private async deleteUser(req: Request, res: Response, next: Next): Promise<void> {
        let id = req.params.id;
        if (!id) {
            return next(new BadRequestError("Need to provide an ID to look for."));
        }
        try {
            res.send(204, await userController.deleteUser(id));
            return next();
        }catch (err) {
            return next(new errors.InternalServerError(err.code));
        }
    }
}
