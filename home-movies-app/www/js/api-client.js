'use strict';

/**
 * TODO :
 *
 * - btn refresh > OK
 * - afficher critiques presse > OK
 * (composant accordeon : https://getbootstrap.com/docs/4.0/components/collapse/#accordion-example)
 * - gérer films suppprimés  / visionnés (déplacés dans _OLD) > OK
 * - socket.io pour connaître état connexion avec serveur
 * - serie (regrouper épisodes)
 * - compiler pour tablettes > OK
 * - faire tourner NodeJS sans passer par Putty > OK
 * http://www.web-technology-experts-notes.in/2017/01/how-to-make-nodejs-application-run-permanently.html
 * http://weworkweplay.com/play/raspberry-pi-nodejs/
 *
 * - Installer MongoDb
 * https://zestedesavoir.com/tutoriels/312/debuter-avec-mongodb-pour-node-js/ :
 *
 * - Bonnes pratiques :
 * http://naholyr.fr/2011/06/bonnes-pratiques-asynchrone-javascript-nodejs/
 *
 */

function APIClient() {
    console.info('### APIClient');

    this.SERVER_URL = this.getServerURL();
    //this.SERVER_URL = document.location.hostname === "localhost" ? "http://localhost:8080/" : "http://192.168.0.50:8080/";

    this.movies = [];
    this.movie = {};
    this.movieKey = null;

    this.returnedAPIMovies = {}; // films renvoyés par l'API classés par clé

    this.actionBtn = null;    // btn 'save' cliqué

    this.basicFilters = {
        all: "tout afficher",
        movie: "par film",
        "all-api": "par film possédant une fiche",
        serie: "par série",
        doc: "par documentaire"
    };

    this.CONFIG = {
        MOVIE_API: 'THEMOVIEDB',    // // API recherche utilisée : ALLOCINE, THEMOVIEDB, IMDB
        POSTER_BASE_PATH: 'http://image.tmdb.org/t/p/w342/'
    }
};

APIClient.prototype.getServerURL = function () {
    console.info('APIClient [getServerURL]');
    if (document.location.hostname === "localhost"){  // localhost > app desktop
      return "http://localhost:54321/";
      //return "http://localhost:8080/";
    }
    else if (document.location.port === ""){
      if (document.location.protocol === "file:"){  // Cordova > app mobile
        return "https://evening-river-52675.herokuapp.com/";
      }
      else {  // Heraku > app production
        return document.location.origin + "/";
      }
    }
    else {
      return "http://192.168.0.50:54321/"; // Bananapi
      //return "http://192.168.0.50:8080/"; // Bananapi
      //return "https://evening-river-52675.herokuapp.com/";  // Heraku > production
    }
};

APIClient.prototype.setMovies = function (movies) {
    console.info('APIClient [setMovies]', movies);
    this.movies = movies;
};
APIClient.prototype.getMovies = function () {
    return this.movies;
};
APIClient.prototype.setMovie = function (movie) {
    this.movie = movie;
};
APIClient.prototype.getMovie = function (key) {
    if (typeof (key) !== "undefined") {
        var movie = null;
        this.movies.forEach(function (m) {
            if (parseInt(m.key) === parseInt(key)) {
                movie = m;
            }
        });
        return movie;
    }
    return this.movie;
};
APIClient.prototype.setMovieKey = function (key) {
    console.info('APIClient [setMovieKey]', key);
    this.movieKey = key;
};
APIClient.prototype.getMovieKey = function () {
    return this.movieKey;
};

APIClient.prototype.getBasicFilters = function () {
    return this.basicFilters;
};

APIClient.prototype.findMovie = function (movieCode) {
    console.info('APIClient [findMovie]', movieCode);
    var foundMovie = false;
    this.getMovies().forEach(function (movie) {
        if (movie.API && movie.API.AlloCine && movie.API.AlloCine.code) {
            if (parseInt(movieCode) === parseInt(movie.API.AlloCine.code))
                foundMovie = movie;
        }
    });
    return foundMovie;
};

/**
 * Stockage provisoire des data de chaque film renvoyé par l'API
 * @returns {array}
 */
