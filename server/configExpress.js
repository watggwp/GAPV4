const router = require('./routerApi');

const dbpackage = require('./dbConfig');
const ConnectPool = require('./connectPool');
const apifunc = require('./apifunc');
const LINE = require("./configLine");
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

const apiAdmin = require('./apiAdmin');
const apiDoctor = require('./apiDoctor');
const apiFarmer = require('./apiFarmer');
const apiMessage = require('./apiMessaging');
const apiPump = require('./apiPump');
const apiWeatherStation = require('./apiWeatherStation');
const apiWeatherGreenhouse = require('./apiWeatherGreenhouse');
const apiEcph = require('./apiEcph');

module.exports = function appConfig(username , password , UrlNgrok ) {
    require('dotenv').config().parsed
 
    const python = spawn('python', ['./server/mqtt/mqtt_to_api.py']);

    console.log(python.pid)
    python.stdout.on('data', data => console.log(`stdout: ${data}`));
    python.stderr.on('data', data => console.error(`stderr: ${data}`));

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

    const upload = multer()
    const server =
                // (mode == process.env.BUILD) ? https.createServer({
                //     key: fs.readFileSync(process.env.pathCertFile),
                //     cert: fs.readFileSync(process.env.pathKeyFile)
                // } , app)
                // :
                http.createServer(app)
    // set Server
 
    const listDB = dbpackage.listConfig(username , password , mode)
    // const HOST_CHECK = (mode == process.env.BUILD) ? process.env.REACT_APP_API_PUBLIC : process.env.REACT_APP_API_LOCAL;
    // config server and Hot Refresh
    // if(mode != process.env.BUILD) reactServ(app)
 
    // set session
    console.log(mode)
    const sessionMiddleware = sessions({
        name : process.env.cookie,
        secret : process.env.KEY_SESSION ?? "gap_project_royal",
        saveUninitialized: false,
        // cookie: {
        //     httpOnly: true,
        //     secure : true,
        //     maxAge: null,
        //     sameSite: "none"
        // },
        // resave : false
        cookie: {
            httpOnly: true,
            secure : mode == process.env.BUILD,
            maxAge: null,
            sameSite: 'strict'
            // secure: mode != process.env.BUILD ? false : true
        },
        resave : false
    })

    // set proxy
    app.use('/gap-log-dashboard', createProxyMiddleware({
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
        pathRewrite: (path, req) => {
            if (path === '/') {
                return '/gap-log-dashboard';
            } else if (path === '/gap-log-dashboard/ws') {
                return '/gap-log-dashboard-ws';
            }
            return '/gap-log-dashboard' + path;
        }
    }))
   
    // app.use(express.json())
    app.use(cookieParser())
    app.use(sessionMiddleware)
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));
    
    const jsonDataNgrok = JSON.parse(fs.readFileSync(__dirname.replace('\server' , "/UrlServer.json")).toString())
    const origins = [
        `http://${process.env.REACT_APP_API_LOCAL}:${process.env.REACT_APP_API_PORT}`, 
        `http://${process.env.REACT_APP_API_LOCAL}:${process.env.ADMIN_PORT}`, 
        `http://${process.env.REACT_APP_API_LOCAL}:${process.env.DOCTOR_PORT}`, 
        `http://${process.env.REACT_APP_API_LOCAL}:${process.env.FARMER_PORT}`, 
        ...Object.entries(jsonDataNgrok).map((Data)=>Data[1]), 
        `https://${process.env.REACT_APP_API_PUBLIC}:${process.env.REACT_APP_API_PORT}`
    ]
    
    // protocal websocket
    const io = WebSocket(server , sessionMiddleware , origins , db , listDB , apifunc)

    app.use(cors({
        origin : origins,
        credentials: true,
    }))
    
    // config environment
    app.use(upload.any())
    app.use(express.static('app/src/assets/style'))
    app.use(express.static('app/src/assets/font'))
    app.use(express.static('app/src/assets/img'))
    app.use(express.static('app/src/assets/js'))
    app.use(express.static('app/src/assets/icon'))
 
    app.get('/' , (req, res) => {
        res.sendFile(__dirname.replace('\server' , '/index404.html'));
    });

    app.use(express.static('build/admin'))
    app.use(express.static('build/doctor'))
    app.use(express.static('build/farmer'))
 
    // router api url
    if(mode === process.env.BUILD || mode === "router") router(app)
    apiAdmin(app , db , apifunc , dbpackage , listDB , io , LINE)
    apiDoctor(app , db , Pool , apifunc , dbpackage , listDB , UrlNgrok , io , LINE)
    apiFarmer(app , db , Pool , apifunc , dbpackage , listDB , io , LINE)
    apiEcph(app , Pool)
    apiWeatherStation(app , Pool)
    apiWeatherGreenhouse(app , Pool)
    apiPump(app , Pool)
    apiMessage(app , db , apifunc , dbpackage , listDB , UrlNgrok , io)
    // page error 404
    app.get("*" , (req, res) => {
        res.sendFile(__dirname.replace('\server' , '/index404.html'));
    });
 
    return server
}