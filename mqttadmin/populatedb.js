#! /usr/bin/env node

console.log('This script populates some test device to the database. ' +
    'Specified database as argument - e.g.: populatedb mongodb://your_username:your_password@your_dabase_url');

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
if (!userArgs[0].startsWith('mongodb://')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}

var async = require('async')
var Device = require('./models/device')

var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

var devices = []

function createDevices(cb) {
    async.parallel([
            function(callback) {
                Device.register({
                    name: 'testDevice01',
                    username: 'testDevice01',
                    type: 'testType01',
                    topics: {
                        "public/#": "r",
                        "device/testType01/testDevice01/#": "rw"
                    },
                    superuser: false
                }, req.body.password, callback);
            },
            function(callback) {
                Device.register({
                    name: 'testDevice02',
                    username: 'testDevice02',
                    type: 'testType01',
                    topics: {
                        "public/#": "r",
                        "device/testType01/testDevice02/#": "rw"
                    },
                    superuser: false
                }, req.body.password, callback);
            },
            function(callback) {
                Device.register({
                    name: 'testDevice03',
                    username: 'testDevice03',
                    type: 'testType02',
                    topics: {
                        "public/#": "r",
                        "device/testType02/testDevice03/#": "rw"
                    },
                    superuser: false
                }, req.body.password, callback);
            },
        ],
        // optional callback
        cb);
}

async.series([
        createDevices()
    ],
// Optional callback
    function(err, results) {
        if (err) {
            console.log('FINAL ERR: '+err);
        }
        else {
            console.log('devices: '+devices);

        }
        // All done, disconnect from database
        mongoose.connection.close();
    });