APIClient.prototype.getReturnedAPIMovies = function () {
    return this.returnedAPIMovies;
};
APIClient.prototype.getReturnedAPIMovie = function (code) {
    return this.returnedAPIMovies[code] !== "undefined" ? this.returnedAPIMovies[code] : null;
};

APIClient.prototype.setActionBtn = function (btn) {
    this.actionBtn = btn;
};
APIClient.prototype.getActionBtn = function () {
    return this.actionBtn;
};


APIClient.prototype.attachEvents = function () {
    console.info('APIClient [attachEvents]');

    var me = this;

    $("#movieSearchForm").submit(function (e) {
        e.preventDefault();

        var keywords = $("#movieKeywords").val();
        me.searchMovie(keywords);
    });

    $("#refreshMovies").on("click", function (e) {
        e.preventDefault();

        me.loadMovies();
    });
};

APIClient.prototype.getFilteredMoviesBy = function (filter) {
    console.info('APIClient [getFilteredMoviesBy]', filter);

    var me = this;
    var filteredMovies = [];

    me.getMovies().forEach(function (movie) {

        if (typeof (movie.serie) === 'string') {
            movie.serie = (movie.serie === 'true') ? true : false;
        }
        if (typeof (movie.doc) === 'string') {
            movie.doc = (movie.doc === 'true') ? true : false;
        }

        switch (filter) {
            case "movie":
                if (!movie.serie && !movie.doc) {
                    filteredMovies.push(movie);
                }
                break;

            case "serie":
                if (movie.serie) {
                    filteredMovies.push(movie);
                }
                break;

            case "doc":
                if (movie.doc) {
                    filteredMovies.push(movie);
                }
                break;
            case "all-api":
                if (typeof (movie.API) !== "undefined") {
                    filteredMovies.push(movie);
                }
                break;
            case "all":
                filteredMovies.push(movie);
                break;

            default:
                if (/^genre:/g.test(filter)){
                    var genre = filter.split(":")[1];
                    if (typeof (movie.API) !== "undefined" && typeof (movie.API.AlloCine) !== "undefined" && typeof (movie.API.AlloCine.genre) !== "undefined") {
                        movie.API.AlloCine.genre.forEach(function(g){
                            if (g["$"].toLowerCase() === genre.toLowerCase()) filteredMovies.push(movie);
                        });
                    }
                }
                break;
        }

    });
    return filteredMovies;
};

/**
 * Charge la liste des films scannés ET ceux trouvés par l'API
 * @returns {void}
 */
APIClient.prototype.loadMovies = function () {
    console.info('APIClient [loadMovies]');

    var me = this;
    var route = me.SERVER_URL + "getAllMovies/";

    var request = $.ajax({
        dataType: "json",
        url: route,
        cache: false,
        beforeSend: function () {
            //console.log('APIClient [loadMovies] beforeSend');
            me.setLoader(true);
        }
//        success: function (data) {
//            console.log('APIClient [loadMovies] success', arguments);
//        },
//        error: function (data) {
//            console.error('APIClient [loadMovies] fail', arguments);
//        },
//        complete: function (data) {
//            console.log('APIClient [loadMovies] complete', arguments);
//        }
    });

    request.done(function (data) {  // success
        console.log('APIClient [loadMovies] done', data);

        // on màj la liste locale
        me.setMovies(data);

        // on l'affiche
        me.refreshMoviesList();
    });

    request.fail(function (xhr, textStatus, errorThrown) { // error
        console.error('APIClient [loadMovies] fail', textStatus);
        if (xhr.readyState === 4) {
            // HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
        } else if (xhr.readyState === 0) {
            // Network error (i.e. connection refused, access denied due to CORS, etc.)
            me.showMessage('Network error', 2);
        } else {
            // something weird is happening
        }
    });
    request.always(function (xhr, textStatus, errorThrown) { // complete
        console.log('APIClient [loadMovies] always', textStatus);
        me.setLoader(false);
    });

};

