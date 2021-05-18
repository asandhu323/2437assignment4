"use strict";
const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const rfs = require('rotating-file-stream');
const fs = require("fs");


const accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'log')
});

app.use(morgan(':referrer :url :user-agent',
               { stream: accessLogStream }));


app.get('/', function (req, res) {
    let doc = fs.readFileSync('./index.html', "utf8");


    res.set('Server', 'Wazubi Engine');
    res.set('X-Powered-By', 'Wazubi');
    res.send(doc);

});

// No longer need body-parser!
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.post('/authenticate', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    let results = authenticate(req.body.email, req.body.password,
        function(rows) {
            if(rows == null) {
                res.send({ status: "fail", msg: "User account not found." });
            } else {
                req.session.loggedIn = true;
                req.session.email = rows.email;
                req.session.save(function(err) {
                })
                res.send({ status: "success", msg: "Logged in." });
            }
    });

});


function authenticate(email, pwd, callback) {

    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'accounts'
    });

    connection.query(
      "SELECT * FROM user WHERE email = ? AND password = ?", [email, pwd],
      function (error, results) {
        if (error) {
            throw error;
        }

        if(results.length > 0) {
            return callback(results[0]);
        } else {
            return callback(null);
        }

    });

}

app.get('/logout', function(req,res){
    req.session.destroy(function(error){
        if(error) {
            console.log(error);
        }
    });
    res.redirect("/");
})


// RUN SERVER
let port = 8000;
app.listen(port, function () {
    console.log('Listening on port ' + port + '.');
});