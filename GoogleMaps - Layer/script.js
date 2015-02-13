/**
 * Alexander Karlsson - akl@qlikview.com - Demo & Best Practices
 *
 * Qlik takes no responsbility for any code.
 * Use at your own risk.
 * Do not submerge in water.
 * Do not taunt Happy Fun Ball.
 */

//Constants
var EXTENSION_NAME = 'GoogleMaps - Layer';
var PATH = Qva.Remote + '?public=only&name=Extensions/' + EXTENSION_NAME + '/';

function init() {
	Qva.AddExtension(EXTENSION_NAME, function() {

		//Cache this for event listeners
		var $this = this;

		//Redraw everything on updates.
		//Unless extream amount of markers this should not have a noticable performace impact.
		$(this.Element).empty();

		//Store our markers
		var markers = [];

		//Store our pop-ups
		var infoList = [];

		//Instanciate bounds object
		var latlngbounds = new google.maps.LatLngBounds();

		//Test for local layer or a remote resource
		//This will fail in desktop - does it have to work in desktop?
		var geoJSONlayer = /http/gi.test(this.Layout.Text0.text) ? this.Layout.Text0.text : PATH + this.Layout.Text0.text;

		//Map Options - See docs: https://developers.google.com/maps/documentation/javascript/reference#MapOptions
		var mapOptions = {
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		//Instanciate a map
		var gmap = new google.maps.Map(this.Element, mapOptions);

		//Load a geoJSON layer and set styles according to the features in the loaded layer
		gmap.data.loadGeoJson(geoJSONlayer);
		gmap.data.setStyle(function(feature) {
			var color = feature.getProperty('color');
			var stroke = feature.getProperty('stroke');
			var scolor = feature.getProperty('strokecolor');
			var opacity = feature.getProperty('opacity');
			return {
				fillColor: color,
				fillOpacity: opacity,
				strokeWeight: stroke,
				strokeColor: scolor
			};
		});

		for (var i = 0, k = this.Data.Rows.length; i < k; i++) {

			var row = this.Data.Rows[i],
				val = parseFloat(row[0].text),
				val2 = parseFloat(row[1].text);

			//Validate coordinates - skip row if invalid
			if (val != NaN && val != '' && val <= 90 && val >= -90 && val2 != NaN && val2 != '' && val2 <= 180 && val >= -180) {
				var latLng = new google.maps.LatLng(val, val2);
				var marker = new google.maps.Circle({
					center: latLng,
					fillColor: row[4].text,
					fillOpacity: +this.Layout.Text1.text,
					strokeColour: this.Layout.Text2.text,
					strokeWeight: +this.Layout.Text4.text,
					strokeOpacity: +this.Layout.Text3.text,
					radius: +row[2].text,
					map: gmap,
					zIndex: 10
				});

				//Add pop-up window
				marker.infoWindow = new google.maps.InfoWindow({
					content: row[3].text
				});

				//Attach pop-up event listeners
				google.maps.event.addListener(marker, 'mouseover', function() {
					this.infoWindow.setPosition(this.getCenter());
					this.infoWindow.open(gmap);
				});

				google.maps.event.addListener(marker, 'mouseout', function() {
					this.infoWindow.close();
				});

				//Store away marker
				markers.push(marker);

				//Extend bounds with marker
				latlngbounds.extend(latLng);

				//Select marker on click
				google.maps.event.addListener(marker, 'click', (function(lat, lng) {
					return function() {
						$this.Data.SelectTextsInColumn(0, true, lat);
						$this.Data.SelectTextsInColumn(1, true, lng)
					}
				})(val, val2));

			};
		};

		//Get center of markers and set bounds
		gmap.setCenter(latlngbounds.getCenter());
		gmap.fitBounds(latlngbounds);
	});
};

function loadScripts() {
	if (!window.google) {
		Qva.LoadScript('https://maps.google.com/maps/api/js?sensor=false&callback=init')
	} else {
		init();
	};
}
loadScripts();