APIClient.prototype.refreshMoviesList = function (data) {
    console.info('APIClient [refreshMoviesList]', data);

    var me = this;

    var movies = typeof (data) !== "undefined" ? data : me.getMovies();
    var items = [];

    $.each(movies, function (key, val) {
        items.push(me.getMovieItem(val, key));
        //items.push("<li id='" + key + "'>" + val + "</li>");
    });

    // on vide le conteneur
    //$("#movies").fadeOut(function(){
    $("#movies").empty();
    //});

    //$("#movieResults").fadeOut(function(){
    $("#movieResults").empty();
    //});

    // on ajoute les items
    $("<div/>", {
        "class": "list-group",
        html: items.join("")
    }).appendTo($("#movies"));

    // on ajoute les evts associés aux items
    $("div.list-group a").each(function (index) {

        $(this).on("click", function (e) {
            e.preventDefault();

            // Postionne le scroll en haut de page
            document.location.hash = '';
            document.location.hash = 'top';

            var movieCode = $(this).data('movie-code');
            if (movieCode > 0) {  // -- Si film déjà trouvé > on utilise le store local
                //console.log('APIClient [loadMovies] movieCode found:', movieCode);
                var foundMovie = me.findMovie(movieCode);
                if (foundMovie) {
                    var movieElt = me.getAPIMovie(foundMovie.API.AlloCine, false);

                    $("#movieResults").empty();

                    // affichage
                    $("<div/>", {
                        "class": "card-deck",
                        html: movieElt
                    }).prependTo($("#movieResults"));

                    // events
                    me.attachMovieResultsEvents();
                }
            } else {  // -- Sinon, on soumet une requête de recherche par mots-clés

                // Remplit auto le champs de recherche
                me.fillForm($(this).find("h5").text());

                // Màj le film du store en cours
                me.setMovieKey($(this).data('movie-key'));

                // Soumet la recherche
                var keywords = $("#movieKeywords").val();
                me.searchMovie(keywords);
            }

        });
    });
};

APIClient.prototype.getMovieItem = function (movie, key) {

    var me = this;
    var code = (movie.API && movie.API.AlloCine && movie.API.AlloCine.code) ? movie.API.AlloCine.code.toString() : "";
    var successClassName = code.length ? "success" : "";

    var html = '';
    html += '<a href="#" class="list-group-item list-group-item-action flex-column align-items-start ' + successClassName + '" data-movie-key="' + movie.key + '" data-movie-code="' + code + '">\n\
                <div class="d-flex w-100 justify-content-between">\n\
                    <h5 class="mb-1">' + movie.searchName + '</h5>\n\
                    <small>';

    if (code.length) {
        html += getRunTime(movie.API.AlloCine.runtime);
        html += '<br />' + me.getGenres(movie.API.AlloCine.genre) + '<br />';
    }
    html += fileConvertSize(movie.size);
    html += '    </small>\n\
                </div>\n\
                <p class="code">' + code + '</p>\n\
                <small>' + movie.base + '</small>\n\
            </a>';

    return html;
};

/**
 * Remplit le champ de recherche avec les mots clés du film
 * @param {string} value
 * @returns {void}
 */
APIClient.prototype.fillForm = function (value) {
    console.info('APIClient [fillForm]', value);

    $("#movieKeywords").val(value);
};

/**
 * Lance une recherche API par mots-clés ou id
 * @param {string|id} value
 * @returns {void}
 */
