'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');// para generar fechas
var secret = 'clave_secreta_redsocial'; //string secreto que solo debemos de saber nosotros
exports.createToken = function (user) {
    var payload = {
        sub: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        sport: user.sport,
        city: user.city,
        iat: moment().unix(),//fecha de creacion del token
        exp: moment().add(30, 'days').unix //fecha de expiracion del token
    };
    return jwt.encode(payload, secret);  //encriptamos el token
};