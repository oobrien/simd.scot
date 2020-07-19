proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");
ol.proj.proj4.register(proj4);

var tilePrefix = "/* To be specified */";

var DEFAULT_LAT = 55.9;
var DEFAULT_LON = -4;
var DEFAULT_ZOOM = 9;

var currYear = "2020";
var currFilter = "";
var currentLayer = "simd" + currYear + currFilter;
var jsonLayer = currYear + "_data";

var num_dz = 6976.0;
var bar_num = 10.0;
var decile_range = num_dz/bar_num;

var count = 0;
var searchRequest = false;

/*				        0  1  2  3  4  5  6  7    8     9     10   11   12   13   14    15   16   17   18 */
var labelZoomFactor =  [0, 0, 0, 0, 0, 0, 0, 0.1, 0.15, 0.25, 0.3, 0.4, 0.8, 1.2, 1.5,   2,   2,   2,   2];

var olMap;
var layerData;
var layerBuildMask;
var layerVectorLabels;
var layerBoundaries;
var layerLABorders;
var layerPostcodePin;
var layerCentres;
var layerInfo;

var isUsingDefaultLLZ = false;
var isUsingCustomLLZ = false;
var showLabels = false;
var twttr;

var keys = ['unused', 'chorolayer', 'layers', 'zoom', 'lon', 'lat'];
var args = [];

var cachedStylesLabels = {};
var emptyStyle = new ol.style.Style({});
var cachedStyles = {};
var cachedStylesBorders = {};

var searchAfterLoad = "";

var fadedfeatures = [];
var fadedcount = 0;

var clickCallback = function(data)
{
    if (data && currYear != "2012") 
    {
		searchForDatazoneByFID(data.datazoneid, false);
	}
}

var hoverCallback = function(data) 
{
	$("#infopanel").css({'display': 'block', 'border-color': '#C81392'});
    var msg = "";
    if (data) 
    {
		$("#infopanelcontent").css({'display': 'block'});	
		$("#nodata").css({'display': 'none'});
		$("#datazoneid").html(data.datazoneid);
		$("#igname").html(data.igname);
		$("#laname").html(data.laname);
		$("#total_pop").html(data.total_pop);
		$("#working_pop").html(data.working_pop);
		$("#income_pop").html(data.income_pop);
		$("#employ_pop").html(data.employ_pop);
		$("#decile").html(data.decile);
		$("#quintile").html(data.quintile);
		$("#simd_rank").html(data.simd_rank);
		$("#income_rank").html(data.income_rank);
		$("#employ_rank").html(data.employ_rank);
		$("#healthdd_rank").html(data.healthdd_rank);
		$("#edust_rank").html(data.edust_rank);
		$("#housesb_rank").html(data.housesb_rank);
		$("#gaccess_rank").html(data.gaccess_rank);
		$("#crimed_rank").html(data.crimed_rank);
		$("#simd_rank_bar").html(getBar(Math.ceil((data.simd_rank/decile_range))));
		$("#income_rank_bar").html(getBar(Math.ceil((data.income_rank/decile_range))));
		$("#employ_rank_bar").html(getBar(Math.ceil((data.employ_rank/decile_range))));
		$("#healthdd_rank_bar").html(getBar(Math.ceil((data.healthdd_rank/decile_range))));
		$("#edust_rank_bar").html(getBar(Math.ceil((data.edust_rank/decile_range))));
		$("#housesb_rank_bar").html(getBar(Math.ceil((data.housesb_rank/decile_range))));
		$("#gaccess_rank_bar").html(getBar(Math.ceil((data.gaccess_rank/decile_range))));
		$("#crimed_rank_bar").html(getBar(Math.ceil((data.crimed_rank/decile_range))));

	}
	else
	{
		$("#infopanelcontent").css({'display': 'none'});	
		$("#nodata").css({'display': 'block'});

	}
}

var popupFeatureInfo = function(evt)
{
	var pixel = evt.pixel;
 	var coordinate = evt.coordinate;
	var centreClick = false;
	
	olMap.forEachFeatureAtPixel(pixel, function(feature, layer) 
	{
		if (feature && currYear != "2012")
		{
			showDatazone(feature);		
		}
	}), 
	{ 
		layerFilter: function(layer) { return layer == layerCentres; }
	};
}

