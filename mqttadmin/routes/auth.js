var express = require('express');
var router = express.Router();
var passport = require('passport');
var mqttpattern = require('mqtt-pattern');

var Device = require('../models/device')

router.post('/user', function (req, res) {
    // body {
    //   username: 'test',
    //   password: 'password',
    //   vhost: '/',
    //   client_id: 'mosqsub|6-8379b498a6c3'
    // }
    var authenticate = Device.authenticate();
    authenticate(req.body.username, req.body.password, function(err, result) {
        if (err) {
            console.log("auth error");
            console.log(err);
            res.status(200).send('deny');
        }
        if (result) {
            console.log("auth success");
            console.log(result);
            if (result.superuser) {
                res.status(200).send('allow administrator');
            } else {
                res.status(200).send('allow');
            }
        } else {
            console.log("auth failure");
            res.status(200).send('deny');
        }
    });
});

router.post('/vhost', function (req, res) {
    // body {
    //   username: 'test',
    //   vhost: '/',
    //   ip: '::ffff:172.27.0.1',
    //   tags: '',
    //   client_id: 'mosqsub|6-8379b498a6c3'
    // }

    // mqtt doesn't have the concept of vhosts, skip
    // console.log(req.body);
    res.status(200).send('allow');
});

router.post('/resource', function (req, res) {
    // body {
    //   username: 'test',
    //   vhost: '/',
    //   resource: 'queue',
    //   name: 'mqtt-subscription-mosqsub|6-8379b498a6c3qos1',
    //   permission: 'configure',
    //   tags: '',
    //   client_id: 'mosqsub|6-8379b498a6c3'
    // }
    // console.log(req.body);
    res.status(200).send('allow');
});

router.post('/topic', function (req, res) {
    // body {
    //   username: 'test',
    //   vhost: '/',
    //   resource: 'topic',
    //   name: 'amq.topic',
    //   permission: 'read',
    //   tags: '',
    //   routing_key: '.device.test.test2',
    //   'variable_map.client_id': 'mosqsub|6-8379b498a6c3',
    //   'variable_map.username': 'test',
    //   'variable_map.vhost': '/'
    // }

    // routing keys are translated, / is replaced with .
    // even at the start, /device/test/test2 becomes .device.test.test2
    // console.log(req.body);
    var device = Device.findByUsername(req.body.username, function(err, user) {
        if (err) {
            console.log("User not found");
            res.status(200).send('deny');
        }
        var result = Object.keys(user.topics).some(function(key) {
            var permission = (req.body.permission === "read" && user.topics[key] === "r" || user.topics[key] === "rw") || (req.body.permission === "write" && user.topics[key] === "w" || user.topics[key] === "rw");
            var transformed_routing_key = req.body.routing_key.replace(/\./g, "/");
            // only check wildcards when subscribing, using wildcards when publishing is not allowed
            if (req.body.permission === "write") {
                permission = permission && transformed_routing_key === key;
            }
            if (req.body.permission === "read") {
                permission = permission && mqttpattern.matches(key, transformed_routing_key);
            }
            return permission;
        });
        if (result) {
            res.status(200).send('allow');
        } else {
            res.status(200).send('deny');
        }
    });
});

module.exports = router;
