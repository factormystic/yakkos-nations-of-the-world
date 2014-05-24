var d3_geo_greatArcInterpolator = function() {
	var d3_radians = Math.PI / 180;

	var x0, y0, cy0, sy0, kx0, ky0,
	x1, y1, cy1, sy1, kx1, ky1,
	d,
	k;

	function interpolate(t) {
		var B = Math.sin(t *= d) * k,
		A = Math.sin(d - t) * k,
		x = A * kx0 + B * kx1,
		y = A * ky0 + B * ky1,
		z = A * sy0 + B * sy1;
		return [
		Math.atan2(y, x) / d3_radians,
		Math.atan2(z, Math.sqrt(x * x + y * y)) / d3_radians
		];
	}

	interpolate.distance = function() {
		if (d == null) k = 1 / Math.sin(d = Math.acos(Math.max(-1, Math.min(1, sy0 * sy1 + cy0 * cy1 * Math.cos(x1 - x0)))));
		return d;
	};

	interpolate.source = function(_) {
		var cx0 = Math.cos(x0 = _[0] * d3_radians),
		sx0 = Math.sin(x0);
		cy0 = Math.cos(y0 = _[1] * d3_radians);
		sy0 = Math.sin(y0);
		kx0 = cy0 * cx0;
		ky0 = cy0 * sx0;
		d = null;
		return interpolate;
	};

	interpolate.target = function(_) {
		var cx1 = Math.cos(x1 = _[0] * d3_radians),
		sx1 = Math.sin(x1);
		cy1 = Math.cos(y1 = _[1] * d3_radians);
		sy1 = Math.sin(y1);
		kx1 = cy1 * cx1;
		ky1 = cy1 * sx1;
		d = null;
		return interpolate;
	};

	return interpolate;
};
