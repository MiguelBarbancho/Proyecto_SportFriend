'use strict' //para poder usar los nuevos estandares de JS

var mongoose = require('mongoose');//CARGAMOS EL MODULO DE MONGOOSE, metemos en una variable el modulo con require para poder utilizarlo
var Schema = mongoose.Schema; //nos va apermitir definir nuevos esquemas

var MessageSchema = Schema({//le pasamos como propiedades un Json 
    text: String,
    viewed: String,
    created_at: String,
    emitter: { type: mongoose.Schema.ObjectId, ref: 'User' },
    receiver: { type: mongoose.Schema.ObjectId, ref: 'User' }
})//estructura que van a tener todos los objetos

module.exports = mongoose.model('Message', MessageSchema);//EN BD se va a guardar como  pluralizar Message y pasarlo a minusculas al exportarlo --messages
