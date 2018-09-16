'use strict' //para poder usar los nuevos estandares de JS

var mongoose = require('mongoose');//CARGAMOS EL MODULO DE MONGOOSE, metemos en una variable el modulo con require para poder utilizarlo
var Schema = mongoose.Schema; //nos va apermitir definir nuevos esquemas

var PublicationSchema = Schema({//le pasamos como propiedades un Json 
    text: String,
    file: String,
    created_at: String,
    user: { type: mongoose.Schema.ObjectId, ref: 'User' }
})//estructura que van a tener todos los objetos

module.exports = mongoose.model('Publication', PublicationSchema);//va a pluralizar Publication y pasarlo a minusculas al exportarlo --publications
