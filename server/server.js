if (Meteor.isServer) {
   
  Meteor.publish('datasets', function(){
    return Datasets.find();
  });
  
  Meteor.publish('tweets', function(dataset){
    
    console.log('Publishing: ' + dataset);
    
    return Tweets.find({ dataset: dataset });
  });
   
  
  Meteor.startup(function () {
    
    var datasets = Datasets.find().fetch();
      
    console.log('INITIALIZE WITH ' + datasets[0].name);
    
    twitterConnection(datasets[0].name);
    
  });
  
    
  function twitterConnection(db) { 
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
        'track': db
    }, function(stream) {
        stream.on('data', function(data) {
          
          Fiber( function() {
                
//            fs.writeFile("/home/german/Projects/twenalizer2/tweets.log", "\n");
//            fs.writeFile("/home/german/Projects/twenalizer2/tweets.log", JSON.stringify(data)); 
                        
            if (data.coordinates !== null /*|| data.user.location != ''*/) {
              
              console.log('TWEET RECEIVED VALID');
              
              data.created_at_date = new Date(data.created_at);
              data.created_at_iso = data.created_at_date.toISOString();
              data.created_at_stamp = Date.parse(data.created_at);
              
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
}