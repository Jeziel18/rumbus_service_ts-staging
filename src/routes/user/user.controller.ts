import {PoolConnection} from 'mariadb'
import mariaDBpool from '../../helpers/mariadbPool';
import uuid from 'uuid/v4';
import {GenericController} from "../generic.controller";
import {User} from "../../models/user.model";


export class UserController {

    public async getAllUsers(): Promise<User[]> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "SELECT * from user;";
            const rows = await conn.query(query);
            return rows;
        }
        finally {
            if (conn) conn.end();
        }
    }

    public async searchUser(params:any): Promise<User[]>{
        let pagination = GenericController.extractPaginationParams(params);
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * FROM user ";
            let sqlObject = GenericController.extractQueryFilterParams(sql, params,
                ["id", "full_name", "email"]);
            sqlObject = GenericController.setOffset(sqlObject.sql, pagination.skip, pagination.limit, sqlObject.values);
            return await conn.query(sqlObject.sql, sqlObject.values);
        }
        finally {
            if (conn) conn.end();
        }

    }

    public async createUser(user: User): Promise<string> {
        let conn: PoolConnection;
        let id = uuid();
        try {
            conn = await mariaDBpool.getConnection();
            let query = "INSERT INTO user(id, full_name, email) VALUES(?, ?, ?);";
            await conn.query(query, [id, user.full_name, user.email]);
            return id;
        } finally {
            if (conn) conn.end();
        }
    }

    public async updateUser(id: string, body:User): Promise<void>{
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "UPDATE user ";
            let sqlObject = GenericController.extractBodyUpdateParameters(query, body,
                ["full_name", "email"]);
            sqlObject = GenericController.extractQueryFilterParams(sqlObject.sql, {id: id},
                ["id", "full_name", "email"], sqlObject.values);
            await conn.query(sqlObject.sql, sqlObject.values);
        }
        finally {
            if (conn) conn.end();
        }
    }

    public async deleteUser(id: string): Promise<void> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "DELETE from user WHERE id = ? ;";
            await conn.query(query, [id]);
        } finally {
            if (conn) conn.end();
        }
    }
}

export const userController = new UserController();
