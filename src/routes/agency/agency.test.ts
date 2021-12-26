import request from "supertest";
import {PoolConnection} from 'mariadb';
import mariaDBpool from "../../helpers/mariadbPool";
import {count_table_entries, test_post_request_with_missing_param} from "../../test_common";

let req = request("http://web:8081");

let test_agency_id = '123';

let clearDB = async (conn: PoolConnection) => {
    try {
        let query = "DELETE FROM agency WHERE id = ?;";
        await conn.query(query, [test_agency_id]);
    } catch (err) {
        console.error('Error cleaning agency table');
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

beforeEach(async () => {
    let conn: PoolConnection;
    try {
        conn = await mariaDBpool.getConnection();
        await clearDB(conn);
        let query = "INSERT INTO agency(id, name, url, timezone) VALUES(?, ?, ?, ?);";
        await conn.query(query, [test_agency_id, "Test RumBus", "https://www.uprm.edu/portada/", "Atlantic Standard Time"]);
    } catch (err) {
        console.error('Error populating agency table')
        console.group(err);
    } finally {
        if (conn) await conn.end();
    }
});

describe('GET /agency - get all agency', function () {
    it('get agency', async () => {
        await req
            .get("/agency")
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('GET /agency/:id - get agency with id', function () {
    it('send a non existing id', async () => {
        await req
            .get("/agency/404")
            .expect(404);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .get("/agency/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('get agency successfully', async () => {
        await req
            .get("/agency/" + test_agency_id)
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('DEL /agency/:id - delete agency with id', function () {
    it('send a non existing id', async () => {
        await req
            .del("/agency/404")
            .expect(204);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .del("/agency/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('delete agency successfully', async () => {
        await req
            .del("/agency/" + test_agency_id)
            .expect(204);

        let conn: PoolConnection;
        try {
            let query = "SELECT * FROM agency WHERE id = ? ;";
            let conn = await mariaDBpool.getConnection();
            let result = await conn.query(query, [test_agency_id]);
            expect(result.length).toEqual(0);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

describe('POST /agency - create a agency', function () {
    it('send bad request with missing body params', async () => {
        await test_post_request_with_missing_param(req, "/agency",
            { "name": "Test RumBus", "url": "https://www.uprm.edu/portada/", "timezone": "Atlantic Standard Time" });
    });
    it('creates the driver successfully', async () => {
        await req
            .post("/agency")
            .send({
                "name": "Test RumBus",
                "url": "https://www.uprm.edu/portada/",
                "timezone": "Atlantic Standard Time"
            })
            .expect(201)
            .expect('Content-Type', /json/);
        let count = await count_table_entries('agency');
        expect(count).toEqual(3);
    });
});

describe('PUT /agency/:id - update agency with id', function () {
    it('send bad request - missing param id', async () => {
        let response = await req
            .put("/agency/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.");
    });
    it('update agency successfully', async () => {
        await req
            .put("/agency/" + test_agency_id)
            .send({ "name": "Test RumBus" })
            .expect(204);

        let conn: PoolConnection;
        let result, agency;
        try {
            conn = await mariaDBpool.getConnection();
            result = await conn.query("SELECT * FROM agency WHERE id = ? ;", [test_agency_id]);
            agency = result[0];
            expect(agency.name).toEqual("Test RumBus");
            expect(agency.url).toEqual("https://www.uprm.edu/portada/");
            expect(agency.timezone).toEqual("Atlantic Standard Time");
        }
        catch (err) {
            console.error(err);
        }
        finally {
            if (conn) await conn.end();
        }

    });
});