APIClient.prototype.searchMovie = function (value) {
    console.info('APIClient [searchMovie]', value);

    var me = this;
    var route;

    if (!isNaN(parseInt(value))) {
        route = me.SERVER_URL + "searchMovieById/" + value;
    } else {
        route = me.SERVER_URL + "searchMovie/" + encodeURIComponent(value);
    }

    var request = $.ajax({
        dataType: "json",
        url: route,
        cache: false,
        beforeSend: function () {
            console.log('APIClient [searchMovie] beforeSend');
            me.setSearchLoader(true);

            $("#movieResults").empty();
        }
    });

    request.done(function (data) {  // success
        console.log('APIClient [searchMovie] done', me.CONFIG.MOVIE_API, data);

        switch (me.CONFIG.MOVIE_API) {

            case "THEMOVIEDB":

                if (typeof(data.id) !== "undefined"){   // recherche par id

                    // affichage complet du film trouvé
                    // TODO: ajouter synopsis + press reviews + genre
                    me.showMovies(data);
                }
                else if (typeof(data.results) !== "undefined" && data.results.length){  // recherche par mots-clés
                    console.log('APIClient [searchMovie] total: ', data.results.length);
    
                    // affiche nbre total de films trouvés
                    $("#totalMovieResults").text(data.results.length);
        
                    // affichage des films trouvés
                    me.showMovies(data.results);
                }
                else {
                    me.showMessage('No result for movie: <b>' + value + '</b>', 3);
                }
            break;

            case "ALLOCINE":

                if (!data.feed) {
                    if (data.movie) {    // recherche par id
        
                        // affichage complet du film trouvé
                        // TODO: ajouter synopsis + press reviews + genre
                        me.showMovies([data.movie]);
                    } else {
                        me.showMessage('No result for movie id #<b>' + value + '</b>', 3);
                    }
                } else if (data.feed.totalResults === 0) {
                    me.showMessage('No result for movie: <b>' + value + '</b>', 3);
                } else {    // recherche par mots-clés
        
                    console.log('APIClient [searchMovie] total: ', data.feed.movie.length);
        
                    // affiche nbre total de films trouvés
                    $("#totalMovieResults").text(data.feed.movie.length);
        
                    // affichage des films trouvés
                    me.showMovies(data.feed.movie);
                }
            break;

            case "IMDB":
                //
            break;
        } 
        
    });
    request.fail(function (xhr, textStatus, errorThrown) { // error
        console.error('APIClient [searchMovie] fail', textStatus);
        if (xhr.readyState === 4) {
            // HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
        } else if (xhr.readyState === 0) {
            // Network error (i.e. connection refused, access denied due to CORS, etc.)
            me.showMessage('Network error', 2);
        } else {
            // something weird is happening
        }
    });
    request.always(function (xhr, textStatus, errorThrown) { // complete
        console.log('APIClient [searchMovie] always', textStatus);
        me.setSearchLoader(false);
    });
};

/**
 * Affiche la liste des films renvoyés par l'API
 * @param {array} movies
 * @returns {void}
 */
APIClient.prototype.showMovies = function (movies) {
    console.info('APIClient [showMovies]', movies);

    var me = this;

    // init
    me.returnedAPIMovies = {};

    var movieElts = [];
    var itemsNberByline = 3;

    movies.forEach(function (movie, index) {
        if (index === 0) {
            movieElts.push(me.getAPIMovie(movie));
        } else if (index % itemsNberByline === 0) {  // nouvelle ligne
            $("<div/>", {
                "class": "card-deck",
                html: movieElts.join("")
            }).appendTo($("#movieResults"));

            movieElts = []; // init
            movieElts.push(me.getAPIMovie(movie));
        } else {
            movieElts.push(me.getAPIMovie(movie));
        }

        // on stocke provisoirement les data de chaque film renvoyé par l'API
        me.returnedAPIMovies[movie.code] = movie;
    });

    if (movieElts.length) {  // s'il en reste, on les affiche
        $("<div/>", {
            "class": "card-deck",
            html: movieElts.join("")
        }).appendTo($("#movieResults"));
    }

// affichage dans un seul "card-deck"

//    var movieElts = [];
//    movies.forEach(function (movie) {
//        movieElts.push(me.getAPIMovie(movie));
//        me.returnedAPIMovies[movie.code] = movie;
//    });
//
//    // affichage dans un "card-deck"
//    $("<div/>", {
//        "class": "card-deck",
//        html: movieElts.join("")
//    }).prependTo($("#movieResults"));

    // events
    me.attachMovieResultsEvents();
};

APIClient.prototype.attachMovieResultsEvents = function () {
    console.info('APIClient [attachMovieResultsEvents]');
    var me = this;

    $("#movieResults a.btn-save").each(function (index) {

        $(this).on("click", function (e) {
            e.preventDefault();

            // On màj la ref du btn
            me.setActionBtn($(this));

            // on stocke le film + code API
            me.storeMovie($(this).data('movie-code'));
        });
    });

    $("#movieResults a.btn-press").each(function (index) {

        $(this).on("click", function (e) {
            e.preventDefault();

            // On màj la ref du btn
            me.setActionBtn($(this));

            // on récupère la liste des critiques via l'API
            me.showPressReviews($(this).data('movie-code'));
        });
    });
};


