var async = require('async')
var mosquittoPBKDF2 = require('mosquitto-pbkdf2');
var zookeeper = require('node-zookeeper-client');

var Device = require('../models/device');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.index = function(req, res) {
    Device.count().then((result) => {
        res.render('index', { title: 'MQTT Admin', data: { device_count: result }})
    })
};

// Display list of all Devices.
exports.device_list = function(req, res) {
    Device.list().then((result) => {
        res.render('device_list', { title: 'Device List', device_list: result })
    })
};

// Display detail page for a specific Device.
exports.device_detail = function(req, res, next) {
    Device.findById(req.params.id).then((result) => {
        res.render('device_detail', { title: 'Device Detail', data: result} );
    }).catch((e) => {
        var err = new Error(e)
        err.status = 404
        return next(err)
    })
};

// Display Device create form on GET.
exports.device_create_get = function(req, res) {
    //res.send('NOT IMPLEMENTED: Device create GET');

    res.render('device_form', { title: 'Create Device' });

};

// Handle Device create on POST.
exports.device_create_post = [

    //Validate fields
    body('name').isLength({ min: 1 }).trim().withMessage('Name must be specified.'),
    body('type').isLength({ min: 1 }).trim().withMessage('Type must be specified.'),
    body('password').isLength({ min: 1 }).trim().withMessage('Password must be specified.'),

    //Sanitize fields
    sanitizeBody('name').trim().escape(),
    sanitizeBody('type').trim().escape(),
    sanitizeBody('password').trim().escape(),
    sanitizeBody('superuser').trim().escape(),

    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('device_form', {title: 'Create Device', device: req.body, errors: errors.array()});
            return;
        }
        else {
            // Data from form is valid.
            var topicsdata = JSON.parse(req.body.topics);

            var devicedata = {
                name: req.body.name,
                type: req.body.type,
                password: req.body.password,
                topics: topicsdata,
                superuser: req.body.superuser ? true : false
            };

            // Create a Device object with escaped and trimmed data.
            var device = new Device.Device(
                devicedata
            );

            device.save().then(() => {
                res.redirect(device.url);
            }).catch((e) => {
                var err = new Error(e)
                return next(err);
            })
        }
    }
];

// Display Device delete form on GET.
exports.device_delete_get = function(req, res, next) {
    Device.findById(req.params.id).then((result) => {
        res.render('device_delete', { title: 'Delete Device', device: result});
    }).catch((e) => {
        var err = new Error(e)
        err.status = 404
        return next(err)
    })
};

// Handle Device delete on POST.
exports.device_delete_post = function(req, res, next) {
    Device.remove(req.body.device_id).then((result) => {
        res.redirect('/devices')
    }).catch((e) => {
        var err = new Error(e)
        return next(err)
    })
};

// Display Device update form on GET.
exports.device_update_get = function(req, res, next) {
    Device.findById(req.params.id).then((result) => {
        res.render('device_form', { title: 'Update Device', device: result });
    }).catch((e) => {
        var err = new Error(e)
        err.status = 404
        return next(err)
    })
};

// Handle Device update on POST.
exports.device_update_post = [
    //Validate fields
    body('name').isLength({ min: 1 }).trim().withMessage('Name must be specified.'),
    body('type').isLength({ min: 1 }).trim().withMessage('Type must be specified.'),
    body('password').isLength({ min: 1 }).trim().withMessage('Password must be specified.'),

    //Sanitize fields
    sanitizeBody('name').trim().escape(),
    sanitizeBody('type').trim().escape(),
    sanitizeBody('password').trim().escape(),
    sanitizeBody('superuser').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        var topicsdata = JSON.parse(req.body.topics);

        var devicedata = {
            name: req.body.name,
            type: req.body.type,
            password: req.body.password,
            topics: topicsdata,
            superuser: req.body.superuser ? true : false
        };

        // Create a Device object with escaped and trimmed data.
        var device = new Device.Device(
            devicedata
        );

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('device_form', { title: 'Update Device', device: device, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            device.save().then(() => {
                res.redirect(device.url);
            }).catch((e) => {
                var err = new Error(e)
                return next(err);
            })
        }
    }

];
