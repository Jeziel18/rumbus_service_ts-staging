import {HttpServer} from './httpServerInterface';

export interface Route {
    initialize(httpServer: HttpServer): void;
}
