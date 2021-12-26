import request from "supertest";
import {PoolConnection} from 'mariadb';
import mariaDBpool from "../../helpers/mariadbPool";
import {count_table_entries, test_post_request_with_missing_param} from "../../test_common";

let req = request("http://web:8081");

let test_user_id = 'qw903ea7-fa57-1239-fj8b-b0ffe9j99p21';

let clearDB = async (conn: PoolConnection) => {
    try {
        let query = "DELETE FROM user;";
        await conn.query(query);
    } catch (err) {
        console.error('Error cleaning user table');
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
        let query = "INSERT INTO user(id, full_name, email) VALUES(?, 'Test User', 'test.user@email.com');";
        await conn.query(query, [test_user_id]);
    } catch (err) {
        console.error('Error populating user table');
        console.group(err);
    } finally {
        if (conn) await conn.end();
    }
});

describe('GET /users - get all users', function () {
    it('get users', async () => {
        let response = await req
            .get("/users")
            .expect(200);
        console.log(response.body);
        expect(response.body.length).toEqual(1);
    });
});

describe('GET /users/:id - get user with id', function () {
    it('send a non existing id', async () => {
        await req
            .get("/users/404")
            .expect(404);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .get("/users/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('get user successfully', async () => {
        await req
            .get("/users/" + test_user_id)
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('DEL /users/:id - delete user with id', function () {
    it('send a non existing id', async () => {
        await req
            .del("/users/404")
            .expect(204);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .del("/users/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('delete user successfully', async () => {
        await req
            .del("/users/" + test_user_id)
            .expect(204);

        let conn: PoolConnection;
        try {
            let query = "SELECT * FROM user WHERE id = ? ;";
            let conn = await mariaDBpool.getConnection();
            let result = await conn.query(query, [test_user_id]);
            expect(result.length).toEqual(0);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

describe('POST /users - create a user', function () {
    it('send bad request with missing body params', async () => {
        await test_post_request_with_missing_param(req, "/users",
            { "full_name": "John Doe", "email": "john.doe@test.com"});
    });
    it('creates the user successfully', async () => {
        await req
            .post("/users")
            .send({
                "full_name": "John Doe",
                "email": "john.doe@test.com"
            })
            .expect(201)
        let count = await count_table_entries('user');
        expect(count).toEqual(2);
    });
});

describe('PUT /users/:id - update user with id', function () {
    it('send bad request - missing param id', async () => {
        let response = await req
            .put("/users/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.");
    });
    it('update user successfully', async () => {
        await req
            .put("/users/" + test_user_id)
            .send({"email": "john.doe@gmail.com"})
            .expect(204);
        let conn: PoolConnection;
        let result, user;
        try {
            conn = await mariaDBpool.getConnection();
            result = await conn.query("SELECT * FROM user WHERE id = ? ;", [test_user_id]);
            user = result[0];
            expect(user.email).toEqual("john.doe@gmail.com");
        }
        catch (err) {
            console.error(err);
        }
        finally {
            if (conn) await conn.end();
        }
    });
});

// TODO: create test for GET /users/search

