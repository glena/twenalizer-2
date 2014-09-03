var circle = d3.geo.circle().angle(90)
  , width = null
  , originalWidth = null
  , height = 0
  , radio = 3
  , π = Math.PI
  , radians = π / 180
  , degrees = 180 / π
  , projection = null
  , svgEl = null
  , path = null
  , svg = null;

/*
  Used to filter the tweets to show in the map. Just the tweets of the last 3
  hours. Need to check, not sure if it is working fine (maybe need to be
  filtered serverside when publishing)
*/
function getFilterSinceTimestamp()
{
  var filter = (new Date());
  filter.setHours(filter.getHours() - 3);
  return filter;
}

function getTweets()
{
  return Tweets.find({
    "created_at_stamp": {
      "$gte": getFilterSinceTimestamp().getTime()
    }
  });
}

/*
  Loads the tweets list
*/
Template.tweets.helpers({
  tweets: function() {
    return getTweets();
  },
  dataset: function() {
    var data = Datasets.find({}, { item: 1, qty: 1 }).fetch();
    return data[0];
  }
});

/*
  D3 helper to move elements on top of the others
*/
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

Template.tweets.rendered = function () {

  var self = this;
  self.node = self.find("svg");

  svgEl = d3.select(self.node);
  svg = svgEl.append('g');

  /*
    Size the graph to fit
  */
  resizeGraph();

  /*
    Initialize the projection. We will user mercator, not the best (didn't
    respect the real proportions but good enough to show the tweets in the best
    way).

    The scale constants is some magic numbers to calculate the width (based on
    the topojson ratio).
  */
  projection = d3.geo.mercator()
      .scale(135 * height / 847)
      .translate([width / 2, height / 2]);

  path = d3.geo.path().projection(projection);

  d3.json("world.json", function(error, world) {

      /*
        Loads the world topojson and create the path
      */
      svg.append("path")
          .classed('world', true)
          .datum( topojson.feature(world, world.objects.land) )
          .attr("d", path);

      /*
        this is the path that shows the night over the globe
      */
      var night = svg.append("path")
        .attr("class", "night")
        .attr("d", path);

      /*
        Draw the night and sets an interval to update the night position over
        time.
      */
      redraw();
      setInterval(redraw, 5 * 60 * 1000);

      function redraw() {
          night.datum(circle
                        .origin(antipode(solarPosition(new Date))))
              .attr("d", path);
      }

      /*
        Loads the data on the map and updates it when it changes
      */
      if (! self.handle) {
        self.handle = Deps.autorun(function () {

          renderData(getTweets().fetch());

          //d3.select(window)
          svg.on("mousemove", mousemove);

       });
      }

  });

  /*
    when the window size changes, will update the graph size to ensure
    responsiveness
  */
  window.onresize = resizeGraph;
};

function mousemove() {
  d3.event.preventDefault();

  var position = d3.mouse(svg.node());
  //var geoPosition = projection.invert(position);

  var searchRadius = 30;

  var nearTweets = d3.selectAll('circle.tweet').filter(function(tweet) {
      return (Math.abs(tweet.position[0] - position[0]) < searchRadius &&
          Math.abs(tweet.position[1] - position[1]) < searchRadius);
  });

  svg.selectAll('text.tweet')
      .attr('x',100)
      .attr('y',50)
      .style('visibility',function(tweet){
        var isNear = nearTweets.filter(function(near) { return near.id == tweet.id; });
        return isNear.empty() ? 'hidden' : 'visible';
      });
}


/*
  The first time will calculate the graph size.
  The next time will resize the svg element and scale the content to fit.
*/
function resizeGraph(){

    width = window.innerWidth;
    height = window.innerHeight;

    if (originalWidth === null)
    {
        originalWidth = width;
    }

    svgEl.attr("width", width).attr("height", height);

    if (originalWidth != width)
    {
        var scale = width / originalWidth;
        svg.attr('transform', 'scale('+ scale +')');
    }

    radio = width * 0.5 / 100;
}

