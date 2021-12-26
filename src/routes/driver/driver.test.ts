import request from "supertest";
import {PoolConnection} from 'mariadb';
import mariaDBpool from "../../helpers/mariadbPool";
import {count_table_entries, test_post_request_with_missing_param} from "../../test_common";

let req = request("http://web:8081");

let test_driver_id = '123';

let clearDB = async (conn: PoolConnection) => {
    try {
        let query = "DELETE FROM driver WHERE id = ?;";
        await conn.query(query, [test_driver_id]);
    } catch (err) {
        console.error('Error cleaning driver table');
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
        let query = "INSERT INTO driver(id, full_name, license) VALUES(?, ?, ?);";
        await conn.query(query, [test_driver_id, 'Test', 1234]);
    } catch (err) {
        console.error('Error populating driver table')
        console.group(err);
    } finally {
        if (conn) await conn.end();
    }
});

describe('GET /drivers - get all drivers', function () {
    it('get drivers', async () => {
        await req
            .get("/drivers")
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('GET /drivers/:id - get driver with id', function () {
    it('send a non existing id', async () => {
        await req
            .get("/drivers/404")
            .expect(404);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .get("/drivers/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('get driver successfully', async () => {
        await req
            .get("/drivers/" + test_driver_id)
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('DEL /drivers/:id - delete driver with id', function () {
    it('send a non existing id', async () => {
        await req
            .del("/drivers/404")
            .expect(204);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .del("/drivers/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('delete driver successfully', async () => {
        await req
            .del("/drivers/" + test_driver_id)
            .expect(204);

        let conn: PoolConnection;
        try {
            let query = "SELECT * FROM driver WHERE id = ? ;";
            let conn = await mariaDBpool.getConnection();
            let result = await conn.query(query, [test_driver_id]);
            expect(result.length).toEqual(0);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

describe('POST /drivers - create a driver', function () {
    it('send bad request with missing body params', async () => {
        await test_post_request_with_missing_param(req, "/drivers",
            { "full_name": "Test John", "license": 54321 });
    });
    it('creates the driver successfully', async () => {
        await req
            .post("/drivers")
            .send({
                "full_name": "Test John",
                "license": 54321
            })
            .expect(201)
            .expect('Content-Type', /json/);
        let count = await count_table_entries('driver');
        expect(count).toEqual(2);
    });
});

describe('PUT /drivers/:id - update driver with id', function () {
    it('send bad request - missing param id', async () => {
        let response = await req
            .put("/drivers/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.");
    });
    it('update driver successfully', async () => {
        await req
            .put("/drivers/" + test_driver_id)
            .send({ "license": 987 })
            .expect(204);

        let conn: PoolConnection;
        let result, driver;
        try {
            conn = await mariaDBpool.getConnection();
            result = await conn.query("SELECT * FROM driver WHERE id = ? ;", [test_driver_id]);
            driver = result[0];
            expect(driver.license).toEqual(987);
            expect(driver.full_name).toEqual("Test");
        }
        catch (err) {
            console.error(err);
        }
        finally {
            if (conn) await conn.end();
        }

    });
});

// TODO: create test for GET /drivers/search

