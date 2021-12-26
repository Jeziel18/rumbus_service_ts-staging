import {Driver} from "../../models/driver.model";
import {PoolConnection} from 'mariadb'
import mariaDBpool from '../../helpers/mariadbPool';
import uuid from 'uuid/v4';
import {GenericController} from "../generic.controller";


export class DriverController {

    public async getAllDrivers(): Promise<Driver[]> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "SELECT * from driver;";
            const rows = await conn.query(query);
            return rows;
        } //TODO: Catch error and pass it to next on ALL FUNCTONS THAT WE ARE DOING THIS?
        finally {
            if (conn) conn.end();
        }
    }

    public async searchDriver(params:any): Promise<Driver[]>{
        let pagination = GenericController.extractPaginationParams(params);
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * FROM driver ";
            let sqlObject = GenericController.extractQueryFilterParams(sql, params,
                ["id", "full_name", "license"]);
            sqlObject = GenericController.setOffset(sqlObject.sql, pagination.skip, pagination.limit, sqlObject.values);
            return await conn.query(sqlObject.sql, sqlObject.values);
        }
        finally {
            if (conn) conn.end();
        }

    }

    public async createDriver(driver: Driver): Promise<string> {
        let conn: PoolConnection;
        var id = uuid();
        try {
            conn = await mariaDBpool.getConnection();
            let query = "INSERT INTO driver(id, full_name, license) VALUES(?, ?, ?);";
            await conn.query(query, [id, driver.full_name, driver.license]);
            return id;
        } finally {
            if (conn) conn.end();
        }
    }

    public async updateDriver(id: string, body:Driver): Promise<void>{
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "UPDATE driver ";
            let sqlObject = GenericController.extractBodyUpdateParameters(query, body,
                ["full_name", "license"]);
            sqlObject = GenericController.extractQueryFilterParams(sqlObject.sql, {id: id},
                ["id", "full_name", "license"], sqlObject.values);
            await conn.query(sqlObject.sql, sqlObject.values);
        }
         finally {
            if (conn) conn.end();
        }
    }
    public async deleteDriver(id: string): Promise<void> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "DELETE from driver WHERE id = ? ;";
            await conn.query(query, [id]);
        } finally {
            if (conn) conn.end();
        }
    }


}

export const driverController = new DriverController();
