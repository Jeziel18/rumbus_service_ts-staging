import config from '../configs/localEnvSetup'
import AWS = require('aws-sdk');

let dynamoDB: AWS.DynamoDB.DocumentClient;

AWS.config.update({
	accessKeyId: config.dynamo_accessKeyId,
	secretAccessKey: config.dynamo_secretAccessKey,
	region: config.dynamo_region
});
// AWS.config.getCredentials( (err)=> {
// 	console.error(err);
// })

dynamoDB = new AWS.DynamoDB.DocumentClient({
	endpoint: config.dynamo_endpoint});

export = dynamoDB;