import request from 'supertest';
import {PoolConnection} from 'mariadb';
import server from '../../app';
import mariaDBpool from '../../helpers/mariadbPool';
import {count_table_entries} from "../../test_common";

let req = request("http://web:8081");

let test_device_id = 1234;
let clearDB = async (conn: PoolConnection) => {
    try {
        // Clean device table
        let query = 'DELETE from device_provider WHERE id = ? ;';
        await conn.query(query, [test_device_id]);
    } catch (err) {
        console.error('Error cleaning device table');
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
        // Populating device table
        conn = await mariaDBpool.getConnection();
        await clearDB(conn);
        let query = 'INSERT INTO device_provider(id, name) VALUES(?, ?);';
        await conn.query(query, [test_device_id, 'Test']);
    } catch (err) {
        console.error('Error populating device table');
        console.group(err);
    } finally {
        if (conn) await conn.end();
    }
});

describe('GET /devices - get all devices', function () {
    it('get devices', async () => {
        await req
            .get('/devices')
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('GET /devices/:id - get device with id', function () {
    it('send a non existing id', async () => {
        await req
            .get('/devices/404')
            .expect(404);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .get('/devices/')
            .expect(400);
        expect(response.body.message).toEqual('Need to provide an ID to look for.')
    });
    it('get device successfully', async () => {
        await req
            .get('/devices/' + test_device_id)
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('POST /devices - create a device', function () {
    it('send bad request with missing name', async done => {
        const response = await req
            .post('/devices')
            .send({})
            .expect(400);
        expect(response.body.message).toEqual('Need to provide a name.');
        done();
    });
    it('creates the device correctly and verify it', async done => {
        const res = await req
            .post('/devices')
            .set('Accept', 'application/json')
            .send({ name: "TestDevice2" })
            .expect(201)
            .expect('Content-Type', /json/);
        let count = await count_table_entries('device_provider');
        expect(count).toEqual(2);
        await req
            .post('/devices/verify')
            .send({
                otp: res.body.otp,
                imei: '12345'
            })
            .expect(200);
        done();
    });
});

// TODO: Fix failing sometimes because the time difference in container? s
describe('POST /devices/verify - test bad requests', function () {
    it('send bad request with missing imei and otp', async () => {
        await req
            .post('/devices/verify')
            .send({ 'otp': 'NewDeviceTest' })
            .expect(400);
        await req
            .post('/devices/verify')
            .send({ 'imei': '12345' })
            .expect(400);
    });
});

// TODO: test GET /devices/search
