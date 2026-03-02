from rest_framework import serializers
from drf_spectacular.utils import extend_schema_serializer, OpenApiExample
@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Exhaustive GeoJSON Example',
            summary='Example with Point (Circle) and Polygon',
            value={
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [-6125131.6, -903120.1]
                        },
                        "properties": {
                            "radius": 791292.0,
                            "original_type": "Circle"
                        }
                    },
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[8733987.5, 3107342.6], [8122041.1, 2735244.1], [8601999.2, 2111078.8], [8733987.5, 3107342.6]]]
                        },
                        "properties": None
                    }
                ]
            }
        )
    ]
)
class GeoJSONInputSerializer(serializers.Serializer):
    type = serializers.CharField(help_text="The GeoJSON type, typically 'FeatureCollection'")
    features = serializers.ListField(
        child=serializers.DictField(),
        help_text="A list of GeoJSON Features containing geometries and optional spatial properties (like radius for circles)."
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
        choices=["xlsx", "csv"],
        help_text="The format of the output file. csv are separated by a semicolon (;)",
    )