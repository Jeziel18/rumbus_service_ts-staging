import { PoolConnection } from 'mariadb'
import mariaDBpool from '../../helpers/mariadbPool';
import uuid from 'uuid/v4';
import { GenericController } from "../generic.controller";
import { Announcement } from "../../models/announcement.model";
import { announcementEmitter, NEW_ANNOUNCEMENT } from '../../helpers/events'

export class AnnouncementController {

    public async getAllAnnouncements(): Promise<Announcement[]> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "SELECT * from announcement;";
            const rows = await conn.query(query);
            return rows;
        }
        finally {
            if (conn) conn.end();
        }
    }

    public async searchAnnouncement(params: any): Promise<Announcement[]> {
        let pagination = GenericController.extractPaginationParams(params);
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let sql = "SELECT * FROM announcement ";
            let sqlObject = GenericController.extractQueryFilterParams(sql, params,
                ["id", "user_id", "content", "headline", "expire_at"]);
            sqlObject = GenericController.setOffset(sqlObject.sql, pagination.skip, pagination.limit, sqlObject.values);
            return await conn.query(sqlObject.sql, sqlObject.values);
        }
        finally {
            if (conn) conn.end();
        }

    }

    public async createAnnouncement(announcement: Announcement): Promise<string> {
        let conn: PoolConnection;
        let id = uuid();
        try {
            conn = await mariaDBpool.getConnection();
            let query = "INSERT INTO announcement(id, user_id, content, headline, expire_at) VALUES(?, ?, ?, ?, ?);";
            await conn.query(query, [id, announcement.user_id, announcement.content, announcement.headline,
                announcement.expire_at]);
            announcement.id = id;
            announcementEmitter.emit(NEW_ANNOUNCEMENT, announcement);
            return id;
        } finally {
            if (conn) conn.end();
        }
    }

    public async updateAnnouncement(id: string, body: Announcement): Promise<void> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "UPDATE announcement ";
            let sqlObject = GenericController.extractBodyUpdateParameters(query, body,
                ["content", "headline", "expire_at"]);
            sqlObject = GenericController.extractQueryFilterParams(sqlObject.sql, { id: id },
                ["id"], sqlObject.values);
            await conn.query(sqlObject.sql, sqlObject.values);
        }
        finally {
            if (conn) conn.end();
        }
    }

    public async deleteAnnouncement(id: string): Promise<void> {
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let query = "DELETE from announcement WHERE id = ? ;";
            await conn.query(query, [id]);
        } finally {
            if (conn) conn.end();
        }
    }
}

export const announcementController = new AnnouncementController();
