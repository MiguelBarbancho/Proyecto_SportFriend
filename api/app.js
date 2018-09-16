'use strict'

var express = require('express');
var bodyParser = require('body-parser');

var app = express();

//cargar rutas
var user_routes = require('./routes/user');
var follow_routes = require('./routes/follow');
var publications_routes = require('./routes/publication');
var messages_routes = require('./routes/message');
//middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//cors CABECERAS PARA PERMITIR Q LAS PETICIONES AJAX SE HAGAN DE FORMA CORRECTA CON ANGULAR
//ACTUARA DE MIDDLEWARE Y ES UNA MEDIDA DE PRECAUCION PARA EL DESARROLLO DEL FORNTEND
// configurar cabeceras http
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
	res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

	next();
});

//rutas
app.use('/api', user_routes);//con este midelware le ponemos de prefijo a la direccion /api
app.use('/api', follow_routes);
app.use('/api', publications_routes);
app.use('/api', messages_routes);
//exportar

module.exports = app;