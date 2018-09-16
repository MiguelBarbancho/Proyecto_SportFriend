'use strict'
//librerias cargadas
var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');
//modelos cargados
var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

function probando(req, res){
    res.status(200).send({
        message: "Hola desde el controlador de publicaciones"
    });
}

function savePublication(req, res){
    var params = req.body;

    if(!params.text) return res.status(200).send({message: 'Debes enviar un texto'});
 //setear los datos del objeto, seteamos la informacion a cada una de las propiedades
    var publication = new Publication(); //creamos el nuevo objeto
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();
    //guardamos en bbdd
    publication.save((err, publicationStored) =>{
        if(err) return res.status(500).send({message: 'Error al guardar la publicacion'});

        if(!publicationStored) return res.status(404).send({message: 'La publicacion no ha sido guardada'});

        return res.status(200).send({publication: publicationStored});

    });
}
//devuelve todas las publicaciones de los usuarios que seguimos, 
// lo q hace es recoger el Id del usuario identificado, 
// hacer un find de todos los usuarios que estoy siguiendo y 
// busca todas las publicaciones de los usuarios q estoy siguiendo, 
// devolviendomelos en un JSON
function getPublications(req, res) {
    var page = 1; //valor por defecto en caso de no pasarle un valor a page por URL
    var sport = req.params.sport;
    var city = req.params.city;
    if (req.params.page) {
        page = req.params.page //reasignamos valor a page ya que se lo pasamos por la URL
    }
    var itemsPerPage = 5;

    Follow.find({ user: req.user.sub }).populate('followed').exec((err, follows) => {
        if (err) return res.status(500).send({ message: 'Error al devolver el seguimiento' });

        var follows_clean = [];
        //mete todos los usuarios dentro de un array limpio
        //solo deja pasar a los que tienen tus mismos gustos deportivos y de tu ciudad
        follows.forEach((follow) => {
            if(sport == follow.followed.sport && city == follow.followed.city) {
                follows_clean.push(follow.followed);
            }
        });

        follows_clean.push(req.user.sub);
        
        //comprueba si alguno de los usuarios esta dentro de alguna propiedad user de alguno de los documentos de publicaciones
        Publication.find({ user: { "$in": follows_clean } }).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
            if (err) return res.status(500).send({ message: 'Error al devolver publicaciones' });

            if (!publications) return res.status(404).send({ message: 'No hay publicaciones' });
            // console.log(publications);

            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total / itemsPerPage),
                page: page,
                items_per_page: itemsPerPage,
                publications,

            });
        });
    });
}


function getPublicationsUser(req, res){
    var page = 1; //valor por defecto en caso de no pasarle un valor a page por URL
    if(req.params.page){
        page = req.params.page //reasignamos valor a page ya que se lo pasamos por la URL
    }

    var user = req.user.sub;
    if(req.params.user) {
        var user = req.params.user;
    }

    var itemsPerPage = 5;
        //comprueba si alguno de los usuarios esta dentro de alguna propiedad user de alguno de los documentos de publicaciones
        Publication.find({user: user}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) =>{
            if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

            if(!publications) return res.status(404).send({message: 'No hay publicaciones'});

            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total/itemsPerPage),
                page: page,
                items_per_page: itemsPerPage,
                publications
            });
        });

    
}

function getPublication(req, res){
    var publicationId = req.params.id;

    Publication.findById(publicationId, (err, publication) => {
        if(err) return res.status(500).send({message: 'Error al devolver la publicacion'});

        if(!publication) return res.status(404).send({message: 'No existe la publicacion'});

        return res.status(200).send({publication});
    });
}

function deletePublication(req, res){
    var publicationId = req.params.id;

    Publication.find({'user': req.user.sub, '_id': publicationId}).remove(err =>{
        if(err) return res.status(500).send({message: 'Error al borrar la publicacion'});

        return res.status(200).send({message: 'Publicacion eliminada correctamente'});
    });
}

// Subir archivos de imagenes de publicaciones
function uploadImage(req, res) {
    var publicationId = req.params.id;

    if (req.files) {
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];
       
        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {
                
            Publication.findOne({'user':req.user.sub, '_id':publicationId}).exec((err, publication) => {
                if(publication){
                    //Actualizar documento de la publicacion
                    Publication.findByIdAndUpdate(publicationId, { file: file_name }, { new: true }, (err, publicationUpdate) => {
                        if (err) return res.status(500).send({ message: 'Error en la petición' });

                        if (!publicationUpdate) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' });

                        return res.status(200).send({ publication: publicationUpdate });
                    });
                }else{return removeFilesOfUploads(res, file_path, 'No tienes persisos para actualizar esta publicacion');}
            });
            

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
    var path_file = './uploads/publications/' + image_file;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res, status(200).send({ message: 'No existe la imagen' });
        }
    });
}

module.exports = {
    probando,
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile,
    getPublicationsUser
}