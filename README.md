Watch the animation
---------
[Yakko's Nations of the World](http://factormystic.net/utils/data-vis/yakkos-nations-of-the-world/)



Build Log
---------

When I concieved this project, I knew that I basically wanted to built a rotating globe that would target each location as Yakko sung its name, and since I was already familiar with D3 and knew that it could produce maps, it was the obvious choice to construct the chart. I also knew that I would want to at least show the name of the country as it was targetted, and possibly add some facts or commentary about that country and the song played. It'd also need to be synchronized with the song in order to make sense.

I'd not yet created a map with D3, or done a project synchronized with music, so there were some considerable unknowns to this project, so I broke down it down into a series of steps. The majority of the work was completed over one weekend, but I spent about a week of casual evening work tweaking the timings and adding some polish.

* Step 1
  * Problem
      * Figure out how to execute code on custom timings
      * Even though the song has a 'beat', only running code on the beat is insufficient to time the animations precisely
      * if we can run code on custom timings, then we should be able to handcraft the timings for when to display things for each country
  * Solution
      * d3.time.parse can turn a H:M:S string into a js Date object. I wrote down the timings in `'H:M:S': 'Country'` format as key/value pairs in a separate javascript object. Then we should be able to simply iterate the keys in that object to know when to do something. This is in `timings.js`.
      * d3.timer provides an efficient way to schedule a callback at after a delay, so that could be combined with the country timings to run the code for each handwritten timestamp.
      * Initially I had thought I'd either be able to set up 1 timer callback per country entry, but timer drift was a huge problem right away -- we need code to execute EXACTLY when the timestamp says it should, or otherwise we'd lose sync with the song. I also tried setting only 1 callback at a time, and scheduling the next callback inside of the previous callback -- this drifted as well. The solution that avoided drift was to run a d3.timer callback continuously, then manually check if the current timestamp of the audio (via `audio.currentTime`) had elapsed passed the time of the next timestamp. Then if so, increment the current timestamp to check and target the specified country. This avoided drift by checking the time as often as possible instead of relying on javascript timers to fire callbacks reliably. Javascript timer drift is an irritating problem, see John Resig's posts for more: http://ejohn.org/blog/accuracy-of-javascript-time/ and http://ejohn.org/blog/how-javascript-timers-work/

* Step 2
  * Problem
      * We need to display a map/globe, and preferrably keep the current point fixed and but translate/rotate the map underneath
	
  * Solution
      * I took inspiration from several sources on this, since it's largely been done before:
          * [Mike Bostock's 'World Tour' example works well](http://bl.ocks.org/mbostock/4183330) combined with [Jason Davies' modifications](http://bl.ocks.org/jasondavies/4183701)
  			  * I liked Jason's spherical interpolation better, so I used it (see d3_geo_greatArcInterpolator.js for his implementation)
	  		  * This renders to `canvas` instead of using SVG, so peformance may possibly be slightly better. However, being a canvas which is effectively "immediate mode" drawing, we're responsible for drawing each step of a rotation. This occurs in the function returned by `targetCountry`, which clears the drawing surface, then iterates over each country drawing it in the specified color (gray, highlight green, already-mentioned green). The country and border geometry come right out of topojson, but d3 has a generator for the latitude/longitude lines ("graticule"), which is trivially initialized with `d3.geo.graticule()`... handy!

* Step 3  
    * Problem
        * Kick off per-country targeting & comments

    * Solution
        * This can be done by looking up the country name in the timer callback, and having a separate config file with per-country info (if any). This is `comments.js`.

* Step 4
    * Problem
        * Embed the song on the page
        * Start the animation when the song starts

    * Solution
        * HTML5 audio tag & my own custom play button that triggers the play function on the audio tag
        * `<audio`> also has an event for when it's ended, so we'll set up a callback for that to reset a bit after the song ends

* Step 5
    * All the typing of the song country timing. This took quite a long time. I probably should have figured out how to write this down as a standard subtitle file, then write a standard subtitle file loader, but I didn't think of that until I was almost done. Plus, it probably wouldn't have reduced the typing as I need the timings to be about within 50-100ms to look correct.

* Step 6
    * Problem
        * I needed a better country geometry file. The one I had been using to set things up was the same one in Mike/Jason's examples above, but it doesn't have all the countries Yakko mentions. Obviously world borders have changed since the song came out, but I was still facing oddities, like missing a few real territories like French Guiana (not a country per se but a French Overseas Department, as I learned)
        * Generating my own GEOJson from NaturalEarth's admin 0 subunits gets pretty close, but is still missing some places, for reasons I didn't really understand (like New Zealand)

    * Solution
        * I spent some time poking around, and the simplified 50m map units data ended up being mostly sufficient. I say "mostly" because some regions that Yakko mentions aren't included, and I didn't have enough expertise with manipulating either NaturalEarth's shapefiles or GEOJson to hand pick targets from several datasets, and even if I did some of these places don't exist as logical units any more so I'd still have to come up with some further solution. To solve targeting for the 9 problem regions (San Juan, Czech Republic, Tibet, Sumatra, Yugoslavia, Algiers, Dahomey, Transylvania, Crete), I just picked out replacement regions to target instead. For example, when the code decides it's time to target Yugoslavia, then Serbia, Montenegro, Macedonia, Slovenia, Serbia, Croatia, Kosovo, Bosnia, and Herzegovina get targetted instead. This logic is the first part of the `targetCountry` function.
        * It's not a particularly brilliant solution but it was simple enough and worked so I could move on
        * Ultimately I was amazed how (relatively) easy it is to go from no data to a globe. Mike Bostock's [Let's Make A Map](http://bost.ocks.org/mike/map/) tutorial is a great place to start, along with installing topojson and experimenting with the parameters. Nate Kelso's [Natural Earth](http://www.naturalearthdata.com/) datasets are and invaluable resource that makes getting started very simple.
        * The topojson file I finally ended up using is `topojson_sp05_fnone_ne_50m_admin_0_map_units.json`

* Step 7
    * Finally, set this up on my website with using a layout and stylesheets from previous visualizations, write the description text, set up comments and so forth.
    * Commit & the source
    * Write this build log!
