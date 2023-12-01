import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import routes from './routes';

class App {
    server: any;

    constructor() {
        this.server = express();
        this.middlewares();
        this.routes();
    }

    middlewares() {
        this.server.use(express.json());
        this.server.use(cors());
        this.server.use(cookieParser())
    }

    routes() {
        this.server.use(routes);
    }
}



export default new App().server;