var bodyParser = require('body-parser');

var express = require('express');
var app = express();

var port = parseInt(process.env.PORT, 10) || 8080;

var debug = require('debug')('myapp:mycontext');

//var debug = require('debug')('http'),
//    http = require('http'),
//    name = 'My App';

// Afficher variables environnement
console.log("--- process.env [START]");
console.info(process.env);
console.log("--- process.env [END]");

const fs = require('fs');
const path = require("path");

// https://wiki.gromez.fr/dev/api/allocine_v3
let allocine = require('allocine-api');
allocine.presets['reviewlist'] = {profile: 'large'};  // add reviewlist

/**
 * getClientURI
 */
function getClientURI(){
  if (typeof (process.env.SSH_CLIENT) !== "undefined"){ // Bananapi
    return 'http://192.168.0.50:' + port + '/';
  }
  else if (typeof (process.env.NODE_ENV) !== "undefined" && process.env.NODE_ENV === 'production'){  // Heroku
    return 'https://evening-river-52675.herokuapp.com/';
  }
  else {  // localhost
    return 'http://localhost:' + port + '/';
  }
};

const CONFIG = {
    LINUX_ENV: typeof (process.env.SSH_CLIENT) !== "undefined" ? true: false,
    VIDEO_DIR: typeof (process.env.SSH_CLIENT) !== "undefined" ? '/mnt/data/media/video/' : 'I:\GRABIT/',
    VIDEO_DIR_PROTECTED: typeof (process.env.SSH_CLIENT) !== "undefined" ? '/mnt/data/media/video/' : 'I:GRABIT\\',
    VIDEO_OLD_DIR: '__OLD',
    CLIENT_URI: getClientURI(),
    //CLIENT_URI: typeof (process.env.SSH_CLIENT) !== "undefined" ? 'http://192.168.0.50:' + port + '/' : 'http://localhost:' + port + '/',
    EXPORTS_SCANNED_MOVIES_FILE: __dirname + '/exports/scannedMovies.js',
    //EXPORTS_SCANNED_MOVIES_FILE: './exports/scannedMovies.js',
    EXPORTS_MOVIES_JSON_FILE: __dirname + '/exports/movies.json',
    //EXPORTS_MOVIES_JSON_FILE: './exports/movies.json',
    PICTURES_DIR: 'pictures',
    RESIZED_PICTURES_DIR: 'pictures/resized',
    MAX_RESIZED_PICTURES_WIDTH: 300
};
const APIUtils = require('./APIUtils.js');
const HomeMoviesAPI = require('./HomeMoviesAPI.js');
HomeMoviesAPI.setPort(port);
HomeMoviesAPI.setCONFIG(CONFIG);

const HomeMoviesMongDb = require('./HomeMoviesMongDb.js');

try {

    /**
     * CORS
     */
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    // parse application/x-www-form-urlencoded : support encoded bodies
    app.use(bodyParser.urlencoded({extended: true}));

    // parse application/json : support json encoded bodies
    app.use(bodyParser.json());

    /*
     * Rep statiques
     * cf: http://expressjs.com/fr/starter/static-files.html
     */
    app.use('/libs', express.static(__dirname + '/../home-movies-app/www/libs'));
    app.use('/js', express.static(__dirname + '/../home-movies-app/www/js'));
    app.use('/css', express.static(__dirname + '/../home-movies-app/www/css'));
    app.use('/fonts', express.static(__dirname + '/../home-movies-app/www/fonts'));
    app.use('/img', express.static(__dirname + '/../home-movies-app/www/img'));

    // Rep images téléchargées et redimensionnées
    app.use('/pictures', express.static(__dirname + '/pictures'));

    /**
     * Routes
     */
    app.get('/', function (req, res) {

        console.log('APIUtils:', APIUtils);
        console.log('HomeMoviesAPI:', HomeMoviesAPI);

        // -- Menu
        APIUtils.sendHtmlResponse(res, APIUtils.getHtmlPage('HomeMoviesAPI', HomeMoviesAPI.getPublicRoutesMenu()));
        //res.end('API Home');
    });

// ex: /etage/1/chambre
    app.get('/etage/:etagenum/chambre', function (req, res) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Etage n°' + req.params.etagenum);
    });


    /**
     * AlloCine API : Recherche par mots-clés
     *
     * TODO : sécuriser données entrantes
     * https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
     */
    app.get('/searchMovie/:movie', function (req, res) {

        let keywords = decodeURIComponent(req.params.movie);

        allocine.api('search', {q: keywords, filter: 'movie'}, function (error, results) {
            if (error) {
                console.log('server [searchMovie] Error : ' + error);
                return;
            }
            console.info('server [searchMovie]', keywords, results);

            // retour JSON
            res.setHeader('Content-Type', 'application/json');
            res.send(results);
        });

        //res.end('>>> END allocine');
    });

    /**
     * AlloCine API : Recherche par id
     */
    app.get('/searchMovieById/:id', function (req, res) {

        let id = parseInt(req.params.id);   // 143067

        allocine.api('movie', {code: id}, function (error, results) {
            if (error) {
                console.log('server [searchMovieById] Error : ' + error);
                return;
            }
            console.info('server [searchMovieById]', id, results);

            // retour JSON
            res.setHeader('Content-Type', 'application/json');
            res.send(results);
        });

        //res.end('>>> END allocine');
    });

    /**
     * AlloCine API : Recherche des critiques presses par id
     * https://wiki.gromez.fr/dev/api/allocine_v3
     */
    app.get('/searchMovieReviewsById/:id', function (req, res) {

        let id = parseInt(req.params.id);   // 143067

        allocine.api('reviewlist', {code: id, filter: 'desk-press', type: "movie"}, function (error, results) {
            if (error) {
                console.log('server [searchMovieReviewsById] Error : ' + error);
                return;
            }
            console.info('server [searchMovieReviewsById]', id, results);

            // retour JSON
            res.setHeader('Content-Type', 'application/json');
            res.send(results);
        });

        //res.end('>>> END allocine');
    });


