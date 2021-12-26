import {EnvVars, ProcessEnv} from './types'

const env = process.env.NODE_ENV || 'localDev';

let localDev: EnvVars = {
    PORT: process.env.PORT || '8081',
    db_database: process.env.db_database || 'rumbus_mdb_dev',
    db_host: process.env.db_host || 'localhost',
    db_password: process.env.db_password || 'uprm_password',
    db_user: process.env.db_user || 'rumbus_api',
    dynamo_accessKeyId: process.env.dynamo_accessKeyId || '0',
    dynamo_endpoint: process.env.dynamo_endpoint || 'http://dynamodb:8000',
    dynamo_region: process.env.dynamo_region || 'us-east-2',
    dynamo_secretAccessKey: process.env.dynamo_secretAccessKey || '0',
    osrm_endpoint: process.env.osrm_endpoint || 'http://localhost:5000'
};
let test: EnvVars = {
    PORT: process.env.PORT || '8081',
    db_database: process.env.db_database || 'rumbus_mdb_test',
    db_host: process.env.db_host || 'localhost',
    db_password: process.env.db_password || 'secretpassword',
    db_user: process.env.db_user || 'test_user',
    dynamo_accessKeyId: process.env.dynamo_accessKeyId || '0',
    dynamo_endpoint: process.env.dynamo_endpoint || 'http://localhost:8000',
    dynamo_region: process.env.dynamo_region || 'us-east-2',
    dynamo_secretAccessKey: process.env.dynamo_secretAccessKey || '0',
    osrm_endpoint: process.env.osrm_endpoint || 'http://localhost:5000'
};
let localContainer: EnvVars = {
    PORT: process.env.PORT || '8081',
    db_database: process.env.db_database || 'rumbus_mdb_dev',
    db_host: process.env.db_host || 'rdbms',
    db_password: process.env.db_password || 'uprm_password',
    db_user: process.env.db_user || 'rumbus_api',
    dynamo_accessKeyId: process.env.dynamo_accessKeyId || '0',
    dynamo_endpoint: process.env.dynamo_endpoint || 'http://dynamodb:8000',
    dynamo_region: process.env.dynamo_region || 'us-east-2',
    dynamo_secretAccessKey: process.env.dynamo_secretAccessKey || '0',
    osrm_endpoint: process.env.osrm_endpoint || 'http://osrm-backend:5000'
};

let localContainerTest: EnvVars = {
    PORT: process.env.PORT || '8081',
    db_database: process.env.db_database || 'rumbus_mdb_test',
    db_host: process.env.db_host || 'mariadb',
    db_password: process.env.db_password || 'secretpassword',
    db_user: process.env.db_user || 'test_user',
    dynamo_accessKeyId: process.env.dynamo_accessKeyId || '0',
    dynamo_endpoint: process.env.dynamo_endpoint || 'http://dynamodb:8000',
    dynamo_region: process.env.dynamo_region || 'us-east-2',
    dynamo_secretAccessKey: process.env.dynamo_secretAccessKey || '0',
    osrm_endpoint: process.env.osrm_endpoint || 'http://osrm-backend:5000'
};

let herokuStaging: EnvVars = {
    PORT: process.env.PORT || '80',
    db_database: process.env.db_database || 'obw917i38peorei5',
    db_host: process.env.db_host || 'u3r5w4ayhxzdrw87.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    db_password: process.env.db_password || 'rhxlw6azi9lcw44c',
    db_user: process.env.db_user || 'nkq5p8bt9bukwjpp',
    dynamo_accessKeyId: process.env.dynamo_accessKeyId || '0',
    dynamo_endpoint: process.env.dynamo_endpoint || 'http://dynamodb:8000',
    dynamo_region: process.env.dynamo_region || 'us-east-2',
    dynamo_secretAccessKey: process.env.dynamo_secretAccessKey || '0',
    osrm_endpoint: process.env.osrm_endpoint || 'http://osrm-backend:5000'
};

const config: ProcessEnv = {
    localDev,
    test,
    localContainer,
    localContainerTest,
    herokuStaging
};
export = config[env];