function labelStyle(feature, resolution)
{
	var minshow = feature.get('minshow')/1000;
	var maxshow = feature.get('maxshow')/1000;
	var type = feature.get('type');
	var name = feature.get('name');
	var fade = feature.get('fade');
	
	var key = "K" + fade + resolution + minshow + type + maxshow + name;
	
	var style = cachedStylesLabels[key];
	if (style !== undefined)
	{
		return style;
	}	
	
	var zoom = olMap.getView().getZoom();
	var zoomInt = parseInt(zoom); //handle fractional zooms.

	var fontsize = minshow*labelZoomFactor[zoomInt];
	var zIndex = 1*maxshow;
		
	/*
	MINSHOW and MAXSHOW
	7 (1200): 80+ and 8000+
	8 (600): 40+ and 8000+
	9 (300): 30+ and 2000+
	10 (150): 20+ and 2000+
	11 (75): 10+ and 2000+
	12 (38): 8+ and 250+
	13 (19): 5+ and 100-2000 and 10+ and 25-2000
	14 (10): Everything
	*/
	
	if (type != "LA")
	{
		if (zoomInt < 8 && (minshow < 80 || maxshow < 8000)) { return null; }
		if (zoomInt < 9 && (minshow < 40 || maxshow < 8000)) { return null; }
		if (zoomInt < 10 && (minshow < 25 || maxshow < 2000)) { return null; }
		if (zoomInt < 11 && (minshow < 15 || maxshow < 2000)) { return null; }
		if (zoomInt < 12 && (minshow < 8 || maxshow < 1000)) { return null; }
		if (zoomInt < 13 && (minshow < 15 || maxshow < 25)) { return null; }
		if (zoomInt == 13 && ((minshow < 5 && (maxshow < 250 || maxshow > 2000)) || (minshow < 9 && (maxshow < 100 || maxshow > 2000)))) { return null; }
		if (zoomInt == 14 && (minshow < 5 && maxshow < 50)) { return null; }
	}
	
	if ((type == "Airfield" || type == "Airport") && zoomInt < 13) { return null; }
	if (type == "Other Settlement" && minshow < 20) { return null; }

	if (fontsize < 9) { fontsize = 9; }	
	if (maxshow == 250 && fontsize < 11) { fontsize == 11; }
 	if (fontsize > 36 && type != "LA") { fontsize = 36; }	
	if ((type == "Airfield" || type == "Airport") && fontsize > 24) { fontsize = 24; }
    var buffersize = parseInt(fontsize/3);

	var textcolour = "0, 0, 0";
	var textopacity = 1;
	var buffercolour = "255, 255, 255";
	var bufferopacity = 0.7;
	 
 	if (type == "Railway Station")
 	{
 		
 		name = "\uD83D\uDE83\n" + name.toUpperCase().replace(' ', '\n');
 		textcolour = "255, 255, 255";
 		buffercolour = "0, 0, 0";
 		zIndex = -1000;
 	}
 	
 	if (type == "LA")
 	{
 		name = name.replace(' ', '\n');
 		textcolour = "0, 0, 0";
 		buffercolour = "255, 255, 0";
 		zIndex = 10000;
 		if (zoomInt < 9 || zoomInt > 11) { return null; }
 	}
 	 	
	fontsize = parseInt(fontsize);
	
	if (fade)
	{
		textopacity = 0.3;
		bufferopacity = 0.1;
	}
	
	cachedStylesLabels[key] = new ol.style.Style(
	{
		text: new ol.style.Text({
			text: name,
			font: '' + fontsize + 'px "Titillium Web", "sans-serif"',
			offsetY: 15,
			fill: new ol.style.Fill({
				color: 'rgba(' + textcolour + ', ' + textopacity + ')',
			}),
			stroke: new ol.style.Stroke({color: 'rgba(' + buffercolour + ', ' + bufferopacity + ')', width: buffersize}),
		}),
		zIndex: zIndex
	});
	
	return cachedStylesLabels[key];
};

function centreStyle(feature, resolution)
{	
	var highlight = feature.get('highlight');
	var dzid = feature.getId();

	var key = "K" + highlight + resolution + showLabels + dzid;
	var style = cachedStyles[key];
	if (style !== undefined)
	{
		return style;
	}

	var thewidth = 2;
	var theradius = 5;
	if (resolution > 60) { return emptyStyle; }
	if (resolution < 30) {theradius = 8; thewidth = 3; }
	if (resolution < 15) { theradius = 10; thewidth = 4; }

	cachedStyles[key] = new ol.style.Style({
			image: new ol.style.Circle ({
				fill: new ol.style.Fill({color: highlight ? 'rgba(0,255,0,0.4)' : (showLabels && resolution < 40 ? 'rgba(255,255,0,0.4)' : 'rgba(0,0,0,0)')}), 
				stroke: new ol.style.Stroke({color: highlight ? 'rgba(0,255,0,1.0)' : (showLabels && resolution < 80 ? 'rgba(255, 255, 0, 0.7)' : 'rgba(0,0,0,0)'), width: thewidth }),
				radius: theradius
			}),
			text: new ol.style.Text({
				text: (highlight || (showLabels && resolution < 40) ? dzid : ""), 
				offsetX: 0,
				offsetY: 0,
				textAlign: 'center',
				font: '8px "Titillium Web", "sans-serif"',
				fill: new ol.style.Fill({ color:  (highlight || showLabels ? 'rgba(0, 0, 0, 1)' : 'rgba(0,0,0,0)') }),
				stroke: new ol.style.Stroke({ color: highlight ? 'rgba(0, 255, 0, 1)' : (showLabels ? 'rgba(255, 255, 50, 1)' : 'rgba(0,0,0,0)'), width: 3 })
			}),
			zIndex: 1000
	});
	return cachedStyles[key];
};

