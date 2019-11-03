
// https://www.npmjs.com/package/allocine-crawler


const allocine = require('allocine-crawler');

var client = new allocine();

// Return movies list on search
client.get_movies_list('interstellar').then(res => {
    console.log(res);
}).catch(err => {
    console.log(err);
});

// Return information of movie search
client.get_movies_sheets_by_name('interstellar').then(res => {
    console.log(res);
}).catch(err => {
    console.log(err);
});