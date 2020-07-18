proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");

var tilePrefix = "/* To be specified */";

var DEFAULT_LAT = 55.9;
var DEFAULT_LON = -4;
var DEFAULT_ZOOM = 9;
var	DEFAULT_LAYER = "simd2012";
var currentLayer = DEFAULT_LAYER;
var jsonLayer = DEFAULT_LAYER + "_data";

var args;

/*				        0  1  2  3  4  5  6  7    8    9    10   11   12   13   14   15   16   17 */
var zoomFactor =       [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.6, 1.2, 1.5, 1.8, 2];
var borderZoomFactor = [0, 0, 0, 0, 0, 0, 0, 0,   0,   0,   0,   0,   1,   2,   3,   4,   4, 4];

var olMap;
var layerData;
var layerBuildMask;
var layerLabels;
var layerBoundaries2012;
var layerPostcodePin;
var layerCentres;
var layerInfo;

var isUsingDefaultLLZ = false;
var isUsingCustomLLZ = false;
var showDZCentroids = true;
var showLabels = true;
var twttr;

function centreStyle(feature, resolution)
{	
	return [
		new ol.style.Style({
			image: new ol.style.Circle ({
				fill: new ol.style.Fill({color: feature.get('highlight') ? 'rgba(255,255,0,0.6)' : feature.get('fillColor')}), 
				stroke: new ol.style.Stroke({color: feature.get('highlight') ? 'rgba(255,255,0,1.0)' : feature.get('strokeColor'), width: feature.get('strokeWidth')}),
				radius: Math.round(feature.get('pointRadius'))
			}),
			text: new ol.style.Text({
				text: (feature.get('label') == "" ? undefined : feature.get('label')), 
				offsetX: 0,
				offsetY: 17,
				textAlign: 'center',
				font: '8px Cabin Condensed, sans-serif',
				fill: new ol.style.Fill({ color: "#000000" }),
				stroke: new ol.style.Stroke({ color: 'rgba(255, 255, 50, 0.6)', width: 3 })
			})	
		})	
	]
};

var clickCallback = function(data)
{
    if (data) 
    {
		addToDownloadList(data.datazoneid);		
	}
}

var hoverCallback = function(data) 
{
    var msg = "";
    if (data) 
    {
		var boxes = 0;
		msg += "<div id='infopanelcontent'>";
		msg += "<div>";
		msg += "<div style='font-weight: bold; font-size: 24px;'>" + data.datazoneid + "</div>";
		msg += "<div id='igtext'>" + data.igname + "<span style='font-size: 9px;'> (part)</span></div>";
		msg += "<div style='font-size: 10px;'>Local Authority: " + data.laname + "</div>";
		msg += "<div style='font-size: 10px;'>Nearest Settlement: " + data.nearest_settle + "</div>";		
		msg += "<table id='poptable'><tr><td colspan='4'>Population</td></tr>";
		msg += "<tr><td>Total</td><td>Working Age</td><td>Income Deprived</td><td>Employ Deprived</td></tr>";
		msg += "<tr><th>" + data.total_pop + "</th><th>" + data.working_pop  + "</th><th>" + data.income_pop  + "</th><th>" + data.employ_pop + "</th></tr>";
		msg += "</table>";
		msg += "<div style='font-size: 18px; margin: 10px 10px 5px 10px;'>";
		msg += "Decile <span style='font-weight: bold;'>" + data.decile + "</span>, ";
		msg += "Quintile <span style='font-weight: bold;'>" + data.quintile + "</span>";
		msg += "</div>";
		msg += "<table id='componenttable'>";
		msg += "<tr><td rowspan='2'><img src='/images/simd30.png' class='componentpic' /></td><td><b>&nbsp;&nbsp;SIMD overall rank: " + data.simd_rank + "</b></td></tr>";
		msg += getBar(Math.ceil((data.simd_rank/(6505.0/10.0))));
		msg += "<tr><td rowspan='2'><img src='/images/income30.png' class='componentpic' /></td><td>&nbsp;&nbsp;Income domain rank: " + data.income_rank + "</td></tr>";
		msg += getBar(Math.ceil((data.income_rank/(6505.0/10.0))));
		msg += "<tr><td rowspan='2'><img src='/images/employ30.png' class='componentpic' /></td><td>&nbsp;&nbsp;Employment domain rank: " + data.employ_rank + "</td></tr>";
		msg += getBar(Math.ceil((data.employ_rank/(6505.0/10.0))));
		msg += "<tr><td rowspan='2'><img src='/images/health30.png' class='componentpic' /></td><td>&nbsp;&nbsp;Health domain rank: " + data.healthdd_rank + "</td></tr>";
		msg += getBar(Math.ceil((data.healthdd_rank/(6505.0/10.0))));
		msg += "<tr><td rowspan='2'><img src='/images/education30.png' class='componentpic' /></td><td>&nbsp;&nbsp;Education/skills domain rank: " + data.edust_rank + "</td></tr>";
		msg += getBar(Math.ceil((data.edust_rank/(6505.0/10.0))));
		msg += "<tr><td rowspan='2'><img src='/images/housing30.png' class='componentpic' /></td><td>&nbsp;&nbsp;Housing domain rank: " + data.housesb_rank + "</td></tr>";
		msg += getBar(Math.ceil((data.housesb_rank/(6505.0/10.0))));
		msg += "<tr><td rowspan='2'><img src='/images/access30.png' class='componentpic' /></td><td>&nbsp;&nbsp;Geographic access domain rank: " + data.gaccess_rank + "</td></tr>";
		msg += getBar(Math.ceil((data.gaccess_rank/(6505.0/10.0))));
		msg += "<tr><td rowspan='2'><img src='/images/crime30.png' class='componentpic' /></td><td>&nbsp;&nbsp;Crime rank: " + data.crimed_rank + "</td></tr>";
		msg += getBar(Math.ceil((data.crimed_rank/(6505.0/10.0))));		
		msg += "</table></div></div>";

		$("#infopanel").css({'display': 'block', 'border-color': '#C81392'});
		$("#infopanelcontent").html(msg);
	}
	else
	{
		$("#infopanel").css({'display': 'block'});
 	  	$("#infopanelcontent").html("<div style='font-size: 10px;'>No information for this area available.</div>");
	}
}

