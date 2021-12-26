import config from '../configs/localEnvSetup'
import AWS = require('aws-sdk');

let dynamoDB = new AWS.DynamoDB({
    endpoint: config.dynamo_endpoint,
    accessKeyId: config.dynamo_accessKeyId,
    secretAccessKey: config.dynamo_secretAccessKey,
    region: config.dynamo_region
});

let otpTablePromise = dynamoDB.createTable({
    AttributeDefinitions: [
        {
            AttributeName: "device_id",
            AttributeType: "S"
        }
    ],
    KeySchema: [
        {
            AttributeName: "device_id",
            KeyType: "HASH"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    TableName: "device_otp"
}).promise();
let etasTablePromise = dynamoDB.createTable({
    AttributeDefinitions: [
        {
            AttributeName: "trip_id",
            AttributeType: "S"
        }
    ],
    KeySchema: [
        {
            AttributeName: "trip_id",
            KeyType: "HASH"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    TableName: "Etas"
}).promise();
let newsTablePromise = dynamoDB.createTable({
    AttributeDefinitions: [
        {
            AttributeName: "id",
            AttributeType: "S"
        }
    ],
    KeySchema: [
        {
            AttributeName: "id",
            KeyType: "HASH"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    TableName: "News"
}).promise();
let passengerCountTablePromise = dynamoDB.createTable({
    AttributeDefinitions: [
        {
            AttributeName: "trip_id",
            AttributeType: "S"
        }
    ],
    KeySchema: [
        {
            AttributeName: "trip_id",
            KeyType: "HASH"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    TableName: "Passenger_count"
}).promise();
let routeTablePromise = dynamoDB.createTable({
    AttributeDefinitions: [
        {
            AttributeName: "route_id",
            AttributeType: "S"
        }
    ],
    KeySchema: [
        {
            AttributeName: "route_id",
            KeyType: "HASH"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    TableName: "Route"
}).promise();
let stopTablePromise = dynamoDB.createTable({
    AttributeDefinitions: [
        {
            AttributeName: "lat",
            AttributeType: "N"
        },
        {
            AttributeName: "lon",
            AttributeType: "N"
        }
    ],
    KeySchema: [
        {
            AttributeName: "lat",
            KeyType: "HASH"
        },
        {
            AttributeName: "lon",
            KeyType: "RANGE"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    TableName: "Stop"
}).promise();
let tripHistoryTablePromise = dynamoDB.createTable({
    AttributeDefinitions: [
        {
            AttributeName: "trip_id",
            AttributeType: "S"
        }
    ],
    KeySchema: [
        {
            AttributeName: "trip_id",
            KeyType: "HASH"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    TableName: "Trip_history"
}).promise();

let createDynamoTables = async () : Promise<Object> => {
    return await Promise.all([
        otpTablePromise,
        etasTablePromise,
        newsTablePromise,
        passengerCountTablePromise,
        routeTablePromise,
        stopTablePromise,
        tripHistoryTablePromise
    ]);
};

export = createDynamoTables;
