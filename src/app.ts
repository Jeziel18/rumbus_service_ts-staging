// if (!process.env.NODE_ENV.toLowerCase().includes("test") &&
// 	!process.env.NODE_ENV.toLowerCase().includes("herokustaging")) {
// 	const apm = require('elastic-apm-node').start({
// 		serverUrl: 'http://apm-server:7200'
// 	});
// }
import * as restify from 'restify';
import corsMiddleware from 'restify-cors-middleware';
import * as socketIO from 'socket.io';
import {ROUTES, SOCKETSPACES} from './routes/index';
import {DeviceRoute} from './routes/device/device'
import config from './configs/localEnvSetup'
import {TripIO} from "./routes/sockets/trip/trip.socket";

const server = restify.createServer({
	name: 'rumbus_service',
	version: '1.0.0'
});

const cors = corsMiddleware({
	origins: ['*'],
	allowHeaders: ['X-App-Version'],
	exposeHeaders: []
});

server.pre(cors.preflight);
server.pre(cors.actual);

// Initialize sockets
const io = socketIO.listen(server.server);
new TripIO(io);
// SOCKETSPACES.forEach(socketspace => new socketspace(io))
let allowed_requests_per_second = 2
if(process.env.NODE_ENV.toLowerCase().includes("test")){
	allowed_requests_per_second = 10;
}
console.log("ARPS", allowed_requests_per_second)
server.use(restify.plugins.throttle({
	burst: 100,  	// Max 10 concurrent requests (if tokens)
	rate: allowed_requests_per_second,  		// Steady state: 2 request / 1 seconds
	ip: true,		// throttle per IP
}));
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.gzipResponse());

ROUTES.forEach(route => route.initialize(server));
const dRoute = new DeviceRoute(io);
dRoute.initialize(server);

server.on('after', restify.plugins.metrics({ server: server }, function onMetrics(err, metrics) {
	let timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
	console.log(`[${timestamp}] "${metrics.method} ${metrics.path}" ${metrics.statusCode} ${metrics.latency} ms`);
	// logger.trace(`${metrics.method} ${metrics.path} ${metrics.statusCode} ${metrics.latency} ms`);
}));

server.listen(config.PORT, function () {
	console.log('%s Now listening at %s', server.name, server.url);
	console.info("Environment: %s", process.env.NODE_ENV);
	// logger.info('%s Now listening at %s', server.name, server.url);
});

server.on('uncaughtException', function (req, res, route, err) {
	// logger.error(err);
});


export default server;
export {io};
