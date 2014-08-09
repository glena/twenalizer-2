if (Meteor.isServer) { 
  Meteor.startup(function () {
  
    console.log('APP INIT');
  
    var Twitter = Meteor.require("twitter");
    var Fiber = Meteor.require('fibers');
        
    var conf = JSON.parse(Assets.getText('twitter.json'));
        
    var twit = new Twitter({
        consumer_key: conf.consumer.key,
        consumer_secret: conf.consumer.secret,
        access_token_key: conf.access_token.key,
        access_token_secret: conf.access_token.secret
    });
    
    console.log('CONNECTING TWITTER');
        
    twit.stream('statuses/filter', {
        'track': 'Pintos'
    }, function(stream) {
        stream.on('data', function(data) {
          
          Fiber( function() {
            console.log('TWEET RECEIVED');
            
            if (data.coordinates !== null || data.user.location != '') {
              Tweets.insert(data);
            }
            
          }).run();
            
        });
    });

  });
}