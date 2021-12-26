import request from "supertest";
import {PoolConnection} from 'mariadb';
import mariaDBpool from "../../helpers/mariadbPool";
import {count_table_entries, empty_database, test_post_request_with_missing_param} from "../../test_common";
import documentClient from "../../helpers/dynamodbEnv";

let req = request("http://web:8081");

let test_public_trip_id = '01c48433-dc4d-454f-b67b-575288610e3e';
let test_administrative_trip_id = 'a55a0143-ce9d-487d-b3af-4f6325333ad4';
let test_trip_1_route_id = '443b8f1c-7cc7-455b-ad4d-834d95438f5b';
let test_trip_driver_id = '6bdb31da-27a0-4342-868e-00fec85a9a43';
let test_trip_vehicle_id = '0d903ea7-f957-4229-ae8b-b0ffe9799292';
let test_trip_user_id = '1';

let trip_driver_query = "INSERT INTO driver (id, full_name, license, updated_on, created_on) VALUES (?, 'Test John', 54321, '2020-01-21 00:27:10', '2020-01-21 00:27:10');";
let trip_vehicle_query = "INSERT INTO vehicle (id, property_number, plate, model, brand, capacity, handicap_enabled, mileage, ownership, updated_on, created_on) VALUES (?, 24, 'ABC123', 'Corolla', 'Toyota', 10, 1, 100000, 'RUMBus', '2020-01-21 00:58:42', '2020-01-21 00:58:42');";
let trip_user_query = "INSERT INTO user (id, full_name, email, updated_on, created_on) VALUES (?, 'Gloria', 'gloria@yahoo.com', '2019-03-05 01:04:58', '2019-03-05 01:04:58');\n";
let trip_1_query = "INSERT INTO trip (trip_number, id, driver_id, vehicle_id, user_id, applicant, faculty, purpose, departure_time, arrival_time, updated_on, created_on) VALUES (210, ?, ?, ?, ?, 'Dr Bienvenido Velez', 'Inso', 'Research Project', '2020-02-03 22:42:45', NULL, '2020-02-03 23:43:40', '2020-02-03 22:42:45');";
let trip_1_public_query = "INSERT INTO public_trip (trip_id, route_id) VALUES (?, ?);";
let trip_1_route_query = "INSERT INTO route (id, name, description, updated_on, created_on) VALUES (?, 'Ruta Expreso Zoológico a Física', 'Ruta 2: Expreso Zoológico a Física', '2019-03-05 00:56:24', '2019-03-05 00:56:24');";
let trip_2_query = "INSERT INTO trip (trip_number, id, driver_id, vehicle_id, user_id, applicant, faculty, purpose, departure_time, arrival_time, updated_on, created_on) VALUES (217, ?, ?,?, ?, 'Dr Bienvenido Velez', 'Inso', 'Research Project', '2020-02-04 14:32:19', NULL, '2020-02-04 14:32:41', '2020-02-04 14:32:19');";
let trip_2_administrative_query = "INSERT INTO administrative_trip (trip_id, type, destination) VALUES (?, 'Academicob', 'Ponce');";
let trip_cancellation_query = "INSERT INTO canceled_trip (trip_id, purpose) VALUES (?, 'test purpose');";

let clearDB = async (conn: PoolConnection) => {
    try {
        console.log('Cleaning trip, public_trip, administrative_trip, user, vehicle, driver and route tables');
        await conn.beginTransaction();
        // Delete data from tables which have references to trips
        await Promise.all([
            conn.query("DELETE from public_trip;"),
            conn.query("DELETE from administrative_trip;"),
            conn.query("DELETE from vehicle_usage;"),
            conn.query("DELETE from trip_device;"),
            conn.query("DELETE from trip_event;"),
            conn.query("DELETE from canceled_trip;")
        ]);
        // Delete trips
        await conn.query("DELETE from trip;");
        // Delete data from tables which trips referenes to
        await Promise.all([
            conn.query("DELETE from route;"),
            conn.query("DELETE from user;"),
            conn.query("DELETE from vehicle;"),
            conn.query("DELETE from driver;")
        ]);
        await conn.commit();
    } catch (err) {
        console.error('Error cleaning trip, public_trip, administrative_trip, user, vehicle, driver and route tables');
        console.group(err);
        if (conn) await conn.rollback();
    }
};

