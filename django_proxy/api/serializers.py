from rest_framework import serializers
from rest_framework_gis.fields import GeometryField
from drf_spectacular.utils import extend_schema_serializer, OpenApiExample
# --- The GeoJSON Part ---
class GeoJSONInputSerializer(serializers.Serializer):
    type = serializers.CharField(
        help_text="The GeoJSON type, typically 'FeatureCollection'."
    )
    # On utilise GeometryField pour valider chaque élément de la liste
    features = serializers.ListField(
        child=serializers.DictField(), # Conteneur de la Feature (geometry + properties)
        help_text="A list of GeoJSON Features containing validated geometries."
    )

    def validate_features(self, value):
        geo_field = GeometryField()
        for feature in value:
            if 'geometry' not in feature:
                raise serializers.ValidationError("Each feature must contain a 'geometry' key.")
            # Ceci va lever une erreur si le format Point/Polygon est invalide
            geo_field.to_internal_value(feature['geometry'])
        return value

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Secure Spatial Request Example',
            summary='Validated GeoJSON data with precision flag',
            value={
                "geojson": {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [2.3522, 48.8566]
                            },
                            "properties": {"radius": 500}
                        }
                    ]
                },
                "is_precise": True
            }
        )
    ]
)
class SpatialProcessSerializer(serializers.Serializer):
    geojson = GeoJSONInputSerializer(
        help_text="The validated GeoJSON object."
    )
    is_precise = serializers.BooleanField(
        help_text="A boolean flag to determine if regionally and nationally precise deals should be returned. No default value."
    )

class GeomResponseSerializer(serializers.Serializer):
    message = serializers.CharField(help_text=" a string for frontend explaining if spatial query works or not")
    data = serializers.DictField(required=False, help_text="the geojson with all the deals related to the calling")
@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Exhaustive JSON Example',
            summary='Example with list of deals for an Excel file',
            value={
                "id_list" : [42,69,666],
                "format" : "xlsx"
            }
        )
    ]
)
class SheetInputSerializer(serializers.Serializer):

    id_list = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="A list of integers representing the ID of each deal.",
    )
    format = serializers.ChoiceField(
        choices=["xlsx", "csv", "pdf"],
        help_text="Output format: xlsx, csv (semicolon ';' separator), or pdf report with charts.",
    )