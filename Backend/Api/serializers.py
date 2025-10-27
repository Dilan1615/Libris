from rest_framework import serializers
from .models import Libro, Manga, Novela, RegistroLectura, MaterialGeneral
class RegistroLecturaSerializer(serializers.ModelSerializer):
    # 1. Campo para RECIBIR el ID del material (PrimaryKeyRelatedField)
    #    Este campo RECIBE el 'id' del material y crea la relación ForeignKey.
    material = serializers.PrimaryKeyRelatedField(
        queryset=MaterialGeneral.objects.all(),
        # Si quieres que muestre el ID cuando se LEE (GET) el registro:
        # read_only=False, 
        # Si prefieres que muestre el título o más detalles (ver punto 3):
        # primary_key=True # Esto ya es el default para PrimaryKeyRelatedField
    )

    # 2. Campo para el ID de Usuario (es EXTERNO, solo un entero)
    #    Es un ID que viene del microservicio de login.
    user_id = serializers.IntegerField() 
    
    # 3. Campo de solo lectura para mostrar el título del material
    #    Esto usa la relación ForeignKey 'material' para acceder al título.
    titulo_material = serializers.CharField(source='material.titulo', read_only=True)
    
    # 4. Campo de solo lectura para mostrar el tipo de material
    tipo_material = serializers.CharField(source='material.tipo', read_only=True)

    class Meta:
        model = RegistroLectura        
        fields = ['id', 'user_id', 'material', 'titulo', 'estado', 'titulo_material', 'tipo_material']
        read_only_fields = ['titulo_material', 'tipo_material']
        

    def create(self, validated_data):        
        #Obtener el objeto MaterialGeneral relacionado (DRF ya lo hizo gracias a PrimaryKeyRelatedField)
        material_obj = validated_data.get('material')
        
        #Asignar el título del material a 'titulo' si no se proporcionó
        if not validated_data.get('titulo'):
            validated_data['titulo'] = material_obj.titulo
            
        # 3. Crea la instancia del RegistroLectura
        return RegistroLectura.objects.create(**validated_data)
#-----------------------------------------------------
# Serializer para MaterialLectura (y sus subclases)
#-----------------------------------------------------

class LibroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Libro
        fields = ['id', 'titulo', 'autor', 'anio_publicacion', 'genero', 'editorial', 'isbn']

class MangaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manga
        fields = ['id', 'titulo', 'autor', 'anio_publicacion', 'genero', 'editorial', 'volumen']

class NovelaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Novela
        fields = ['id', 'titulo', 'autor', 'anio_publicacion', 'genero', 'editorial', 'volumen']

class MaterialGeneralSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialGeneral
        fields = '__all__'