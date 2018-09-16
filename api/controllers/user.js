'use strict' //para poder usar los nuevos estandares de JS
var bcrypt = require('bcrypt-nodejs');// para cifrar password
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');// nos permite trabajar con archivos, es la libreria de node
var path = require('path');

var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var jwt = require('../services/jwt');

//Metodos de prueba
function home(req, res) {
    res.status(200).send({
        message: 'Hola Mundo desde el servidor de NodeJS'
    });
}

function pruebas(req, res) {
    console.log(req.body);
    res.status(200).send({
        message: 'Accion de pruebas en el servidor de NodeJS'
    });
}
//Registro
function saveUser(req, res) {
    var params = req.body;// todos lo params que nos lleguen por post los vamos a recoger en esta variable
    console.log(params.email + ' params saveUser bd');
    var user = new User();// creamos un objeto del modelo de User

    if (params.name && params.surname && params.nick && params.email && params.password && params.city && params.sport) {
        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;
        
        user.city = params.city;
        user.sport = params.sport;
        
        //Controlar usuarios duplicados
        User.find({
            $or: [
                { email: user.email.toLowerCase() },
                { nick: user.nick.toLowerCase() }
            ]
        }).exec((err, users) => {
            if (err) return res.status(500).send({ message: 'Error en la petición de usuarios' });

            if (users && users.length >= 1) {
                return res.status(200).send({ message: 'El usuario que inteta registrar ya existe' });
            } else {
                // Cifra la password y guarda los datos
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    user.password = hash;

                    user.save((err, userStored) => {
                        if (err) return res.status(500).send({ message: 'Error al guardar el usuario' });

                        if (userStored) {
                            res.status(200).send({ user: userStored });
                        } else {
                            res.status(404).send({ message: 'no se ha registrado el usuario' });
                        }

                    });
                });
            }
        });


    } else {
        res.status(200).send({
            message: 'Envía todos los campos necesarios'
        });
    }
}
//Login
function loginUser(req, res) {
    var params = req.body;
    // console.log(params.email + ' params loginuser bd');
    var email = params.email;
    var password = params.password;

    //que me busque el usuario que el email sea igual al email
    User.findOne({ email: email }, (err, user) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });
        // console.log(user + ' user en finOne a BD');
        if (user) {
            bcrypt.compare(password, user.password, (err, check) => {
                if (check) {

                    if (params.gettoken) {
                        //generar el token y devolver el token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    } else {
                        //devolver datos de usuario
                        user.password = undefined;//para que no se vea la password al enviarla y solo se quede en backend
                        return res.status(200).send({ user })
                    }

                } else {
                    return res.status(404).send({ message: 'El usuario no se ha podido identificar' });
                }
            });
        } else {
            return res.status(404).send({ message: 'El usuario no se ha podido identificar!!' });
        }
    });
}

//Conseguir datos de un usuario
function getUser(req, res) {
    var userId = req.params.id;

    User.findById(userId, (err, user) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });

        if (!user) return res.status(404).send({ message: 'El usuario no existe' });

        followThisUser(req.user.sub, userId).then((value) => {
            user.password = undefined;

            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        })
    });
}

//funcion sincrona alternativa
async function followThisUser(identity_user_id, user_id) {
    try {
        var following = await Follow.findOne({ user: identity_user_id, followed: user_id }).exec()
            .then((following) => {
                console.log(following);
                return following;
            })
            .catch((err) => {
                return handleerror(err);
            });
        var followed = await Follow.findOne({ user: user_id, followed: identity_user_id }).exec()
            .then((followed) => {
                console.log(followed);
                return followed;
            })
            .catch((err) => {
                return handleerror(err);
            });
        return {
            following: following,
            followed: followed
        }
    } catch (e) {
        console.log(e);
    }
}

// //funcion sincrona
// async function followThisUser(identity_user_id, user_id) {
//     var following = await Follow.findOne({ "user": identity_user_id, "followed": user_id }).exec((err, follow) => {
//         if (err) return handleError(err);
//         return follow
//     });

//     var followed = await Follow.findOne({ "user": user_id, "followed": identity_user_id }).exec((err, follow) => {
//         if (err) return handleError(err);
//         return follow
//     });

//     return {
//         following: following,
//         followed: followed
//     }
// }

