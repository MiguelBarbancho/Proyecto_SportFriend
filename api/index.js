'use strict'

var mongoose = require('mongoose');
var app = require('./app');//aqui dentro esta ya express
var port = 3800;

//Conexion Database
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/Redsocial', { useNewUrlParser: true })
    .then(() => {
        console.log("La conexion de la Base de Datos Redsocial se ha realizado correctamente")
        // Crea servidor
        app.listen(port, () => {
            console.log("Servidor corriendo en http://localhost:3800")
        })
    })
    .catch(err => console.log(err));