afterAll(async () => {
    try {
        await empty_database();
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
        console.log('Populating trip, public trip, administrative trip, driver, vehicle, user, and route tables');
        await conn.beginTransaction();
        await Promise.all([
            conn.query(trip_driver_query, [test_trip_driver_id]),
            conn.query(trip_vehicle_query, [test_trip_vehicle_id]),
            conn.query(trip_user_query, [test_trip_user_id])
        ]);
        await conn.query(trip_1_query, [test_public_trip_id, test_trip_driver_id, test_trip_vehicle_id, test_trip_user_id]);
        await Promise.all([
            conn.query(trip_1_route_query, [test_trip_1_route_id]),
            conn.query(trip_2_query, [test_administrative_trip_id, test_trip_driver_id, test_trip_vehicle_id, test_trip_user_id])
        ]);
        await Promise.all([
            conn.query(trip_cancellation_query, [test_administrative_trip_id]),
            conn.query(trip_1_public_query, [test_public_trip_id, test_trip_1_route_id]),
            conn.query(trip_2_administrative_query, [test_administrative_trip_id])
        ]);
        await conn.commit();
    } catch (err) {
        console.error('Error populating trip, public trip, administrative trip, driver, vehicle, user, and route tables');
        console.group(err);
        if (conn) await conn.rollback();
    } finally {
        if (conn) await conn.end();
    }
});

describe('GET /trips/active - get all active trips', function () {
    it('get active trips', async () => {
        let response = await req
            .get("/trips/active")
            .expect(200)
            .expect('Content-Type', /json/);
        expect(response.body.length).toEqual(1);
        expect(response.body[0]["id"]).toEqual(test_public_trip_id);
    });
    it('search trips', async () => {
        let response = await req
            .get(`/trips/search?departure_time=2020-02-03`)
            .expect(200)
            .expect('Content-Type', /json/);
        expect(response.body.length).toEqual(1);
        expect(response.body[0]["id"]).toEqual(test_public_trip_id);
    });
});