function getBar(item)
{
	var html = "<tr><td><div style='width:165px; margin: 0 0 15px 3px; font-size: 9px; text-align: center;'>";
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



var keys = ['unused', 'chorolayer', 'layers', 'zoom', 'lon', 'lat'];
args = [];

$( document ).ready(function()
{	
	setDefaults();
	
	$("#chooser").accordion({ collapsible: true, heightStyle: "content"});
	$("#options").accordion({ collapsible: true, heightStyle: "content"});
	$("#download").accordion({ collapsible: true, heightStyle: "content"});
	$("#switchpanel").accordion({ collapsible: true, heightStyle: "content"}).draggable({ snap: true, snapTolerance: 6, scroll: false, distance: 10 });
	$("#infopanel").accordion({ collapsible: true, heightStyle: "content"}).draggable({ snap: true, snapTolerance: 6, scroll: false, distance: 10 });

	$("#buttonBuildings").click(function() 
	{	
		layerBuildMask.setVisible(!layerBuildMask.getVisible());
		updateUrl();
		tweetSetup();
	});
	
	$("#buttonPlacenames").button().click(function() 
	{
		layerLabels.setVisible(!layerLabels.getVisible());
		updateUrl();
		tweetSetup();
	});
	
	$("#buttonDZ").button().click(function() 
	{
		toggleLabels();
	});
	
	$( "#radioMaps" ).buttonset().find(':radio').click( function() 
	{  
		var	val = $(this).attr("id");
		currentLayer = val.substring(5);
		setTables(true);
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

	setTables();
	
  	var cityJumpHTML = "";
  	for (i in cities)
  	{
  		cityJumpHTML += "<button onclick='setLocation(" + cities[i][1] + ", " + cities[i][2] + "," + cities[i][3] + ")'>";
  		cityJumpHTML += cities[i][0];
  		cityJumpHTML += "</button>";
  	}
  	$("#cityjump").html(cityJumpHTML);

	for (var i in council_areas)
	{
		$('#councilAreasS').append($('<option>', { value : council_areas[i][0] }).text(council_areas[i][0]));			
		$('#councilAreasSM').append($('<option>', { value : council_areas[i][0] }).text(council_areas[i][0]));			
	}  		
});

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
				"<br />Created by Oliver O'Brien and James Cheshire, UCL Geography<br />Data: Contains Scottish Government data © Crown copyright 2016.<br />"
			]
		})
	});

	layerBuildMask = new ol.layer.Tile({
		title: "Buildings (mask) & roads",
		source: new ol.source.XYZ({
			urls: [
				tilePrefix + "shine_urbanmask_dark" + "/{z}/{x}/{y}.png"
			],
			crossOrigin: 'null',
			attributions: [ 
				//ol.source.OSM.ATTRIBUTION
			]
		})
	});
	
	layerLabels = new ol.layer.Tile({
		title: "Placenames",
		source: new ol.source.XYZ({
			urls: [
				tilePrefix + "shine_labels_cdrc" + "/{z}/{x}/{y}.png"
			],
			crossOrigin: 'null',
			attributions: [ 
				new ol.Attribution({ 'html': 'Base: Ordnance Survey &copy; Crown copyright &amp; database right 2011-6.' })
			]
		})
	});
	
 	layerBoundaries2012 = new ol.layer.Tile({
		title: "Boundaries",
		source: new ol.source.XYZ({
			urls: [
				tilePrefix + "dzborders2012" + "/{z}/{x}/{y}.png"
			],
			crossOrigin: 'null',
			attributions: [ 
				new ol.Attribution({ 'html': '' })
			]
		})
	});
	
	layerPostcodePin = new ol.layer.Vector({ 
		source: new ol.source.Vector() 
	});
	
	var dzSource = new ol.source.Vector(
	{
		defaultProjection: "EPSG:4326",
		url: "data/dz2012_centroids.json",
		format: new ol.format.GeoJSON()
	});	

	layerCentres = new ol.layer.Vector({
		title: "DZ 2012 Centroids",
		source: dzSource,
		style: centreStyle
	});
	
	dzSource.once('change', function()
	{
		if (dzSource.getState() == 'ready')
		{
			handleCentreStyling(true);		
		}
	});

	layerInfo = new ol.layer.Tile({ }); 

	olMap = new ol.Map( 
	{
		target: "mapcontainer",
		layers: 
		[
			layerData,
			layerBuildMask,
			layerBoundaries2012,
			layerLabels,
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
			extent: ol.proj.transformExtent([-9, 54.5, -0.5, 61], "EPSG:4326", "EPSG:3857")
 			/* Aggressive to minimise the jumping scrolling quirk in OL3. */
 		}),
		interactions: ol.interaction.defaults({pinchRotate:false})

	});	

	layerBoundaries2012.setOpacity(0.8);

	/* INTERACTIONS AND EVENTS */
	olMap.getView().on('change:resolution', updateOnZoom);
	olMap.on("moveend", updateUrl);

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
    
	$(olMap.getViewport()).on('mousemove', function(evt) {
		var coordinate = olMap.getEventCoordinate(evt.originalEvent);
		showUTFData(coordinate);		   
	});
	
	olMap.on('click', function(evt) {
  		popupFeatureInfo(evt);
		var coordinate = olMap.getEventCoordinate(evt.originalEvent);
		selectByUTFData(coordinate);		   
	});

	setUTFURL();	

	olMap.on("moveend", updateUrl);	 

	updateUrl();
	tweetSetup();
   
	useDefaultLocation(-1);
	if (isUsingCustomLLZ)
	{
		setLocation(DEFAULT_LAT, DEFAULT_LON, DEFAULT_ZOOM);	
	}
	else
	{
		isUsingDefaultLLZ = true;
	}
	
	if (!showDZCentroids)
	{
		layerCentres.setVisible(false);
	}	
	
	clearDownloadList();
}

