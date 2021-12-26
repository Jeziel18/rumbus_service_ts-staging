import { Route } from "../routeInterface"
import { HttpServer } from "../httpServerInterface";
import { Request, Response, Next } from 'restify';
import * as mqtt from 'mqtt';

export class HomeRoute implements Route {
	public initialize(httpServer: HttpServer): void {
		httpServer.get('/', this.list.bind(this));
	}

	private async list(req: Request, res: Response, next: Next): Promise<void> {
		res.json({
			message: 'Welcome to RUMBus',
			query: req.query
		});

		const mqttClient = mqtt.connect('ws://mqtt-broker:8083/mqtt', { username: "rumbus", password: "secret_pwd"});

		const queryTopic = 'resolveMyQuery';
		const responseTopic = 'responseFromServer';

		mqttClient.on('connect', function () {
			console.log('Server connected to Mqtt broker');
			console.log("Client ID: ", mqttClient.options.clientId)
			mqttClient.subscribe(queryTopic);
		});

		// On receiving message from any client
		mqttClient.on('message', function (topic: String, message: String) {
			console.log('Received query from client: -', message.toString());
			// Responding to client
			mqttClient.publish(responseTopic, 'Hello client, yes I can hear you');
			console.log('Responded to client');
			mqttClient.end();
		});

		next();
	}


}
