if (Meteor.isServer) {
  Meteor.publish('tweets', function(){
      return Tweets.find();
  });
  
  Meteor.startup(function () {
  
    console.log('APP INIT');
  
    var Twitter = Meteor.require("twitter");
    var Fiber = Meteor.require('fibers');
    var fs = Meteor.require('fs');


        
    var conf = JSON.parse(Assets.getText('twitter.json'));
        
    var twit = new Twitter({
        consumer_key: conf.consumer.key,
        consumer_secret: conf.consumer.secret,
        access_token_key: conf.access_token.key,
        access_token_secret: conf.access_token.secret
    });
    
    console.log('CONNECTING TWITTER');
        
    twit.stream('statuses/filter', {
        'track': 'Irak'
    }, function(stream) {
        stream.on('data', function(data) {
          
          Fiber( function() {
                
            fs.writeFile("/home/german/Projects/twenalizer2/tweets.log", "\n");
            fs.writeFile("/home/german/Projects/twenalizer2/tweets.log", JSON.stringify(data)); 
                        
            if (data.coordinates !== null /*|| data.user.location != ''*/) {
              
              console.log('TWEET RECEIVED VALID');
              
              Tweets.insert(data);
            }
            else
            {
              //console.log('TWEET RECEIVED INVALID');
            }
            
          }).run();
            
        });
    });

  });
}