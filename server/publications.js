Meteor.publish('datasets', function(){
  return Datasets.find();
});

Meteor.publish('tweets', function(dataset){

  console.log('Publishing: ' + dataset);

  return Tweets.find({ dataset: dataset });
});
