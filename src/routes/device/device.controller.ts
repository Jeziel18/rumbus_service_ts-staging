import mariaDBpool from '../../helpers/mariadbPool';
import {Device} from '../../models/device.model';
import {PoolConnection} from 'mariadb';
import docClient from '../../helpers/dynamodbEnv';
import * as crypto from 'crypto';
import {Server} from 'socket.io';
import {AdminIO} from '../sockets/admin/admin.socket'
import uuid from 'uuid/v4';
import {GenericController} from "../generic.controller";

export class DeviceController {
    private ioAdmin: AdminIO;
    constructor(io: Server) {
        this.ioAdmin = new AdminIO(io);
    }
    public async getAllDevices(params: any): Promise<Device[]> {
        let pagination = GenericController.extractPaginationParams(params);
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * from device_provider LIMIT ?,?;";
            let rows = await conn.query(sql, [pagination.skip, pagination.limit]);
            return rows;
        }
        finally {
            if (conn) await conn.end();
        }
    }

    public async searchDevice(params: any): Promise<Device[]> {
        let pagination = GenericController.extractPaginationParams(params);
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * FROM device_provider ";
            let sqlObject = GenericController.extractQueryFilterParams(sql, params,["id",
                "imei", "name"]);
            sqlObject = GenericController.setOffset(sqlObject.sql, pagination.skip, pagination.limit, sqlObject.values);
            return await conn.query(sqlObject.sql, sqlObject.values);
        }
        finally {
            if (conn) await conn.end();
        }
    }
    public testSocketEvent(): boolean {
        try{
        this.ioAdmin.tabletVerified();
        return true;
        }
        catch {
            return false;
        }
    }
    public async verifyDevice(imei: String, otp: string): Promise<boolean> {
        let conn: PoolConnection;
        let device_id: string;
        try {
            device_id = await this.otpVerify(otp);
            if (device_id) {
                conn = await mariaDBpool.getConnection();
                let sql = "UPDATE device_provider SET imei = ? WHERE id = ?;";
                const rows = await conn.query(sql, [imei, device_id]);
                this.deleteOTP(device_id);
                if (rows) {
                    this.ioAdmin.tabletVerified();
                    return true;
                }
            }
            else {
                console.warn("No device id returned");
                return false;
            }
        } catch (err) {
            console.error(err);
            return err;
        } finally {
            if (conn) await conn.end();
        }

    }

    public async createDevice(device: Device): Promise<Object> {
        const id = uuid();
        let conn: PoolConnection;
        let query = "INSERT INTO device_provider(id, name) VALUES(?, ?);";
        try {
            conn = await mariaDBpool.getConnection();
            await conn.query(query, [id, device.name]);
            let otpInserted = await this.createNewDeviceOTP(id);
            return otpInserted;
        } catch (err) {
            console.error(err);
            return err;
        } finally {
            if (conn) await conn.end();
        }
    }

    private async createNewDeviceOTP(device_id: string): Promise<Object> {
        let bytes = crypto.randomBytes(6);
        let otp = bytes.toString('hex').slice(0, 6);
        let params = {
            Item: {
                "device_id": device_id,
                "otp": otp
            },
            TableName: "device_otp"
        };
        let inserted = { device_id, otp };
        try {
            await docClient.put(params).promise();
            inserted.device_id = device_id;
            inserted.otp = otp;
            return inserted;
        } catch (err) {
            console.group("Error Creating Device OTP");
            console.error(err);
            console.groupEnd();
            return err;
        }
    }

    /**
     * Inserts new entry in Etas table
     * @method function
     * @param  {String} otp one time passcode
     * @return  {Promise<string>}  string with device_id
     */
    private async otpVerify(otp: string): Promise<string> {
        /* Scans the entire device_otp table, and then narrows the results by otp then only the device_id is returned. */
        let params = {
            ExpressionAttributeNames: {
                "#device_id": "device_id"
            },
            ExpressionAttributeValues: {
                ":otp": otp
            },
            FilterExpression: "otp = :otp",
            ProjectionExpression: "#device_id",
            TableName: "device_otp"
        };
        try {
            console.info("OTP being Verified: %s", otp);
            let data = await docClient.scan(params).promise();
            if (data.Count == 1) {
                return data.Items[0].device_id;
            } else {
                return;
            }
        } catch (err) {
            console.error(err);
            return err;
        }
    }

    private async deleteOTP(device_id: string): Promise<boolean> {
        let params = {
            Key: {
                "device_id": device_id
            },
            TableName: "device_otp"
        };
        try {
            let data = await docClient.delete(params).promise();
            console.info("Deleted otp of device with id: %s", device_id);
            return (data ? true : false);
        } catch (err) {
            console.error(err);
            return err;
        }
    }
}
// export const deviceController = new DeviceController()
