from rest_framework import serializers
from .models import Libro, Manga, Novela, RegistroLectura, MaterialGeneral
from api.models import CustomUser  # Importa tu modelo de usuario personalizado
from django.core.mail import send_mail
from django.conf import settings

# -----------------------------
# Serializer para registro
# -----------------------------
class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password2', 'rol']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("La contraseña no coincide.")
        if CustomUser.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("El email ya está en uso.")
        if CustomUser.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError("El nombre de usuario ya está en uso.")
        return data

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            rol=validated_data.get('rol', CustomUser.Roles.USER)
        )

        # Intentar enviar correo
        try:
            send_mail(
               subject="Bienvenido a Libris",
                message=f"Hola {user.username},\n\nGracias por registrarte en Libris.\n¡Esperamos que disfrutes tu experiencia!",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"⚠️ Error al enviar el correo: {e}")

        return user

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

class MaterialGeneralSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialGeneral
        fields = '__all__'
   