"use strict";
const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const rfs = require('rotating-file-stream');
const fs = require("fs");
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mysql = require('mysql2');
const { JSDOM } = require('jsdom');
const session = require('express-session');

app.use('/css', express.static('private/css'));
app.use('/html', express.static('private/html'));
app.use('/js', express.static('private/js'));
app.use('/img', express.static('private/img'));

const accessLogStream = rfs.createStream('access.log', {
    interval: '1d', // rotate daily
    path: path.join(__dirname, 'log')
});

app.use(morgan(':referrer :url :user-agent', {
    stream: accessLogStream
}));


app.get('/', function (req, res) {
    let doc = fs.readFileSync('./private/html/index.html', "utf8");


    res.set('Server', 'Wazubi Engine');
    res.set('X-Powered-By', 'Wazubi');
    res.send(doc);

    initDB();

});

async function initDB() {

const mysql = require('mysql2/promise');

const connection = await mysql.createConnection({
host: 'localhost',
user: 'root',
password: '',
multipleStatements: true
});

const createDBAndTables = `CREATE DATABASE IF NOT EXISTS accounts2537;
  use accounts2537;
  CREATE TABLE IF NOT EXISTS user (
  ID int NOT NULL AUTO_INCREMENT,
  name varchar(30),
  password varchar(30),
  PRIMARY KEY (ID));`;

await connection.query(createDBAndTables);
let results = await connection.query("SELECT COUNT(*) FROM user");
let count = results[0][0]['COUNT(*)'];

if(count < 1) {
  results = await connection.query("INSERT INTO user (name, password) values ('50Green', 'admin')");
  console.log("Added one user record.");
}
connection.end();
}

app.use(session({
  secret:'super secret password',
  name:'50Greener',
  resave: false,
  saveUninitialized: true 
})
);




app.get('/main', function(req, res) {

if(req.session.loggedIn) {

  let mainFile = fs.readFileSync('./private/html/main.html', "utf8");
  let mainDOM = new JSDOM(mainFile);
  let $main = require("jquery")(mainDOM.window);

  $main("#name").html(req.session.name);

  res.send(mainDOM.serialize());

} else {
  res.redirect('/');
}


});

// No longer need body-parser!
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))

app.post('/authenticate', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    let results = authenticate(req.body.name, req.body.password,
        function (rows) {
            if (rows == null) {
                res.send({
                    status: "fail",
                    msg: "User account not found."
                });
            } else {
                req.session.loggedIn = true;
                req.session.name = rows.name;
                req.session.save(function (err) {})
                res.send({
                    status: "success",
                    msg: "Logged in."
                });
            }
        });

});


function authenticate(name, pwd, callback) {

    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'accounts2537'
    });

    connection.query(
        "SELECT * FROM user WHERE name = ? AND password = ?", [name, pwd],
        function (error, results) {
            if (error) {
                throw error;
            }

            if (results.length > 0) {
                return callback(results[0]);
            } else {
                return callback(null);
            }

        });

}

app.get('/logout', function (req, res) {
    req.session.destroy(function (error) {
        if (error) {
            console.log(error);
        }
    });
    res.redirect("/");
})

var userCount = 0;

io.on('connect', function (socket) {
    userCount++;
    let str = "anonymous";
    socket.userName = str;
    io.emit('user_joined', {
        user: socket.userName,
        numOfUsers: userCount
    });
    console.log('Connected users:', userCount);

    socket.on('disconnect', function (data) {
        userCount--;
        io.emit('user_left', {
            user: socket.userName,
            numOfUsers: userCount
        });

        console.log('Connected users:', userCount);
    });

    socket.on('chatting', function (data) {

        console.log('User', data.name, 'Message', data.message);

        // if you don't want to send to the sender
        //socket.broadcast.emit({user: data.name, text: data.message});

        if (socket.userName == "anonymous") {


            io.emit("chatting", {
                user: data.name,
                text: data.message,
                event: socket.userName + " is now known as " + data.name
            });
            socket.userName = data.name;

        } else {

            io.emit("chatting", {
                user: socket.userName,
                text: data.message
            });

        }


    });

});


// RUN SERVER
let port = 8000;
server.listen(port, function () {
    console.log('Listening on port ' + port + '.');
});