/**
 * Renvoie la fiche complète d'un film
 * @param {obj} movie
 * @param {boolean} showSaveBtn
 * @returns {String}
 */
APIClient.prototype.getAPIMovie = function (movie, showSaveBtn) {
    console.info('APIClient [getAPIMovie]', movie, showSaveBtn);
    var me = this;

    var showSaveBtn = typeof (showSaveBtn) !== "undefined" ? showSaveBtn : true;
    var actionBtnClassName = showSaveBtn ? "" : "hidden";

    switch(me.CONFIG.MOVIE_API){

        case 'THEMOVIEDB':
            return me.getTHEMOVIEDBMovieCard(movie, showSaveBtn, actionBtnClassName);
        break;

        case 'ALLOCINE':
            return me.getALLOCINEMovieCard(movie, showSaveBtn, actionBtnClassName);
        break;

        case 'IMDB':
            return null;
        break;
    }   
};

APIClient.prototype.getTHEMOVIEDBMovieCard = function(movie, showSaveBtn, actionBtnClassName){
    var me = this;

    var poster = typeof (movie.poster_path) !== "undefined" ? me.CONFIG.POSTER_BASE_PATH + movie.poster_path : "";
    var link = "#";
    var actors = "";
    var directors = "";
    var movieYear = movie.release_date.split("-")[0];

    // if (poster.length){ // on affiche l'image traitée localement pour améliorer les perfs
    //     var fileName = poster.split("/").pop();
    //     poster = 'pictures/resized/'+fileName;
    // }

    var card = '<div class="card">\n\
                    <img class="card-img-top" src="' + poster + '" alt="' + movie.original_title + '" onerror="this.onerror=null; this.src=\'./img/404.png\'; this.className=\'card-img-top img-404\';">\n\
                    <div class="card-body">\n\
                      <h4 class="card-title">' + movie.original_title + '</h4>\n\
                      <p class="card-text">Year: ' + movieYear + '</p>\n\
                    </div>';

    card += '       <ul class="list-group list-group-flush">';

    if (movie.overview && movie.genre_ids) {
        card += '       <li class="list-group-item">' + movie.overview + '</li>\n\
                        <li class="list-group-item">Duration: </li>\n\
                        <li class="list-group-item">Genre(s): ' + me.getGenres(movie.genre_ids) + '</li>';
    }
    card += '           <li class="list-group-item">Actors: ' + actors + '</li>\n\
                        <li class="list-group-item">Directors: ' + directors + '</li>\n\
                    </ul>';

    card += '       <div class="card-footer">\n\
                        <small class="text-muted">Id: ' + movie.id + '</small>\n\
                    </div>';

    card += '      <div class="card-body text-center">\n\
                      <a href="#" class="btn btn-primary btn-press" data-movie-code="' + movie.id + '"><i class="fa fa-align-left"></i> Press</a>\n\
\n\                   <a href="#" class="btn btn-primary btn-save ' + actionBtnClassName + '" data-movie-code="' + movie.id + '"><i class="fa fa-check"></i> Save</a>\n\
                    </div>\n\
                  </div>';

    return card;
}

