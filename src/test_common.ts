import mariaDBpool from './helpers/mariadbPool';
import documentClient from './helpers/dynamodbEnv';
import {PoolConnection} from 'mariadb';

export let test_post_request_with_missing_param = async (req: any, route_path: string, params: Object) => {
    for (let i = 0; i < Object.keys(params).length; i++) {
        let body = params;
        // @ts-ignore
        delete body[Object.keys(params)[i]];
        await req
            .post(route_path)
            .send(body)
            .expect(400);
    }
};

export let empty_database = async () => {
    let deleteQuery = 'DELETE FROM ';
    let orderedTables = [
        'administrative_trip', 'public_trip',
        'vehicle_usage', 'trip_device',
        'trip_event','canceled_trip', 'trip',
        'driver', 'route',
        'device_provider', 'user_roles',
        'roles', 'announcement', 'vehicle_maintenance',
        'user', 'vehicle'
    ];
    let conn: PoolConnection;
    try {
        conn = await mariaDBpool.getConnection();
        orderedTables.forEach(async t => {
            await conn.query(deleteQuery.concat(t, ';'));
        });
    } catch (err) {
        console.error('Error emptying database.');
        console.group(err);
    } finally {
        if (conn) await conn.end();
    }
};

export let clear_ddb_objects = async (table: string, keys: object[]) => {
    try {
        keys.forEach(async key => {
            // TODO: Consider using BatchWriteItem
            // (https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html).
            await documentClient.delete({ TableName: table, Key: key }).promise();
        });
    } catch (err) {
        console.error(`Error deleting from dynamo table: ${table}.`);
        console.group(err);
    }
};

export let count_table_entries = async (table_name: string) => {
    let conn: PoolConnection;
    let query = "SELECT COUNT(*) as count FROM ".concat(table_name, ';');
    try {
        let conn = await mariaDBpool.getConnection();
        let result = await conn.query(query);
        return result[0]["count"]
    } catch (err) {
        console.error(err);
        return null
    } finally {
        if (conn) await conn.end();
    }
}
