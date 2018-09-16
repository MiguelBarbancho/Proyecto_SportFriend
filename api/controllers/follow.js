'use strict'

// var path = require('path');
// var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');

function prueba(req, res){
    res.status(200).send({message: 'Hola mundo desde el controlador follows'});
}

function saveFollow(req, res){
    var params = req.body;

    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored) => {
        if(err) return res.status(500).send({message: 'Error al guardar el seguimiento'});

        if(!followStored) return res.status(404).send({message: 'El seguimiento no se ha guardado'})

        return res.status(200).send({follow:followStored});
    });
}


function deleteFollow(req, res){
    var userId = req.user.sub;
    var followId = req.params.id;

    Follow.find({'user':userId, 'followed':followId}).remove(err =>{
        if(err) return res.status(500).send({message: 'Error al dejar de seguir'});

        return res.status(200).send({message: 'El follow se ha eliminado correctamente'});
    });
}

// Usuarios que sigo
function getFollowingUsers(req, res){
    //guardo el user id del usuario logueado que nos llega, se usará en caso de cono llegue user por url
    var userId = req.user.sub;
    //compruebo que nos llegue el user id por la url xq en ese caso, este será prioriatario para listar los usuarios q sigue
	if(req.params.id && req.params.page){
		userId = req.params.id;
	}

	var page = 1;
	//en caso de que llegue una pagina por la url, por params
	if(req.params.page){
		page = req.params.page;
	}else{
		page = req.params.id;
	}

	var itemsPerPage = 4;
    // Buscamos todos los follows cuyo user yo sea el usuario que esta siguiendo, es decir buscamos 
    // todos los objetos el los cuales yo esté siguiendo un usuario
	Follow.find({user:userId}).populate({path: 'followed'}).paginate(page, itemsPerPage, (err, follows, total) => {
		if(err) return res.status(500).send({message: 'Error en el servidor'});

		if(!follows) return res.status(404).send({message: 'No estas siguiendo a ningun usuario'});

		followUserIds(req.user.sub).then((value) => {
			return res.status(200).send({
				total: total,
				pages: Math.ceil(total/itemsPerPage),
				follows,
				users_following: value.following,
				users_follow_me: value.followed,
			});
		});
	});
}
// Usuarios que me siguen
function getFollowedUsers(req, res){
    var userId = req.user.sub;

    if(req.params.id && req.params.page){
        userId = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }

    var itemsPerPage = 4;

    Follow.find({ followed: userId }).populate('user').paginate(page, itemsPerPage, (err, follows, total) => {
        if (err) return res.status(500).send({ message: 'Error en el servidor' });

        if (!follows) return res.status(404).send({ message: 'No te sigue ningun usuario' });

        followUserIds(req.user.sub).then((value) => {
			return res.status(200).send({
				total: total,
				pages: Math.ceil(total/itemsPerPage),
				follows,
				users_following: value.following,
				users_follow_me: value.followed,
			});
		});
    });
}

async function followUserIds(user_id) {

    try {
        //Obejter los usuarios que seguimos          
        //El select es para mostrar los campos que yo quiera
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

// async function followUserIds(user_id) {
//         var following = await Follow.find({ "user": user_id }).select({ '_id': 0, '__v': 0, 'user': 0 }).exec((err, follows) => {
//             return follows;
//         });
    
//         var followed = await Follow.find({ "followed": user_id }).select({ '_id': 0, '__v': 0, 'followed': 0 }).exec((err, follows) => {
//             return follows;
//         });
    
//         //procesar following ids
//         var following_clean = [];
    
//         following.forEach((follow) => {
//             following_clean.push(follow.followed);
//         });
//         //procesar followed ids
//         var followed_clean = [];
    
//         followed.forEach((follow) => {
//             followed_clean.push(follow.user);
//         });
    
//         return {
//             following: following_clean,
//             followed: followed_clean
//         }
//     }


//devuelve los usuarios que sigo o que me siguen, devuelve el listado de usuarios
function getMyFollows(req, res){
    var userId = req.user.sub;

    var find = Follow.find({user: userId});
    
    if(req.params.followed){
        find = Follow.find({followed: userId});
    }

    find.populate('user followed').exec((err, follows) =>{
        if(err) return res.status(500).send({message: 'Error en el servidor'});

        if(!follows) return res.status(404).send({message: 'No sigues a ningun usuario'});

        return res.status(200).send({
            follows
        });
    })
}


module.exports = {
    prueba,
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}