describe('POST /trips - create a trip', function () {
    it('send bad request with missing body params for public trip', async () => {
        await test_post_request_with_missing_param(req, "/trips",
            {
                "trip_number": "1", "driver_id": test_trip_driver_id, "vehicle_id": test_trip_vehicle_id,
                "user_id": test_trip_user_id, "route_id": test_trip_1_route_id, "public": "1", "applicant": "John",
                "faculty": "Some Faculty", "purpose": "Life has no purpose", "departure_time": Date.now().toString()
            });

    });
    it('send bad request with missing body params for administrative trip', async () => {
        await test_post_request_with_missing_param(req, "/trips",
            {
                "trip_number": "1", "driver_id": test_trip_driver_id, "vehicle_id": test_trip_vehicle_id,
                "user_id": test_trip_user_id, "public": "0", "applicant": "John", "faculty": "Some Faculty",
                "purpose": "Life has no purpose", "departure_time": Date.now().toString(), "destination": "somewhere",
                "type": "not sure what goes here"
            });

    });
    it('creates a public trip successfully', async () => {
        await req
            .post("/trips")
            .send({
                "trip_number": "1", "driver_id": test_trip_driver_id, "vehicle_id": test_trip_vehicle_id,
                "user_id": test_trip_user_id, "route_id": test_trip_1_route_id, "public": "1", "applicant": "John",
                "faculty": "Some Faculty", "purpose": "Life has no purpose",
                "departure_time": new Date().toISOString().slice(0, 19).replace('T', ' ')
            })
            .expect(201)
            .expect('Content-Type', /json/);
        let count = await count_table_entries('public_trip');
        expect(count).toEqual(2);
    });
    it('creates an administrative trip successfully', async () => {
        await req
            .post("/trips")
            .send({
                "trip_number": "1", "driver_id": test_trip_driver_id, "vehicle_id": test_trip_vehicle_id,
                "user_id": test_trip_user_id, "public": "0", "applicant": "John", "faculty": "Some Faculty",
                "purpose": "Life has no purpose",
                "departure_time": new Date().toISOString().slice(0, 19).replace('T', ' '),
                "destination": "somewhere",
                "type": "not sure what goes here"
            })
            .expect(201)
            .expect('Content-Type', /json/);
        let count = await count_table_entries('administrative_trip');
        expect(count).toEqual(2);
    });
    it('Shows that trip is not created if public trip cannot be created', async () => {
        await req
            .post("/trips")
            .send({
                "trip_number": "1", "driver_id": test_trip_driver_id, "vehicle_id": test_trip_vehicle_id,
                "user_id": test_trip_user_id, "route_id": "Purposely not valid", "public": "1", "applicant": "John",
                "faculty": "Some Faculty", "purpose": "Life has no purpose",
                "departure_time": new Date().toISOString().slice(0, 19).replace('T', ' ')
            })
            .expect(500);
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            // TODO: Verify that id = 1 is actualy what we want. In line 153 we use trip_number, not id
            let rows = await conn.query("SELECT * FROM trip WHERE id = ?", ['1']);
            expect(rows.length).toEqual(0);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
    it('Shows that trip is not created if administrative trip cannot be created', async () => {
        await req
            .post("/trips")
            .send({
                "trip_number": "1", "driver_id": test_trip_driver_id, "vehicle_id": test_trip_vehicle_id,
                "user_id": test_trip_user_id, "public": "0", "applicant": "John", "faculty": "Some Faculty",
                "purpose": "Life has no purpose",
                "departure_time": new Date().toISOString().slice(0, 19).replace('T', ' '),
                "destination": null,
                "type": "not sure what goes here"
            })
            .expect(500);
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let rows = await conn.query("SELECT * FROM trip WHERE id = ?", ['1'])
            expect(rows.length).toEqual(0);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

describe('GET /trips/:id - get trip with id', function () {
    it('send a non existing id', async () => {
        await req
            .get("/trips/404")
            .expect(404);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .get("/trips/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('get trip successfully', async () => {
        await req
            .get("/trips/" + test_public_trip_id)
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('DEL /trips/:id - delete trip with id', function () {
    it('send a non existing id', async () => {
        await req
            .del("/trips/404")
            .expect(204);
    });
    it('send bad request - missing param id', async () => {
        const response = await req
            .del("/trips/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.")
    });
    it('delete trip successfully', async () => {
        await req
            .del("/trips/" + test_public_trip_id)
            .expect(204);

        let query = "SELECT * FROM trip WHERE id = ? ;";
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let result = await conn.query(query, [test_public_trip_id]);
            expect(result.length).toEqual(0);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});


describe('PUT /trips/end-trip - puts an arrival time on a trip', function () {
    it('end a trip', async () => {
        let response = await req
            .put("/trips/end-trip/" + test_public_trip_id)
            .expect(204);
        let query = "SELECT * FROM trip WHERE id = ? ;";
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let result = await conn.query(query, [test_public_trip_id]);
            expect(result[0]["arrival_time"]).not.toBeNull();
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

describe('POST /trips/:trip_id/cancel - cancel a trip', function () {
    it('send bad request with missing body params', async () => {
        await test_post_request_with_missing_param(req, "/trips/" + test_public_trip_id + "/cancel",
            { "purpose": "test" });

    });
    it('send a non-existing trip id', async () => {
        await req
            .post("/trips/404/cancel")
            .send({ "purpose": "test" })
            .expect(404);

    });
    it('cancel a trip successfully', async () => {
        await req
            .post("/trips/" + test_public_trip_id + "/cancel")
            .send({ "purpose": "test" })
            .expect(204)
        let count = await count_table_entries('canceled_trip');
        expect(count).toEqual(2);
    });
});

describe('PUT /trips/:trip_id/cancel - edit a trip cancellation', function () {
    it('send bad request with missing id', async () => {
        await req
            .put("/trips//cancel")
            .expect(400);
    });
    it('send a non-existing trip id', async () => {
        await req
            .put("/trips/404/cancel")
            .send({ "purpose": "test" })
            .expect(404);
    });
    it('update trip cancellation successfully', async () => {
        await req
            .put("/trips/" + test_administrative_trip_id + "/cancel")
            .send({ "purpose": "updated" })
            .expect(204)
        let conn: PoolConnection;
        let result, trip_cancellation;
        try {
            conn = await mariaDBpool.getConnection();
            result = await conn.query("SELECT * FROM canceled_trip WHERE trip_id = ?;", [test_administrative_trip_id]);
            trip_cancellation = result[0];
            expect(trip_cancellation.purpose).toEqual("updated");
        }
        catch (err) {
            console.error(err);
        }
        finally {
            if (conn) await conn.end();
        }
    });
});

// describe('PUT /trips/:id - update trip with id', function() {
//     it('send bad request - missing param id', async () => {
//         let response = await req
//             .put("/trips/")
//             .expect(400);
//         expect(response.body.message).toEqual("Need to provide an ID to look for.");
//     });
//     it('update trip successfully', async () => {
//         await req
//             .put("/drivers/"+test_driver_id)
//             .send({"license": 987})
//             .expect(204);
//
//         let conn = await mariaDBpool.getConnection();
//         let result = await conn.query("SELECT * FROM driver WHERE id = ? ;", [test_driver_id]);
//         conn.end();
//
//         let driver = result[0];
//         expect(driver.license).toEqual(987);
//         expect(driver.full_name).toEqual("Test");
//     });});



describe('POST /trips/:trip_id/history - create a trip history instance', function () {
    it('send bad request with missing body params', async () => {
        try{
            await test_post_request_with_missing_param(req, "/trips/" + test_public_trip_id + "/history",
                { "geopoints": [] });
        } catch(err){
            console.error(err);
        }

    });
    it('send bad request with missing geopoints params', async () => {
        let response = await req
            .post("/trips/" + test_public_trip_id + "/history")
            .send({ "geopoints": [{ "lat": 1, "lon": 2, "timestamp": 0, "accuracy": 3, "bearing": 4 },
                    { "lat": 1, "lon": 2,"accuracy": 3, "bearing": 4 }]})
            .expect(400);
        expect(response.body.message).toEqual("A geopoint is missing required param: timestamp");
    });
    it('send a non-existing trip id', async () => {
        await req
            .post("/trips/404/history")
            .expect(404);
    });
    it('create a trip history successfully', async () => {
        await req
            .post("/trips/" + test_public_trip_id + "/history")
            .send({ "geopoints": [{ "lat": 1, "lon": 2, "timestamp": 0, "accuracy": 3, "bearing": 4 }] })
            .expect(201)
            .on('error', (err)=>{
                console.error(err);
            });
        try{
            let params = {
                TableName: "Trip_history",
            };
            let data = await documentClient.scan(params).promise();
            expect(data.Items.length).toEqual(1);
        } catch(err){
            console.error(err);
        }
    });
});

describe('GET /trips/:trip_id/history - get trip history', function () {
    it('send a non-existing trip id', async () => {
        await req
            .get("/trips/404/history")
            .expect(404);

    });
    it('get trip history successfully', async () => {
        let trip_history_params = {
            TableName: "Trip_history",
            Key: {
                trip_id: test_public_trip_id
            },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set #geopoints = list_append(#geopoints, :geopoints)',
            ExpressionAttributeNames: {
                '#geopoints': 'geopoints'
            },
            ExpressionAttributeValues: {
                ':geopoints':  [
                    {
                        "lat": 1,
                        "lon": 2,
                        "timestamp": 0,
                        "accuracy": 3,
                        "bearing": 4
                    }
                ],
            }
        };
        try {
            await documentClient.update(trip_history_params).promise();
        } catch (err) {
            console.error(err);
        }

        let response = await req
            .get("/trips/" + test_public_trip_id + "/history")
            .expect(200);
        expect(response.body.length).toEqual(1);

        let params = {
            TableName: "Trip_history",
            Key: {
                trip_id: test_public_trip_id
            }
        };
        try {
            await documentClient.delete(params).promise();
        } catch (err) {
            console.error(err);
        }
    });
});

describe('POST /trips/:trip_id/events - create a trip event', function () {
    it('send bad request with missing body params', async () => {
        await test_post_request_with_missing_param(req, "/trips/" + test_public_trip_id + "/events",
            { "description": "test", "type": "test" });

    });
    it('send a non-existing trip id', async () => {
        await req
            .post("/trips/404/events")
            .expect(404);

    });
    it('create a trip event successfully', async () => {
        await req
            .post("/trips/" + test_public_trip_id + "/events")
            .send({ "description": "Mucho test y tapón", "type": "accidente" })
            .expect(201)
            .expect('Content-Type', /json/);
        let count = await count_table_entries('trip_event');
        expect(count).toEqual(1);
    });
});

describe('GET /trips/:trip_id/events - get trip events', function () {
    it('send a non-existing trip id', async () => {
        await req
            .get("/trips/404/events")
            .expect(404);

    });
    it('get trip events successfully', async () => {
        let trip_event_id = 'test123';
        let sql = "INSERT INTO trip_event(id, trip_id, description, type) VALUES(?, ?, 'test', 'accidente');";
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            await conn.query(sql, [trip_event_id, test_public_trip_id]);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }

        let res = await req
            .get("/trips/" + test_public_trip_id + "/events")
            .expect(200);
        expect(res.body.length).toEqual(1);

        try {
            conn = await mariaDBpool.getConnection();
            await conn.query("DELETE from trip_event WHERE id = ?;", [trip_event_id]);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

