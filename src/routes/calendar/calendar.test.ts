import request from "supertest";
import {PoolConnection} from 'mariadb';
import mariaDBpool from "../../helpers/mariadbPool";
import {count_table_entries, test_post_request_with_missing_param} from "../../test_common";

let req = request("http://web:8081");

let calendar_date_id = 'WD';

let clearDB = async (conn: PoolConnection) => {
    try {
        let query = "DELETE FROM calendar WHERE id = ?;";
        await conn.query(query, [calendar_date_id]);
    } catch (err) {
        console.error('Error cleaning calendar table');
        console.group(err);
    }
};

afterAll(async () => {
    try {
        await mariaDBpool.end();

    } catch (err) {
        console.error(err);
    }
});

beforeEach(async () =>{
    let conn: PoolConnection;
    try {
        conn = await mariaDBpool.getConnection();
        await clearDB(conn);
        let query = "INSERT INTO calendar(id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date) VALUES(?,?,?,?,?,?,?,?,?,?);";
        await conn.query(query, [calendar_date_id,1,1,1,
        1,1,0,0,"20210710","20210717"]);
    } catch (err) {
        console.error('Error populating calendar table')
        console.group(err);
    } finally {
        if (conn) await conn.end();
    }
});

describe('GET /calendar - get all service dates', function () {
    it('get calendar', async () => {
        await req
            .get("/calendar")
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('GET /calendar/:id - get service date with id', function () {
    it('send a non existing id', async () => {
        await req
            .get("/calendar/404")
            .expect(404);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .get("/calendar/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('get service date successfully', async () => {
        await req
            .get("/calendar/" + calendar_date_id)
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('DEL /calendar/:id - delete service date with id', function () {
    it('send a non existing id', async () => {
        await req
            .del("/calendar/404")
            .expect(204);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .del("/calendar/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('delete service date successfully', async () => {
        await req
            .del("/calendar/" + calendar_date_id)
            .expect(204);

        let conn: PoolConnection;
        try {
            let query = "SELECT * FROM calendar WHERE id = ? ;";
            let conn = await mariaDBpool.getConnection();
            let result = await conn.query(query, [calendar_date_id]);
            expect(result.length).toEqual(0);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

describe('POST /calendar - create a service date', function () {
    it('send bad request with missing body params', async () => {
        await test_post_request_with_missing_param(req, "/calendar",
            { "id": "CL", "monday": 0,"tuesday":0,"thursday":0,"friday":0,"saturday":0,
            "sunday":0,"start_date":"20210715","end_date":"20210722" });
    });
    it('creates the service date successfully', async () => {
        await req
            .post("/calendar")
            .send({
                "id": "CL",
                "monday": 0,
                "tuesday":0,
                "thursday":0,
                "friday":0,
                "saturday":0,
                "sunday":0,
                "start_date":"20210715",
                "end_date":"20210722"
            })
            .expect(201)
            .expect('Content-Type', /json/);
        let count = await count_table_entries('calendar');
        expect(count).toEqual(9);
    });
});

describe('PUT /calendar/:id - update service date with id', function () {
    it('send bad request - missing param id', async () => {
        let response = await req
            .put("/calendar/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.");
    });
    it('update service date successfully', async () => {
        await req
            .put("/calendar/" + calendar_date_id)
            .send({ "id": "800" })
            .expect(204);

        let conn: PoolConnection;
        let result, calendar;
        try {
            conn = await mariaDBpool.getConnection();
            result = await conn.query("SELECT * FROM calendar WHERE id = ? ;", [calendar_date_id]);
            calendar = result[0];
            expect(calendar.id).toEqual("800");
            expect(calendar.monday).toEqual(0);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            if (conn) await conn.end();
        }

    });
});

