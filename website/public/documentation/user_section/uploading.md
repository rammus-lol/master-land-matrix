# Uploading file

Our app can read GeoJSON, KML, zipped ESRI Shapefile and Geopackage.
They mus be in EPSG 3857 or EPSG 4326

You can drop your files directly onto the map or by clicking on the Drop or click to load a geographic file button.<br>
You can pass different types of file in one row 
(exemple : you can ask to load 1 geojson and one zipped shapefile), 
as well as multiple files with the same format (exemple : 5 geopackages).

They will go in the drawing layer with the shapes you have or will draw.

Although the application is intended for use with polygon layers, 
geometries are not validated before rendering. 
Users are advised to exercise caution,
your computer or our website will not explode but there 
is no point in trying to intersect anything with a point.<br>
Don't worry if you only have a file with a linestring or a point geometry
type the next section will explain what you can do with it on our app.

### Addendum : shapefile specification : 

You must zip the files to pass them, if you have several shapefiles,
producing one zip file for each one can be difficult, so we have unlocked
the possibility to pass one zip file with multiple shapefile.
It will work as long as you pas at least : 
- .shp file,
- .dbf file,
- .shx file,
- .prj file.

### Addendum Geopackage specification :
GeoPackage is the exclusive file format supported by our application. 
A ll geometries must be provided using the 
EPSG:3857 coordinate reference system.
Please note that GeoPackage files may contain multiple layers. 
The application does not support individual layer selection. 
Therefore, all layers within the file will be loaded automatically.

