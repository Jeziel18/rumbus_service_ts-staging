import request from "supertest";
import {PoolConnection} from 'mariadb';
import mariaDBpool from "../../helpers/mariadbPool";
import {count_table_entries, test_post_request_with_missing_param} from "../../test_common";

let req = request("http://web:8081");

let test_announcement_id = 'qw90l3gj8-fa57-1239-fj8b-f0bfe9j99p2';
let test_user_id = '3j603ea7-fa57-1239-fj8b-b0ffe9j9dge1';

let announcement_query = "INSERT INTO announcement(id, user_id, content, headline, expire_at) VALUES(?, ?, 'test content', 'test headline', '2021-03-05 00:56:24');";
let user_query = "INSERT INTO user(id, full_name, email) VALUES(?, 'Test User', 'test.user@email.com');";

let clearDB = async (conn: PoolConnection) => {
    try {
        await Promise.all([
            conn.query("DELETE from announcement;"),
            conn.query("DELETE from user;")
        ]);
    } catch (err) {
        console.error('Error cleaning announcement table');
        console.group(err);
    }
};

afterAll(async () => {
    let conn: PoolConnection;
    try {
        conn = await mariaDBpool.getConnection();
        await clearDB(conn);
        await mariaDBpool.end();

    } catch (err) {
        console.error(err);
    }
});

beforeEach(async () => {
    let conn: PoolConnection;
    try {
        conn = await mariaDBpool.getConnection();
        await clearDB(conn);
        await conn.query(user_query, [test_user_id]);
        await conn.query(announcement_query, [test_announcement_id, test_user_id]);
    } catch (err) {
        console.error('Error populating announcement table');
        console.group(err);
    } finally {
        if (conn) await conn.end();
    }
});

describe('GET /announcements - get all announcements', function () {
    it('get announcements', async () => {
        let response = await req
            .get("/announcements")
            .expect(200);
        console.log(response.body);
        expect(response.body.length).toEqual(1);
    });
});

describe('GET /announcements/:id - get announcement with id', function () {
    it('send a non existing id', async () => {
        await req
            .get("/announcements/404")
            .expect(404);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .get("/announcements/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('get announcement successfully', async () => {
        await req
            .get("/announcements/" + test_announcement_id)
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('DEL /announcements/:id - delete announcement with id', function () {
    it('send a non existing id', async () => {
        await req
            .del("/announcements/404")
            .expect(204);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .del("/announcements/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('delete announcement successfully', async () => {
        await req
            .del("/announcements/" + test_announcement_id)
            .expect(204);

        let conn: PoolConnection;
        try {
            let query = "SELECT * FROM announcement WHERE id = ? ;";
            let conn = await mariaDBpool.getConnection();
            let result = await conn.query(query, [test_announcement_id]);
            expect(result.length).toEqual(0);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

describe('POST /announcements - create a announcement', function () {
    it('send bad request with missing body params', async () => {
        await test_post_request_with_missing_param(req, "/announcements",
            { "full_name": "John Doe", "email": "john.doe@test.com"});
    });
    it('creates the announcement successfully', async () => {
        await req
            .post("/announcements")
            .send({
                "user_id": test_user_id,
                "content": "This is the content",
                "headline": "Test headline",
                "expire_at": "2021-01-21 00:27:10"
            })
            .expect(201)
        let count = await count_table_entries('announcement');
        expect(count).toEqual(2);
    });
});

describe('PUT /announcements/:id - update announcement with id', function () {
    it('send bad request - missing param id', async () => {
        let response = await req
            .put("/announcements/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.");
    });
    it('update announcement successfully', async () => {
        await req
            .put("/announcements/" + test_announcement_id)
            .send({"content": "updated content"})
            .expect(204);
        let conn: PoolConnection;
        let result, announcement;
        try {
            conn = await mariaDBpool.getConnection();
            result = await conn.query("SELECT * FROM announcement WHERE id = ? ;", [test_announcement_id]);
            announcement = result[0];
            expect(announcement.content).toEqual("updated content");
        }
        catch (err) {
            console.error(err);
        }
        finally {
            if (conn) await conn.end();
        }
    });
});

// TODO: create test for GET /announcements/search
