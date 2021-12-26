import {TripRoute} from '../../models/tripRoute.model';
import {PoolConnection} from 'mariadb'
import documentClient from '../../helpers/dynamodbEnv';
import mariaDBpool from '../../helpers/mariadbPool';
import {GenericController} from "../generic.controller";
import {Route} from "../routeInterface";
import uuid from 'uuid/v4';
import {OSRM, OSRMParams} from '../../helpers/osrm';


export class RouteController {

    table = "Route";

    public async getAllRoutes(queryParams: Object): Promise<TripRoute[]> {
        let conn: PoolConnection;

        try {
            let conn = await mariaDBpool.getConnection();
            let sql = "SELECT * FROM route;";
            let savedRoutes = await conn.query(sql);
            return savedRoutes;

        } catch (err) {
            throw err;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async searchRoute(params: Object, skip: number = 0, limit: number = 100): Promise<TripRoute[]> {
        let conn: PoolConnection;

        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * FROM " + this.table.toLowerCase() + " " ;
            let sqlObject = GenericController.extractQueryFilterParams(sql, params,
                ["id", "name", "description"]);
            sqlObject = GenericController.setOffset(sqlObject.sql, skip, limit, sqlObject.values);
            return await conn.query(sqlObject.sql, sqlObject.values);

        } catch (err) {
            throw err;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async createRoute(body: TripRoute): Promise<string> {
        let conn: PoolConnection;
        const id = uuid();

        try {
            conn = await mariaDBpool.getConnection();
            let sql = "INSERT INTO route(id, name, description) VALUES(?, ?, ?);";
            await conn.query(sql, [id, body.name, body.description]);
            return id;
        } catch (err) {
            throw err;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async updateRoute(route_id: string, body: any): Promise<void> {
        let conn: PoolConnection;

        try {
            if (body.hasOwnProperty("name") || body.hasOwnProperty("description")) {
                conn = await mariaDBpool.getConnection();
                let sql = "UPDATE route ";
                let sqlObject = GenericController.extractBodyUpdateParameters(sql, body,
                    ["name", "description"]);
                sqlObject = GenericController.extractQueryFilterParams(sqlObject.sql, {id: route_id},
                    ["id", "name", "description"], sqlObject.values);
                await conn.query(sqlObject.sql, sqlObject.values);
            }

        } catch (err) {
            throw err;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async deleteRouteWithId(route_id: string): Promise<void> {
        let conn: PoolConnection;

        try {
            conn = await mariaDBpool.getConnection();
            let sql = "DELETE from " + this.table.toLowerCase() + " WHERE id = ? ;";
            await conn.query(sql, [route_id]);

        } catch (err) {
            throw err;
        } finally {
            if (conn) await conn.end();
        }
    }

}

export const routeController = new RouteController();

