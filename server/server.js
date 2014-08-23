/*
Docs:
  Subscribe info:
    http://docs.meteor.com/#meteor_subscribe

  Structure of a meteor project:
    http://stackoverflow.com/questions/10122977/what-are-the-best-practices-for-structuring-a-large-meteor-app-with-many-html-te

  Info about spacebars templating:
    https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md
*/


Meteor.startup(function () {

  /*
    Get the databases to start the stream. Using just the first for now...
  */

  var datasets = Datasets.find().fetch();


  /*
    If it is empty, we are going to use a dummy one (really dummy one...)
  */
  if (datasets.length == 0) {
    Datasets.insert({
      name: 'justin bieber' // just to ensure lots of new tweets, this people is crazy!
    });
  }

  console.log('INITIALIZE WITH ' + datasets[0].name);

  /*
    Comment the following line once that you have enough tweets on the database.
    If the servers restarts many times you will get banned from twitter because of
    the api rate limits for a while (more info here
      https://dev.twitter.com/docs/rate-limiting/1.1)
  */
  twitterConnection(datasets[0].name);

});

/*
  Initialize the streaming
*/
function twitterConnection(db) {
  var Twitter = Meteor.require("twitter");
  var Fiber = Meteor.require('fibers');

  var twit = new Twitter({
      consumer_key: twitter_conf.consumer.key,
      consumer_secret: twitter_conf.consumer.secret,
      access_token_key: twitter_conf.access_token.key,
      access_token_secret: twitter_conf.access_token.secret
  });

  console.log('CONNECTING TWITTER');

  /*
    Connects to the twitter streamind api.
    The track parameter is the text to monitor. Coma separated terms are treated
     as a logical OR and spaces as an AND. For example: "usa ukraine" will look
     for tweets having both words, and "usa, ukraine" will look for tweets
     having only one of them.
    More info here: https://dev.twitter.com/docs/api/1.1/post/statuses/filter
  */
  twit.stream('statuses/filter', {
      'track': db
  }, function(stream) {
      stream.on('data', function(data) {

        Fiber( function() {

          /*
          Just if uncomment this if you want to log tweets on a file
            fs.writeFile("/home/german/Projects/twenalizer2/tweets.log", "\n" + JSON.stringify(data));
          */


          /*
            We are just interested in tweets with geo coordinates. In the future
              we can attempt to get the proximated coordinates using the user
              location and the google maps api.
          */
          if (data.coordinates !== null /*|| data.user.location != ''*/) {

            console.log('TWEET RECEIVED VALID');

            /*
              Different formats to see which one is better to work with MongoDB.
              Seems that the best option is using the stamp.
            */
            data.created_at_date = new Date(data.created_at);
            data.created_at_iso = data.created_at_date.toISOString();
            data.created_at_stamp = Date.parse(data.created_at);

            /*
              We will add to the tweet the dataset that it belongs to be able
                later to filter which one to publish
            */
            data.dataset = db;

            Tweets.insert(data);
          }
          else
          {
            //console.log('TWEET RECEIVED INVALID');
          }

        }).run();

      });
  });
}
