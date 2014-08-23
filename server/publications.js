/*
  We will publish all the datasets (maybe in the future we will need to handle
  deleted datasets)
*/
Meteor.publish('datasets', function(){
  return Datasets.find();
});

/*
  We will publish only the tweets of the dataset selected by the user
*/

Meteor.publish('tweets', function(dataset){

  console.log('Publishing: ' + dataset);

  return Tweets.find({ dataset: dataset });
});
