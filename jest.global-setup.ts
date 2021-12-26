import config = require("./src/configs/localEnvSetup");
import createDynamoTables = require("./src/configs/dynamoInit");
import {empty_database} from "./src/test_common";

export default async () => {
    console.log('Jest Set Up before running all tests.');
    console.log("Environment: %s", process.env.NODE_ENV);
    console.log("Config: %s", config);
    try {
        await empty_database();
        console.log(await createDynamoTables());
    } catch (err) {
        if (err.statusCode == 400 && err.message == 'Cannot create preexisting table') {
            console.info('DynamoDB tables already created.')
        }
        else {
            console.error(err);
        }
    }
}