function infoLayers(layerCand)
{
	return true;
}

var popupFeature;
var popupLayerName;
var popupFeatureInfo = function(evt)
{
	var pixel = evt.pixel;
 	var coordinate = evt.coordinate;
	var centreClick = false;
	
	olMap.forEachFeatureAtPixel(pixel, function(feature, layer) 
	{
		if (feature)
		{
			centreClick = true;
			popupFeature = feature;
		}
		if (layer)
		{
			var title = layer.get('title');
			if (title !== undefined)
			{
				popupLayerName = layer.get('title');
			}
		}
	}, this, infoLayers, this);

	if (centreClick && popupLayerName && popupLayerName === "DZ 2012 Centroids")
	{
		addToDownloadList(popupFeature.get('dz'));		
	}
}

function addToDownloadList(dzid)
{
	$('#downloadSelectedDataButton').button({'disabled': false});
	$('#clearSelectedDataButton').button({'disabled': false});

	layerCentres.getSource().forEachFeature(function(feature)
	{
		if (feature.get('dz') == dzid)
		{
			feature.set('highlight', true);	
			feature.set('label', feature.get('dz'));	
		}
	});
	
	var count = 0;	
	layerCentres.getSource().forEachFeature(function(feature)
	{
		if (feature.get('highlight'))
		{
			count++;
		}
	});
	$('#selectedCount').html("" + count + " selected");
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
	updateStyleCentres();
}

