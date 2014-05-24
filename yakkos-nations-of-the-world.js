var size = {
	width: 650,
	height: 400,

	padding: 60,
};

// for debugging, it's really really handy to be able to start midway through the list
var initial_country = '';
var current_index = -1;
var audio = document.getElementsByTagName('audio')[0];

var is_paused = false;
var is_ended = false;

// set up list of countries with their scheduled time in milliseconds
var country_list = [];

Object.getOwnPropertyNames(timings).forEach(function(k, _i, all) {
	if (initial_country && timings[k] == initial_country) {
		current_index = _i-1;
	}

	country_list.push({
		relative: d3.time.format('%X:%L').parse(k) - d3.time.format('%X').parse('0:00:00'),
		country_name: timings[k],
		highlight: true,
	});
});


var initial_country_time = 0;
if (initial_country) {
	Object.getOwnPropertyNames(timings).forEach(function(k) {
		if (timings[k] == initial_country && initial_country_time == 0) {
			initial_country_time = d3.time.format('%X:%L').parse(k) - d3.time.format('%X').parse('0:00:00');
		}
	});
}


size.outer_width = size.width + size.padding * 2;
size.outer_height = size.height + size.padding * 2;

var canvas = d3.select('#chart .svg').append('canvas')
	.attr('width', size.outer_width)
	.attr('height', size.outer_height);

var chart = canvas.node()
	.getContext('2d');

var centroid = d3.geo.path()
	.projection(function(d) { return d; })
	.centroid;

var projection = d3.geo.orthographic()
	.scale(250)
	.clipAngle(90)

var path = d3.geo.path()
	.projection(projection)
	.context(chart);

var graticule = d3.geo.graticule()
	.extent([[-180, -90], [180 - .1, 90 - .1]]);

var rotate = d3_geo_greatArcInterpolator();