function laBorderStyle(feature, resolution)
{	
	var key = "K" + resolution;
	var style = cachedStylesBorders[key];
	if (style !== undefined)
	{
		return style;
	}

	var thewidth = 3;
	if (resolution > 250) { thewidth = 1; }
	if (resolution < 60) { thewidth = 5; }
	if (resolution < 30) { thewidth = 8; }

	var opacity = 0.5;
	if (resolution > 1000) { opacity=  0; }

	cachedStylesBorders[key] = new ol.style.Style({
			stroke: new ol.style.Stroke({ width: thewidth, color:'rgba(255, 255, 0, ' + opacity + ')' })
	});
	return cachedStylesBorders[key];

};

function getBar(item)
{
	var html = "<tr><td><div style='width:165px; margin: 0 0 15px 0; font-size: 9px; text-align: center;'>";
	for (var i = 1; i <= 10; i++)
	{
		if (item == i)
		{
			html += "<div style='float: left; width: 12px; height: 11px; border: 2px solid black; background-color: #" + categoryLookup[jsonLayer][i][1] + "; color: #" + getTextColour(categoryLookup[jsonLayer][i][1]) + ";'>" + i + "</div>";				
		}
		else
		{
			html += "<div style='float: left; width: 12px; height: 11px; border: 2px solid white; background-color: #" + categoryLookup[jsonLayer][i][1] + ";'>&nbsp;</div>";				
		}
	}
	html += "</td></tr>";
	return html;

}

function initMap()
{  
	layerData = new ol.layer.Tile({
		title: "Choropleth",
		source: new ol.source.XYZ({
			urls: [
				tilePrefix + currentLayer + "/{z}/{x}/{y}.png"
			],
			crossOrigin: 'null',
			attributions: [ 
				"Map created by <a href='https://oomap.co.uk/'>Oliver O'Brien</a> (<a href='https://oomap.co.uk/'>OOMap</a>).<br />Built with OpenLayers &amp; Open Data.<br />Contains Scottish Government data<br />© Crown copyright 2020.<br />"
			]
		}),
		extent: ol.proj.transformExtent([-9, 54.5, -0.5, 61], 'EPSG:4326', 'EPSG:3857')	
	});

	layerBuildMask = new ol.layer.Tile({
		title: "Buildings (mask) & roads",
		source: new ol.source.XYZ({
			urls: [
				tilePrefix + "basemap/" + "{z}/{x}/{y}.png"
			],
			crossOrigin: 'null',
			attributions: [ 
				//ol.source.OSM.ATTRIBUTION
			],
		}),
		extent: ol.proj.transformExtent([-12, 52, 2, 63], 'EPSG:4326', 'EPSG:3857')	
	});
	
	layerVectorLabels = new ol.layer.Vector({
          declutter: true,
          name: 'layerVectorLabels',
	  source: new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            url: 'data/scotland_labels.json'
          }),
          style: labelStyle
	});

 	layerBoundaries = new ol.layer.Tile({
		title: "Boundaries",
		source: new ol.source.XYZ({
			urls: [
				tilePrefix + "dzborders2020/" + "{z}/{x}/{y}.png"
			],
			crossOrigin: 'null',
			attributions: [ '' ],
		}),
		extent: ol.proj.transformExtent([-9, 54.5, -0.5, 61], 'EPSG:4326', 'EPSG:3857')	
	});
	
	layerLABorders = new ol.layer.Vector({
          name: 'layerLABorders',
	  source: new ol.source.Vector({
            format: new ol.format.TopoJSON(),
            url: 'data/scotland_la_common_borders.json'
          }),
          style: laBorderStyle,
	});

	layerPostcodePin = new ol.layer.Vector({ 
		source: new ol.source.Vector() 
	});
	
	var dzSource = new ol.source.Vector(
	{
		defaultProjection: "EPSG:4326",
		url: "data/dz2020_centroids.json",
		format: new ol.format.GeoJSON(),
		maxZoom: 14,
		minZoom: 12
	});	

	layerCentres = new ol.layer.VectorImage({
		title: "DZ 2020 Centroids",
		source: dzSource,
		style: centreStyle,
	});
	
	layerCentres.setVisible(false);
	
	dzSource.once('change', function()
	{
		if (dzSource.getState() == 'ready')
		{
			layerCentres.getSource().forEachFeature(function(feature)
			{
				feature.setId(feature.get('dz'));
				feature.set('highlight', false);
			});
			
			$("#dzLoading").dialog("close");
			if (searchAfterLoad != "")
			{
				searchForDatazoneByFID(searchAfterLoad, searchRequest);
				searchRequest = false;
			}
			
		}
	});

	layerInfo = new ol.layer.Tile(
	{ 
		extent: ol.proj.transformExtent([-9, 54.5, -0.5, 61], 'EPSG:4326', 'EPSG:3857')	
	}); 

	olMap = new ol.Map( 
	{
		target: "mapcontainer",
		layers: 
		[
			layerData,
			layerBuildMask,
			layerBoundaries,
			layerLABorders,
			layerVectorLabels,
			layerCentres,
			layerPostcodePin,
			layerInfo
		],
		controls: ol.control.defaults({}).extend(
		[
			new ol.control.ScaleLine({'geodesic': true, 'units': 'metric'}) 				
		]),
		view: new ol.View({
			projection: "EPSG:3857",
			maxZoom: 14,
			minZoom: 7,
			zoom: DEFAULT_ZOOM,
			center: ol.proj.transform([DEFAULT_LON, DEFAULT_LAT], "EPSG:4326", "EPSG:3857"),
			extent: ol.proj.transformExtent([-12, 53.5, 1, 62], "EPSG:4326", "EPSG:3857")
 		}),
		interactions: ol.interaction.defaults({pinchRotate:false})

	});	

	/* INTERACTIONS AND EVENTS */

	var showUTFData = function(coordinate)
	{
		var viewResolution = olMap.getView().getResolution();
		layerInfo.getSource().forDataAtCoordinateAndResolution(coordinate, viewResolution, hoverCallback);
	}
	
	var selectByUTFData = function(coordinate)
	{
		var viewResolution = olMap.getView().getResolution();
		layerInfo.getSource().forDataAtCoordinateAndResolution(coordinate, viewResolution, clickCallback);
	}
    
	$(olMap.getViewport()).on('pointermove', function(evt) {
		var coordinate = olMap.getEventCoordinate(evt.originalEvent);
		showUTFData(coordinate);		  		
	});
	
	olMap.on('pointermove', function(evt) 
	{
		fadedcount = 0;
		olMap.forEachFeatureAtPixel(evt.pixel, function(feature, layer) 
		{
			if (layer == layerVectorLabels)
			{
				feature.set('fade', true);
				fadedcount++;
				fadedfeatures.push(feature);
			}
        }, { hitTolerance: 0 })
    	if (fadedcount == 0)
		{
			for (var i in fadedfeatures) 
			{ 
				fadedfeatures[i].set('fade', false);
			}
		}	
    });		 
	
	olMap.on('click', function(evt) {
  		popupFeatureInfo(evt);
		var coordinate = olMap.getEventCoordinate(evt.originalEvent);
		selectByUTFData(coordinate);		   
	});

	olMap.on("moveend", updateOnPanOrZoom);	 

	useDefaultLocation(-1);
	if (isUsingCustomLLZ)
	{
		setLocation(DEFAULT_LAT, DEFAULT_LON, DEFAULT_ZOOM);	
	}
	else
	{
		isUsingDefaultLLZ = true;
	}
}