function setUTFURL()
{
	jsonLayer = "simd2012_data";
	var jsonUrl = "utf_tilejsonwrapper.php?json_name=" + jsonLayer
	layerInfo.setSource(new ol.source.TileUTFGrid({
			jsonp: true, 
			url: jsonUrl
		})
	);
}

function handleCentreStyling()
{
	var zoom = olMap.getView().getZoom();
	layerCentres.getSource().forEachFeature(function(feature)
	{
		feature.set('fillColor', 'rgba(255, 255, 255, 0.4)');
		feature.set('strokeColor', 'rgba(0,0,0,0.5)');
	});
	layerCentres.set('title', 'DZ 2012 Centroids'); 
	updateStyleCentres();
}

function toggleLabels()
{
	showLabels = !showLabels;
	updateStyleCentres();
}

function updateStyleCentres()
{
	var zoom = olMap.getView().getZoom();
	layerCentres.setVisible(zoom > 11);
	if (zoom > 11)
	{
		layerCentres.getSource().forEachFeature(function(feature)
		{
			feature.set('pointRadius', 10 * zoomFactor[zoom]);
			feature.set('strokeWidth', borderZoomFactor[zoom]);	

			if (feature.get('highlight'))
			{
				feature.set('fillColor', 'rgba(255, 255, 255, 0.4)');
				feature.set('strokeColor', 'rgba(0,0,0,0.5)');
				feature.set('label', feature.get('dz'));
			}
			else if (showLabels)
			{
				if (zoom > 11)
				{
					feature.set('fillColor', 'rgba(255, 255, 255, 0.4)');
					feature.set('strokeColor', 'rgba(0,0,0,0.5)');
				}
				if (zoom > 13)
				{
					feature.set('label', feature.get('dz'));
				}
				else
				{
					feature.set('label', "");						
				}
			}
			else
			{
					feature.set('label', "");		
					feature.set('fillColor', 'rgba(255, 255, 255, 0)');
					feature.set('strokeColor', 'rgba(0,0,0,0)');
			}

		});
	}
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
		showDZCentroids = false;
	}		
}

function setLayers()
{
	if (args['layers'])
	{
		layerBuildMask.setVisible(args['layers'][1] == "T");
		layerLabels.setVisible(args['layers'][2] == "T");
		layerBoundaries2012.setVisible(args['layers'][3] == "T");
		layerCentres.setVisible(args['layers'][4] == "T");
		layerPostcodePin.setVisible(args['layers'][5] == "T");
		layerInfo.setVisible(args['layers'][6] == "T");
	}
}

function setTables()
{
	$("#radio" + currentLayer).prop("checked", true);
	$("#radioMaps" ).buttonset('refresh');			
	$("#infopanel").css({'display': 'none'});

	updateOnZoom();
	setUTFURL();
	
	$("#keypanel1").empty();
	$("#keypanel2").empty();
	$("#keypanel3").empty();
	buildKey();
}	

function useDefaultLocation(error)
{
	setLocation(DEFAULT_LAT, DEFAULT_LON, DEFAULT_ZOOM);
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
	layerLabels.getVisible() ? layerString += "T" : layerString += "F";
	layerBoundaries2012.getVisible() ? layerString += "T" : layerString += "F";
	layerCentres.getVisible() ? layerString += "T" : layerString += "F";
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
		if (categoryLookup[currentLayer][i][2] == 0 || categoryLookup[currentLayer][i][2] == 1)
		{
			$("#keypanel1").append("<div class='keyitem' style='background-color: #" + categoryLookup[currentLayer][i][1] + " !IMPORTANT; color: #" + getTextColour(categoryLookup[currentLayer][i][1]) + ";'>" + categoryLookup[currentLayer][i][0] + "</div>");		
		}
		if (categoryLookup[currentLayer][i][2] == 1 || categoryLookup[currentLayer][i][2] == 2 || categoryLookup[currentLayer][i][2] == 3)
		{
			$("#keypanel2").append("<div class='keyitemshort' style='background-color: #" + categoryLookup[currentLayer][i][1] + " !IMPORTANT; color: #" + getTextColour(categoryLookup[currentLayer][i][1]) + ";'>" + categoryLookup[currentLayer][i][3] + "</div>");						
		}
		if (categoryLookup[currentLayer][i][2] == 3 || categoryLookup[currentLayer][i][2] == 4)
		{
			$("#keypanel3").append("<div class='keyitem' style='background-color: #" + categoryLookup[currentLayer][i][1] + " !IMPORTANT; color: #" + getTextColour(categoryLookup[currentLayer][i][1]) + ";'>" + categoryLookup[currentLayer][i][0] + "</div>");				
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
			setLocation(council_areas[i][1], council_areas[i][2] , council_areas[i][3] );			
		}	
	}  	
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
	var url = '/postcode.php?pc=' + escape(p);
	$.get(url, null, handleSearchPostcodeCallback);
}