var start = function(countries, borders) {
	var target_history = [];

	var getMapUnits = function(country_name) {
		// turn the specified country name into one or more map unit objects
		var units = [];

		country_name.split(',').forEach(function(country_name) {
			// the listed country is hopefully coded in the data source as a distinct map unit
			// in which case, no problem
			var match = countries.filter(function(c){ return c.id == country_name })[0]

			if (match) {
				units.push(match);
				return;
			}

			// if it's not, perhaps the listed country name is part of an official title?
			// ex: Tobago => 'Trinidad and Tobago'
			console.info('not sure about:', country_name);

			match = countries.filter(function(c){ return c.id.indexOf(country_name) > -1 })[0];

			if (match) {
				units.push(match);
				return match;
			}

			// perhaps the country we're looking for is coded in the data set as several map units
			// ex: Belgium => Brussels + Walloon + Flemish
			console.warn('could not find:', country_name);

			matches = countries.filter(function(c){ return c.properties.admin.indexOf(country_name) > -1 });

			if (matches.length > 0) {
				matches.forEach(function(m){ units.push(m); });
				return;
			}

			console.error('could not find any map unit that matches', country_name);
		});

		if (!units.length) {
			console.error('no map units:', country_name, units);
		}

		return units;
	};


	var targetCountry = function(country_name, highlight) {
		switch (country_name) {
			case 'San Juan':
				return targetCountry('Puerto Rico', false);
			
			case 'Czech Rep.':
				return targetCountry('Czech Rep.,Slovakia', true);
			
			case 'Tibet':
				return targetCountry('Nepal', false);
			
			case 'Sumatra':
				return targetCountry('Thailand', false);
			
			case 'Yugoslavia':
				return targetCountry('Serbia,Montenegro,Macedonia,Slovenia,Serbia,Croatia,Kosovo,Bosnia,Herzegovina', true);
			
			case 'Algiers':
				return targetCountry('Algeria', false);
			
			case 'Dahomey':
				return targetCountry('Benin', false);
			
			case 'Transylvania':
				return targetCountry('Romania', false);
			
			case 'Crete':
				return targetCountry('Greece', false);
		}

		var units = getMapUnits(country_name);

		var target_point = d3.geo.centroid(units[0]);

		var rotation = projection.rotate();
		rotate.source(rotation)
			.target([-target_point[0], -target_point[1]])
			.distance();

		// this is the tweening function that will get called every 'frame' of the tween
		// since this chart is based on a canvas element, we're responsible for redrawing the chart when anything changes...
		// like transition tween animation.
		// therefore, we'll need to clear the canvas and loop over all the countries to redraw them with the right color
		return function(t) {
			// rotate the underlaying projection accoring to our tween progress
			// todo: figure out why this rotation is NaN sometimes in FF/IE
			var r = rotate(t);
			if (!isNaN(r[0])) {
				projection.rotate(r);
			}

			// targetted country = light green
			// previously targetted country = dark green
			// all others = gray

			chart.clearRect(0, 0, size.outer_width, size.outer_height);

			countries.forEach(function(country) {
				if (highlight && units.indexOf(country) > -1) {
					chart.fillStyle = '#03cc00';
				} else if (target_history.indexOf(country) > -1) {
					chart.fillStyle = '#8ba78b';
				} else {
					chart.fillStyle = '#ddd';
				}
				
				chart.beginPath();
				path(country);
				chart.fill();
			});

			// only paint this country dark green in the future if it was highlighted currently
			if (highlight) {
				units.forEach(function(unit){ target_history.push(unit); });
			}

			// grid lines, country borders, and the circle around the outside of the globe
			chart.strokeStyle = '#888', chart.lineWidth = 0.2, chart.beginPath(), path(graticule()), chart.stroke();
			chart.strokeStyle = '#fff', chart.lineWidth = 0.5, chart.beginPath(), path(borders), chart.stroke();
			chart.strokeStyle = '#888', chart.lineWidth = 1, chart.beginPath(), path({type: 'Sphere'}), chart.stroke();
		};
	};


	var transition = function(country_name, highlight) {
		// reset when we're all done
		if (country_name == 'The End') {
			return;
		}

		d3.transition()
			.duration(350)
			.tween('rotate', function() {
				return targetCountry(country_name || 'United States', highlight || false);
			});

		if (!country_name) {
			return;
		}

		var comment = comments[country_name] || {title: country_name, subtitle: ''};
		comment.title = comment.title || country_name;
		comment.subtitle = comment.subtitle || '';

		var title = d3.select('.commentary').selectAll('.commentary-container')
			.data([comment], function(d){ return d.title; });

		var new_title = title.enter()
			.insert('div', ':first-child')
				.attr('class', 'commentary-container')
				.style({'height': '30px', 'float': 'none'})
				.html(function(d) {
					// if (d.title == 'Cuba') debugger;

					return '<div class="commentary-title" style="float:left">'+ d.title +'</div><div class="commentary-subtitle">'+ d.subtitle +'</div>';
				});

		title.exit()
			.style({'color': '#bbb', 'font-size': '12pt', 'height': '25px'})
			// .transition()
			// .delay(10000)
			// // .duration(500)
			// // 	.style('opacity', 0)
			// 	.remove();

		d3.select('.commentary > .counter')
			.text(current_index+1);
	};

	var audioTimeToMs = function(currentTime) {
		var s = currentTime << 0;
		var ms = ((currentTime * 1000) << 0) - (s * 1000);

		var d = new Date(0);
		d.setSeconds(s);
		d.setMilliseconds(ms);

		return d.getTime();
	};

	var audioTimeToDate = function(currentTime) {
		var s = currentTime << 0;
		var ms = ((currentTime * 1000) << 0) - (s * 1000);

		var d = new Date(0);
		d.setSeconds(s);
		d.setMilliseconds(ms);

		return d;
	};


	var startTimer = function() {
		d3.timer(function() {
			// when the elapsed time has reached the next country, target it
			if (country_list[current_index+1].relative - audioTimeToMs(audio.currentTime) < 0) {
				current_index++;
				transition(country_list[current_index].country_name, country_list[current_index].highlight);
			}

			// if the song is paused, stop the timer
			return is_paused;
		});
	};


	var play_button = d3.select('.play-button');
	play_button.on('click', function(e) {
		play_button.attr('class', 'play-button');
		pause_button.attr('class', 'pause-button active');

		is_paused = false;

		// reset, if we've already played through once
		if (is_ended) {
			is_ended = false;

			initial_country = '';
			initial_country_time = 0;
			current_index = -1;
			target_history = [];

			d3.selectAll('.commentary-container').remove();

			d3.select('.commentary > .counter')
				.text(current_index+1);
		}

		// if we're resuming from a pause, the audio current time is the new base time
		// otherwise, the initial country time (if any)
		audio.currentTime = audio.currentTime > 0 ? audio.currentTime : initial_country_time / 1000;
		startTimer();

		audio.play();
		// audio.volume = 0;

		d3.select('.audio-controls > .warning')
			.text('Enjoy the show...')
			.transition()
			.delay(1000)
				.style('opacity', 0)
				.remove();

		d3.select('.get-ready')
			.transition()
			.delay(500)
				.style('opacity', 0)
				.remove();
	});


	var pause_button = d3.select('.pause-button');
	pause_button.on('click', function() {
		pause_button.attr('class', 'pause-button');
		play_button.attr('class', 'play-button active');

		is_paused = true;
		audio.pause();
	});


	d3.select(audio).on('ended', function(){
		is_ended = true;
		audio.currentTime = 0;

		pause_button.attr('class', 'pause-button');
		play_button.attr('class', 'play-button active');
	});


	// point to default country while the song starts
	transition();
};

// d3.json('topojson_sp05_ne_50m_admin_0_map_units.json', function(error, world) {
// d3.json('topojson_sp30_ne_50m_admin_0_map_units.json', function(error, world) {
d3.json('topojson_sp05_fnone_ne_50m_admin_0_map_units.json', function(error, world) {
	var countries = topojson.feature(world, world.objects['ne_50m_admin_0_map_units']).features;
	var borders = topojson.mesh(world, world.objects['ne_50m_admin_0_map_units'], function(a, b) { return a !== b; });

	start(countries, borders);
});
