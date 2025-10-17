from rest_framework import serializers
from api.models import Persona, Cuenta, Libro, Manga, Novela, RegistroLectura
from django.contrib.contenttypes.models import ContentType


class PersonaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Persona # indicas el modelo
        fields = '__all__'  # serializar todo, aunque por seguridad no es recomendable

class CuentaSerializer(serializers.ModelSerializer):
    persona_data = PersonaSerializer(source='persona', read_only=True)
    class Meta:
        model = Cuenta
        fields = '__all__'        

class LibroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Libro
        fields = '__all__'                


class MangaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manga
        fields = '__all__'

class NovelaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Novela
        fields = '__all__'

class RegistroLecturaSerializer(serializers.ModelSerializer):
    material_data = serializers.SerializerMethodField()
    class Meta:
        model = RegistroLectura
        fields = ['id', 'persona', 'content_type', 'object_id', 'material_data', 'fecha_creacion', 'pagina_actual', 'estado']
    
    def get_material_data(self, obj):
        if isinstance(obj.material, Libro):
            return LibroSerializer(obj.material).data
        elif isinstance(obj.material, Manga):
            return MangaSerializer(obj.material).data
        elif isinstance(obj.material, Novela):
            return NovelaSerializer(obj.material).data
        return None

    def create(self, validated_data):
        return RegistroLectura.objects.create(**validated_data)
    
    def create(self, validated_data):
        material_type = validated_data.pop('material_type')
        material_id = validated_data.pop('material_id')

        content_type = None
        if material_type.lower() == 'libro':
            content_type = ContentType.objects.get_for_model(Libro)
        elif material_type.lower() == 'manga':
            content_type = ContentType.objects.get_for_model(Manga)
        elif material_type.lower() == 'novela':
            content_type = ContentType.objects.get_for_model(Novela)
        else:
            raise serializers.ValidationError("Tipo de material no válido")

        validated_data['content_type'] = content_type
        validated_data['object_id'] = material_id
        return RegistroLectura.objects.create(**validated_data)