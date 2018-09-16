'use strict'

var express = require('express');
var PublicationControler = require('../controllers/publication');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({ uploadDir: './uploads/publications'});

api.get('/probando-pub', md_auth.ensureAuth, PublicationControler.probando);
api.post('/publication', md_auth.ensureAuth, PublicationControler.savePublication);
api.get('/publications/:page?/:sport?/:city?', md_auth.ensureAuth, PublicationControler.getPublications);
api.get('/publications-user/:user/:page?', md_auth.ensureAuth, PublicationControler.getPublicationsUser);
api.get('/publication/:id', md_auth.ensureAuth, PublicationControler.getPublication);
api.delete('/publication/:id', md_auth.ensureAuth, PublicationControler.deletePublication);
api.post('/upload-image-pub/:id', [md_auth.ensureAuth, md_upload], PublicationControler.uploadImage);
api.get('/get-image-pub/:imageFile', PublicationControler.getImageFile);
module.exports = api;