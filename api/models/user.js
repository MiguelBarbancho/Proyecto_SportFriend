'use strict' //para poder usar los nuevos estandares de JS

var mongoose = require('mongoose');//metemos en una variable el modulo con require para poder utilizarlo
var Schema = mongoose.Schema; //nos va apermitir definir nuevos esquemas

var UserSchema = Schema({//le pasamos como propiedades un Json
    name: String,
    surname: String,
    nick: String,
    email: String,
    password: String,
    role: String,
    image: String,

    sport: String,
    city: String

})//estructura que van a tener todos los objetos

module.exports = mongoose.model('User', UserSchema);//NOMBRE Y FORMATO de la entidad, va a pluralizar User y pasarlo a minusculas al exportarlo -->users en BD