function handleSearchPostcodeCallback(json)
{
	/* Pan and zoom to area. */
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

function updateOnZoom()
{
	updateStyleCentres();
	updateUrl();
	tweetSetup();
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

	var items = { 'year': 2012, 'ids': ids };
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
	postForm.action = 'data/simd2012_withgeog.zip';
	document.body.appendChild(postForm);
	postForm.submit();
	document.body.removeChild(postForm);
}

function printWindow()
{
	$('#infopanel').css('display', 'none');
	window.print();
	$('#infopanel').css('display', 'block');
}

function downloadWindow()
{

	if ( ! Modernizr.adownload ) 
	{
		alert("This function is not available at this time, as it requires a browser with Canvas and HTML5 Download, such as Chrome or Firefox. An alternative is to use the 'Print' button instead and print to PDF.");
	}
	else
	{
		olMap.once('postcompose', function(event) {
			var canvas = event.context.canvas;
			var dl = document.createElement('a');
			dl.setAttribute('download', 'SIMD_map.png');
			dl.setAttribute('visibility', 'hidden');
			dl.setAttribute('display', 'none');
			dl.setAttribute('href', canvas.toDataURL('image/png'));
			document.body.appendChild(dl);
			dl.click();
		});
		olMap.renderSync();
	}
}

/* H/T https://musicmachinery.com/2012/11/27/dynamically-adjusting-the-tweet-button/ */
function tweetSetup() {

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

/*! modernizr 3.3.1 (Custom Build) | MIT *
 * https://modernizr.com/download/?-adownload-setclasses !*/
!function(e,n,s){function a(e,n){return typeof e===n}function o(){var e,n,s,o,t,i,f;for(var c in r)if(r.hasOwnProperty(c)){if(e=[],n=r[c],n.name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(s=0;s<n.options.aliases.length;s++)e.push(n.options.aliases[s].toLowerCase());for(o=a(n.fn,"function")?n.fn():n.fn,t=0;t<e.length;t++)i=e[t],f=i.split("."),1===f.length?Modernizr[f[0]]=o:(!Modernizr[f[0]]||Modernizr[f[0]]instanceof Boolean||(Modernizr[f[0]]=new Boolean(Modernizr[f[0]])),Modernizr[f[0]][f[1]]=o),l.push((o?"":"no-")+f.join("-"))}}function t(e){var n=c.className,s=Modernizr._config.classPrefix||"";if(u&&(n=n.baseVal),Modernizr._config.enableJSClass){var a=new RegExp("(^|\\s)"+s+"no-js(\\s|$)");n=n.replace(a,"$1"+s+"js$2")}Modernizr._config.enableClasses&&(n+=" "+s+e.join(" "+s),u?c.className.baseVal=n:c.className=n)}function i(){return"function"!=typeof n.createElement?n.createElement(arguments[0]):u?n.createElementNS.call(n,"http://www.w3.org/2000/svg",arguments[0]):n.createElement.apply(n,arguments)}var l=[],r=[],f={_version:"3.3.1",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var s=this;setTimeout(function(){n(s[e])},0)},addTest:function(e,n,s){r.push({name:e,fn:n,options:s})},addAsyncTest:function(e){r.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=f,Modernizr=new Modernizr;var c=n.documentElement,u="svg"===c.nodeName.toLowerCase();Modernizr.addTest("adownload",!e.externalHost&&"download"in i("a")),o(),t(l),delete f.addTest,delete f.addAsyncTest;for(var d=0;d<Modernizr._q.length;d++)Modernizr._q[d]();e.Modernizr=Modernizr}(window,document);
