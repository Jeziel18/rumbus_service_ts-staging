import mariaDBpool from '../../helpers/mariadbPool';
import {PoolConnection} from 'mariadb';
import {Calendar} from '../../models/calendar.model';
import { GenericController } from '../generic.controller';
import uuid from 'uuid';
import { Calendar_dates } from '../../models/calendar_dates.model';


export class CalendarDatesController{
    
    public async createException(calendar_dates:Calendar_dates): Promise<string>{
        let conn: PoolConnection;
        var id = uuid();
        try{
            conn = await mariaDBpool.getConnection();
            let query = "INSERT INTO calendar_dates(service_id,date,exception_type) VALUES(?,?,?);";
            await conn.query(query, [id,calendar_dates.date,calendar_dates.exception_type]);
            return id;
        }
        catch(err){
            throw err;
        } 
        finally{
            if (conn) conn.end();
        }
    }
            
    public async deleteException(id:string): Promise<void>{
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "DELETE from calendar_dates WHERE id = ? ;";
            await conn.query(query, [id]);
        } finally {
            if (conn) conn.end();
        } 
    }
}
export const calendarDatesController = new CalendarDatesController();