function clearDownloadList()
{
	$('#downloadSelectedDataButton').button({'disabled': true});
	$('#clearSelectedDataButton').button({'disabled': true});
	$('#selectedCount').html("");
	
	layerCentres.getSource().forEachFeature(function(feature)
	{
		feature.set('highlight', false);
	});
	count = 0;
	if (olMap.getView().getZoom() < 12 || !showLabels)
	{
		layerCentres.setVisible(false);
	}
}

function setUTFURL()
{
	jsonLayer = "simd" + currYear + "_data";
	var jsonUrl = "utf_tilejsonwrapper.php?json_name=" + jsonLayer
	layerInfo.setSource(new ol.source.UTFGrid({
			jsonp: true, 
			url: jsonUrl
		})
	);
}

function parseQueryStr() 
{
	var params = new URLSearchParams(document.location.search.substring(1));
	var dz = params.get('dz');
	if (!dz) return;
	$('#datazone').val(dz);
	searchForDatazone();
}

function setDefaults()
{
	/* Specified by user in URL. */
	var hash = window.location.hash;

	if (hash.length > 0)
	{
		var elements = hash.split('#');
		var pieces = elements[1].split('/');
		for(var i = 0; i < keys.length; i++)
		{
			if (pieces[i])
			{
				args[keys[i]] = pieces[i];			
			}
		}
		if (args['zoom']) { args['zoom'] = parseInt(args['zoom']); }
		if (args['lon']) { args['lon'] = parseFloat(args['lon']); }
		if (args['lat']) { args['lat'] = parseFloat(args['lat']); }
	}

	if (args['chorolayer'])
	{	
		currentLayer = args['chorolayer'];	
		if (args['zoom'] && args['lon'] && args['lat'])
		{
			DEFAULT_ZOOM = args['zoom'];
			DEFAULT_LAT = args['lat'];
			DEFAULT_LON = args['lon'];
			isUsingCustomLLZ = true;
		}
	}
	else
	{
		/* First time into site. Show default. */
		showLabels = false;
	}		
}

function setLayers()
{
	if (args['layers'])
	{
		layerBuildMask.setVisible(args['layers'][1] == "T");
		layerVectorLabels.setVisible(args['layers'][2] == "T");
		layerBoundaries.setVisible(args['layers'][3] == "T");
		showLabels = args['layers'][4] == "T";
		layerPostcodePin.setVisible(args['layers'][5] == "T");
		layerInfo.setVisible(args['layers'][6] == "T");
	}
}

