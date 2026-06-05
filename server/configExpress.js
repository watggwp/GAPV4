const router = require('./routerApi');

const dbpackage = require('./dbConfig');
const ConnectPool = require('./connectPool');
const apifunc = require('./apifunc');
const WebSocket = require('./webSocket');

const express = require('express');
const cors = require('cors')
const helmat = require('helmet');
const multer = require('multer');
const http = require('http');
const https = require('https');
const db = require('mysql2');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
const fs = require('fs');
const { spawn } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');

const ScheduleCorn = require("./core/corn")

const logging = require('./middleware/userAccessLogs');
const authorizer = require('./middleware/authorizer');

const apiAdmin = require('./apiAdmin');
const apiDoctor = require('./apiDoctor');
const apiFarmer = require('./apiFarmer');
const apiMessage = require('./apiMessaging');
const apiPump = require('./apiPump');
const apiWeatherStation = require('./apiWeatherStation');
const apiWeatherGreenhouse = require('./apiWeatherGreenhouse');
const apiEcph = require('./apiEcph');
const apiSchedules = require('./endpoints/schedules');
const apiFertilizers = require('./endpoints/fertilizer');
const apiChemicals = require('./endpoints/chemical');
const apiPests = require('./endpoints/pest');
const callServices = require('./callServices');
const apiAddDevice = require('./apiAddDevice');


