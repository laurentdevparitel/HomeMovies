const imdb = require('imdb-api');

const API_KEY = "97cd5b44";


// https://www.npmjs.com/package/imdb-api

// http://www.omdbapi.com/
// http://www.omdbapi.com/?i=tt3896198&apikey=97cd5b44

// title
/*imdb.get({name: 'The Toxic Avenger'}, {
	apiKey: API_KEY, timeout: 30000
}).then(console.log).catch(console.log)*/


//  id
//imdb.get({id: 'tt0090190'}, {apiKey: API_KEY}).then(console.log);

// search
imdb.search({
  name: 'Stoker'
  //name: 'Toxic Avenger'
}, {
  apiKey: API_KEY
}).then(console.log).catch(console.log);

// client
/*const cli = new imdb.Client({apiKey: API_KEY});

cli.search({'name': 'The Toxic Avenger'}).then((search) => {
  for (const result of search.results) {
    console.log(result.title);
  }
});*/