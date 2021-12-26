import request from "supertest";
import {PoolConnection} from 'mariadb';
import mariaDBpool from "../../helpers/mariadbPool";
import {count_table_entries, empty_database, test_post_request_with_missing_param} from "../../test_common";

let req = request("http://web:8081");
let test_vehicle_id = "bops123";
let test_vehicle_2_id = "vehicle123";
let test_trip_id = "abc123";
let test_driver_id = "123abc";
let test_user_id = "test432";
let test_vehicle_maintenance_id = "maintenance123";

let trip_driver_query = "INSERT INTO driver (id, full_name, license, updated_on, created_on) VALUES (?, 'Test John', 54321, '2020-01-21 00:27:10', '2020-01-21 00:27:10');";
let trip_vehicle_query = "INSERT INTO vehicle (id, property_number, plate, model, brand, capacity, handicap_enabled, mileage, ownership, updated_on, created_on) VALUES (?, 24, 'ABC123', 'Corolla', 'Toyota', 10, 1, 100000, 'RUMBus', '2020-01-21 00:58:42', '2020-01-21 00:58:42');";
let trip_user_query = "INSERT INTO user (id, full_name, email, updated_on, created_on) VALUES (?, 'Gloria', 'gloria@yahoo.com', '2019-03-05 01:04:58', '2019-03-05 01:04:58');\n";
let trip_query = "INSERT INTO trip (trip_number, id, driver_id, vehicle_id, user_id, applicant, faculty, purpose, departure_time, arrival_time, updated_on, created_on) VALUES (210, ?, ?, ?, ?, 'Dr Bienvenido Velez', 'Inso', 'Research Project', '2020-02-03 22:42:45', NULL, '2020-02-03 23:43:40', '2020-02-03 22:42:45');";
let vehicle_usage_query = "INSERT INTO vehicle_usage (trip_id, end_mileage_system, start_mileage, end_mileage, start_gas, end_gas, gas_expense) VALUES (?, 80000, 80000, 81000, 90, 50, 20);";
let vehicle_maintenance_query = "INSERT INTO vehicle_maintenance(id, vehicle_id, user_id, maintenance_date, type, mileage, cost, details, inspector) VALUES(?, ?, ?, '2019-03-05', 'Fixes', 130000, 500, 'Broken parts', 'Juan Test');";

let clearDB = async (conn: PoolConnection) => {
    try {
        console.log('Cleaning trip, vehicle, vehicle_usage, vehicle_maintenance, user, and driver tables');
        await conn.beginTransaction();
        // Delete data from tables which have references to trips, vehicle and user
        await conn.query("DELETE from vehicle_usage;");
        await conn.query("DELETE from vehicle_maintenance;");
        // Delete trip
        await conn.query("DELETE from trip;");
        // Delete data from tables which trips referenes to
        await Promise.all([
            conn.query("DELETE from user;"),
            conn.query("DELETE from vehicle;"),
            conn.query("DELETE from driver;")
        ]);
        await conn.commit();
    } catch (err) {
        console.error('Error cleaning trip, vehicle, vehicle_usage, vehicle_maintenance, user, and driver tables');
        console.group(err);
        if (conn) await conn.rollback();
    } finally {
        if (conn) await conn.end();
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
        console.log('Populating trip, vehicle, vehicle_usage, vehicle_maintenance, user and driver tables');
        await conn.beginTransaction();
        await Promise.all([
            conn.query(trip_driver_query, [test_driver_id]),
            conn.query(trip_vehicle_query, [test_vehicle_id]),
            conn.query(trip_vehicle_query, [test_vehicle_2_id]),
            conn.query(trip_user_query, [test_user_id])
        ]);
        await conn.query(trip_query, [test_trip_id, test_driver_id, test_vehicle_id, test_user_id]);
        await conn.query(vehicle_usage_query, [test_trip_id]);
        await conn.query(vehicle_maintenance_query, [test_vehicle_maintenance_id, test_vehicle_id, test_user_id]);
        await conn.commit();
    } catch (err) {
        console.error('Error populating trip, vehicle, vehicle_usage, vehicle_maintenance, user and driver tables');
        console.group(err);
           if (conn) await conn.rollback();
    } finally {
        if (conn) await conn.end();
    }
});

