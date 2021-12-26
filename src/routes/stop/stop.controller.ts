import {Stop} from "../../models/stop.model";
import documentClient from "../../helpers/dynamodbEnv";
import mariaDBpool from '../../helpers/mariadbPool';
import {GenericController} from "../generic.controller";
import {StopRoute} from "./stop";
import { PoolConnection } from "mariadb";
import uuid from 'uuid/v4';

export class StopController {

     table = "Stop";

    public async getAllStops(): Promise<Stop[]> {
        let conn:PoolConnection;
        try {
            let conn = await mariaDBpool.getConnection();
            let sql = "SELECT * FROM stop;";
            const savedStops = await conn.query(sql);
            return savedStops;
        } catch (err) {
            throw err;
        }
        finally {
            if (conn) conn.end();
        }
    }

    public async searchStop(params: Object, /*limit: number = 100*/): Promise<Stop[]> {
        let pagination = GenericController.extractPaginationParams(params);
        let conn: PoolConnection;
        try{
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * FROM stop ";
            let sqlObject = GenericController.extractQueryFilterParams(sql,params,["id","name","lat","lon"]);
            sqlObject = GenericController.setOffset(sqlObject.sql,pagination.skip,pagination.limit,sqlObject.values);
            return await conn.query(sqlObject.sql,sqlObject.values);
        } catch (err) {
            console.log(err);
            throw err;
        }      
        finally {
            if (conn) conn.end();
        }
    }

    public async createStop(body: Stop): Promise<string> {
        let conn:PoolConnection;
        var id = uuid();
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "INSERT INTO stop(id, name,lat,lon) VALUES(?, ?, ?, ?);";
            await conn.query(sql,[id,body.name,body.lat,body.lon]);
            return id;
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            if (conn) conn.end();
        }
    }

    public async updateStop(stop_lat: number, stop_lon: number, body: any): Promise<void> {
        let conn:PoolConnection;
        try {
            conn=await mariaDBpool.getConnection();
            let query = "UPDATE stop ";
            let sqlObject = GenericController.extractBodyUpdateParameters(query,body,["name","lat","lon"]);
            sqlObject = GenericController.extractQueryFilterHavingParams(sqlObject.sql,{stop_lat: stop_lat,stop_lon:stop_lon}, ["id","name","lat","lon"],sqlObject.values);
            await conn.query(sqlObject.sql,sqlObject.values);

        } catch (err) {
            throw err;
        }         
        finally {
            if (conn) conn.end();
        }
    }

    public async deleteStop(stop_lat: number, stop_lon: number): Promise<void> {
        let conn:PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "DELETE from stop WHERE lat = ? AND lon = ?;";
            await conn.query(sql,[stop_lat,stop_lon]);
        } catch (err) {
            throw err;
        }finally {
            if (conn) conn.end();
        }
    }
}

export const stopController = new StopController();
