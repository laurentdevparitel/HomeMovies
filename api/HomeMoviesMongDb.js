'use strict';

const MongoClient = require("mongodb").MongoClient;
const assert = require('assert');

/**
 * https://docs.mongodb.com/manual/reference/method/js-collection/
 */
const HomeMoviesMongDb = function () {

    // Connection URL
    this.DB_URL = 'mongodb://localhost:27017';

    // Database Name
    this.DB_NAME = "myHomeMovies";

    // Get the documents collection
    this.getCollection = function (db) {
        return db.collection('movies');
    };
    
    this.client = null;
    this.setClient = function(client){
        this.client = client;
    };
    this.getClient = function(){
        return this.client;
    };

    // Use connect method to connect to the server
    this.getConnection = function (callbackFn) {
        var self = this;

        MongoClient.connect(self.DB_URL, function (error, client) {
            if (error) {
                console.error("HomeMoviesMongDb [getConnection]: " + error);
                throw (error);
            }
            
            self.setClient(client);
            
            // test
            assert.equal(null, error);
            
            console.info("HomeMoviesMongDb [getConnection]: connected successfully to server");

            const db = client.db(self.DB_NAME);
            console.info("HomeMoviesMongDb [getConnection]: connecté à la base de données: " + self.DB_NAME, db);

            if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                callbackFn.call(self, db);
                //client.close();
            }
        });

    };

    this.insertMovies = function (movies, callbackFn) {

        var self = this;
//        var movies = [
//            {a: 1}, {a: 2}, {a: 3}
//        ];

        self.getConnection(function (db) {

            // Insert some documents
            self.getCollection(db).insertMany(movies, function (error, result) {
                if (error) {
                    console.error("HomeMoviesMongDb [insertMovies]: " + error);
                    throw (error);
                }

                // tests
                assert.equal(error, null);
//                assert.equal(3, result.result.n);
//                assert.equal(3, result.ops.length);

                console.log("HomeMoviesMongDb [insertMovies]: inserted "+result.insertedCount+" documents into the collection");
                
                // fermeture de la connexion
                self.getClient().close();
                
                if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                    callbackFn.call(self, result);
                }
            });
        });

    };

    this.updateMovie = function (movie, updatedMovie, callbackFn) {

        var self = this;

//        var movie = {a: 2};
//        var updatedMovie = {$set: {b: 1}};

        self.getConnection(function (db) {

            // Update document where a is 2, set b equal to 1
            self.getCollection(db).updateOne(movie, updatedMovie, function (error, result) {
                if (error) {
                    console.error("HomeMoviesMongDb [updateMovie]: " + error);
                    throw (error);
                }
                // tests
                assert.equal(error, null);
                //assert.equal(1, result.result.n);
                
                console.log("HomeMoviesMongDb [updateMovie]: updated the document with the field a equal to 2");
                
                // fermeture de la connexion
                self.getClient().close();
                
                if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                    callbackFn.call(self, result);
                }
            });
        });
    };

    this.deleteMovie = function (movie, callbackFn) {

        var self = this;

        //var movie = {a: 3};

        self.getConnection(function (db) {

            // Delete document where a is 3
            self.getCollection(db).deleteOne(movie, function (error, result) {
                if (error) {
                    console.error("HomeMoviesMongDb [deleteMovie]: " + error);
                    throw (error);
                }
                // tests
                assert.equal(error, null);
                //assert.equal(1, result.result.n);
                
                console.log("HomeMoviesMongDb [deleteMovie]: removed the document with the field a equal to 3");
                
                // fermeture de la connexion
                self.getClient().close();
                
                if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                    callbackFn.call(self, result);
                }
            });
        });
    };

    this.deleteAllMovies = function (callbackFn) {

        var self = this;

        self.getConnection(function (db) {

            // Delete all documents 
            self.getCollection(db).remove({}, function (error, result) {
                if (error) {
                    console.error("HomeMoviesMongDb [deleteAllMovies]: " + error);
                    throw (error);
                }
                // tests
                assert.equal(error, null);
                //assert.equal(1, result.result.n);
                
                console.log("HomeMoviesMongDb [deleteAllMovies]: removed "+result.result.n+" documents ");
                
                // fermeture de la connexion
                self.getClient().close();
                
                if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                    callbackFn.call(self, result);
                }
            });
        });
    };

    this.getMovies = function (callbackFn) {

        var self = this;

        self.getConnection(function (db) {

            // Find some documents
            self.getCollection(db).find({}).toArray(function (error, results) {
                if (error) {
                    console.error("HomeMoviesMongDb [getMovies]: " + error);
                    throw (error);
                }
                // tests
                assert.equal(error, null);
                
                console.log("HomeMoviesMongDb [getMovies]: found the following records", results);
                
                // fermeture de la connexion
                self.getClient().close();
                
                if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                    callbackFn.call(self, results);
                }
            });
        });
    };
    
    /**
     * Recherche par mot-clé
    // https://stackoverflow.com/questions/13606555/how-to-perform-keyword-query-in-mongodb
    // https://docs.mongodb.com/manual/tutorial/model-data-for-keyword-search/
     * @param {obj} searchPattern
     * @param {fn} callbackFn
     * @returns {obj}
     */
    this.getDbMoviesByKeyWord = function(searchPattern, callbackFn){
        
        var self = this;
        
        self.getConnection(function (db) {

            // Find some documents
            self.getCollection(db).find(searchPattern).toArray(function (error, results) {
                if (error) {
                    console.error("HomeMoviesMongDb [getDbMoviesByKeyWord]: " + error);
                    throw (error);
                }
                // tests
                assert.equal(error, null);
                
                console.log("HomeMoviesMongDb [getDbMoviesByKeyWord]: found the following records", results);
                
                // fermeture de la connexion
                self.getClient().close();
                
                if (typeof (callbackFn) !== "undefined" && typeof (callbackFn) === "function") {
                    callbackFn.call(self, results);
                }
            });
        });
        
    };

};

module.exports = new HomeMoviesMongDb();