describe('GET /vehicles - get all vehicles', function () {
    it('get vehicles successfully', async ()=> {
        await req
            .get("/vehicles")
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('GET /vehicles/:id - get vehicle with id', function () {
    it('send a non existing id', async () => {
        await req
            .get("/vehicles/404")
            .expect(404);
    });

    it('send bad request - missing param id', async () => {
        const response = await req
            .get("/vehicles/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.");
    });

    it('get vehicle successfully', async () => {
        await req
            .get("/vehicles/" + test_vehicle_id)
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('DEL /vehicles/:id - delete vehicle with id', function () {
    it('send a non existing id', async () => {
        await req
            .del("/vehicles/404")
            .expect(204);
    });

    it('send bad request - missing param id', async () => {
        const response = await req
            .del("/vehicles/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.");
    });

    it('delete the vehicle successfully', async () => {
        let conn: PoolConnection;
        let query = "SELECT * FROM vehicle WHERE id = ? ;";
        try {
            conn = await mariaDBpool.getConnection();
            await req
                .del("/vehicles/" + test_vehicle_2_id)
                .expect(204);
            let result = await conn.query(query, [test_vehicle_2_id]);
            expect(result.length).toEqual(0);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

describe('POST /vehicles - create a vehicle', function () {
    it('send bad request with missing body params', async () => {
        await test_post_request_with_missing_param(req, "/vehicles", {
            "property_number": 24, "plate": 'ABC123',
            "model": 'Corolla', "brand": 'Toyota', "capacity": 10, "handicap_enabled": true,
            "mileage": 100000, "ownership": 'RUMBus'});
    });

    it('creates the vehicle successfully', async () => {
        let body = { "property_number": 10, "plate": 'ABC123',
            "model": 'Corolla', "brand": 'Toyota', "capacity": 10, "handicap_enabled": false, "mileage": 40000,
            "ownership": 'Tests'};
        await req
            .post("/vehicles")
            .send(body)
            .expect(201)
            .expect('Content-Type', /json/);
        let count = await count_table_entries('vehicle');
        expect(count).toEqual(3);
    });
});

describe('PUT /vehicles/:id - update vehicle with id', function () {
    it('send bad request - missing param id', async () => {
        let response = await req
            .put("/vehicles/")
            .expect(400);
        expect(response.body.message).toEqual("Need to provide an ID to look for.");
    });

    it('update vehicle successfully', async () => {
        await req
            .put("/vehicles/" + test_vehicle_id)
            .send({ "model": 'Model S', "brand": 'Tesla' })
            .expect(204);
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let result = await conn.query("SELECT * FROM vehicle WHERE id = ? ;", [test_vehicle_id]);
            let vehicle = result[0];
            expect(vehicle.brand).toEqual("Tesla");
            expect(vehicle.model).toEqual("Model S");
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

describe('GET /vehicles/:vehicle_id/vehicle_usages - get vehicle usages by vehicle_id', function() {
    it('send a non-existing vehicle id', async () => {
        await req
            .get("/vehicles/404/vehicle_usages")
            .expect(404);

    });
    it('get vehicle usages by vehicle_id successfully', async () => {
        let response = await req
            .get("/vehicles/"+test_vehicle_id+"/vehicle_usages")
            .expect(200);
        expect(response.body.length).toEqual(1);
    });
});

describe('GET /vehicles/vehicle_usages/:trip_id - get vehicle usage by trip_id', function() {

    it('send a non-existing trip id', async () => {
        await req
            .get("/vehicles/vehicle_usages/404")
            .expect(404);
    });
    it('get vehicle usage by trip_id successfully', async () => {
        await req
            .get("/vehicles/vehicle_usages/"+test_trip_id)
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

describe('PUT /vehicles/vehicle_usages/:trip_id - update vehicle usage by trip_id', function() {

    it('send bad request', async () => {
        await req
            .put("/vehicles/vehicle_usages/")
            .expect(400);
    });
    it('send a non-existing id', async () => {
        await req
            .put("/vehicles/vehicle_usages/404")
            .send({ "gas_expense": 60 })
            .expect(204);
    });
    it('update vehicle usage by trip_id successfully', async () => {
        await req
            .put("/vehicles/vehicle_usages/"+test_trip_id)
            .send({ "gas_expense": 60 })
            .expect(204);
        let query = "SELECT * FROM vehicle_usage WHERE trip_id = ? ;";
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let result = await conn.query(query, [test_trip_id]);
            let vehicle_usage = result[0];
            expect(vehicle_usage.gas_expense).toEqual(60);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

describe('POST /vehicles/:vehicle_id/vehicle_maintenance - create a vehicle maintenance instance', function () {
    it('send bad request with missing body params', async () => {
        try{
            await test_post_request_with_missing_param(req, "/vehicles/" + test_vehicle_id + "/vehicle_maintenance",
                {"user_id": "", "inspector": "", "cost": 1, "mileage": 1, "details": "", "type": "",
                    "maintenance_date": ""
                });
        } catch(err){
            console.error(err);
        }

    });
    it('send a non-existing trip id', async () => {
        await req
            .post("/vehicles/404/vehicle_maintenance")
            .expect(404);
    });
    it('create vehicle maintenance successfully', async () => {
        await req
            .post("/vehicles/" + test_vehicle_id + "/vehicle_maintenance")
            .send({"user_id": test_user_id, "inspector": "Juan Test", "cost": 500.0,
                "mileage": 130000, "details": "Broken parts", "maintenance_date": "2019-03-05", "type": "Fixes"
            })
            .expect(201)
            .on('error', (err)=>{
                console.error(err);
            });
        let count = await count_table_entries('vehicle_maintenance');
        expect(count).toEqual(2);
    });
});

describe('GET /vehicles/:vehicle_id/vehicle_maintenance - get vehicle maintenances by vehicle_id', function() {
    it('send a non-existing vehicle id', async () => {
        await req
            .get("/vehicles/404/vehicle_maintenance")
            .expect(404);
    });
    it('send a bad request', async () => {
        await req
            .get("/vehicles//vehicle_maintenance")
            .expect(400);
    });
    it('get vehicle_maintenance by vehicle_id successfully', async () => {
        let response = await req
            .get("/vehicles/" + test_vehicle_id + "/vehicle_maintenance")
            .expect(200);
        expect(response.body.length).toEqual(1);
    });
});

describe('PUT /vehicles/vehicle_maintenance/:id - update vehicle maintenance by id', function() {
    it('send bad request', async () => {
        await req
            .put("/vehicles/vehicle_maintenance/")
            .expect(400);
    });
    it('send a non-existing id', async () => {
        await req
            .put("/vehicles/vehicle_maintenance/404")
            .send({"cost": 1000})
            .expect(204);
    });
    it('update vehicle maintenance by id successfully', async () => {
        await req
            .put("/vehicles/vehicle_maintenance/"+test_vehicle_maintenance_id)
            .send({"cost": 1000})
            .expect(204);
        let query = "SELECT * FROM vehicle_maintenance WHERE id = ? ;";
        let conn: PoolConnection;
        try {
            conn = await mariaDBpool.getConnection();
            let result = await conn.query(query, [test_vehicle_maintenance_id]);
            let vehicle_maintenance = result[0];
            expect(vehicle_maintenance.cost).toEqual(1000);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) await conn.end();
        }
    });
});

// TODO: create test for GET /vehicles/search
