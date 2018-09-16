'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FollowSchema = Schema({
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    followed: { type: mongoose.Schema.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Follow', FollowSchema);