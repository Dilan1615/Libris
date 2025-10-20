from rest_framework import serializers
from .models import Libro, Manga, Novela, RegistroLectura
from api.models import CustomUser  # Importa tu modelo de usuario personalizado

# -----------------------------
# Serializer para registro
# -----------------------------
class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)  # Campo extra para confirmar la contraseña, no se guarda en la base 

    class Meta:
        model = CustomUser
        fields =[ 'username', 'email', 'password', 'password2', 'rol']  # Campos que recibirá y validará

    def validate(self, data):
        # Verifica que las contrasenas coincidan
        if data['password'] != data['password2']:
            raise serializers.ValidationError("La contraseña no coincide.")
        
        #verifica que el email no esté en uso
        if CustomUser.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("El email ya está en uso.")
        
        if CustomUser.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError("El nombre de usuario ya está en uso.")
        return data  # Si todo es correcto, devuelve los datos validados

    def create(self, validated_data):
        # Crea un usuario usando create_user (hashea la contraseña automáticamente)
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            rol=validated_data.get('rol', CustomUser.Roles.USER)  # Sino se elige un rol por defecto es USER
        )
        return user  # Devuelve el usuario creado

# -----------------------------
# Serializer para mostrar perfil
# -----------------------------
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email','rol']  # Solo devuelve campos seguros, no incluye password

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


class RegistroLecturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroLectura
        fields = '__all__'        
   