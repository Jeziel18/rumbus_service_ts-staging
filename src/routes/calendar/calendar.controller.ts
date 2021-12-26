import mariaDBpool from '../../helpers/mariadbPool';
import {PoolConnection} from 'mariadb';
import {Calendar} from '../../models/calendar.model';
import { GenericController } from '../generic.controller';
import uuid from 'uuid';


export class CalendarController{

    public async getAllServiceDates(): Promise<Calendar[]>{
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "SELECT * from calendar;";
            const rows = await conn.query(query);
            return rows;
        }
        catch(err){
            throw err;
        }
        finally {
            if (conn) conn.end();
        }
    }

    public async searchServiceDates(params:any):Promise<Calendar[]>{
        let pagination = GenericController.extractPaginationParams(params);
        let conn: PoolConnection;
        try{
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * FROM calendar ";
            let sqlObject = GenericController.extractQueryFilterParams(sql, params,["id"]);
            sqlObject = GenericController.setOffset(sqlObject.sql, pagination.skip, pagination.limit, sqlObject.values);
            return await conn.query(sqlObject.sql, sqlObject.values);
        }
        catch(err){
            throw err;
        }
        finally{
            if (conn) conn.end();
        }
    }

    public async createServiceDate(calendar:Calendar): Promise<string>{
        let conn: PoolConnection;
        var id = uuid();
        try{
            conn = await mariaDBpool.getConnection();
            let query = "INSERT INTO calendar(id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date) VALUES(?,?,?,?,?,?,?,?,?,?);";
            await conn.query(query, [id,calendar.monday,calendar.tuesday,calendar.wednesday,
            calendar.thursday,calendar.friday,calendar.saturday,calendar.sunday,
            calendar.start_date,calendar.end_date]);
            return id;
        }
        catch(err){
            throw err;
        } 
        finally{
            if (conn) conn.end();
        }
    }

    public async updateServiceDate(id:string,body:Calendar):Promise<void>{
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "UPDATE calendar ";
            let sqlObject = GenericController.extractBodyUpdateParameters(query, body,
                ["monday","tuesday","wednesday","thursday","friday",
                "saturday","sunday","start_date","end_date"]);
            sqlObject = GenericController.extractQueryFilterParams(sqlObject.sql, {id: id},
                ["id","monday","tuesday","wednesday","thursday","friday",
                "saturday","sunday","start_date","end_date"], sqlObject.values);
            await conn.query(sqlObject.sql, sqlObject.values);
        }
         finally {
            if (conn) conn.end();
        }
    }


    public async deleteServiceDate(id:string): Promise<void>{
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "DELETE from calendar WHERE id = ? ;";
            await conn.query(query, [id]);
        } finally {
            if (conn) conn.end();
        } 
    }
    
}
export const calendarController = new CalendarController();
