if (Meteor.isClient) {

  Meteor.subscribe('tweets');
  
  Template.tweets.helpers({
    tweets: function() {
      return Tweets.find();
    }
  });
  
  var RealWidth = 0
    , circle = d3.geo.circle().angle(90)
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
    , lat_tz = null
    , svg = null;
  
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
  
    resizeGraph();
    
    projection = d3.geo.mercator()
        .scale(135 * height / 847)
        .translate([width / 2, height / 2]);
    
    path = d3.geo.path().projection(projection);
    
    lat_tz = d3.range(-180,180,15).map(function (lat){
        var tz = Math.floor(lat / 15)+1;
        var from = projection([lat,0]);
        var to = projection([lat+15,0]);
        return {
            tz: tz,
            latitude: lat,
            width: to[0] - from[0],
            x: from[0]
        };
    });
    d3.json("world.json", function(error, world) {
        svg.append("path")
            .classed('world', true)
            .datum( topojson.feature(world, world.objects.land) )
            .attr("d", path);
    
        var night = svg.append("path")
          .attr("class", "night")
          .attr("d", path);
    
        redraw();
        setInterval(redraw, 5 * 60 * 1000);
    
        function redraw() {
            night.datum(circle.origin(antipode(solarPosition(new Date)))).attr("d", path);
        }
        
        if (! self.handle) {
          self.handle = Deps.autorun(function () {
      
            renderData();
              
         });
        }
        
    });
    
    window.onresize = resizeGraph;
 
  
  };
  
  
  
  function resizeGraph(){
      realWidth = document.body.clientWidth;
      width = realWidth - 420;
      height = width;
  
      if (width < 420)
      {
          width = realWidth;
          height = width;
      }
      else
      {
          height = width;		
      }
  
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
      
      radio = width * 0.7 / 100;
  }
  
  function renderData()
  {  
      var circles = svg.selectAll("circle").data(Tweets.find().fetch(), function (tweet) { return tweet._id; });
  
      var timeLimit = new Date();
      var timeLimit1 = (new Date()).setMinutes(timeLimit.getMinutes() - 20);
      var timeLimit2 = (new Date()).setMinutes(timeLimit.getMinutes() - 40);
      var timeLimit3 = (new Date()).setMinutes(timeLimit.getMinutes() - 60);
      var timeLimit4 = (new Date()).setMinutes(timeLimit.getMinutes() - 80);
      var timeLimit5 = (new Date()).setMinutes(timeLimit.getMinutes() - 100);
      var timeLimit6 = (new Date()).setMinutes(timeLimit.getMinutes() - 120);
  
      circles.enter().append("circle")
          .attr("fill", "rgb(255,0,0)")
          .attr("r", 0)
          .transition()
            .attr("r", radio * 2)
            .transition()
              .attr("r", radio)
              .attr("fill", "rgb(255,140,0)");
  
      circles.exit().transition()
          .attr("r", 0)
          .remove();
  
      circles
          .attr("cx", function(d) {
            d.position = projection(d.coordinates.coordinates);
            return d.position[0];
          })
          .attr("cy", function(d) { return d.position[1]; })
          .attr("fill-opacity", function(t){          
              if (t.created_at_date < timeLimit6) return 0.1;
              if (t.created_at_date < timeLimit5) return 0.2;
              if (t.created_at_date < timeLimit4) return 0.3;
              if (t.created_at_date < timeLimit3) return 0.5;
              if (t.created_at_date < timeLimit2) return 0.7;
              if (t.created_at_date < timeLimit1) return 0.8;
              return 0.9;
          });
        
  }
  
  // Equations based on NOAA’s Solar Calculator; all angles in radians.
  // http://www.esrl.noaa.gov/gmd/grad/solcalc/
    
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
  
}