module.exports = function appConfig(username, password, hostServer) {
    require('dotenv').config().parsed

    // const python = spawn(
    //     'python', ['./server/mqtt/mqtt_to_api.py'] , {
    //         env : {
    //             ...process.env,
    //             PYTHONIOENCODING: 'utf-8'
    //         },
    //         // stdio: ["pipe" , "pipe" , "pipe"],
    //     }
    // );

    // python.stdout.setEncoding('utf8')
    // python.stdout.on('data', data => console.log(`stdout: ${data}`));

    // python.stderr.setEncoding('utf8')
    // python.stderr.on('data', data => console.log(`stderr: ${data}`));

    const mode = process.argv[2]
    const app = express();

    const Pool = new ConnectPool()
    Pool.createPool({
        user: username,
        password: password,
        mode: mode
    })

    // เมื่อใช้ ngrok หากไม่ได้ใช้ ngrok ให้ comment
    app.set('trust proxy', 1);

    app.use((req, res, next) => {
        console.log('host:', req.headers.host);
        console.log('protocol:', req.protocol);
        console.log('secure:', req.secure);
        console.log('x-forwarded-proto:', req.headers['x-forwarded-proto']);
        next();
    });

    const upload = multer()
    const server =
        // (mode == process.env.BUILD) ? https.createServer({
        //     key: fs.readFileSync(process.env.pathCertFile),
        //     cert: fs.readFileSync(process.env.pathKeyFile)
        // } , app)
        // :
        http.createServer(app)
    // set Server

    const listDB = dbpackage.listConfig(username, password, mode)
    // const HOST_CHECK = (mode == process.env.BUILD) ? process.env.REACT_APP_API_PUBLIC : process.env.REACT_APP_API_LOCAL;
    // config server and Hot Refresh
    // if(mode != process.env.BUILD) reactServ(app)

    // set session
    const isProduction = mode == process.env.BUILD
    const sessionMiddleware = sessions({
        name: process.env.cookie,
        secret: process.env.KEY_SESSION ?? "gap_project_royal",
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProduction,
            // maxAge: 1000 * 60 * 60 * 24,
            maxAge: null,
            sameSite: isProduction ? "none" : "lax"
        },
        resave: false
        // cookie: {
        //     // ตั้งให้เปิด mode https ได้
        //     // httpOnly: true,
        //     // secure : mode == process.env.BUILD,
        //     maxAge: 1000 * 60 * 60 * 8, // 8 ชั่วโมง
        //     sameSite: 'strict'
        //     // secure: mode != process.env.BUILD ? false : true
        // },
        // resave: false
    })

    const subpathPrefix = process.env.PREFIX_PATH || ""; // ทุก redirect จะเพิ่ม prefix นี้
    // Middleware override res.redirect
    app.use((req, res, next) => {
        const originalRedirect = res.redirect.bind(res);

        res.redirect = (url) => {
            // ถ้า url ไม่ใช่ full URL (http/https) ให้เพิ่ม subpath
            if (!url.startsWith('http')) {
                url = subpathPrefix + url;
            }

            return originalRedirect(url);
        };

        next();
    });

    // set proxy sub services
    app.use('/gap-device-dashboard', createProxyMiddleware({
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
        pathRewrite: (path, req) => {
            return path
        }
    }))

    // app.use(express.json())
    app.use(cookieParser())
    app.use(sessionMiddleware)
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    // const jsonDataNgrok = JSON.parse(fs.readFileSync(__dirname.replace('\server' , "/UrlServer.json")).toString())
    const origins = [
        `http://${process.env.REACT_APP_API_LOCAL}:${process.env.REACT_APP_API_PORT}`,
        `http://${process.env.REACT_APP_API_LOCAL}:${process.env.ADMIN_PORT}`,
        `http://${process.env.REACT_APP_API_LOCAL}:${process.env.DOCTOR_PORT}`,
        `http://${process.env.REACT_APP_API_LOCAL}:${process.env.FARMER_PORT}`,
        // ...Object.entries(jsonDataNgrok).map((Data)=>Data[1]), 
        `https://${process.env.REACT_APP_API_PUBLIC}:${process.env.REACT_APP_API_PORT}`,
        "https://doctor.gapv4.online",
        "https://admin.gapv4.online",
        "https://api.gapv4.online",
        "https://farmer.gapv4.online",
        "http://localhost:5173",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004"
    ]

    // protocal websocket
    const io = WebSocket(server, sessionMiddleware, origins, db, listDB, apifunc)

    app.use(cors({
        //อันเก่า
        origin: origins,

        //อันนหใม่ที่อนุญาติ IP ต่างๆ
        // origin: function (origin, callback) {
        //     // Allow requests with no origin (like mobile apps or curl requests)
        //     if (!origin) return callback(null, true);

        //     // Allow localhost and specific domains from the list
        //     if (origins.indexOf(origin) !== -1) {
        //         return callback(null, true);
        //     }

        //     // Allow any ngrok domain
        //     if (origin.endsWith('.ngrok.app') || origin.endsWith('.ngrok-free.app') || origin.endsWith('.ngrok.io')) {
        //         return callback(null, true);
        //     }

        //     // Allow localhost regex and LAN IPs (192.168.x.x, 10.x.x.x, 172.16.x.x)
        //     if (/^http:\/\/localhost(:\d+)?$/.test(origin) ||
        //         /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
        //         /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
        //         /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) {
        //         return callback(null, true);
        //     }

        //     const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        //     // console.log("Blocked Origin:", origin); // Optional debug
        //     return callback(new Error(msg), false);
        // },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    }))

    // middleware custom
    app.use(logging(Pool))
    app.use("/api/schedules", authorizer(Pool))
    app.use("/api/schedules/*", authorizer(Pool))
    app.use("/api/pests", authorizer(Pool))
    app.use("/api/chemicals", authorizer(Pool))
    app.use("/api/fertilizers", authorizer(Pool))
    app.use("/api/pests/*", authorizer(Pool))

    // config environment
    app.use(upload.any())
    app.use(express.static('app/src/assets/style'))
    app.use(express.static('app/src/assets/font'))
    app.use(express.static('app/src/assets/img'))
    app.use(express.static('app/src/assets/js'))
    app.use(express.static('app/src/assets/icon'))

    app.get('/', (req, res) => {
        res.sendFile(__dirname.replace('\server', '/index404.html'));
    });

    app.use(express.static('build/admin'))
    app.use(express.static('build/doctor'))
    app.use(express.static('build/farmer'))

    // services
    ScheduleCorn(Pool)
    callServices(app, Pool)

    // router api url
    if (mode === process.env.BUILD || mode === "router") router(app)
    apiAdmin(app, db, Pool, apifunc, dbpackage, listDB, io)
    apiDoctor(app, db, Pool, apifunc, dbpackage, listDB, hostServer, io)
    apiFarmer(app, db, Pool, dbpackage, listDB, io)
    apiEcph(app, Pool)
    apiWeatherStation(app, Pool)
    apiWeatherGreenhouse(app, Pool)
    apiPump(app, Pool)
    apiMessage(app, db, Pool, apifunc, dbpackage, listDB, hostServer, io)

    apiSchedules(app, Pool)
    apiFertilizers(app, Pool)
    apiChemicals(app, Pool)
    apiPests(app, Pool)

    apiAddDevice(app, Pool)
    // page error 404
    app.get("*", (req, res) => {
        res.sendFile(__dirname.replace('\server', '/index404.html'));
    });

    app.get("/api/heartbeat", (req, res) => {
        res.status(200)
    });

    return server
}