/*
  Loads the data from the database and makes the D3 joins to add, update and
  remove the data.
  Also, some time limits to calculate the opacity.
*/
function renderData(data)
{
    svg.selectAll('text')
      .data(data, function (tweet) { return tweet._id; })
        .enter()
          .append('text')
            .attr('class',function(tweet){return 'tweet id_'+tweet.id_str;})
            .style('visibility','hidden')
            .text(function(tweet){return tweet.text;})
            .call(wrap, 500);

    var circles = svg
      .selectAll("circle.tweet")
        .data(data, function (tweet) { return tweet._id; });

    var nowStamp = (new Date()).getTime();

    circles.enter().append("circle")
        .each(function(d){
          /*
            This calculates the position of the circles on the map applying the
            projection. Not sure if it is better to make it here (I think not)
            but I don't like to make a foreach before loading the tweets. Maybe
            add the method to the model, but how to work with the projection
            as long as this is not defined on the server.
          */
          d.position = projection(d.coordinates.coordinates);
        })
        .attr("cx", function(d) { return d.position[0]; })
        .attr("cy", function(d) { return d.position[1]; })

        .classed('tweet', true)
        .attr("fill", "rgb(255,0,0)")
        .attr("r", 0)
        .transition()
          .attr("r", radio * 2)
          .transition()
            .attr("r", radio)
            .attr("fill", "rgb(255,140,0)");

    circles.exit()
        .remove();

    circles
        .attr("fill-opacity", function(t){

            /*
              Calculates the opacity as a percentaje of the age of the tweet over it lifetime (3 hours).
            */

            return 1 - ((nowStamp - t.created_at_stamp) / (180 * 60 * 1000));

        });

}

/*
  Wraps the text to enable multiline text svg elements.
  Code from http://bl.ocks.org/mbostock/7555321
*/
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = text.attr("dy") ? parseFloat(text.attr("dy")) : 0,
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");

    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

/*
  From here it is some kind of black magic.
  This calculates the position and the way that the night is shown and loads the
  path.

  Equations based on NOAA’s Solar Calculator; all angles in radians.
  http://www.esrl.noaa.gov/gmd/grad/solcalc/

  BEGIN OF MAGIC
*/

function antipode(position) {
  return [position[0] + 180, -position[1]];
}

function solarPosition(time) {
  var centuries = (time - Date.UTC(2000, 0, 1, 12)) / 864e5 / 36525, // since J2000
      longitude = (d3.time.day.utc.floor(time) - time) / 864e5 * 360 - 180;
  return [
    longitude - equationOfTime(centuries) * degrees,
    solarDeclination(centuries) * degrees
  ];
}

function equationOfTime(centuries) {
  var e = eccentricityEarthOrbit(centuries),
      m = solarGeometricMeanAnomaly(centuries),
      l = solarGeometricMeanLongitude(centuries),
      y = Math.tan(obliquityCorrection(centuries) / 2);
  y *= y;
  return y * Math.sin(2 * l)
      - 2 * e * Math.sin(m)
      + 4 * e * y * Math.sin(m) * Math.cos(2 * l)
      - 0.5 * y * y * Math.sin(4 * l)
      - 1.25 * e * e * Math.sin(2 * m);
}

function solarDeclination(centuries) {
  return Math.asin(Math.sin(obliquityCorrection(centuries)) * Math.sin(solarApparentLongitude(centuries)));
}

function solarApparentLongitude(centuries) {
  return solarTrueLongitude(centuries) - (0.00569 + 0.00478 * Math.sin((125.04 - 1934.136 * centuries) * radians)) * radians;
}

function solarTrueLongitude(centuries) {
  return solarGeometricMeanLongitude(centuries) + solarEquationOfCenter(centuries);
}

function solarGeometricMeanAnomaly(centuries) {
  return (357.52911 + centuries * (35999.05029 - 0.0001537 * centuries)) * radians;
}

function solarGeometricMeanLongitude(centuries) {
  var l = (280.46646 + centuries * (36000.76983 + centuries * 0.0003032)) % 360;
  return (l < 0 ? l + 360 : l) / 180 * π;
}

function solarEquationOfCenter(centuries) {
  var m = solarGeometricMeanAnomaly(centuries);
  return (Math.sin(m) * (1.914602 - centuries * (0.004817 + 0.000014 * centuries))
      + Math.sin(m + m) * (0.019993 - 0.000101 * centuries)
      + Math.sin(m + m + m) * 0.000289) * radians;
}

function obliquityCorrection(centuries) {
  return meanObliquityOfEcliptic(centuries) + 0.00256 * Math.cos((125.04 - 1934.136 * centuries) * radians) * radians;
}

function meanObliquityOfEcliptic(centuries) {
  return (23 + (26 + (21.448 - centuries * (46.8150 + centuries * (0.00059 - centuries * 0.001813))) / 60) / 60) * radians;
}

function eccentricityEarthOrbit(centuries) {
  return 0.016708634 - centuries * (0.000042037 + 0.0000001267 * centuries);
}
/* END OF MAGIC */
