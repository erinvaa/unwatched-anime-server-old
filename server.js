const express = require('express');
const request = require('request');

const app = express();

var startTimeMap = {};

app.listen(8000, () => {
  console.log('Server started!');
  loadAnimeStartTimes();
});

app.get('/', (req, res) => res.send('Hello World!'));

app.route('/api/:user/watching').get((req, res) => {
  const username = req.params['user'];

  const malUrl1 = 'https://myanimelist.net/animelist/'
  const malUrl2 = '/load.json?offset=0&status=1&order=1'

  console.log("Got request for user watching", username);

  url = malUrl1 + username + malUrl2

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
const animeId = 'anime_id'

// One week in seconds
const oneWeek = 60*60*24*7

function addAiredEpisodeCount(data) {
  var anime;
  var startDate, malId;
  var millisecondsAiring;
  var currentTime = new Date().getTime() / 1000;
  for (var i = 0; i < data.length; i++) {
    anime = data[i];
    if (anime[animeAiringStatus] == 1) {
      // Currently airing anime. Most of logic is done here.
      // startDate = Date.parse(anime[animeStartDate])
      malId = anime[animeId];
      startDate = startTimeMap[malId];
      millisecondsAiring = currentTime - startDate;
      anime[airedEpisodesKey] = parseInt(millisecondsAiring / oneWeek) + 1;
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

const senpaiApiUrl = 'http://www.senpai.moe/export.php?type=json&src=raw'

const malIdKey = 'MALID'
const airdateKey = 'airdate_u'

function loadAnimeStartTimes() {
  var map = startTimeMap;
  request(senpaiApiUrl, function(error, response, html) {
    var jsonObject, malId, airdate;
    if (!error) {
      jsonObject = JSON.parse(html);
      jsonObject.items.forEach((x) => {
	malId = x[malIdKey];
	airdate = x[airdateKey];
	console.log(x.name);

	map[malId] = airdate;
      });
      console.log("\nLoaded start times from Senpai.moe");
    } else {
      console.log(error);
    }
  });
}