//Devolver un listado de usuarios paginados
function getUsers(req, res) {
    var identity_user_id = req.user.sub;//id del usuario logueado

    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }

    var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });

        if (!users) return res.status(404).send({ message: 'No hay usuarios disponibles' });

        followUserIds(identity_user_id).then((value) => {
            return res.status(200).send({
                users, //es lo mismo que poner users:users pero es redundante
                users_following: value.following,
                users_follow_me: value.followed,
                total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
    });
}

async function followUserIds(user_id) {

    try {
        //Obejter los usuarios que seguimos          //El select es para mostrar los campos que yo quiera
        var following = await Follow.find({ 'user': user_id })
        .select({ '_id': 0, '__v': 0, 'user': 0 }).exec()
            .then((following) => {
                var follows_clean = [];

                following.forEach((follow) => {
                    //console.log("followed", follow.followed);
                    //Guardar los usuarios que yo sigo
                    follows_clean.push(follow.followed);
                });

                return follows_clean;
            })
            .catch((err) => {
                return handleError(err);
            });

        //Obejter los usuarios que seguimos          
        //El select es para mostrar los campos que yo quiera
        var followed = await Follow.find({ 'followed': user_id })
        .select({ '_id': 0, '__v': 0, 'followed': 0 }).exec()
            .then((following) => {
                var follows_clean = [];

                following.forEach((follow) => {
                    //console.log("user", follow.user);
                    //Guardar los usuarios que yo sigo
                    follows_clean.push(follow.user);
                });

                return follows_clean;
            })
            .catch((err) => {
                return handleError(err);
            });

        return {
            following: following,
            followed: followed
        }
    } catch (e) {
        console.log(e);
    }

}

// //Otra forma de la funcion anterior sin exec que da problemas de version
// async function followUserIds(user_id) {
//     var following = await Follow.find({ "user": user_id }).select({ '_id': 0, '__v': 0, 'user': 0 }).exec((err, follows) => {
//         return follows;
//     });

//     var followed = await Follow.find({ "followed": user_id }).select({ '_id': 0, '__v': 0, 'followed': 0 }).exec((err, follows) => {
//         return follows;
//     });

//     //procesar following ids
//     var following_clean = [];

//     following.forEach((follow) => {
//         following_clean.push(follow.followed);
//     });
//     //procesar followed ids
//     var followed_clean = [];

//     followed.forEach((follow) => {
//         followed_clean.push(follow.user);
//     });

//     return {
//         following: following_clean,
//         followed: followed_clean
//     }
// }

function getCounters(req, res) {
    var userId = req.user.sub;
    if (req.params.id) {
        userId = req.params.id;
    }

    getCountFollow(userId).then((value) => {
        return res.status(200).send(value);
    });

}
// (node:18808) DeprecationWarning: collection.count is deprecated, 
// and will be removed in a future version. Use collection.countDocuments
// or collection.estimatedDocumentCount instead

async function getCountFollow(user_id) {
    
    // El codigo comentado da errores de version o algo con node, con respecto a no usar then y catch
    // var following = await Follow.countDocuments({ "user": user_id }).exec((err, count) => {
    //     if (err) return handleError(err);
    //     return count;
    // });

    // var followed = await Follow.countDocuments({ "followed": user_id }).exec((err, count) => {
    //     if (err) return handleError(err);
    //     return count;
    // });

    // var publications = await Publication.countDocuments({ 'user': user_id }).exec((err, count) => {
    //     if (err) return handleError(err);
    //     return (count);
    // });

    var following = await Follow.countDocuments({ "user": user_id }).exec().then((count) => {
        //if (err) return handleError(err);
        return count;
    })
    .catch((err) => {
        return handleError(err);
    });
    var followed = await Follow.countDocuments({ "followed": user_id }).exec().then((count) => {
        //if (err) return handleError(err);
        return count;
    })
    .catch((err) => {
        return handleError(err);
    });
    var publications = await Publication.countDocuments({ 'user': user_id }).exec().then((count) => {
        //if (err) return handleError(err);
        return (count);
    })
    .catch((err) => {
        return handleError(err)
    });
    return {
        following: following,
        followed: followed,
        publications: publications
    }
}



// Edición de datos de usuario
function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;


    //Borrar la propiedad password para que no se vea
    delete update.password;

    if (userId != req.user.sub) {
        return res.status(500).send({ message: 'No tiene permisos para actualizar los datos del usuario' });
    }

    User.find({
        $or: [
            { email: update.email.toLowerCase() },
            { nick: update.nick.toLowerCase() }
        ]
    }).exec((err, users) => {
        let user_isset = false;
        users.forEach((user) => {
            if (user && user._id != userId) user_isset = true;

        });

        if (user_isset) return res.status(404).send({ message: 'Los datos ya estan en uso' });

        User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdate) => {
            if (err) return res.status(500).send({ message: 'Error en la petición' });

            if (!userUpdate) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' });

            return res.status(200).send({ user: userUpdate });
        });
    });


}

// Subir archivos de imagen/avatar de usuario
function uploadImage(req, res) {
    var userId = req.params.id;



    if (req.files) {
        var file_path = req.files.image.path;
        console.log(file_path);
        var file_split = file_path.split('\\');
        console.log(file_split);
        var file_name = file_split[2];
        console.log(file_name);
        var ext_split = file_name.split('\.');
        console.log(ext_split);
        var file_ext = ext_split[1];
        console.log(file_ext);

        if (userId != req.user.sub) {
            return removeFilesOfUploads(res, file_path, 'No tiene permisos para actualizar los datos de usuario');
        }

        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {
            //Actualizar documento de usuario
            User.findByIdAndUpdate(userId, { image: file_name }, { new: true }, (err, userUpdate) => {
                if (err) return res.status(500).send({ message: 'Error en la petición' });

                if (!userUpdate) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' });

                return res.status(200).send({ user: userUpdate });
            })

        } else {
            return removeFilesOfUploads(res, file_path, 'Extensión no válida');
        }

    } else {
        return res.status(200).send({ message: 'No se han subido imagenes' });
    }

}

function removeFilesOfUploads(res, file_path, message) {
    fs.unlink(file_path, (err) => {
        return res.status(200).send({ message: message });
    });
}

function getImageFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/' + image_file;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({ message: 'No existe la imagen' });
        }
    });
}

module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile
}