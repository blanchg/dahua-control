const express = require('express')
const path = require('path')
const fs = require('fs')
const ipcamera = require('node-dahua-api');
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
let port = 80
let refresh = 5000

if (process.argv.length > 2) {
    port = parseInt(process.argv[2])
}
if (process.argv.length > 3) {
    refresh = parseInt(process.argv[3])
}

let cameras = [
    { key: 'aud1', name: 'Auditorium 1', presets: [
        { name: 'Main', preset: 1 }
    ], options: {
        host: '10.2.0.77',
        port: '80',
        user: 'admin',
        password: 'admin',
        log: false,
        cameraAlarms: false
    }},
    { key: 'aud2', name: 'Auditorium 2', presets: [
        { name: 'Main', preset: 1 },
        { name: 'Demo', preset: 2 },
        { name: 'Reader', preset: 3 },
        { name: 'Platform', preset: 4 }
    ], options: {
        host: '10.2.0.78',
        port: '80',
        user: 'admin',
        password: 'admin',
        log: false,
        cameraAlarms: false
    }},
]
try {
    let config = fs.readFileSync(path.join(process.cwd(), 'cameras.json'))
    cameras = JSON.parse(config);
} catch (e) {
    console.log(e);
}
// const Bundler = require('parcel-bundler');
// let bundler = new Bundler('index.html');
try {
    const cameradict = {};
    cameras.forEach(camera => {
        camera.cam = new ipcamera.dahua(camera.options)
        camera.cam.on('connect', () => {
            camera.connected = true;
            io.to(camera.key).emit('connected', camera.connected);
        });
        camera.cam.on('end', () => {
            camera.connected = false;
            io.to(camera.key).emit('connected', camera.connected);
        });
        camera.watching = 0;
        camera.cmd = {}
        camera.cmd.preset = msg => {
            camera.cam.ptzPreset(msg.preset);
            setTimeout(() => camera.getSnapshot(), 500);
        }
        camera.cmd.presets = (msg, cb) => {
            cb(camera.presets)
        }
        camera.cmd.connect = (msg, cb, socket) => {
            let needsJoin = true;
            Object.keys(socket.rooms).forEach(room => {
                if (room === camera.key) {
                    needsJoin = false;
                    return;
                }
                if (room !== socket.id) {
                    cameradict[room].cmd.disconnect(null, null, socket);
                }
            });
            if (needsJoin) {
                socket.join(camera.key);
            }
            if (camera.watching == 0) {
                camera.watch();
            }
            camera.watching++;
            camera.sendlatest();
        }
        camera.cmd.disconnect = (msg, cb, socket) => {
            socket.leave(camera.key);
            camera.watching--;
            if (camera.watching == 0) {
                camera.stopWatching();
            }
        }
        let frame = 0;
        camera.getSnapshot = () => {
            try {
                camera.cam.getSnapshot({filename: camera.key + '.jpg'});
            } catch (e) {
                console.log(e);
            }
        }
        camera.watch = () => {
            console.log(camera.key, '#', frame++);
            camera.getSnapshot();
            try {
                clearTimeout(camera.watchTimer);
            } catch (e) {

            }
            camera.watchTimer = setTimeout(() => {
                camera.watch();
            }, refresh);
        }
        camera.cam.on('getSnapshot',function( msg ) {
            console.log(camera.key, 'get snapshot', msg)
            if (msg.status == 'DONE') {
                camera.sendlatest();
            } else {
                camera.sendlatest();
            }
        });
        camera.sendlatest = () => {
            try {
                let file = fs.readFileSync(camera.key + '.jpg');
                if (file.length > 0) {
                    io.to(camera.key).emit('frame', file.toString('base64'))
                    return
                }
            } catch (e) {
            }
            let file = fs.readFileSync('camera.jpg');
            io.to(camera.key).emit('frame', file.toString('base64'))
        }
        camera.stopWatching = () => {
            clearTimeout(camera.watchTimer);
        }
        cameradict[camera.key] = camera
    });

    app.use('/api/cameras', (req, res) => {
        res.send(cameras.map(c => ({ key: c.key, name: c.name, connected: c.connected})))
    })

    app.use('/api/*', (req, res) => {
        console.log('api')
        throw new Error('oops')
    })
    // app.use(bundler.middleware())
    app.use(express.static(path.join(__dirname, 'dist')))
    app.use('/*', (req, res) => res.send(path.join(__dirname, 'dist/index.html')))

    io.on('connection', function(socket){
        console.log('a user connected')
        socket.on('disconnect', function(){
            console.log('user disconnected', Object.keys(socket.rooms))
            cameras.forEach(camera => {
                camera.cmd.disconnect(null, null, socket);
            })
        })
        cameras.forEach(camera => {
            socket.on(camera.key, function(msg, cb) {
                console.log(camera.key + ':' + JSON.stringify(msg, null, 0))
                camera.cmd[msg.cmd](msg, cb, socket);
            })
        });
    })

    http.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
    })
} catch (e) {
    console.error('Server error', e);
}