function setTables()
{
	//console.log("setTables");
	$("#theyear").html(currYear.substr(0, 4));

	if (currYear == "2012")
	{
		num_dz = 6505.0;
		decile_range = num_dz/bar_num;

		layerBoundaries.getSource().setUrls([tilePrefix + "dzborders2012/" + "{z}/{x}/{y}.png"]);
		layerLABorders.setVisible(false);
		
		//layerCentres.getSource().setUrl("data/dz2012_centroids.json");
		layerCentres.setVisible(false);
		$('#buttonDZ').button({'disabled': true});
		$('#dzsearch').css({'display': 'none'});
		$('#selecteddatadownload2012').css({'display': 'block'});
		$('#downloadSelectedDataButton').button({'disabled': true});
		$('#clearSelectedDataButton').button({'disabled': true});
		clearDownloadList();
	}
	else
	{
		num_dz = 6976.0;
		decile_range = num_dz/bar_num;

		layerBoundaries.getSource().setUrls([tilePrefix + "dzborders2020/" + "{z}/{x}/{y}.png"]);
		layerLABorders.setVisible(true);

		layerCentres.getSource().setUrl("data/dz2020_centroids.json");
		$('#buttonDZ').button({'disabled': false});
		$('#dzsearch').css({'display': 'block'});
		$('#selecteddatadownload2012').css({'display': 'none'});
		$('#downloadSelectedDataButton').button({'disabled': false});
		if (count > 0)
		{
			$('#clearSelectedDataButton').button({'disabled': false});
		}
	}

	if (currYear == "2020")
	{
		$('#mainsite').css({'display': 'block'});
		$('#mainsiteold').css({'display': 'none'});
	}
	else
	{
		$('#mainsite').css({'display': 'none'});
		$('#mainsiteold').css({'display': 'block'});	
	}
	
	$("#radio" + currFilter).prop("checked", true);
	$("#radiosimd" + currYear).prop("checked", true);

	$("#radioMaps" ).buttonset('refresh');			
	$("#radioYears" ).buttonset('refresh');			
	$("#infopanel").css({'display': 'none'});

	$("#keypanel1").empty();
	$("#keypanel2").empty();
	buildKey();

	setUTFURL();
	updateUrl();
	tweetSetup();

}	

function useDefaultLocation(error)
{
	setLocation(DEFAULT_LAT, DEFAULT_LON, DEFAULT_ZOOM);
}

function setLocationFromCoords(coords, zoom)
{	
	olMap.getView().setRotation(0); 
    olMap.getView().setCenter(coords);
	olMap.getView().setZoom(zoom);
}

function setLocation(lat, lon, zoom)
{
	olMap.getView().setRotation(0); 
    olMap.getView().setCenter(ol.proj.transform([lon, lat], "EPSG:4326", "EPSG:3857"));
	olMap.getView().setZoom(zoom);
}

function updateUrl()
{
	var layerString = "B";
	layerBuildMask.getVisible() ? layerString += "T" : layerString += "F";
	layerVectorLabels.getVisible() ? layerString += "T" : layerString += "F";
	layerBoundaries.getVisible() ? layerString += "T" : layerString += "F";

	showLabels ? layerString += "T" : layerString += "F";

	layerPostcodePin.getVisible() ? layerString += "T" : layerString += "F";
	layerInfo.getVisible() ? layerString += "T" : layerString += "F";

	var centre = ol.proj.transform(olMap.getView().getCenter(), "EPSG:3857", "EPSG:4326");  
	
	var theLayer = "default";
	window.location.hash = "/" + currentLayer + "/"  + layerString + "/" + olMap.getView().getZoom() + "/" + centre[0].toFixed(4) + "/" + centre[1].toFixed(4) + "/"; 
}

