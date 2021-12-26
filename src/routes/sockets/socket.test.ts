import io from "socket.io-client";
import {Stop} from "../../models/stop.model";
import documentClient from "../../helpers/dynamodbEnv";
import {StopController} from "../stop/stop.controller";
import {LOCATION_CHANGED_SOCKET_EVENT} from "./trip/trip.socket";
let tripSocket: any;

let stopDetected = false;
let stops = [
    { "lat": 18.2145115, "lon": -67.1398197, "name": "Ingeniería Civil" },
    { "lat": 18.214009, "lon": -67.141527, "name": "Ingeniería Agricola" },
    { "lat": 18.2117397, "lon": -67.1419556, "name": "Biblioteca" },
    { "lat": 18.2112528, "lon": -67.1408481, "name": "Patio Central" },
    { "lat": 18.2108147, "lon": -67.1396338, "name": "Física" },
    { "lat": 18.211932, "lon": -67.138322, "name": "Biología" },
    { "lat": 18.215803, "lon": -67.133728, "name": "Zoológico" }];

function sendLocationToSocket(location: any) {
    tripSocket.emit(LOCATION_CHANGED_SOCKET_EVENT, location);
}

function connectToTripSocket() {
    tripSocket = io.connect("http://web:8081/socket/trip", {
        'transports': ['websocket'],
    });
}

beforeEach(async () => {
    stopDetected = false;
    try {
        for (let i = 0; i < stops.length; i++) {
            let params = {
                TableName: 'Stop',
                Item: stops[i],
            };
            await documentClient.put(params).promise();
        }
    } catch (err) {
        console.error("Error populating stop table in DynamoDB");
        console.group(err);
    }
});


afterEach(async function(done) {
    if(tripSocket.connected){
        tripSocket.disconnect();
    }
    for (let i = 0; i < stops.length; i++) {
        let params = {
            TableName: StopController.table,
            Key: {
                "lat": stops[i]["lat"],
                "lon":stops[i]["lon"],
            },
            ConditionExpression: "attribute_exists(lat) AND attribute_exists(lon)",
        };
        try {
            let data = await documentClient.scan(params).promise();
            if (data.Items.length > 0)
                await documentClient.delete(params).promise();
        } catch (err) {
            throw err;
        }
    }
    done();
});

describe('Detects location near stop', () => {
    it('Can detect stops', async () => {
        connectToTripSocket();
        tripSocket.on('connect', () => {
            let waypointSent = {lat: 0, lon: 0, near: ""};
            tripSocket.on("near_stop", (stop:any) => {
                stopDetected= true;
                expect(stop["name"]).toEqual(waypointSent["near"]);
            })
            waypointSent = {

                lat:
                    18.21463256233265,

                lon:
                    -67.13978110284378,

                near:
                    "Ingeniería Civil"
            }
            sendLocationToSocket(waypointSent);
            setTimeout(function() {
                expect(stopDetected).toBeTruthy();
            }, 4000 )

        });
    });
    it('Not all locations are stops', async () => {
       connectToTripSocket();
        tripSocket.on('connect', () => {
            let waypointSent = {lat: 0, lon: 0, near: ""};
            tripSocket.on("near_stop", (stop: any) => {
                console.log("Test received near stop event");
                fail("Near Stop reported a false positive, waypoint: "
                    + waypointSent["lat"] + ", " + waypointSent["lon"] + " is not near Stop: " + stop["name"]);
            })
            waypointSent = {

                lat:
                    18.21519598274965,
                lon:
                    -67.13997007785498,
                near: ""
            }
            sendLocationToSocket(waypointSent);
        });
    });

});
