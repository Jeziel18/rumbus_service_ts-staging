import request from "supertest";
import documentClient from "../../helpers/dynamodbEnv";
import {clear_ddb_objects, test_post_request_with_missing_param} from "../../test_common";
import mariaDBpool from '../../helpers/mariadbPool';
import {PoolConnection} from 'mariadb';

let req = request("http://web:8081");

let stop1_lat = 18.215853;
let stop1_lon = -67.133769;

let getDbTotalContent = async () => {
    let conn: PoolConnection;
    try {
        conn = await mariaDBpool.getConnection();
        let sql = "SELECT * FROM stop"
        await conn.query(sql);
    
    
    } catch (err) {
        console.error('Error getting DB content');
        console.group(err);
    }
};


afterAll(async () => {
    try {
        await clear_ddb_objects('Stop', [{'lat': stop1_lat, 'lon': stop1_lon}]);

    } catch (err) {
        console.error(err);
    }
});

beforeEach(async () => {
    let conn: PoolConnection;
    try {
        // Will be updating stop to original state.
        conn = await mariaDBpool.getConnection();
        let query = "INSERT INTO stop(lat,lon) VALUES(?,?,?);";
        await conn.query(query,[stop1_lat,stop1_lon])
        
    } catch (err) {
        console.error("Error populating stop table in DynamoDB");
        console.group(err);
    }
});

describe("GET /stops - get all stops", function () {
    it('get all stops successfully', async function () {
        await req.
            get("/stops")
            .expect(200)
            .expect("Content-Type", /json/);
    });
});

describe("GET /stops/:lat/:lon - get stop with lat and lon", function () {
    it('send non existing lat and lon', async function () {
        await req
            .get('/stops/20.20/21.21')
            .expect(404);
    });

    it('send bad request - missing params lat and lon', async function () {
        const res_missing_lat_lon = await req
            .get('/stops//')
            .expect(400);
        const res_missing_lat = await req
            .get('/stops/32.5436/')
            .expect(400);
        const res_missing_lon = await req
            .get('/stops//54.321')
            .expect(400);
        expect(res_missing_lat_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_missing_lat.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_missing_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
    });

    it('send bad request - non numeric lat and lon', async function () {
        const res_bad_lat_lon = await req
            .get('/stops/latitude/longitude')
            .expect(400);
        const res_bad_lat = await req
            .get('/stops/latitude/-45.321')
            .expect(400);
        const res_bad_lon = await req
            .get('/stops/12.3456/longitude')
            .expect(400);
        expect(res_bad_lat_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_bad_lat.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_bad_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
    });

    it('get stop successfully', async function () {
        await req
            .get(`/stops/${stop1_lat}/${stop1_lon}`)
            .expect(200);
    });
});

describe("DEL /stops/:lat/:lon - delete stop with lat and lon",  function () {
    it('send non existing lat and lon', async function () {
        let data:any;
        await req
            .del('/stops/20.20/-21.21')
            .expect(404);
        data = await getDbTotalContent();
        expect(data.Items.length).toEqual(1);
    });

    it('send bad request - missing params lat and lon', async function () {
        const res_missing_lat_lon = await req
            .del('/stops//')
            .expect(400);
        const res_missing_lat = await req
            .del('/stops/32.5436/')
            .expect(400);
        const res_missing_lon = await req
            .del('/stops//54.321')
            .expect(400);
        expect(res_missing_lat_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_missing_lat.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_missing_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
    });

    it('send bad request - non numeric lat and lon', async function () {
        const res_bad_lat_lon = await req
            .del('/stops/latitude/longitude')
            .expect(400);
        const res_bad_lat = await req
            .del('/stops/latitude/-45.321')
            .expect(400);
        const res_bad_lon = await req
            .del('/stops/12.3456/longitude')
            .expect(400);
        expect(res_bad_lat_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_bad_lat.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_bad_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
    });

    it('delete stop successfully', async function () {
        let data:any;
        await req
            .del(`/stops/${stop1_lat}/${stop1_lon}`)
            .expect(204);
        data = await getDbTotalContent();
        expect(data.Items.length).toEqual(0);
    });
});

describe('POST /stops - create a stop', function () {
    it('send bad request - missing body param', async function () {
        await test_post_request_with_missing_param(req, '/stops',
            {
                'name': 'Centro de Estudiantes',
                'lat': 18.211241,
                'lon': -67.133769
            });
    });

    it('create existing stop - conflict error', async function () {
        let body = {
            'name': 'Biblioteca',
            'lat': stop1_lat,
            'lon': stop1_lon,
        };
        await req
            .post('/stops')
            .send(body)
            .expect(409);
    });

    it('create stops successfully', async function () {
        let body = {
            'name': 'Centro de Estudiantes',
            'lat': 18.211241,
            'lon': -67.133769
        };
        let data:any;
        const res = await req
            .post('/stops')
            .send(body)
            .expect(201)
            .expect('Content-Type', /json/);
        data = await getDbTotalContent();
        expect(res.body.message).toEqual("Stop was successfully created!");
        expect(data.Items.length).toEqual(2);

        await clear_ddb_objects('Stop', [{'lat': body.lat, 'lon': body.lon}]);
    });
});

describe('PUT /stops/:lat/:lon - update stop with lat and lon', function () {
    it('update non existing stop', async function() {
        let body = {'name': 'New stop'};
        await req
            .put('/stops/20.20/-21.21')
            .send(body)
            .expect(404);
    });

    it('send bad request - missing params lat and lon', async function () {
        const res_missing_lat_lon = await req
            .put('/stops//')
            .expect(400);
        const res_missing_lat = await req
            .put('/stops/32.5436/')
            .expect(400);
        const res_missing_lon = await req
            .put('/stops//54.321')
            .expect(400);
        expect(res_missing_lat_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_missing_lat.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_missing_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
    });

    it('send bad request - non numeric lat and lon', async function () {
        const res_bad_lat_lon = await req
            .put('/stops/latitude/longitude')
            .expect(400);
        const res_bad_lat = await req
            .put('/stops/latitude/-45.321')
            .expect(400);
        const res_bad_lon = await req
            .put('/stops/12.3456/longitude')
            .expect(400);
        expect(res_bad_lat_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_bad_lat.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
        expect(res_bad_lon.body.message)
            .toEqual("Need to provide both coordinates (lat, lon) as numeric values.");
    });

    it('update stop successfully', async function () {
        let body = { "name": "Biblioteca" };
        await req
            .put(`/stops/${stop1_lat}/${stop1_lon}`)
            .send(body)
            .expect(204);
        let data;
        try {
            let params = {
                TableName: 'Stop',
                Key: {
                    'lat': stop1_lat,
                    'lon': stop1_lon,
                }
            };
            data = await documentClient.get(params).promise();
            let stop = data.Item;
            expect(stop.name).toEqual(body.name);
        } catch (err) {
            console.error(err);
        }
    });
});
