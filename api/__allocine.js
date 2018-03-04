var allocine = require('allocine-api');

// Recherche de tous les films "spiderman" 
allocine.api('search', {q: 'spiderman', filter: 'movie'}, function (error, results) {
    if (error) {
        console.log('Error : ' + error);
        return;
    }

    console.log('Voici les données retournées par l\'API Allociné:');
    console.log(results);
});

// Informations sur un film particulier 
allocine.api('movie', {code: '143067'}, function (error, result) {
    if (error) {
        console.log('Error : ' + error);
        return;
    }

    console.log('Voici les données retournées par l\'API Allociné:');
    console.log(result);
});