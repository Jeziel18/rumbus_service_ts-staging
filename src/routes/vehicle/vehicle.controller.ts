import {PoolConnection} from 'mariadb'
import mariaDBpool from '../../helpers/mariadbPool';
import {Vehicle} from "../../models/vehicle.model";
import uuid from 'uuid/v4';
import {GenericController} from "../generic.controller";
import {VehicleRoute} from "./vehicle";
import {VehicleUsageRoute} from "./vehicle_usage";
import {VehicleMaintenanceRoute} from "./vehicle_maintenance";

export class VehicleController {

    public async getAllVehicles(): Promise<Vehicle[]> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "SELECT * from vehicle;";
            const rows = await conn.query(query);
            return rows;
        } finally {
            if (conn) conn.end();
        }
    }

    public async createVehicle(body: Vehicle): Promise<string> {
        const id = uuid();
        let values = [id, body.property_number, body.plate, body.model, body.brand, body.capacity,
            body.handicap_enabled, body.mileage, body.ownership];
        let conn: PoolConnection;
        let query = "INSERT INTO vehicle(id, property_number, plate, model, brand, capacity, handicap_enabled, mileage, ownership) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);";
        try {
            conn = await mariaDBpool.getConnection();
            await conn.query(query, values);
            return id;
        } finally {
            if (conn) conn.end();
        }
    }

    public async updateVehicle(vehicle_id: string, body: any): Promise<void> {
        let conn: PoolConnection;
        let query = "UPDATE vehicle ";
        try {
            conn = await mariaDBpool.getConnection();
            let sqlObject = GenericController.extractBodyUpdateParameters(query, body, VehicleRoute.VEHICLE_REQUIRED_BODY_PARAMS);
            sqlObject = GenericController.extractQueryFilterParams(sqlObject.sql, {id: vehicle_id},
                VehicleRoute.VEHICLE_REQUIRED_BODY_PARAMS.concat(["id"]), sqlObject.values);
            await conn.query(sqlObject.sql, sqlObject.values);
        } finally {
            if (conn) conn.end();
        }
    }

    public async deleteVehicle(vehicle_id: string): Promise<void> {
        let conn: PoolConnection;
        let query = "DELETE from vehicle WHERE id = ? ;";
        try {
            conn = await mariaDBpool.getConnection();
            await conn.query(query, [vehicle_id]);
        } finally {
            if (conn) conn.end();
        }
    }

    public async searchVehicle(params: any): Promise<Vehicle[]> {
        let pagination = GenericController.extractPaginationParams(params);
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * FROM vehicle ";
            let sqlObject = GenericController.extractQueryFilterParams(sql, params, VehicleRoute.VEHICLE_REQUIRED_BODY_PARAMS.concat(["id"]));
            sqlObject = GenericController.setOffset(sqlObject.sql, pagination.skip, pagination.limit, sqlObject.values);
            let rows = await conn.query(sqlObject.sql, sqlObject.values);
            return rows;
        } finally {
            if (conn) conn.end();
        }
    }

    public async getVehicleUsagesByVehicleID(vehicle_id: string): Promise<any[]> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT v.* from trip as t\
                        INNER JOIN vehicle_usage as v on v.trip_id = t.id \
                        WHERE t.vehicle_id = ?;";
            let rows = await conn.query(sql, [vehicle_id]);
            return rows;
        } finally {
            if (conn) conn.end();
        }
    }

    public async getVehicleUsageByTripID(trip_id: string): Promise<any[]> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * from vehicle_usage where trip_id = ?;";
            const rows = await conn.query(sql, [trip_id]);
            return rows;
        } finally {
            if (conn) conn.end();
        }
    }

    public async updateVehicleUsage(trip_id: string, body: any): Promise<void> {
        let conn: PoolConnection;
        let query = "UPDATE vehicle_usage ";
        try {
            conn = await mariaDBpool.getConnection();
            let sqlObject = GenericController.extractBodyUpdateParameters(query, body, ["start_mileage",
                "end_mileage", "start_gas", "end_gas", "gas_expense"]);
            sqlObject = GenericController.extractQueryFilterParams(sqlObject.sql, {trip_id: trip_id},
                VehicleUsageRoute.VEHICLE_USAGE_REQUIRED_BODY_PARAMS, sqlObject.values);
            await conn.query(sqlObject.sql, sqlObject.values);
        } finally {
            if (conn) conn.end();
        }
    }

    public async createVehicleMaintenance(vehicle_id: string, body: any): Promise<string> {
        let conn: PoolConnection;
        const id = uuid();
        let values = [id, vehicle_id, body.user_id, body.maintenance_date, body.type, body.mileage,
            body.cost, body.details, body.inspector];
        let sql = "INSERT INTO vehicle_maintenance(id, vehicle_id, user_id, maintenance_date, type, mileage,\
                    cost, details, inspector) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);";
        try {
            conn = await mariaDBpool.getConnection();
            await conn.query(sql, values);
            return id;
        }finally {
            if (conn) conn.end();
        }
    }

    public async updateVehicleMaintenance(maintenance_id: string, body: any): Promise<void> {
        let conn: PoolConnection;
        let query = "UPDATE vehicle_maintenance ";
        try {
            conn = await mariaDBpool.getConnection();
            let sqlObject = GenericController.extractBodyUpdateParameters(query, body,
                VehicleMaintenanceRoute.VEHICLE_MAINTENANCE_BODY_REQUIRED_PARAMS);
            sqlObject = GenericController.extractQueryFilterParams(sqlObject.sql, {id: maintenance_id},
                VehicleMaintenanceRoute.VEHICLE_MAINTENANCE_BODY_REQUIRED_PARAMS, sqlObject.values);
            await conn.query(sqlObject.sql, sqlObject.values);
        } finally {
            if (conn) conn.end();
        }
    }

    public async getVehicleMaintenancesByVehicleID(vehicle_id: string): Promise<any[]> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * from vehicle_maintenance where vehicle_id = ?;";
            const rows = await conn.query(sql, [vehicle_id]);
            return rows;
        } finally {
            if (conn) conn.end();
        }
    }

}

export const vehicleController = new VehicleController();
