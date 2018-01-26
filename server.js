const express = require('express');
const request = require('request');

const app = express();

app.listen(8000, () => {
  console.log('Server started!');
});

app.get('/', (req, res) => res.send('Hello World!'));

app.route('/api/:user/watching').get((req, res) => {
  const username = req.params['user'];

  url = 'https://myanimelist.net/animelist/daphoa/load.json?offset=0&status=1&order=1'

  request(url, function(error, response, html) {
    if (!error) {
      var jsonObject = JSON.parse(html);
      addAiredEpisodeCount(jsonObject);
      res.send(jsonObject);
    } else {
      console.log(error);
    }
  });

});


const airedEpisodesKey = 'anime_aired_episodes' // My own creation
  
const animeAiringStatus = 'anime_airing_status'
const animeNumEpisodes = 'anime_num_episodes'
const animeStartDate = 'anime_start_date_string'

// One week in milliseconds
const oneWeek = 1000*60*60*24*7

function addAiredEpisodeCount(data) {
  var anime;
  var startDate;
  var millisecondsAiring;
  for (var i = 0; i < data.length; i++) {
    anime = data[i];
    if (anime[animeAiringStatus] == 1) {
      // Currently airing anime. Most of logic is done here.
      startDate = Date.parse(anime[animeStartDate])
      millisecondsAiring = new Date().getTime() - startDate;
      anime[airedEpisodesKey] = parseInt(millisecondsAiring / oneWeek) + 1;
      // Note currently this logic doesn't include start time at all; just start date. Eventual plan is to cache data
      // from senpai.moe to learn the exact start time for a show (rather than this terrible estimate)
    }
    if (anime[animeAiringStatus] == 2) {
      // Completed anime; can just assume all episodes are out
      anime[airedEpisodesKey] = anime[animeNumEpisodes]
    }
    if (anime[animeAiringStatus] == 3) {
      // Not yet airing anime; obviously nothing is out yet (probably)
      anime[airedEpisodesKey] = 0;
    }
  }
}
