/*

http://docs.meteor.com/#meteor_subscribe


http://stackoverflow.com/questions/10984030/get-meteor-collection-by-name
https://github.com/meteor/meteor/blob/devel/packages/spacebars/README.md
*/

Meteor.subscribe('datasets', subscribeTweets);

function subscribeTweets()
{
  var data = Datasets.find({}, { item: 1, qty: 1 }).fetch();
  var tweetsSubscriptionHandler = Meteor.subscribe('tweets', data[0].name);
}
