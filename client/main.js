/*
  The client will subscribe to the databases, and once it is loaded will
    subscribe to the tweets dataset related to the first one (in the future
    it will need to populate a menu and subscribe to the dataset selected by
    the user)
*/
Meteor.subscribe('datasets', subscribeTweets);

function subscribeTweets()
{
  var data = Datasets.find({}, { item: 1, qty: 1 }).fetch();
  var tweetsSubscriptionHandler = Meteor.subscribe('tweets', data[0].name);
}
