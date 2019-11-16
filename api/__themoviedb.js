
/*
	https://www.themoviedb.org/faq/api
	https://www.themoviedb.org/documentation/api

	https://www.npmjs.com/package/@leonardocabeza/the-movie-db
	https://github.com/leocabeza/the-movie-db/tree/0acdd583d0ce77b2fd94ab460dd46fbd14a1ed4c/examples

	https://github.com/leocabeza/the-movie-db/blob/HEAD/docs/v3-api.md
*/

const { v3, v4 } = require('@leonardocabeza/the-movie-db');

// You can read the FAQ on how to get a token at:
// https://www.themoviedb.org/faq/api?language=en-US 

// For v3 endpoints (https://developers.themoviedb.org/3):
const v3ApiKey = 'd3a8eb1865797e8962707f26bbdbbb88';

// For v4 endpoints (https://developers.themoviedb.org/4):
const v4ApiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkM2E4ZWIxODY1Nzk3ZTg5NjI3MDdmMjZiYmRiYmI4OCIsInN1YiI6IjVkYzdlNmYyZmUwNzdhMDAxNjUxNTJiMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.TEb-76Qvwcrt-LjPkzBwU1LUwrMmQ9wC6G4RQf1UOwI';
const userToken = 'AN_USER_ACCESS_TOKEN';
const accountId = 'AN_ACCOUNT_ID';

const v3Client = v3(v3ApiKey);

/*v3Client.movie.popular()
  .then((data) => {
    console.log('popular movies: ', data);
  })
  .catch((error) => {
    console.log('error: ', error);
  });*/

  //console.log(v3Client);
  console.log(v3Client.movie);

  // config
 v3Client.configuration.api()
  .then((data) => {
    console.log('-- configuration api: ', data);
  })
  .catch((error) => {
    console.log('error: ', error);
  });

/*

Images

ex: http://image.tmdb.org/t/p/w342/bXUK375s7l2sxJnddFGg3LCH8Hm.jpg

base_url: 'http://image.tmdb.org/t/p/',
  secure_base_url: 'https://image.tmdb.org/t/p/',
  backdrop_sizes: [ 'w300', 'w780', 'w1280', 'original' ]
  logo_sizes: [ 'w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'],
  poster_sizes:
   [ 'w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
  profile_sizes: [ 'w45', 'w185', 'h632', 'original' ],
  still_sizes: [ 'w92', 'w185', 'w300', 'original' ] },
*/

 // search by keywords
 /*v3Client.search.keywords({
	//options: {
  		query: 'Stoker'
  		//name: 'Toxic Avenger'
	//}
  })
  .then((data) => {
    console.log('-- keywords search results: ', data);
  })
  .catch((error) => {
    console.log('error: ', error);
  });*/

 // search by keywords
//  v3Client.search.movies({
//   		query: 'Un Coeur En Hiver',	// 48150,  imdb_id: 'tt0105682'
//   		language: 'fr'
//   })
//   .then((data) => {
//     console.log('-- keywords search results: ', data);
//   })
//   .catch((error) => {
//     console.log('error: ', error);
//   });

  // search by id
 v3Client.movie.details(48150, {language: 'fr'})	//  453405,  118043
  .then((data) => {
    console.log('-- movie details: ', data);
  })
  .catch((error) => {
    console.log('error: ', error);
  });

//const v4Client = v4(v4ApiKey);

/*v4Client.account.favoriteMovies(userToken, accountId)
  .then((data) => {
    console.log('favorite movies: ', data);
  })
  .catch((error) => {
    console.log('error: ', error);
  });*/
