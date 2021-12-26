import request from "supertest";
import {PoolConnection} from 'mariadb';
import mariaDBpool from "../../helpers/mariadbPool";
import documentClient from "../../helpers/dynamodbEnv";
import {clear_ddb_objects, test_post_request_with_missing_param} from "../../test_common";
// import {OSRM} from "../../helpers/osrm";

let req = request("http://web:8081");

let test_route_id = "123456-abcdef";
let test_stops = [
    { "lon": -67.141943, "lat": 18.211755, "name": "Stop 1" },
    { "lon": -67.144662, "lat": 18.211112, "name": "Stop 2" },
    { "lon": -67.139144, "lat": 18.209635, "name": "Stop 3" },
];
let clearDB = async (conn: PoolConnection) => {
    try {
        let query = "DELETE from route;";
        await conn.query(query);
    } catch(err) {
        console.error('Error cleaning route table.');
        console.group(err);
        throw err;
    }
};
let get_db_total_content = async () => {
    let query = "SELECT * FROM route;";
    let conn: PoolConnection;
    try{
        conn = await mariaDBpool.getConnection();
        let params = {
            TableName: "Route",
        };
        return await Promise.all([
            conn.query(query),
            documentClient.scan(params).promise()
        ]);
    } catch(err){
        console.error('Error testing db total content');
        console.group(err);
    } finally {
        if (conn) await conn.end();
    }
};

afterAll(async () => {
    try {
        await clear_ddb_objects('Route', [{'route_id': test_route_id}]);
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
        let mdb_values = [test_route_id, "Testing Route Name", "This is a route for testing."];
        let mdb_query = "INSERT INTO route(id, name, description) VALUES(?, ?, ?);";
        let params = {
            TableName: "Route",
            Item: {
                "route_id": test_route_id,
                "Stops": test_stops,
            }
        };
        // Document client will be updating route to original state.
        await Promise.all([conn.query(mdb_query, mdb_values), documentClient.put(params).promise()]);
    } catch (err) {
        console.error("Error populating route table in MariaDB and in DynamoDB");
        console.group(err);
    } finally {
        if (conn) await conn.end();
    }
});

// describe("Testing OSRM backend connectivity ", function () {
//     it('test osrm connectivity', async function () {
//         let response = await OSRM.osrm(test_stops);
//         expect(response.code).toEqual("Ok");
//     });
// });

describe("GET /routes - get all routes", function () {
    it('get routes successfully', async function () {
        await req
            .get("/routes")
            .expect(200)
            .expect("Content-Type", /json/);
    });
});

describe("GET /routes/:id - get route with id", function () {
    it('send a non existing id', async function () {
        await req
            .get("/routes/404")
            .expect(404);
    });

    it('send bad request - missing param id', async function () {
        const res = await req
            .get("/routes/")
            .expect(400);
        expect(res.body.message).toEqual("Need to provide an ID to look for.");
    });

    it('get route successfully', async function () {
        await req
            .get(`/routes/${test_route_id}`)
            .expect(200);
    });
});

describe("DEL /routes/:id - delete route with id", function () {
    it('send a non existing id', async function () {
        let result,data;
        await req
            .del("/routes/404")
            .expect(204);
        [result , data] = await get_db_total_content();
        expect(result.length).toEqual(1);
        expect(data.Items.length).toEqual(1);
    });

    it('send bad request - missing param id', async function () {
        const res = await req
            .del("/routes/")
            .expect(400);
        expect(res.body.message).toEqual("Need to provide an ID to look for.");
    });

    it('delete route successfully', async function () {
        let result,data;
        await req
            .del(`/routes/${test_route_id}`)
            .expect(204);
        [result , data] = await get_db_total_content();
        expect(result.length).toEqual(0);
        expect(data.Items.length).toEqual(0);
    });
});

describe("POST /routes - create a route", function () {
    it("send bad request with missing body params", async function () {
        await test_post_request_with_missing_param(req, "/routes",
            {
                "name": "Alternate Testing Route", "description": "This is another testing route.",
                "stops": [
                    { "lon": -67.139887, "lat": 18.215144, "name": "Stop 4" },
                    { "lon": -67.139678, "lat": 18.210959, "name": "Stop 5" },
                ]
            })
    });

    it('create the route successfully', async function () {
        let result, data;
        let body = {
            "name": "Alternate Testing Route", "description": "This is another testing route.",
            "stops": [
                { "lon": -67.139887, "lat": 18.215144, "name": "Stop 4" },
                { "lon": -67.139678, "lat": 18.210959, "name": "Stop 5" },
            ]
        };
        const res = await req
            .post("/routes")
            .send(body)
            .expect(201)
            .expect("Content-Type", /json/);
        expect(res.body.message).toEqual("TripRoute was successfully created!");
        [result , data] = await get_db_total_content();
        expect(result.length).toEqual(2);
        expect(data.Items.length).toEqual(2);

        await clear_ddb_objects('Route', [{'route_id': res.body.route_id}]);
    });
});

describe("PUT /routes/:id", function () {
    it('send bad request - missing param id', async function () {
        let res = await req
            .put("/routes/")
            .expect(400);
        expect(res.body.message).toEqual("Need to provide an ID to look for.");
    });

    it('update route successfully', async function () {
        let data = {
            "name": "Changed route name",
            "stops": [
                { "lon": -67.140819, "lat": 18.211239, "name": "Stop 4" },
                { "lon": -67.133752, "lat": 18.215914, "name": "Stop 5" },
            ]
        };
        await req
            .put(`/routes/${test_route_id}`)
            .send(data)
            .expect(204);
        let conn: PoolConnection;
        let result, dc_data;
        try {
            conn = await mariaDBpool.getConnection();
            let params = { TableName: "Route", Key: { "route_id": test_route_id } };
            [result, dc_data] = await Promise.all([
                await conn.query("SELECT * FROM route WHERE id = ?;", [test_route_id]),
                await documentClient.get(params).promise()]);
            let mdb_route = result[0];
            let ddb_route = dc_data.Item;
            expect(mdb_route.name).toEqual("Changed route name");
            expect(ddb_route.Stops).toEqual([
                { "lon": -67.140819, "lat": 18.211239, "name": "Stop 4" },
                { "lon": -67.133752, "lat": 18.215914, "name": "Stop 5" },
            ]);
        } catch(err){
            console.error(err);
        } finally{
            if (conn) await conn.end();
        }
    });
});
