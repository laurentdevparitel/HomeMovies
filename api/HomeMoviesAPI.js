'use strict';

const fs = require('fs');

// https://wiki.gromez.fr/dev/api/allocine_v3
let allocine = require('allocine-api');
allocine.presets['reviewlist'] = {profile: 'large'};  // add reviewlist

const APIUtils = require("./APIUtils.js");

// TODO : 
// 
// - http://simov.github.io/express-admin/
// - https://github.com/simov/express-admin
// 
// - ajouter moteur tpl 
// https://webapplog.com/handlebars/
// https://openclassrooms.com/courses/des-applications-ultra-rapides-avec-node-js/le-framework-express-js

// https://delicious-insights.com/fr/articles/libs-node-js/

const HomeMoviesAPI = function () {

    //global process;
    //global port;

    this.port = null;
    this.CONFIG = {};

    this.setPort = function (port) {
        this.port = port;
    };
    this.setCONFIG = function (CONFIG) {
        this.CONFIG = CONFIG;
    };
    this.getCONFIG = function () {
        return this.CONFIG;
    };

    /**
     * 
     * @returns {String}
     */
    this.getPublicRoutesMenu = function () {
        console.info(this.constructor.name + ' [' + Object.keys(this).toString() + ']');

        let self = this;

        let html = '<ul>';
        let publicRoutes = [
            {
                route: self.getCONFIG().CLIENT_URI,
                label: 'Home'
            },
            {
                route: self.getCONFIG().CLIENT_URI + 'scanMovies',
                label: 'Scan movies'
            },
            {
                route: self.getCONFIG().CLIENT_URI + 'getAllMovies',
                label: 'Show all movies'
            },
            {
                route: self.getCONFIG().CLIENT_URI + 'getMoviesGenres',
                label: 'Show movies genres'
            },

            {
                route: self.getCONFIG().CLIENT_URI + 'batchMoviePictures',
                label: 'Batch movie pictures'
            },
            {
                route: self.getCONFIG().CLIENT_URI + 'asyncBatchMoviePictures',
                label: 'Async batch movie pictures'
            },

            {
                route: self.getCONFIG().CLIENT_URI + 'testMovies',
                label: 'Test movies'
            },

            {
                sep: true
            },
            {
                route: self.getCONFIG().CLIENT_URI + 'app',
                label: 'See myHomeMovies app online'
            },
            {
                sep: true
            },
            {
                route: self.getCONFIG().CLIENT_URI + 'connectToDb',
                label: '[Mongo Db] connectToDb'
            },
            {
                route: self.getCONFIG().CLIENT_URI + 'getDbMovies',
                label: '[Mongo Db] getDbMovies'
            },
            {
                route: self.getCONFIG().CLIENT_URI + 'getDbMoviesByKeyWord',
                label: '[Mongo Db] getDbMoviesByKeyWord'
            },
            {
                route: self.getCONFIG().CLIENT_URI + 'deleteAllDbMovies',
                label: '[Mongo Db] deleteAllDbMovies'
            }
        ];

        publicRoutes.forEach(function (r) {
            if (r.sep) {
                html += '<li>-------------------------------------</li>';
            } else {
                html += '<li>\n\
                        <a href="' + r.route + '">' + r.label + '</a>\n\
                    </li>';
            }
        });
        html += '</ul>';

        return html;
    };

    this.getSearchMovieName = function (movieName) {
        //console.info('HomeMoviesAPI [getSearchMovieName]', movieName);

        let movieSearchName = "";
        const stopWords = [
            'FRENCH',
            'FR',
            'VOSTFR',
            'DVDRIP',
            'XVID',
            'BDRIP',
            'DVDSCR',
            'HDRIP',
            'TRUEFRENCH',
            '(VO)',
            '(HD)',
            '(720P)',
            'RERIP',
            '[ WWW CPASBIEN PW ]'
        ];
        const stopRegex = [/^\d{4}$/];

        let tmps = movieName.split(".");
        let yearFound = false;
        let stopWordFound = false;

        tmps.forEach(function (tmp) {
            if (stopRegex[0].test(tmp)) {
                yearFound = true;
            } else if (stopWords.indexOf(tmp.toUpperCase()) !== -1) {
                stopWordFound = true;
            } else if (!yearFound && !stopWordFound) {
                movieSearchName += tmp + " ";
            } else {
                //
            }
        });

        return movieSearchName.trim();
    };

    this.isMovieSerie = function (movieFile) {
        //console.info('HomeMoviesAPI: isMovieSerie', movieFile);
        let tmp = movieFile.replace(this.getCONFIG().VIDEO_DIR_PROTECTED, '');  // OK
        let tmps = typeof (process.env.SSH_CLIENT) !== "undefined" ? tmp.split("/") : tmp.split("\\");
        return tmps.length > 1;
    };

    this.isDumpedMovie = function (movieFile) {
        return new RegExp(this.getCONFIG().VIDEO_OLD_DIR, "g").test(movieFile);
    };

    this.isMovieDoc = function (movieName) {
        //console.info('HomeMoviesAPI: isMovieDoc', movieName);        
        return /DOC/g.test(movieName);
    };

    this.findMovie = function (base, movies) {
        //console.info('HomeMoviesAPI: findMovie', base, movies);
        let movieFound = false;
        movies.forEach(function (movie) {
            if (movie.API && movie.API.AlloCine && movie.API.AlloCine.code) {
                if (movie.base === base) {
                    movieFound = movie;
                }
            }
        });
        return movieFound;
    };

    this.getMovieGenres = function (movie) {
        //console.info('HomeMoviesAPI: getMovieGenres', movie);  
        let genres = [];
        if (movie.API && movie.API.AlloCine && movie.API.AlloCine.genre) {
            movie.API.AlloCine.genre.forEach(function (genre) {
                genres.push(genre['$']);
            });
        }
        return genres;
    };

    /**
     * Renvoie le json des films trouvés par l'API
     * @param {fn} callbackFn
     * @returns {json}
     */
    this.getMovies = function (callbackFn) {
        fs.readFile(this.getCONFIG().EXPORTS_MOVIES_JSON_FILE, 'utf8', function (error, data) {
            if (error)
                throw error;

            let json = JSON.parse(data);
            console.info('HomeMoviesAPI: getMovies', json);

            if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                callbackFn.call(this, json);
            }
            return json;
        });
        return null;
    };

    /**
     * Renvoie le tableau des films scannés ET trouvés par l'API
     * @param {fn} callbackFn
     * @returns {array}
     */
    this.getAllMovies = function (callbackFn) {
        //console.info('HomeMoviesAPI: getAllMovies', callbackFn);
        let self = this;

        const scannedMovies = require(self.getCONFIG().EXPORTS_SCANNED_MOVIES_FILE);
        //console.info('scannedMovies :', scannedMovies);

        let handledMovies = [];

        this.getMovies(function (movies) {

            //console.info('HomeMoviesAPI: getAllMovies', movies);

            scannedMovies.forEach(function (scannedMovie) {

                let movie = self.findMovie(scannedMovie.base, movies);
                let handledMovie;

                if (movie) {   // film déjà trouvé via l'API et présent dans le JSON
                    handledMovie = Object.assign({}, movie); // NB: copie sans toucher l'original
                    handledMovie.genres = self.getMovieGenres(movie);   // NB : permet une meilleure indexation MOngoDb
                } else {
                    handledMovie = Object.assign({}, scannedMovie); // NB: copie sans toucher l'original

                    // Titre qui sera envoyé à l'API
                    handledMovie.searchName = self.getSearchMovieName(handledMovie.name);

                    // Distingeur film (root) / s곩e (dir)
                    handledMovie.serie = self.isMovieSerie(handledMovie.fileProtected);
                    handledMovie.doc = self.isMovieDoc(handledMovie.name);

                    handledMovie.key = APIUtils.getHashCode(handledMovie.base);
                }
                handledMovies.push(handledMovie);
            });
            //console.log('HomeMoviesAPI: getAllMovies :', handledMovies);

            if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                callbackFn.call(this, handledMovies);
            }
            return handledMovies;
        });
    };

    /**
     * Renvoie la liste des genres rencontrés
     * @param {fn} callbackFn
     * @returns {obj}
     */
    this.getMoviesGenres = function (callbackFn) {
        console.info(this.constructor.name + ' [getMoviesGenres]');

        let genres = {};

        this.getAllMovies(function (movies) {
            movies.forEach(function (movie) {
                if (movie.genres) {
                    movie.genres.forEach(function (genre) {
                        if (typeof (genres[genre]) === "undefined") {
                            genres[genre] = 0;
                        }
                        genres[genre]++;
                    });
                }
            });

            // tri DESC
            var sortedGenres = [];
            for (var key in genres) {
                sortedGenres.push([key, genres[key]]);
            }

            sortedGenres.sort(function (a, b) {
                return b[1] - a[1]; // tri ASC
                //return a[1] - b[1];   // tri DESC
            });

            genres = {};
            sortedGenres.forEach(function (sortedGenre) {
                genres[sortedGenre[0]] = sortedGenre[1];
            });

            var response = {
                success: true,
                genres: genres
            };

            if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                callbackFn.call(this, response);
            }
            return genres;
        });
    };

    /**
     * Scanne la liste des fichiers films
     * @param {fn} callbackFn
     * @returns {obj} 
     * https://www.npmjs.com/package/scandir
     * https://www.npmjs.com/package/node-id3 > KO
     * https://github.com/43081j/id3
     */
    this.scanMovies = function (callbackFn) {
        console.info(this.constructor.name + ' [scanMovies]');

        const path = require('path');
        //const NodeID3 = require('node-id3');
        let scandir = require('scandir').create();

        let self = this;
        let movies = [];
        let response = {};

        //console.log('__dirname', __dirname);

        // scan
        scandir.on('file', function (file, stats) {
            //console.log(file + ' ' + stats.size, stats.mtime, stats);
            //console.log('filename: ' + path.parse(file).base);

            // https://nodejs.org/api/path.html
            let fileParse = path.parse(file);
            if (!self.isDumpedMovie(file)) {
                movies.push({
                    file: file,
                    base: fileParse.base,
                    name: fileParse.name,
                    ext: fileParse.ext,
                    mtime: stats.mtime,
                    size: stats.size
                });
            }

        });

        scandir.on('error', function (err) {
            console.error(err);
        });

        scandir.on('end', function (totalCount) {
            console.log('server [scanMovies] scandir done: {totalCount} ' + totalCount, movies);

            // Màj fichier scannedMovies.js
            let str = "";

            str += "let scannedMovies = [];\n";

            for (let i = 0; i < movies.length; i++) {

                str += "scannedMovies.push(\n";
                str += "    {\n";
                str += "        file: \"" + movies[i].file + "\",\n";
                str += "        fileProtected: \"" + movies[i].file.replace(/\\/g, "\\\\") + "\",\n";
                str += "        base: \"" + movies[i].base + "\",\n";
                str += "        name: \"" + movies[i].name + "\",\n";
                str += "        ext: \"" + movies[i].ext + "\",\n";
                str += "        mtime: \"" + movies[i].mtime + "\",\n";
                str += "        size: " + movies[i].size + ",\n";
                str += "    }\n";
                str += ");\n";
            }
            str += "module.exports = scannedMovies;\n";

//        str += "let scannedMovies = "+JSON.stringify(scannedMovies)+"\n";        
//        str += "module.exports = JSON.parse(scannedMovies);\n";

            fs.writeFile(self.getCONFIG().EXPORTS_SCANNED_MOVIES_FILE, str, (err) => {
                // throws an error, you could also catch it here
                if (err)
                    throw err;

                // success case, the file was saved
                console.log(self.getCONFIG().EXPORTS_SCANNED_MOVIES_FILE + ' saved!');

                const scannedMovies = require(self.getCONFIG().EXPORTS_SCANNED_MOVIES_FILE);
                console.log('server [scanMovies] scannedMovies:', scannedMovies);

                response = {
                    success: true,
                    message: 'scannedMovies done: ' + scannedMovies.length + ' movies found',
                    scannedMovies: scannedMovies
                };
                if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                    callbackFn.call(this, response);
                }
            });

            // init movies json
//            str = JSON.stringify([]);
//
//            fs.writeFile(CONFIG.EXPORTS_MOVIES_JSON_FILE, str, (err) => {
//                if (err)
//                    throw err;
//            });

        });

        scandir.scan({
            //dir: '__tmps/',
            dir: self.getCONFIG().VIDEO_DIR,
            //dir: 'G:\__MOVIES',
            //dir: '.',
            recursive: true,
            filter: /.*/,
            media: 'video'
        });
    };

    /**
     * Télécharge un fichier
     * TODO : tester https://www.npmjs.com/package/download-file
     * @param {string} file
     * @param {fn} callbackFn
     * @param {fn} errorCallbackFn
     * @returns {void}
     */
    this.downloadFile = function (uri, callbackFn, errorCallbackFn) {
        console.info(this.constructor.name + ' [downloadFile]', uri);

        let self = this;
        
        const dirSep = self.getCONFIG().LINUX_ENV ? "/" : "\\";
        
        let file = uri.split("/").pop();
        let dest = __dirname + dirSep + self.getCONFIG().PICTURES_DIR + dirSep + file;
        //console.log(self.constructor.name + ' [downloadFile]', file, dest);

        const http = require('http');

        let stream = fs.createWriteStream(dest);
        let request = http.get(uri, function (response) {
            response.pipe(stream);
            stream.on('finish', function () {
                //console.log(self.constructor.name + ' [downloadFile] file ' + file + ' downloaded !');

                let response = {
                    success: true,
                    message: 'file ' + file + ' downloaded !',
                    dest: dest
                };
                stream.close(function () {
                    if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                        callbackFn.call(self, response);
                    }
                });
            });
        }).on('error', function (error) { // Handle errors
            console.error(self.constructor.name + ' [downloadFile] error: ', error);
            fs.unlink(dest); // Delete the file async. (But we don't check the result)

            if (typeof (errorCallbackFn) !== "undefined" && typeof (errorCallbackFn) === "function") {
                errorCallbackFn.call(this, error.message);
            }
        });
    };

    /**
     * Redimensionne un fichier image
     * http://sharp.dimens.io/en/stable/api-resize/
     * 
     * 1/ installer oitils c++ (cmd admin) : npm install --global --production windows-build-tools
     * 2/ npm install sharp --save
     * 
     * https://www.npmjs.com/package/jimp
     * 
     * @param {string} inputPictureFile
     * @param {string} outputPictureFile
     * @param {boolean} useSharpLib
     * @param {fn} callbackFn
     * @param {fn} errorCallbackFn
     * @returns {obj}
     */
    this.resizePictureFile = function (inputPictureFile, outputPictureFile, useSharpLib = false, callbackFn, errorCallbackFn) {
        console.info(this.constructor.name + ' [resizePictureFile]', inputPictureFile, outputPictureFile);

        let self = this;

        if (useSharpLib) {
            const sharp = require('sharp');

            sharp(inputPictureFile)
                    .resize(self.getCONFIG().MAX_RESIZED_PICTURES_WIDTH, null)   // width, height               
                    .toFile(outputPictureFile)
                    .then(function (result) {
                        //console.log(self.constructor.name + ' [resizePictureFile]', result);

                        if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                            callbackFn.call(self, result);
                        }
                    });
        } else {

            //console.info(self.constructor.name + ' [resizePictureFile] using jimp | ${inputPictureFile} > ${outputPictureFile}');
            const Jimp = require("jimp");

            Jimp.read(inputPictureFile).then(function (pict) {
                pict.resize(self.getCONFIG().MAX_RESIZED_PICTURES_WIDTH, Jimp.AUTO)            // resize (width, height) Jimp.AUTO                
                        .quality(80)                 // set JPEG quality 
                        //.greyscale()                 // set greyscale 
                        .write(outputPictureFile, function () {
                            if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                                callbackFn.call(self, {
                                    success: true,
                                    width: pict.bitmap.width,
                                    height: pict.bitmap.height,
                                    file: outputPictureFile,
                                    name: outputPictureFile.split("\\").pop()
                                });
                            }
                        }); // save 
            }).catch(function (error) {
                console.error(self.constructor.name + ' [resizePictureFile]', error);
                if (typeof (errorCallbackFn) !== "undefined" && typeof (errorCallbackFn) === "function") {
                    errorCallbackFn.call(self, {
                        success: false,
                        error: error
                    });
                }
            });
    }

    };

    /**
     * Lance le batch de traitement des affiches de films
     * TODO : 
     * - utiliser async
     * - utiliser méthode dans storeMovie en passant en param un array de movies
     * @returns {void}
     */
    this.batchMoviePictures = function (callbackFn) {
        console.info(this.constructor.name + ' [batchMoviePictures]');

        var self = this;
        const dirSep = self.getCONFIG().LINUX_ENV ? "/" : "\\";
        
        var fileName, inputPictureFile, outputPictureFile;
        var logs = [];

        var handledMovies = [];
        var handledPictures = 0;

        self.getAllMovies(function (movies) {

            movies.forEach(function (movie) {
                if (movie.API && movie.API.AlloCine && movie.API.AlloCine.poster) {
                    handledMovies.push(movie);
                }
            });

            handledMovies.forEach(function (handledMovie, index) {

                // télécharge le fichier
                self.downloadFile(handledMovie.API.AlloCine.poster.href, function (result) {
                    if (result.dest) {

                        // redimensionne l'image
                        fileName = handledMovie.API.AlloCine.poster.href.split("/").pop();
                        inputPictureFile = result.dest;
                        outputPictureFile = __dirname + dirSep + self.getCONFIG().RESIZED_PICTURES_DIR + dirSep + fileName;

                        self.resizePictureFile(inputPictureFile, outputPictureFile, false, function (result) {
                            if (!result) {
                                logs.push({
                                    uri: handledMovie.API.AlloCine.poster.href,
                                    error: true
                                });
                            } else {
                                console.info(self.constructor.name + ' [batchMoviePictures] done: ' + index + '/' + handledMovies.length);
                                logs.push(result);
                                handledPictures++;

                                if (index === (handledMovies.length - 1)) { // KO
                                    if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                                        var response = {
                                            success: true,
                                            handledPictures: handledPictures,
                                            logs: logs
                                        };
                                        callbackFn.call(self, response);
                                    }
                                }
                            }

                        }, function (error) {
                            console.error(self.constructor.name + ' [batchMoviePictures] resizePictureFile error: ' + error);
                        });
                    }
                },
                        function (error) {
                            console.error(self.constructor.name + ' [batchMoviePictures] downloadFile error: ' + error);
                        });

            });
        });

    };

    /**
     * Lance le batch de traitement des affiches de films
     * NB: utilise async
     * - utiliser méthode dans storeMovie en passant en param un array de movies
     * @returns {void}
     */
    this.asyncBatchMoviePictures = function (callbackFn) {
        console.info(this.constructor.name + ' [asyncBatchMoviePictures]');

        const async = require("async");

        let self = this;
        let fileName, inputPictureFile, outputPictureFile;
        let logs = [];

        let handledMovies = [];
        let handledPictures = 0;

        self.getAllMovies(function (movies) {

            movies.forEach(function (movie) {
                if (movie.API && movie.API.AlloCine && movie.API.AlloCine.poster) {
                    handledMovies.push(movie);
                }
            });

            // https://caolan.github.io/async/docs.html#eachOf
            // 1st para in async.each() is the array of items
            async.eachOf(handledMovies,
                    // 2nd param is the function that each item is passed to
                            function (handledMovie, key, callback) {

                                console.log(self.constructor.name + ' [asyncBatchMoviePictures] async key: ', key);

                                // télécharge le fichier
                                self.downloadFile(handledMovie.API.AlloCine.poster.href, function (result) {
                                    if (result.dest) {

                                        // redimensionne l'image
                                        fileName = handledMovie.API.AlloCine.poster.href.split("/").pop();
                                        inputPictureFile = result.dest;
                                        outputPictureFile = __dirname + "\\" + self.getCONFIG().RESIZED_PICTURES_DIR + "\\" + fileName;

                                        self.resizePictureFile(inputPictureFile, outputPictureFile, false, function (result) {

                                            if (!result) {
                                                console.error(self.constructor.name + ' [asyncBatchMoviePictures] failed: ' + key + '/' + handledMovies.length);
                                                logs.push({
                                                    uri: handledMovie.API.AlloCine.poster.href,
                                                    error: true
                                                });
                                            } else {
                                                console.info(self.constructor.name + ' [asyncBatchMoviePictures] done: ' + key + '/' + handledMovies.length);
                                                logs.push(result);
                                                handledPictures++;
                                            }
                                        }, function (error) {
                                            console.error(self.constructor.name + ' [asyncBatchMoviePictures] resizePictureFile error: ', error);
                                        });
                                    }
                                }, function (error) {
                                    console.error(self.constructor.name + ' [asyncBatchMoviePictures] downloadFile error: ', error);
                                });
                                callback();
                            },
                            // 3rd param is the function to call when everything's done
                                    function (error) {
                                        if (error) {
                                            console.error(self.constructor.name + ' [asyncBatchMoviePictures] error: ' + error);
                                        } else {    // All tasks are done now
                                            console.log(self.constructor.name + ' [asyncBatchMoviePictures] All tasks are done now ! ');

                                            if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                                                var response = {
                                                    success: true,
                                                    handledPictures: handledPictures,
                                                    logs: logs
                                                };
                                                callbackFn.call(self, response);
                                            }
                                        }
                                        //callback(err);
                                    }
                            );
                        });

            };

    this.asyncTest = function (callbackFn) {
        console.info(this.constructor.name + ' [asyncTest]');

        const async = require("async");
        let self = this;

        let files = ["journeys3.json", "stop_schedules.json", "journeys2.json", "journeys.json"];
        let inputDir = __dirname + "/__tests/";
        let outputDir = __dirname + "/__tests/outputs/";
        let json;
        let jsons = {};

        let outputFile;
        let response = {};

        async.eachOf(files, (value, key, callback) => {
            console.log(self.constructor.name + ' [asyncTest] : json ' + key);

            // 1er appel asynchrone
            fs.readFile(inputDir + value, "utf8", (error, data) => {
                console.log(self.constructor.name + ' [asyncTest] : json ' + key + ' start reading !');

                if (error) {
                    console.error(self.constructor.name + ' [asyncTest] : json ' + key + ' read error !', error);
                    return callback(error);
                }
                try {
                    json = JSON.parse(data);
                    if (typeof (jsons[key]) === "undefined")
                        jsons[key] = {};
                    jsons[key]['keys'] = Object.keys(json);
                    console.log(self.constructor.name + ' [asyncTest] : json ' + key + ' parsed !');

                    // 2ème appel asynchrone > pas pris en compte dans les logs ....
                    outputFile = outputDir + value;
                    fs.writeFile(outputFile, jsons[key], function (error) {
                        console.log(self.constructor.name + ' [asyncTest] : json ' + key + ' start writing !', outputFile);
                        if (error) {
                            console.error(self.constructor.name + ' [asyncTest] : json ' + key + ' writing error !', error);
                            return callback(error);
                        } else {
                            console.log(self.constructor.name + ' [asyncTest] : json ' + key + ' created !');
                            jsons[key]['output'] = outputFile;
                        }
                    });

                } catch (error) {
                    console.error(self.constructor.name + ' [asyncTest] : json ' + key + ' : parsing error !', error);
                    return callback(error);
                }
                callback();
            });
        }, error => {   // erreur remontée par l'appel asynchrone précédent
            if (error) {
                console.error(self.constructor.name + ' [asyncTest] : json  callback error !', error.message);
                response = {
                    success: false,
                    error: error.message
                };
            } else {
                // configs is now a map of JSON data
                console.log(self.constructor.name + ' [asyncTest] : json all parsed !');
                response = {
                    success: true,
                    jsons: jsons
                };
            }

            if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                callbackFn.call(self, response);
            }
        });
    };

    this.asyncTest2 = function (callbackFn) {
        console.info(this.constructor.name + ' [asyncTest2]');

        const async = require("async");
        let self = this;

        let files = ["journeys3.json", "stop_schedules.json", "journeys2.json", "journeys.json"];
        let inputDir = __dirname + "/__tests/";
        let outputDir = __dirname + "/__tests/outputs/";
        let json;
        let jsons = {};

        let outputFile;
        let response = {};

        let readFn = function (key, value, callback) {

            fs.readFile(inputDir + value, "utf8", (error, data) => {
                console.log(self.constructor.name + ' [asyncTest2] readFn : json ' + key + ' start reading !');

                if (error) {
                    console.error(self.constructor.name + ' [asyncTest2] readFn : json ' + key + ' read error !', error);
                    callback(error);
                }

                try {
                    json = JSON.parse(data);
                    if (typeof (jsons[key]) === "undefined")
                        jsons[key] = {};
                    jsons[key]['keys'] = Object.keys(json);
                    console.log(self.constructor.name + ' [asyncTest2] readFn : json ' + key + ' parsed !');
                    callback(null, key, value);

                } catch (error) {
                    console.error(self.constructor.name + ' [asyncTest2] readFn : json ' + key + ' : parsing error !', error);
                    callback(error);
                }
            });
        };

        let writeFn = function (key, value, callback) {

            outputFile = outputDir + value;
            fs.writeFile(outputFile, jsons[key], function (error) {
                console.log(self.constructor.name + ' [asyncTest2] writeFn : json ' + key + ' start writing !', outputFile);
                if (error) {
                    console.error(self.constructor.name + ' [asyncTest2] writeFn : json ' + key + ' writing error !', error);
                    callback(error);
                } else {
                    console.log(self.constructor.name + ' [asyncTest2] writeFn : json ' + key + ' created !');
                    jsons[key]['output'] = outputFile;
                    callback(null, key, outputFile);
                }
            });
        };

        async.waterfall([
            // Lecture des fichiers
            function (callback) {
                async.map(files, readFn, callback);
            },

            // Écriture de chaque fichier final 
            function (key, value, callback) {
                writeFn(key, value, callback);
            },

            function () {
                console.log('OK');
            }
        ],
                // Erreur
                function (error) {
                    console.log('FAIL: ' + error.message);
                });

            };

    /**
     * Initialise le fichier json des films sauvegardés
     * @param {fn} callbackFn
     * @returns {void}
     */
    this.initJsonMovies = function (callbackFn) {
        console.info(this.constructor.name + ' [' + Object.keys(this).toString() + ']');

        let self = this;
        let response = {};
        let str = JSON.stringify([]);

        fs.writeFile(self.getCONFIG().EXPORTS_MOVIES_JSON_FILE, str, (err) => {
            if (err)
                throw err;

            console.log('server [initJsonMovies] ' + self.getCONFIG().EXPORTS_MOVIES_JSON_FILE + ' initialized !');

            response = {
                success: true,
                message: self.getCONFIG().EXPORTS_MOVIES_JSON_FILE + ' initialized !'
            };
            if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                callbackFn.call(this, response);
            }
        });
    };

    /**
     * Récupère et stocke un obj film après un appel à l'API AlloCine
     * @param {obj} movie
     * @param {fn} callbackFn
     * @returns {obj} 
     * https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
     */
    this.storeMovie = function (movie, callbackFn) {
        console.info(this.constructor.name + ' [' + Object.keys(this).toString() + ']', movie);

        let self = this;
        let response = {};

        // on vérifie que le film n'est pas déjà présent dans le JSON
        fs.readFile(self.getCONFIG().EXPORTS_MOVIES_JSON_FILE, 'utf8', function (error, data) {
            if (error)
                throw error;

            let movies = JSON.parse(data);
            console.log('server [storeMovie] movies:', movies);

            let movieFound = false;
            movies.forEach(function (m) {
                if (parseInt(m.API['AlloCine'].code) === parseInt(movie.API['AlloCine'].code)) {
                    movieFound = true;
                }
            });

            if (movieFound) {
                response = {
                    success: false,
                    message: "movie " + movie.API['AlloCine'].code + " allready recorded !"
                };

                if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                    callbackFn.call(this, response);
                }
                return;
            } else {

                // on récupère sa fiche complète 
                allocine.api('movie', {code: parseInt(movie.API['AlloCine'].code)}, function (error, result) {
                    if (error) {
                        console.error('server [storeMovie] Error : ' + error);
                        response = {
                            success: false,
                            message: error
                        };
                        if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                            callbackFn.call(this, response);
                        }
                        return;
                    }
                    console.log('server [storeMovie]', movie.API['AlloCine'].code, result);
                    movie.API['AlloCine'] = result.movie;

                    // on l'ajoute à la liste                        
                    movies.push(movie);
                    console.log('server [storeMovie] movies: ', movies);

                    let str = JSON.stringify(movies);

                    fs.writeFile(self.getCONFIG().EXPORTS_MOVIES_JSON_FILE, str, (err) => {
                        if (err)
                            throw err;

                        console.log('server [storeMovie] movies saved !');

                        // on renvoie la liste des films màj
                        self.getAllMovies(function (handledMovies) {

                            response = {
                                success: true,
                                message: "movie " + movie.API['AlloCine'].code + " added !",
                                movies: handledMovies,
                                movieCode: movie.API['AlloCine'].code
                            };
                            if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                                callbackFn.call(this, response);
                            }
                            return;
                        });

                    });

                });

            }
        });


    };
};

module.exports = new HomeMoviesAPI();


