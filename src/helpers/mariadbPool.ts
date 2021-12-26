import * as mariadb from 'mariadb';
import config from '../configs/localEnvSetup';

let mariaDBpool: mariadb.Pool;

mariaDBpool = mariadb.createPool({
    host: config.db_host,
    user: config.db_user,
    password: config.db_password,
    database: config.db_database
});

export = mariaDBpool;