APIClient.prototype.getALLOCINEMovieCard = function(movie, showSaveBtn, actionBtnClassName){
    var me = this;

    var poster = typeof (movie.poster) !== "undefined" ? movie.poster.href : "";
    var link = typeof (movie.link[0]) !== "undefined" ? movie.link[0].href : "#";
    var actors = typeof (movie.castingShort) !== "undefined" ? movie.castingShort.actors : "";
    var directors = typeof (movie.castingShort) !== "undefined" ? movie.castingShort.directors : "";

    if (poster.length){ // on affiche l'image traitée localement pour améliorer les perfs
        var fileName = poster.split("/").pop();
        poster = 'pictures/resized/'+fileName;
    }

    var card = '<div class="card">\n\
                    <img class="card-img-top" src="' + poster + '" alt="' + movie.originalTitle + '" onerror="this.onerror=null; this.src=\'./img/404.png\'; this.className=\'card-img-top img-404\';">\n\
                    <div class="card-body">\n\
                      <h4 class="card-title">' + movie.originalTitle + '</h4>\n\
                      <p class="card-text">Year: ' + movie.productionYear + '</p>\n\
                    </div>';

    card += '       <ul class="list-group list-group-flush">';

    if (movie.synopsis && movie.runtime && movie.genre) {
        card += '       <li class="list-group-item">' + movie.synopsis + '</li>\n\
                        <li class="list-group-item">Duration: ' + getRunTime(movie.runtime) + '</li>\n\
                        <li class="list-group-item">Genre(s): ' + me.getGenres(movie.genre) + '</li>';
    }
    card += '           <li class="list-group-item">Actors: ' + actors + '</li>\n\
                        <li class="list-group-item">Directors: ' + directors + '</li>\n\
                    </ul>';

    card += '       <div class="card-footer">\n\
                        <small class="text-muted">Code: ' + movie.code + '</small>\n\
                    </div>';

    card += '      <div class="card-body text-center">\n\
                      <a href="' + link + '" target="_blank" class="btn btn-primary"><i class="fa fa-external-link"></i> AlloCine</a>\n\
                      <a href="#" class="btn btn-primary btn-press" data-movie-code="' + movie.code + '"><i class="fa fa-align-left"></i> Press</a>\n\
\n\                   <a href="#" class="btn btn-primary btn-save ' + actionBtnClassName + '" data-movie-code="' + movie.code + '"><i class="fa fa-check"></i> Save</a>\n\
                    </div>\n\
                  </div>';

    return card;
}

APIClient.prototype.getGenres = function (genres) { // TODO : à adapter en fonction de l'API ...
    var str = "";
    genres.forEach(function (item, index) {
        str += item.$;
        str += (index < genres.length - 1) ? ", " : "";
    });
    return str;
};

/**
 * Ajoute une fiche issue de l'API pour un film sélectionné
 * @param {type} movieCodeAlloCine
 * @returns {void}
 */
APIClient.prototype.storeMovie = function (movieCodeAlloCine) {
    console.info('APIClient [storeMovie]', movieCodeAlloCine);

    var me = this;
    var movie = me.getMovie(me.getMovieKey());
    if (!movie) {
        throw new Error('No movie found with key: ' + me.getMovieKey());
        return;
    }

    //delete movie.fileProtected; // NB : les //font pêter le JSON ...
    //movie.codeAlloCine = movieCodeAlloCine;
    movie.API = {
        'AlloCine': me.getReturnedAPIMovie(movieCodeAlloCine)
    };
    console.log('APIClient [storeMovie]', movie, me.getReturnedAPIMovie(movieCodeAlloCine));

    var route = me.SERVER_URL + "storeMovie/";

    var request = $.ajax({
        method: "POST",
        dataType: "json",
        url: route,
        data: movie,
        //data: JSON.stringify(movie),
        beforeSend: function () {
            //console.log('APIClient [storeMovie] beforeSend');
            me.getActionBtn().html("<i class='fa fa-circle-o-notch fa-spin'></i> Saving ...");
        }
    });

    request.done(function (data) {  // success
        console.log('APIClient [storeMovie] done', data);

        me.showMessage(data.message, 1);

        // Passer le btn en OK + disabled
        me.getActionBtn().attr("disabled", "disabled");
        me.getActionBtn().off('click');
        me.getActionBtn().text('Saved');
        me.getActionBtn().addClass("btn-success");

        // On passe le film de la liste en flagué OK
        var elt = $("a.list-group-item[data-movie-key=" + me.getMovieKey() + "]");
        if (elt.length) {
            elt.addClass("success");
            //elt[0].remove();
            elt.data('movie-code', data.movieCode);
            elt.find("p.code").text(data.movieCode);
        }

        // on màj la liste locale
        me.setMovies(data.movies);
    });
    request.fail(function (xhr, textStatus, errorThrown) { // error
        console.error('APIClient [storeMovie] fail', textStatus);
        if (xhr.readyState === 4) {
            // HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
        } else if (xhr.readyState === 0) {
            // Network error (i.e. connection refused, access denied due to CORS, etc.)
            me.showMessage('Network error', 2);
        } else {
            // something weird is happening
        }
    });
    request.always(function (xhr, textStatus, errorThrown) { // complete
        console.log('APIClient [storeMovie] always', textStatus);
        me.setSearchLoader(false);
    });
};