function buildKey()
{
	for (var i in categoryLookup[currentLayer])
	{
		if (categoryLookup[currentLayer][i][2] == 0)
		{
			$("#keypanel1").append("<div class='keyitem' style='background-color: #" + categoryLookup[currentLayer][i][1] + " !IMPORTANT; color: #" + getTextColour(categoryLookup[currentLayer][i][1]) + ";'>" + categoryLookup[currentLayer][i][0] + "</div>");		
		}
		if (categoryLookup[currentLayer][i][2] == 1)
		{
			$("#keypanel1").append("<div class='keyitemhalf' style='background-color: #" + categoryLookup[currentLayer][i][1] + " !IMPORTANT; color: #" + getTextColour(categoryLookup[currentLayer][i][1]) + ";'>" + categoryLookup[currentLayer][i][0] + "</div>");		
		}
		if (categoryLookup[currentLayer][i][2] == 2)
		{
			$("#keypanel1").append("<div class='keyitemshort' style='background-color: #" + categoryLookup[currentLayer][i][1] + " !IMPORTANT; color: #" + getTextColour(categoryLookup[currentLayer][i][1]) + ";'>" + categoryLookup[currentLayer][i][3] + "</div>");						
		}
		if (categoryLookup[currentLayer][i][2] == 3)
		{
			$("#keypanel2").append("<div class='keyitemshort' style='background-color: #" + categoryLookup[currentLayer][i][1] + " !IMPORTANT; color: #" + getTextColour(categoryLookup[currentLayer][i][1]) + ";'>" + categoryLookup[currentLayer][i][3] + "</div>");						
		}
		if (categoryLookup[currentLayer][i][2] == 4)
		{
			$("#keypanel2").append("<div class='keyitemhalf' style='background-color: #" + categoryLookup[currentLayer][i][1] + " !IMPORTANT; color: #" + getTextColour(categoryLookup[currentLayer][i][1]) + ";'>" + categoryLookup[currentLayer][i][0] + "</div>");				
		}
	}
	$('#lead').html(keyTitles[currentLayer]);
	layerData.getSource().setUrls([tilePrefix + currentLayer  + "/{z}/{x}/{y}.png"]);
	updateUrl();
	tweetSetup();
}

function jumpToCouncilAreaM()
{
	var ca = $("#councilAreasSM").val();
	jumpToCouncilAreaF(ca);
	$('#welcomepanel').css('display', 'none');
	$('#blurpanel').css('display', 'none');
	$('#welcomecontentpanel').css('display', 'none');
}

function jumpToCouncilArea()
{
	var ca = $("#councilAreasS").val();
	jumpToCouncilAreaF(ca);
}

function jumpToCouncilAreaF(ca)
{
	for (var i in council_areas)
	{
		if (council_areas[i][0] == ca)
		{
			setLocation(council_areas[i][1], council_areas[i][2] , council_areas[i][3]);			
		}	
	}  	
}

function searchForDatazone()
{
	var p = $('#datazone').val();

	p = p.toUpperCase();
	p = p.replace(" ", "");

	if (p.length < 9)
	{
		alert('This datazone is not in the correct format.');
		return;		
	}

	var params = new URLSearchParams(location.search);
	params.set('dz', p);

	window.history.replaceState({}, '', `${location.pathname}?${params.toString()}${window.location.hash}`);

	searchForDatazoneByFID(p, true);
}

function searchForDatazoneByFID(dzid, fromSearch)
{
	if (olMap.getView().getZoom() < 12) { olMap.getView().setZoom(12); }
	if (layerCentres.getSource().getFeatures().length == 0)
	{
		searchAfterLoad = dzid;
		searchRequest = fromSearch;
		layerCentres.setVisible(true);
		$("#dzLoading").dialog("open");
		return;
	}
	var dz = layerCentres.getSource().getFeatureById(dzid);
	if (dz)
	{
		searchAfterLoad = "";
		showDatazone(dz, fromSearch)
	}	
	else
	{
		alert('Datazone not found: ' + searchAfterLoad);
		searchAfterLoad = "";
	}	
}

function showDatazone(dz, fromSearch)
{
	if (fromSearch) 
	{ 
		setLocationFromCoords(dz.getGeometry().getCoordinates(), 13);	
	}

	$('#downloadSelectedDataButton').button({'disabled': false});
	$('#clearSelectedDataButton').button({'disabled': false});

	dz.set('highlight', true);	
	
	layerCentres.setVisible(true);

	count = 0;	
	layerCentres.getSource().forEachFeature(function(feature)
	{
		if (feature.get('highlight'))
		{
			count++;
		}
	});
	$('#selectedCount').html("" + count + " selected");

	searchRequest = false;
}

function jumpToPostcodeM()
{
	var p = $('#postcodeM').val();
	p = p.toUpperCase();
	p = p.replace(" ", "");

	if (p.length < 5 || p.length > 7)
	{
		alert('This postcode is not in the correct format.');
		return;		
	}

	jumpToPostcodeF(p);
	$('#welcomepanel').css('display', 'none');
	$('#blurpanel').css('display', 'none');
	$('#welcomecontentpanel').css('display', 'none');
}

function jumpToPostcode()
{
	var p = $('#postcode').val();

	p = p.toUpperCase();
	p = p.replace(" ", "");

	if (p.length < 5 || p.length > 7)
	{
		alert('This postcode is not in the correct format.');
		return;		
	}

	jumpToPostcodeF(p);
}

function jumpToPostcodeF(p)
{
	var url = 'postcode.php?pc=' + escape(p);
	$.get(url, null, handleSearchPostcodeCallback);
}

