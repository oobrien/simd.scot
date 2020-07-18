# simd.scot
Interactive map of SIMD (Scottish Index of Multiple Deprivation)

The JS, HTML, CSS, non-map images and some GeoJSON and CSV files from the project. 

This is a working version of SIMD.scot except:
* No postcode search (this uses PHP and a DB).
* No tiled attribute data (UTF Grid tiles) as this uses PHP to retrieve JSON files from server.
* No selected data CSV download as this uses PHP to extract the necessary rows.
* Raster image tiles are not included. CORS may stop these being retrieved from my server.
* Bulk data+geodata zip downloads - not included for space reasons.