APIClient.prototype.showPressReviews = function (movieCodeAlloCine) {
    console.info('APIClient [showPressReviews]', movieCodeAlloCine);

    var me = this;

    var route = me.SERVER_URL + "searchMovieReviewsById/" + parseInt(movieCodeAlloCine);

    var request = $.ajax({
        method: "GET",
        dataType: "json",
        url: route,
        beforeSend: function () {
            me.getActionBtn().html("<i class='fa fa-circle-o-notch fa-spin'></i> Loading ...");
        }
    });

    request.done(function (data) {  // success
        console.log('APIClient [showPressReviews] done', data);

        me.getActionBtn().text('Done');

        if (data.feed.review) {

            // on màj le contenu de l'accordion
            var htmlReviews = me.getAPIPressReviews(data.feed.review);

            // Update modal content
            var clientModal = $("#clientModal");

            clientModal.find("h5.modal-title").html("Press reviews");
            clientModal.find(".modal-body").html(htmlReviews);

            // Show
            clientModal.modal('show');
        } else {
            me.showMessage("No press review for this movie ...", 3);
        }
    });
    request.fail(function (xhr, textStatus, errorThrown) { // error
        console.error('APIClient [showPressReviews] fail', textStatus);
        if (xhr.readyState === 4) {
            // HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
        } else if (xhr.readyState === 0) {
            // Network error (i.e. connection refused, access denied due to CORS, etc.)
            me.showMessage('Network error', 2);
        } else {
            // something weird is happening
        }
    });
    request.always(function (xhr, textStatus, errorThrown) { // complete
        console.log('APIClient [showPressReviews] always', textStatus);
        me.setSearchLoader(false);
    });
};

APIClient.prototype.getMoviesGenres = function () {
    console.info('APIClient [getMoviesGenres]');

    var me = this;

    var route = me.SERVER_URL + "getMoviesGenres/";

    var request = $.ajax({
        method: "GET",
        dataType: "json",
        url: route,
        beforeSend: function () {
            //
        }
    });

    request.done(function (data) {  // success
        console.log('APIClient [getMoviesGenres] done', data);

        var filterDropDown = $("#dropdown-menu-filter");
        filterDropDown.empty(); // init

        var filters = [];

        for (var filter in me.getBasicFilters()) {
            filters.push({
                key: filter,
                label: me.getBasicFilters()[filter]
            });
        }

        if (data.genres) {
            for (var genre in data.genres) {
                filters.push({
                    key: "genre:"+genre,
                    label: "par genre: "+ genre+" ("+data.genres[genre]+")"
                });
            }
        } else {
            me.showMessage("No genres list available ...", 3);
        }

        // affichage
        filters.forEach(function(filter){
            $("<a/>", {
                "class": "dropdown-item",
                href: "#",
                "data-filter": filter.key,
                html: filter.label
            }).appendTo(filterDropDown);
        });

        // add events
        $("#dropdown-menu-filter a").on("click", function (e) {
            e.preventDefault();
            //console.log($(this).data('filter'));

            var filteredMovies = me.getFilteredMoviesBy($(this).data('filter'));

            me.refreshMoviesList(filteredMovies);
        });
    });
    request.fail(function (xhr, textStatus, errorThrown) { // error
        console.error('APIClient [getMoviesGenres] fail', textStatus);
        if (xhr.readyState === 4) {
            // HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
        } else if (xhr.readyState === 0) {
            // Network error (i.e. connection refused, access denied due to CORS, etc.)
            me.showMessage('Network error', 2);
        } else {
            // something weird is happening
        }
    });
    request.always(function (xhr, textStatus, errorThrown) { // complete
        console.log('APIClient [getMoviesGenres] always', textStatus);
    });
};

/*
 * Renvoie la liste des critiques
 * @param {obj} reviews
 * @returns {String}
 */
