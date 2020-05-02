var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var Schema = mongoose.Schema;

var DeviceSchema = new Schema(
    {
        name: {type: String, required: true},
        type: {type: String},
        topics: {type: Object},
        superuser: {type: Boolean}
    }
);
DeviceSchema.plugin(passportLocalMongoose);

DeviceSchema
    .virtual('url')
    .get(function () {
        return '/device/' + this._id;
    });

//Export model
module.exports = mongoose.model('Device', DeviceSchema);
