var keyTitles = {}

keyTitles["simd2020_20pc"] = "Most Deprived 20%";
keyTitles["simd2020_10pc"] = "Most Deprived 10%";
keyTitles["simd2020_5pc"] = "Most Deprived 5%";
keyTitles["simd2020"] = "All Deciles";

var categoryLookup = {}

//Placement on key:
//0 = Regular only
//1 = Short version appears after
//2 = Short version only
//3 = Short version appears before
	
categoryLookup["simd2020_20pc"] = {
"1": ["Most deprived 20%", "d73027", 0],
"z": ["Other areas", "bbaa99", 0]
};	

categoryLookup["simd2020_10pc"] = {
"1": ["Most deprived 10%", "c00000", 0],
"z": ["Other areas", "bbaa99", 0]
};	

categoryLookup["simd2020_5pc"] = {
"1": ["Most deprived 5%", "a50026", 0],
"z": ["Other areas", "bbaa99", 0]
};	
			
categoryLookup["simd2020"] = {
"1": ["Most deprived 10%", "a50026", 1, "1st"],
"2": ["", "d73027", 2, "2nd"],
"3": ["", "f46d43", 2, "3rd"],
"4": ["", "fdae61", 2, "4th"],
"5": ["", "fee090", 2, "5th"],
"6": ["", "e0f3f8", 3, "6th"],
"7": ["", "abd9e9", 3, "7th"],
"8": ["", "74add1", 3, "8th"],
"9": ["", "4575b4", 3, "9th"],
"10": ["Least deprived 10%", "313695", 4, "10th"]
};

categoryLookup["simd2020_data"] = categoryLookup["simd2020"];

categoryLookup["simd2016"] = categoryLookup["simd2020"];
categoryLookup["simd2016_data"] = categoryLookup["simd2020"];
categoryLookup["simd2016_5pc"] = categoryLookup["simd2020_5pc"];
categoryLookup["simd2016_10pc"] = categoryLookup["simd2020_10pc"];
categoryLookup["simd2016_20pc"] = categoryLookup["simd2020_20pc"];
categoryLookup["simd2012"] = categoryLookup["simd2020"];
categoryLookup["simd2012_data"] = categoryLookup["simd2020"];
categoryLookup["simd2012_5pc"] = categoryLookup["simd2020_5pc"];
categoryLookup["simd2012_10pc"] = categoryLookup["simd2020_10pc"];
categoryLookup["simd2012_20pc"] = categoryLookup["simd2020_20pc"];

keyTitles["simd2016"] = keyTitles["simd2020"];
keyTitles["simd2016_data"] = keyTitles["simd2020"];
keyTitles["simd2016_5pc"] = keyTitles["simd2020_5pc"];
keyTitles["simd2016_10pc"] = keyTitles["simd2020_10pc"];
keyTitles["simd2016_20pc"] = keyTitles["simd2020_20pc"];
keyTitles["simd2012"] = keyTitles["simd2020"];
keyTitles["simd2012_data"] = keyTitles["simd2020"];
keyTitles["simd2012_5pc"] = keyTitles["simd2020_5pc"];
keyTitles["simd2012_10pc"] = keyTitles["simd2020_10pc"];
keyTitles["simd2012_20pc"] = keyTitles["simd2020_20pc"];



var cities = 
[
["Aberdeen", 57.15, -2.13, 13],
["Ayr", 55.475, -4.62, 13],
["Dundee", 56.48, -2.98, 13],
["Dunfermline", 56.066, -3.452, 14],
["East Kilbride", 55.75, -4.18, 14],
["Edinburgh", 55.94, -3.21, 12],
["Falkirk", 56, -3.78, 13],
["Fort William", 56.82, -5.12, 14],
["Glasgow", 55.86, -4.29, 12],
["Inverness", 57.467, -4.228, 13],
["Motherwell", 55.785, -4, 13],
["Paisley", 55.84, -4.45, 13],
["Perth", 56.4, -3.46, 14],
["Stirling", 56.116, -3.945, 14]
];			

var council_areas = 
[
["Aberdeen City", 57.15585113, -2.173599174, 11],
["Aberdeenshire", 57.24416074, -2.627851007, 9],
["Angus", 56.72465122, -2.917669372, 10],
["Argyll and Bute", 56.0847417, -5.21155246, 9],
["City of Edinburgh", 55.92657691, -3.2883491, 11],
["Clackmannanshire", 56.15051494, -3.74218702, 12],
["Dumfries and Galloway", 55.07169676, -3.955578289, 9],
["Dundee City", 56.47719391, -2.969530499, 12],
["East Ayrshire", 55.4860209, -4.314415058, 10],
["East Dunbartonshire", 55.95606481, -4.225548249, 11],
["East Lothian", 55.94206016, -2.7208472, 11],
["East Renfrewshire", 55.75318451, -4.359606999, 12],
["Falkirk", 55.9973978, -3.790653732, 11],
["Fife", 56.22972333, -3.123348817, 10],
["Glasgow City", 55.85793257, -4.253044234, 11],
["Highland", 57.61109077, -4.638445539, 9],
["Inverclyde", 55.90444695, -4.742703102, 11],
["Midlothian", 55.83227908, -3.11036446, 11],
["Moray", 57.47691225, -3.267020516, 10],
["Na h-Eileanan an Iar", 58.13407895, -6.657931487, 9],
["North Ayrshire", 55.72459726, -4.732048806, 11],
["North Lanarkshire", 55.8750075, -3.948489102, 11],
["Orkney Islands", 58.99048896, -3.094725225, 10],
["Perth and Kinross", 56.56728062, -3.820373125, 9],
["Renfrewshire", 55.847884, -4.542719093, 11],
["Scottish Borders", 55.57762725, -2.78735095, 9],
["Shetland Islands", 60.37578431, -1.293975169, 9],
["South Ayrshire", 55.26958176, -4.687866761, 10],
["South Lanarkshire", 55.61339049, -3.811241939, 10],
["Stirling", 56.24508632, -4.341318198, 10],
["West Dunbartonshire", 55.98498903, -4.517714392, 11],
["West Lothian", 55.88514689, -3.573762213, 11]
];
