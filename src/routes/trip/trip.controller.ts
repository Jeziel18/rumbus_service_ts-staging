import {PoolConnection} from 'mariadb';
import mariaDBpool from '../../helpers/mariadbPool';
import {Trip} from "../../models/trip.model";
import uuid from 'uuid/v4';
import {GenericController} from "../generic.controller";
import docClient from '../../helpers/dynamodbEnv';
import {TRIP_CANCELED, TRIP_CREATED, tripEmitter} from "../../helpers/events";

export class TripController {
    public async getAllActiveTrips(): Promise<Trip[]> {
        let sql: string;
        sql = " SELECT \
                trip.id,\
                trip.trip_number,\
                trip.vehicle_id, \
                trip.departure_time,\
                vehicle.capacity,\
                vehicle.property_number, \
                vehicle.handicap_enabled,\
				public_trip.route_id, \
				route.name as route_name \
				 FROM trip \
				 JOIN public_trip on trip.id = public_trip.trip_id \
				 JOIN vehicle on trip.vehicle_id = vehicle.id \
				 JOIN route on public_trip.route_id = route.id \
				 WHERE arrival_time is null;";
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            const rows = await conn.query(sql);
            return rows;
        }finally {
            if (conn) conn.end();
        }
    }

    public async createTrip(trip: any): Promise<string> {
        //TODO Generate Trip number in backend, should not come from request
        let conn: PoolConnection;
        let trip_id = uuid();
        let query: string;
        try {
            conn = await mariaDBpool.getConnection();
            await conn.beginTransaction();
            query = "INSERT INTO  \
                 trip(id, trip_number, driver_id, vehicle_id, user_id, applicant, faculty, purpose, departure_time) \
                 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);";
            await conn.query(query, [trip_id, trip.trip_number, trip.driver_id, trip.vehicle_id, trip.user_id,
                trip.applicant, trip.faculty, trip.purpose, trip.departure_time]);

            if(trip.public =="1"){
                query = "INSERT INTO  \
                 public_trip(trip_id, route_id) \
                 VALUES(?, ?);";
                await conn.query(query, [trip_id, trip.route_id]);
            }else{
                query = "INSERT INTO  \
                 administrative_trip(trip_id, type, destination) \
                 VALUES(?, ?, ?);";
                await conn.query(query, [trip_id, trip.type, trip.destination]);
            }

            // Create vehicle_usage entry after trip creation
            query = "INSERT INTO vehicle_usage(trip_id) VALUES (?)";
            await conn.query(query, [trip_id]);

            await conn.commit();

            // Emit event of trip creation
            trip.id = trip_id;
            tripEmitter.emit(TRIP_CREATED, trip);

            return trip_id;
        } finally {
            if (conn) conn.end();
        }
    }

    public async updateTrip(id: string, body: any, isPublic: boolean): Promise<void> {
        // TODO: thorough testing
        // applicant, faculty, purpose, vehicle_id, driver_id and departure_time, route_id(public), type, destination, can only be updated before departure_time
        let tableName: string;
        let validUpdateParams: string[] = ["applicant", "faculty", "purpose", "vehicle_id", "driver_id", "departure_time"];
        if(isPublic == true){
            tableName = "public_trip";
            validUpdateParams.push("route_id");
        }else{
            tableName = "administrative_trip";
            validUpdateParams.push("type", "destination");
        }
        let conn: PoolConnection, sqlObject: any;
        let sql = `UPDATE trip INNER JOIN ${tableName} on trip.id = ${tableName}.trip_id`;
        try {
            conn = await mariaDBpool.getConnection();
            sqlObject = GenericController.extractBodyUpdateParameters(sql, body, validUpdateParams);
            sqlObject.sql += `WHERE id = ? AND departure_time > ?;`;
            sqlObject.values.push(id, new Date().toISOString().slice(0, 19).replace('T', ' '));
            await conn.query(sqlObject.sql, sqlObject.values);
        }
        finally {
            if (conn) conn.end();
        }
    }

    public async cancelTrip(trip_cancellation: any): Promise<void> {
        let conn: PoolConnection;
        let sql = "INSERT INTO canceled_trip(trip_id, purpose) VALUES (?, ?)";
        try {
            conn = await mariaDBpool.getConnection();
            await conn.query(sql, [trip_cancellation.trip_id, trip_cancellation.purpose]);
        }
        finally {
            if (conn) conn.end();
        }

        // Emit event of trip cancellation
        tripEmitter.emit(TRIP_CANCELED, trip_cancellation);
    }

    public async updateCancelledTrip(trip_id: string, body: any): Promise<void> {
        let conn: PoolConnection;
        let query = "UPDATE canceled_trip ";
        try {
            conn = await mariaDBpool.getConnection();
            let sqlObject = GenericController.extractBodyUpdateParameters(query, body,
                ["purpose"]);
            sqlObject = GenericController.extractQueryFilterParams(sqlObject.sql, {trip_id: trip_id},
                ["trip_id"], sqlObject.values);
            await conn.query(sqlObject.sql, sqlObject.values);
        }
        finally {
            if (conn) conn.end();
        }
    }

    public async getTripWithId(id:string){
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * \
				FROM trip \
				WHERE id = ? ";
            return  await conn.query(sql, [id]);
        }
        finally {
            if (conn) conn.end();
        }
    }

    public async searchTrip(params: any): Promise<Trip[]> {
        let pagination = GenericController.extractPaginationParams(params);
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT \
                trip.id,\
                trip.trip_number,\
                trip.departure_time,\
                vehicle.property_number, \
				driver.full_name,\
				IF(a.trip_id IS NULL, TRUE, FALSE) as public,\
				IF(arrival_time IS NULL, TRUE, FALSE) as active\
				FROM trip \
				 JOIN vehicle on trip.vehicle_id = vehicle.id \
				 JOIN driver on trip.driver_id = driver.id\
				 LEFT JOIN administrative_trip a on trip.id = a.trip_id \
				 LEFT JOIN public_trip pt on trip.id = pt.trip_id ";
            if (Object.keys(params).includes("departure_time")){
                sql += ` WHERE DATE_FORMAT(departure_time, '%Y-%m-%d') = '${params['departure_time']}' `;
            }
            let sqlObject = GenericController.extractQueryFilterHavingParams(sql, params, ["public", "active"]);
            sqlObject = GenericController.setOffset(sqlObject.sql, pagination.skip, pagination.limit, sqlObject.values);
            return await conn.query(sqlObject.sql, sqlObject.values);
        }
        finally {
            if (conn) conn.end();
        }
    }

    public async deleteTrip(id:string): Promise<void> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            await conn.beginTransaction();
            await conn.query("DELETE from public_trip WHERE trip_id = ? ;", [id]);
            await conn.query("DELETE from administrative_trip WHERE trip_id = ? ;", [id]);
            await conn.query("DELETE from trip WHERE id = ? ;", [id]);
            await conn.commit()
        } finally {
            if (conn) conn.end();
        }
    }

    public async endTrip(id:string): Promise<void>{
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "UPDATE trip ";
            let sqlObject = GenericController.extractBodyUpdateParameters(query,
                {arrival_time: new Date().toISOString().slice(0, 19).replace('T', ' ')}, ["arrival_time"]);
            sqlObject = GenericController.extractQueryFilterParams(sqlObject.sql, {id: id},
                ["id", "arrival_time"], sqlObject.values);
            sqlObject.sql += " AND arrival_time is NULL";
            await conn.query(sqlObject.sql, sqlObject.values);
        } finally {
            if (conn) conn.end();
        }
    }

    public async createTripEvent(trip_id: string, body: any): Promise<string> {
        let conn: PoolConnection;
        const id = uuid();
        let values = [id, trip_id, body.description, body.type];
        let sql = "INSERT INTO trip_event(id, trip_id, description, type) VALUES(?, ?, ?, ?);";
        try {
            conn = await mariaDBpool.getConnection();
            await conn.query(sql, values);
            return id;
        }finally {
            if (conn) conn.end();
        }
    }

    public async getTripEventsByTripID(trip_id: string): Promise<any[]> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "SELECT * from trip_event where trip_id = ? ;";
            const rows = await conn.query(query, [trip_id]);
            return rows;
        } finally {
            if (conn) conn.end();
        }
    }

    public async createTripHistory(trip_id: string, body: any): Promise<void> {
        let params = {
            TableName: "Trip_history",
            Key: {
                trip_id: trip_id
            },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set #geopoints = list_append(if_not_exists(#geopoints, :empty_list), :geopoints)',
            ExpressionAttributeNames: {
                '#geopoints': 'geopoints'
            },
            ExpressionAttributeValues: {
                ':geopoints': body.geopoints,
                ":empty_list": <any[]> []
            }
        };
        await docClient.update(params).promise();
    }

    public async getTripHistoryByTripID(trip_id: string): Promise<any[]> {
        let params = {
            TableName: "Trip_history",
            ExpressionAttributeValues: {
                ':trip_id': trip_id
            },
            KeyConditionExpression: "trip_id = :trip_id",
        };
        let data = await docClient.query(params).promise();
        return data.Items;
    }
}

export const tripController = new TripController();
