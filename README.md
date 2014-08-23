Twinalizer-2
============

Migration of the first version of twinalizer (twenalizer-ukraine.germanlena.com.ar) to MeteorJS with newer and cooler features!

Technologies
------------

* MeteorJS
* D3.JS
* MongoDB

Details
--------

* Real-time tweets visualization, geolocated on a map.
* First created under vanilla node + socket.io and migrated to Meteor for easy real-time visualizations.
* Store in MongoDB the received tweets to store an historical archive.

Next steps
----------

* Visualization of the archived tweets  within a timeline.
* Multiple tweets streams handler (probably over the same twitter stream).
* Stackoverflow-like votes to let the visitors select which stream to monitor.
* Allow visitors to add new streams to monitor.

Configuration
-------------

Create the /server/lib/environment.js file.
Create an app on twitter (https://dev.twitter.com/apps) and copy your keys on your environment file with the following format:

```
twitter_conf = {
    consumer: {
        key: "YOUR CONSUMER KEY",
        secret: "YOUR CONSUMER SECRET"
    },
    access_token: {
        key: "YOUR APP KET",
        secret: "YOUR APP SECRET"
    }
}
```
Startup
-------

Install Meteor (https://www.meteor.com/)
```
$ curl https://install.meteor.com/ | sh
```

Install Meteorite (http://atmospherejs.com/docs/installing)
```
$ npm install -g meteorite
```

Install dependencies
```
$ mrt update
```

Initialize the server
```
$ mrt
```


[![Analytics](https://ga-beacon.appspot.com/UA-51467836-1/glena/twinalizer-2)](http://germanlena.com.ar)
