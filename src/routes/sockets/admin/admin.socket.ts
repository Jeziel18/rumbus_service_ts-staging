import { Socket, Server, Namespace } from 'socket.io';
import * as os from 'os';

export class AdminIO {
    private ioAdmin: Namespace;
    constructor(io: Server) {
        this.ioAdmin = io.of('/admin');

        this.ioAdmin.use((socket, next) => {
            // ensure the user has sufficient rights
            next();
        });

        this.ioAdmin.on('connection', socket => {
            let data = {
                "server_hostname": os.hostname()
            }
            socket.emit("initial_data", data);
        });

    }

    tabletVerified() {
        this.ioAdmin.emit('tablet-verified');
    }

}