APIClient.prototype.getAPIPressReviews = function (reviews) {
    console.info('APIClient [getAPIPressReviews]', reviews);

    var html = '<div id="accordion">';

    reviews.forEach(function (review, index) {

        html += '<div class="card">\n\
                        <div class="card-header" id="heading-' + index + '">\n\
                            <h5 class="mb-0">\n\
                                <button class="btn btn-link collapsed" data-toggle="collapse" data-target="#collapse-' + index + '" aria-expanded="true" aria-controls="collapse-' + index + '">\n\
                                    ' + review.newsSource.name + '\n\
                                </button>\n\
                                <span class="badge badge-secondary">' + review.rating + '</span>\n\
                            </h5>\n\
                        </div>';

        html += '    <div id="collapse-' + index + '" class="collapse" aria-labelledby="heading-' + index + '" data-parent="#accordion">\n\
                            <div class="card-body">\n\
                            ' + review.body + '\n\
                            </div>\n\
                        </div>\n\
                    </div>';
    });

    html += '</div>';

    return html;
};

/**
 * Gère l'affichage du loader du conteneur "movies"
 * @param {boolean} visible
 * @returns {void}
 */
APIClient.prototype.setLoader = function (visible) {
    //console.info('APIClient [setLoader]', visible);

    if (visible) {
        $("#movies").prepend('<div class="spinner"></div>');
    } else {
        $(".spinner").remove();
    }
};

/**
 * Gère l'affichage du loader du btn de recherche
 * @param {boolean} visible
 * @returns {void}
 */
APIClient.prototype.setSearchLoader = function (visible) {
    //console.info('APIClient [setSearchLoader]', visible);

    var button = $("button#load");
    var defaultText = 'Rechercher';

    if (visible) {
        button.html(button.data('loading-text'));
    } else {
        button.html(defaultText);
    }
};

/**
 * Affiche un message dans une modale
 * @param {string} message
 * @param {int} type
 * @returns {void}
 */
APIClient.prototype.showMessage = function (message, type) {
    console.info('APIClient [showMessage]', message, type);

    var title;
    var html;

    switch (type) {
        case 1: // success
            title = message;
            html = '<div class="alert alert-success" role="alert">' + message + '</div>';
            break;

        case 2: // error
            title = message;
            html = '<div class="alert alert-danger" role="alert">' + message + '</div>';
            break;

        case 3: // warning
            title = message;
            html = '<div class="alert alert-warning" role="alert">' + message + '</div>';
            break;
    }

    var clientModal = $("#clientModal");

    // Update content
    clientModal.find("h5.modal-title").html(title);
    clientModal.find(".modal-body").html(html);

    // Show
    clientModal.modal('show');

    if (type === 1) {
        setTimeout(function () {
            clientModal.modal('hide');
        }, 2000);
    }
};

/**
 * Utils
 */
function fileConvertSize(aSize) {
    aSize = Math.abs(parseInt(aSize, 10));
    var def = [[1, 'octets'], [1024, 'ko'], [1024 * 1024, 'Mo'], [1024 * 1024 * 1024, 'Go'], [1024 * 1024 * 1024 * 1024, 'To']];
    for (var i = 0; i < def.length; i++) {
        if (aSize < def[i][0])
            return (aSize / def[i - 1][0]).toFixed(2) + ' ' + def[i - 1][1];
    }
}
function getRunTime(seconds) {
    var date = new Date(null);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8);
}

function removeElt(eltId) {
    var elt = document.getElementById(eltId);
    if (elt)
        elt.parentNode.removeChild(elt);
}

var myAPIClient;

function startApp() {

    $(function () {

        try {

            removeElt('spinnerContainer');
            document.getElementById('app').style.display = 'block';

            myAPIClient = new APIClient();

            myAPIClient.attachEvents();
            myAPIClient.loadMovies();

            myAPIClient.getMoviesGenres();

        } catch (error) {
            console.error(error);
            myAPIClient.showMessage(error, 2);
        }
    });
}


if (!window.cordova) { // desktop
    startApp();
} else {  // device

    document.addEventListener('deviceready', function () {
        console.info("deviceready detected > cordova");

        //document.addEventListener("offline", onOffline, false);
        //document.addEventListener("online", onOnline, false);

        startApp();
    }, false);
}