function handleSearchPostcodeCallback(json)
{
	var result = JSON.parse(json);
	if (result.success)
	{
		var newCentre = ol.proj.transform([result.easting, result.northing], "EPSG:27700", "EPSG:4326");
		setLocation(newCentre[1], newCentre[0], 14);
		
		var iconFeature = new ol.Feature({
			geometry: new ol.geom.Point(ol.proj.transform([result.easting, result.northing], "EPSG:27700", "EPSG:3857"))
		});
		
		var iconStyle = new ol.style.Style({
			image: new ol.style.Icon(({
				anchor: [12, 41],
				anchorXUnits: 'pixels',
				anchorYUnits: 'pixels',
				opacity: 1.0,
				src: '/images/marker.png'
			}))
		});
		
		iconFeature.setStyle(iconStyle);
		
		layerPostcodePin.getSource().clear();
		layerPostcodePin.getSource().addFeature(iconFeature);
				
	}
	else
	{
		alert('An error occurred: ' + result.message);
	}
}

function updateOnPanOrZoom()
{
	//console.log("updateOnPanOrZoom");
	if (olMap.getView().getZoom() >= 12 && (showLabels || count > 0))
	{
		if (layerCentres.getSource().getFeatures().length == 0)
		{
			$("#dzLoading").dialog("open");
		}
		if (currYear != "2012")
		{
			layerCentres.setVisible(true);
		}
	}
	else
	{
		layerCentres.setVisible(false);	
	}
	
	updateUrl();
	tweetSetup();
}

function downloadSelectedData()
{
	var ids = "";
	layerCentres.getSource().forEachFeature(function(feature)
	{
		if (feature.get('highlight'))
		{
			ids += feature.get('dz'); 
			ids += ","; 
		}
	});

	var items = { 'year': currYear, 'ids': ids };
	var postForm = document.createElement('form');
	postForm.method="POST";
	postForm.action = 'getdata.php';
	for (var item in items)
	{
		var postInput = document.createElement("input");
		postInput.setAttribute("name", item);
		postInput.setAttribute("value", items[item]);
		postForm.appendChild(postInput);
	}

	document.body.appendChild(postForm);
	postForm.submit();
	document.body.removeChild(postForm);			
}

function downloadAll()
{
	var postForm = document.createElement('form');
	postForm.method="POST";
	postForm.action = 'data/simd' + currYear + '_withgeog.zip';
	document.body.appendChild(postForm);
	postForm.submit();
	document.body.removeChild(postForm);
}