//cf : https://www.gitbook.com/book/kevinchisholm/sending-multiple-http-responses-with-express-js/details
//    app.get('/test', function (req, res) {
//        var i = 1,
//                max = 5;
//
//        //set the appropriate HTTP header
//        res.setHeader('Content-Type', 'text/html');
//
//        // 1 - send multiple responses to the client
////    for (; i <= max; i++) {
////        res.send('<h1>This is the response #: ' + i + '</h1>');
////    }
//
//        // 2 - send multiple responses to the client
//        for (; i <= max; i++) {
//            res.write('<h1>This is the response #: ' + i + '</h1>');
//        }
//        //end the response process
//        res.end('>>> test');
//    });


    /**
     * Scanne la liste des fichiers films > TODO : tester
     * @private
     */
    app.get('/scanMovies', function (req, res) {

        // -- Menu (pb headers)
        //APIUtils.sendHtmlResponse(res, APIUtils.getHtmlPage('HomeMoviesAPI', HomeMoviesAPI.getPublicRoutesMenu()));

        HomeMoviesAPI.scanMovies(function (response) {
            APIUtils.sendHtmlResponse(res, response.message);

            res.end('>>> END scanMovies');
        });
    });

    /**
     * Initialise le fichier json des films sauvegardés > TODO : tester
     * @private
     */
    app.get('/initJsonMovies', function (req, res) {

        HomeMoviesAPI.initJsonMovies(function (response) {
            APIUtils.sendHtmlResponse(res, response.message);

            res.end('>>> END initJsonMovies');
        });
    });

    /**
     * Renvoie la liste des fichiers films scannés ET déjà trouvés par l'API
     *
     */
    app.get('/getAllMovies', function (req, res) {

        HomeMoviesAPI.getAllMovies(function (handledMovies) {
            APIUtils.sendJSONResponse(res, handledMovies);
        });

        //res.end('>>> END getAllMovies');
    });

    /**
     * Renvoie la liste des genres rencontrés
     *
     */
    app.get('/getMoviesGenres', function (req, res) {

        HomeMoviesAPI.getMoviesGenres(function (movies) {
            APIUtils.sendJSONResponse(res, movies);
        });
    });

    app.get('/batchMoviePictures', function (req, res) {

        HomeMoviesAPI.batchMoviePictures(function (result) {
            APIUtils.sendJSONResponse(res, result);
        });
    });

    app.get('/asyncBatchMoviePictures', function (req, res) {

        HomeMoviesAPI.asyncTest2(function (result) {
            APIUtils.sendJSONResponse(res, result);
        });
//        HomeMoviesAPI.asyncBatchMoviePictures(function (result) {
//            APIUtils.sendJSONResponse(res, result);
//        });


    });



    /**
     * Tests
     */
    app.get('/testMovies', function (req, res) {

//        let uri = "http://images.allocine.fr/pictures/16/02/15/08/47/568021.jpg";
//
//        HomeMoviesAPI.downloadFile(uri, function (response) {   // OK
//            APIUtils.sendJSONResponse(res, response);
//        });

//        const inputPictureFile = CONFIG.LINUX_ENV ? __dirname + "/" + HomeMoviesAPI.getCONFIG().PICTURES_DIR + "/568021.jpg" : __dirname + "\\" + HomeMoviesAPI.getCONFIG().PICTURES_DIR + "\\568021.jpg";
//        const outputPictureFile = CONFIG.LINUX_ENV ? __dirname + "/" + HomeMoviesAPI.getCONFIG().RESIZED_PICTURES_DIR + "/568021.jpg" : __dirname + "\\" + HomeMoviesAPI.getCONFIG().RESIZED_PICTURES_DIR + "\\568021.jpg";
//
//        HomeMoviesAPI.resizePictureFile(inputPictureFile, outputPictureFile, false, function (response) {   // OK
//            APIUtils.sendJSONResponse(res, response);
//        });
    });

    /**
     * Récupère et stocke un obj film > TODO : tester
     * POST
     * https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
     */
    app.post('/storeMovie', function (req, res) {
        console.log('server [storeMovie]', req.body);

        let movie = typeof (req.body) !== "undefined" ? req.body : null;

        if (movie) {
            HomeMoviesAPI.storeMovie(movie, function (response) {
                APIUtils.sendJSONResponse(res, response);
            });
        } else {
            let response = {
                success: false,
                message: "no movie posted !"
            };
            APIUtils.sendJSONResponse(res, response);
        }
    });

    app.get('/connectToDb', function (req, res) {
        console.info('server [connectToDb]');

        HomeMoviesMongDb.getConnection(function (db) {
            console.log(db);
            APIUtils.sendHtmlResponse(res, 'server [connectToDb] ' + db.s.databaseName + ' : OK');
        });
    });

    app.get('/getDbMovies', function (req, res) {
        console.info('server [getDbMovies]');

        HomeMoviesMongDb.getMovies(function (result) {
            console.log(result);
            APIUtils.sendHtmlResponse(res, 'server [getDbMovies]: ' + result.length);
        });
    });

    app.get('/getDbMoviesByKeyWord', function (req, res) {
        console.info('server [getDbMoviesByKeyWord]');

        let searchPattern = {genres: /Drame/};
        //let searchPattern = {genres: /Comédie/};
        HomeMoviesMongDb.getDbMoviesByKeyWord(searchPattern, function (result) {
            console.log(result);
            APIUtils.sendHtmlResponse(res, 'server [getDbMoviesByKeyWord]: ' + result.length);
        });
    });

    app.get('/insertDbMovies', function (req, res) {
        console.info('server [insertDbMovies]');

//        HomeMoviesMongDb.insertMovies([
//            {a: 1}, {a: 2}, {a: 3}
//        ], function (result) {
//            console.log(result);
//            APIUtils.sendHtmlResponse(res, 'server [insertDbMovies]: ' + result.insertedCount);
//        });

        HomeMoviesAPI.getAllMovies(function (handledMovies) {

            HomeMoviesMongDb.insertMovies(handledMovies, function (result) {
                console.log(result);
                APIUtils.sendHtmlResponse(res, 'server [insertDbMovies]: ' + result.insertedCount);
            });
        });
    });

    app.get('/updateDbMovie', function (req, res) {
        console.info('server [updateDbMovie]');

        HomeMoviesMongDb.updateMovie({a: 2}, {$set: {b: 1}}, function (result) {
            console.log(result);
            APIUtils.sendHtmlResponse(res, 'server [updateDbMovie]: ' + result.matchedCount);
        });
    });

    app.get('/deleteDbMovie', function (req, res) {
        console.info('server [deleteDbMovie]');

        HomeMoviesMongDb.deleteMovie({a: 3}, function (result) {
            console.log(result);
            APIUtils.sendHtmlResponse(res, 'server [deleteDbMovie]: ' + result.deletedCount);
        });
    });

    app.get('/deleteAllDbMovies', function (req, res) {
        console.info('server [deleteAllDbMovies]');

        HomeMoviesMongDb.deleteAllMovies(function (result) {
            console.log(result);
            APIUtils.sendHtmlResponse(res, 'server [deleteAllDbMovies]: ' + result.result.n);
        });
    });

    // http://mongodb.github.io/node-mongodb-native/3.0/quick-start/quick-start/
    app.get('/testDb', function (req, res) {


//        MongoClient.connect("mongodb://127.0.0.1:27017/" + DB_NAME, function (error, db) {
//            if (error) {
//                console.error(error);
//                throw error;
//            }
//
//            console.info("Connecté à la base de données: " + DB_NAME, db);
//
//            res.write("Connecté à la base de données: " + DB_NAME);
//
//            db.collection(DB_NAME).find().toArray(function (error, results) {
//                if (error)
//                    throw error;
//
//                console.log(results);
//
////                results.forEach(function (i, obj) {
////                    console.log(
////                            "ID : " + obj._id.toString() + "\n" // 53dfe7bbfd06f94c156ee96e
////                            "Nom : " + obj.name + "\n"           // Adrian Shephard
////                            "Jeu : " + obj.game                  // Half-Life: Opposing Force
////                            );
////                });
//            });
//        });

    });

    /**
     * Renvoie l'app
     * https://codeforgeek.com/2015/01/render-html-file-expressjs/
     */
    app.get('/app', function (req, res) {

        const file = path.join(__dirname + '/../home-movies-app/www/index.html');
        console.info('server [app] path:', __dirname, file);
        res.sendFile(file);
    });

    // 404
    app.use(function (req, res, next) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(404).send('Page introuvable !');
    });


    //wait for a connection
    app.listen(port, function () {
        console.info('The web server is running. Please open ' + CONFIG.CLIENT_URI + ' in your browser.');
    });
} catch (error) {
    console.error(error);
}
