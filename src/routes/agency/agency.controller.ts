import {Agency} from "../../models/agency.model";
import {PoolConnection} from 'mariadb'
import mariaDBpool from '../../helpers/mariadbPool';
import uuid from 'uuid/v4';
import {GenericController} from "../generic.controller";


export class AgencyController {

    public async getAllAgencies(): Promise<Agency[]> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "SELECT * from agency;";
            let savedAgencys = await conn.query(query);
            return savedAgencys;
        } 
        finally {
            if (conn) conn.end();
        }
    }

    public async searchAgency(params:any): Promise<Agency[]>{
        let pagination = GenericController.extractPaginationParams(params);
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * FROM agency ";
            let sqlObject = GenericController.extractQueryFilterParams(sql, params,
                ["id", "name"]);
            sqlObject = GenericController.setOffset(sqlObject.sql, pagination.skip, pagination.limit, sqlObject.values);
            return await conn.query(sqlObject.sql, sqlObject.values);
        }
        finally {
            if (conn) conn.end();
        }

    }

    public async createAgency(agency: Agency): Promise<string> {
        let conn: PoolConnection;
        var id = uuid();
        try {
            conn = await mariaDBpool.getConnection();
            let query = "INSERT INTO agency(id, name, url, timezone) VALUES(?, ?, ?, ?);";
            await conn.query(query, [id, agency.name, agency.url, agency.timezone]);
            return id;
        } finally {
            if (conn) conn.end();
        }
    }

    public async updateAgency(id: string, body:Agency): Promise<void>{
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "UPDATE agency ";
            let sqlObject = GenericController.extractBodyUpdateParameters(query, body,
                ["name", "url", "timezone"]);
            sqlObject = GenericController.extractQueryFilterParams(sqlObject.sql, {id: id},
                ["id", "name", "url", "timezone"], sqlObject.values);
            await conn.query(sqlObject.sql, sqlObject.values);
        }
         finally {
            if (conn) conn.end();
        }
    }

    public async deleteAgency(id: string): Promise<void> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "DELETE from agency WHERE id = ? ;";
            await conn.query(query, [id]);
        } finally {
            if (conn) conn.end();
        }
    }


}

export const agencyController = new AgencyController();