function getMSCanvas()
{
	const resolution = 150;
	const dim = [297, 210]
	const width = Math.round(dim[0] * resolution / 25.4);
	const height = Math.round(dim[1] * resolution / 25.4);
	const size = olMap.getSize();
	const viewResolution = olMap.getView().getResolution();

	const mapCanvas = document.createElement('canvas');
	mapCanvas.width = width;
	mapCanvas.height = height;

	const mapContext = mapCanvas.getContext('2d');
	Array.prototype.slice.call(document.querySelectorAll('.ol-layer canvas'), 0).forEach(function(canvas) 
	{
		if (canvas.width > 0) 
		{
			const transform = canvas.style.transform;
			// Get the transform parameters from the style's transform matrix
			const matrix = transform.match(/^matrix\(([^\(]*)\)$/)[1].split(',').map(Number);
			// Apply the transform to the export map context
			CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
			mapContext.drawImage(canvas, 0, 0);
		}
	});
	return mapCanvas;
}

function printWindow()
{
	olMap.once('rendercomplete', function() 
	{
		$('#infopanel').css('display', 'none');
		$('.ol-zoom').css('opacity', 0);
		$('.ol-attribution').css('opacity', 0);

		var img = new Image();
		if (navigator.msSaveBlob) //For IE11.
		{
			const mapCanvas = getMSCanvas();
			img.src = mapCanvas.toDataURL();
			document.body.appendChild(img);
			requestAnimationFrame(function() 
			{
				window.print(document);
				document.body.removeChild(img);
				$('.ol-zoom').css('opacity', 1);
				$('.ol-attribution').css('opacity', 1);
			});
		}		
		else
		{
			domtoimage.toPng(olMap.getTargetElement()).then(function(dataURL) 
			{
				img.src = dataURL;			
				document.body.appendChild(img);
				requestAnimationFrame(function() 
				{
					window.print(document);
					document.body.removeChild(img);
					$('.ol-zoom').css('opacity', 1);
					$('.ol-attribution').css('opacity', 1);
				});
			});
		}
  	});
  	olMap.renderSync();
	$('#infopanel').css('display', 'block');
}

function downloadWindow()
{
	olMap.once('rendercomplete', function() 
	{
		$('.ol-zoom').css('opacity', 0);
		$('.ol-attribution').css('opacity', 0);

		if (navigator.msSaveBlob) //For IE11.
		{
			const mapCanvas = getMSCanvas();
			navigator.msSaveBlob(mapCanvas.msToBlob('image/jpeg'), 'SIMD.jpg');
			$('.ol-zoom').css('opacity', 1);
			$('.ol-attribution').css('opacity', 1);
		}
		else
		{
			domtoimage.toPng(olMap.getTargetElement()).then(function(dataURL) 
			{
				return new Promise(function (resolve, reject) { 
					var img = new Image();
					img.onLoad = function() { 
						resolve(img);
					};
					img.onerror = reject;
					img.src = dataURL;
			
					var link = document.getElementById('image-download');
					link.href = img.src;
					link.click();
					$('.ol-zoom').css('opacity', 1);
					$('.ol-attribution').css('opacity', 1);
				});
			});
		}
  });
  olMap.renderSync();
}

/* UTILITY FUNCTIONS */

function getTextColour(backgroundColour)
{
	var val = hexToRgbCount("#" + backgroundColour);
	if (val > 350) { return "000000"; }
	return "ffffff";
}

function hexToRgbCount(hex) 
{
	if (!hex)
	{
		return 0;
	}

    var bigint = parseInt(hex.substring(1), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return r + g + b;
}

function tweetSetup() 
{
	if (twttr === undefined)
	{
		return;
	}
    $(".twitter-share-button").remove();
    var tweet = $('<a>')
        .attr('href', "https://twitter.com/share")
        .attr('id', "tweet")
        .attr('class', "twitter-share-button")
        .attr('data-text', "#SIMD")
        .attr('data-dnt', "true")
        .attr('data-via', "EqualityPoverty")
        .attr('data-lang', "en")
        .attr('data-count', "none")
        .text('Tweet');
    $("#tweet-span").prepend(tweet);
    twttr.widgets.load();
}

$( document ).ready(function()
{	
	setDefaults();
	
	$("#chooser").accordion({ collapsible: true, heightStyle: "content"});
	$("#options").accordion({ collapsible: true, heightStyle: "content"});
	$("#download").accordion({ collapsible: true, heightStyle: "content"});
	$("#switchpanel").accordion({ collapsible: true, heightStyle: "content"}).draggable({ snap: true, snapTolerance: 6, scroll: false, distance: 10 });
	$("#infopanel").accordion({ collapsible: true, heightStyle: "content"}).draggable({ snap: true, snapTolerance: 6, scroll: false, distance: 10 });

	$("#dzLoading").dialog({ autoOpen: false });

	$("#buttonBuildings").click(function() 
	{	
		layerBuildMask.setVisible(!layerBuildMask.getVisible());
		updateUrl();
		tweetSetup();
	});
	
	$("#buttonPlacenames").button().click(function() 
	{
		layerVectorLabels.setVisible(!layerVectorLabels.getVisible());
		updateUrl();
		tweetSetup();
	});
	
	$("#buttonDZ").button().click(function() 
	{
		if (olMap.getView().getZoom() < 12) { olMap.getView().setZoom(12); }
		if (layerCentres.getSource().getFeatures().length == 0)
		{
			$("#dzLoading").dialog("open");
		}
		layerCentres.setVisible(true);
		showLabels = !showLabels;
		layerCentres.changed();
		updateUrl();
	});
	
	$( "#radioMaps" ).buttonset().find(':radio').click( function() 
	{  
		var	val = $(this).attr("id");
		currYear = $( "#radioYears" ).find(':radio:checked').attr('id').substr(9);
		currFilter = val.substr(5);
		currentLayer = "simd" + currYear + currFilter;
		setTables();
	});

	$( "#radioYears" ).controlgroup().find(':radio').click( function() 
	{  
		var	val = $(this).attr("id");
		currYear = val.substr(9);
		currFilter = $( "#radioMaps" ).find(':radio:checked').attr('id').substr(5);
		currentLayer = "simd" + currYear + currFilter;
		setTables();
	});

	
	$("#welcomeclose").button().click(function() 
	{
		$('#welcomepanel').css('display', 'none');
		$('#blurpanel').css('display', 'none');
		$('#welcomecontentpanel').css('display', 'none');
	});
	
	/* This must go before initMap so we don't style the map control buttons with JQueryUI. */
	$("input[type=submit], button").button().click(function(event) 
	{
		event.preventDefault();
	});
	
	initMap();
	setLayers();

	$('#postcode').keypress(function(event) 
	{
		var code = event.keyCode || event.which;
		if (code === 13)
		{
			/* event.preventDefault(); */
			jumpToPostcode();
		}
	});	

	currYear = currentLayer.substr(4);
	currFilter = ""
	if (currentLayer.indexOf("_") > 0)
	{
		currYear = currentLayer.split("_")[0].substr(4);
		currFilter = "_" + currentLayer.split("_")[1];
	}
	setTables();
	parseQueryStr();
  	var cityJumpHTML = "";
  	for (var i in cities)
  	{
  		cityJumpHTML += "<button onclick='setLocation(" + cities[i][1] + ", " + cities[i][2] + "," + cities[i][3] + ")'>";
  		cityJumpHTML += cities[i][0];
  		cityJumpHTML += "</button>";
  	}
  	$("#cityjump").html(cityJumpHTML);
	$('#cityjump button').each(function()
	{
		$(this).button();
	});

	for (var i in council_areas)
	{
		$('#councilAreasS').append($('<option>', { value : council_areas[i][0] }).text(council_areas[i][0]));			
		$('#councilAreasSM').append($('<option>', { value : council_areas[i][0] }).text(council_areas[i][0]));			
	}  
});
