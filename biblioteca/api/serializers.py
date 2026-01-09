from rest_framework import serializers
from .models import Libro, Manga, Novela, RegistroLectura, MaterialGeneral, Comentarios, GeneroTag, Calificacion, Favorito
from api.models import CustomUser  # Importa tu modelo de usuario personalizado
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Avg, Count

# Funciones auxiliares para envío de emails
def send_email_async(subject, message, recipient_email):
    """Función auxiliar para enviar emails"""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"⚠️ Error al enviar correo a {recipient_email}: {e}")
        return False

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
    foto_perfil = serializers.SerializerMethodField()
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'rol', 'first_name', 'last_name', 'foto_perfil']
        read_only_fields = ['id']

    def get_foto_perfil(self, obj):
        if getattr(obj, 'foto_perfil'):
            request = self.context.get('request')
            url = obj.foto_perfil.url
            return request.build_absolute_uri(url) if request else url
        return None

# -----------------------------
# Serializer para editar perfil (self-update: usuario actualiza su propio perfil)
# -----------------------------
class UserSelfUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'first_name', 'last_name', 'foto_perfil']
    
    def validate_username(self, value):
        # Validar que el username no esté en uso por otro usuario
        if CustomUser.objects.exclude(id=self.instance.id).filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
        return value
    
    def validate_email(self, value):
        # Validar que el email no esté en uso por otro usuario
        if CustomUser.objects.exclude(id=self.instance.id).filter(email=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value

    def validate_foto_perfil(self, file):
        # Permitir omitir archivo
        if not file:
            return file
        # Validar tipo
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        content_type = getattr(file, 'content_type', None)
        if content_type and content_type not in allowed_types:
            raise serializers.ValidationError("Formato de imagen no permitido. Usa JPG, PNG o WEBP.")
        # Validar tamaño (<= 5MB)
        max_size = 5 * 1024 * 1024
        size = getattr(file, 'size', 0)
        if size and size > max_size:
            raise serializers.ValidationError("La imagen es demasiado grande (máx. 5MB).")
        return file
    
    def update(self, instance, validated_data):
        old_data = {
            'username': instance.username,
            'email': instance.email,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
        }
        
        instance = super().update(instance, validated_data)
        
        # Registrar cambios para notificación
        changes = []
        for field in ['username', 'email', 'first_name', 'last_name']:
            old_val = old_data.get(field, '')
            new_val = validated_data.get(field, old_val)
            if old_val != new_val and new_val:
                changes.append(f"{field.replace('_', ' ').title()}: {old_val or '(vacío)'} → {new_val}")
        
        if changes:
            subject = "🔔 Cambios en tu perfil de Libris"
            message = f"""Hola {instance.username},

Se han realizado los siguientes cambios en tu perfil:

{chr(10).join(['• ' + change for change in changes])}

Si no reconoces estos cambios, cambia tu contraseña de inmediato.

¡Gracias por usar Libris!
"""
            send_email_async(subject, message, instance.email)
        
        return instance

# -----------------------------
# Serializer para editar usuarios (admin)
# -----------------------------
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'rol']
    
    def validate_username(self, value):
        # Validar que el username no esté en uso por otro usuario
        if CustomUser.objects.exclude(id=self.instance.id).filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
        return value
    
    def update(self, instance, validated_data):
        old_username = instance.username
        old_rol = instance.rol
        new_username = validated_data.get('username', instance.username)
        new_rol = validated_data.get('rol', instance.rol)
        
        instance = super().update(instance, validated_data)
        
        # Enviar email si cambió el nombre de usuario o rol
        changes = []
        if old_username != new_username:
            changes.append(f"Nombre de usuario: {old_username} → {new_username}")
        if old_rol != new_rol:
            changes.append(f"Rol: {old_rol} → {new_rol}")
        
        if changes:
            subject = "🔔 Cambios en tu cuenta de Libris"
            message = f"""Hola {new_username},

Se han realizado los siguientes cambios en tu cuenta:

{chr(10).join(['• ' + change for change in changes])}

Si no reconoces estos cambios, contacta con el administrador.

¡Gracias por usar Libris!
"""
            send_email_async(subject, message, instance.email)
        
        return instance

#-----------------------------------------------------
# Serializer para MaterialLectura (y sus subclases)
#-----------------------------------------------------

class LibroSerializer(serializers.ModelSerializer):
    imagen = serializers.SerializerMethodField()
    generos = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)
    avg_rating = serializers.SerializerMethodField()
    total_ratings = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    contenido_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Libro
        fields = ['id', 'titulo', 'autor', 'anio_publicacion', 'editorial', 'isbn', 'numero_paginas', 'portada', 'imagen', 'descripcion', 'contenido_pdf', 'contenido_pdf_url', 'generos', 'avg_rating', 'total_ratings', 'is_favorited']

    def get_imagen(self, obj):
        if obj.portada:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.portada.url)
            return obj.portada.url
        return None
    
    def get_avg_rating(self, obj):
        """Obtener promedio de calificaciones para este libro"""
        avg = Calificacion.objects.filter(libro=obj).aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0
    
    def get_total_ratings(self, obj):
        """Obtener cantidad total de calificaciones"""
        return Calificacion.objects.filter(libro=obj).count()
    
    def get_is_favorited(self, obj):
        """Verificar si el usuario actual tiene marcado como favorito"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Favorito.objects.filter(user=request.user, libro=obj).exists()

    def get_contenido_pdf_url(self, obj):
        if obj.contenido_pdf:
            request = self.context.get('request')
            url = obj.contenido_pdf.url
            return request.build_absolute_uri(url) if request else url
        return None
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['generos'] = [g.nombre for g in instance.generos.all()]
        return data

    def _set_generos(self, instance, nombres):
        if nombres is None:
            return
        tags = []
        for nombre in nombres:
            tag, _ = GeneroTag.objects.get_or_create(nombre=nombre, tipo=GeneroTag.TipoMaterial.LIBRO)
            tags.append(tag)
        instance.generos.set(tags)

    def create(self, validated_data):
        generos = validated_data.pop('generos', None)
        libro = super().create(validated_data)
        self._set_generos(libro, generos)
        return libro

    def update(self, instance, validated_data):
        generos = validated_data.pop('generos', None)
        instance = super().update(instance, validated_data)
        self._set_generos(instance, generos)
        return instance

class MangaSerializer(serializers.ModelSerializer):
    imagen = serializers.SerializerMethodField()
    generos = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)
    avg_rating = serializers.SerializerMethodField()
    total_ratings = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    contenido_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Manga
        fields = ['id', 'titulo', 'autor', 'anio_publicacion', 'editorial', 'tomo', 'capitulos', 'estado_publicacion', 'portada', 'imagen', 'descripcion', 'contenido_pdf', 'contenido_pdf_url', 'generos', 'avg_rating', 'total_ratings', 'is_favorited']

    def get_imagen(self, obj):
        if obj.portada:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.portada.url)
            return obj.portada.url
        return None
    
    def get_avg_rating(self, obj):
        """Obtener promedio de calificaciones para este manga"""
        avg = Calificacion.objects.filter(manga=obj).aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0
    
    def get_total_ratings(self, obj):
        """Obtener cantidad total de calificaciones"""
        return Calificacion.objects.filter(manga=obj).count()
    
    def get_is_favorited(self, obj):
        """Verificar si el usuario actual tiene marcado como favorito"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Favorito.objects.filter(user=request.user, manga=obj).exists()

    def get_contenido_pdf_url(self, obj):
        if obj.contenido_pdf:
            request = self.context.get('request')
            url = obj.contenido_pdf.url
            return request.build_absolute_uri(url) if request else url
        return None
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['generos'] = [g.nombre for g in instance.generos.all()]
        return data

    def _set_generos(self, instance, nombres):
        if nombres is None:
            return
        tags = []
        for nombre in nombres:
            tag, _ = GeneroTag.objects.get_or_create(nombre=nombre, tipo=GeneroTag.TipoMaterial.MANGA)
            tags.append(tag)
        instance.generos.set(tags)

    def create(self, validated_data):
        generos = validated_data.pop('generos', None)
        manga = super().create(validated_data)
        self._set_generos(manga, generos)
        return manga

    def update(self, instance, validated_data):
        generos = validated_data.pop('generos', None)
        instance = super().update(instance, validated_data)
        self._set_generos(instance, generos)
        return instance

class NovelaSerializer(serializers.ModelSerializer):
    imagen = serializers.SerializerMethodField()
    generos = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)
    avg_rating = serializers.SerializerMethodField()
    total_ratings = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    contenido_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Novela
        fields = ['id', 'titulo', 'autor', 'anio_publicacion', 'editorial', 'volumen', 'numero_capitulos', 'tipo', 'portada', 'imagen', 'descripcion', 'contenido_pdf', 'contenido_pdf_url', 'generos', 'avg_rating', 'total_ratings', 'is_favorited']

    def get_imagen(self, obj):
        if obj.portada:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.portada.url)
            return obj.portada.url
        return None
    
    def get_avg_rating(self, obj):
        """Obtener promedio de calificaciones para esta novela"""
        avg = Calificacion.objects.filter(novela=obj).aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0
    
    def get_total_ratings(self, obj):
        """Obtener cantidad total de calificaciones"""
        return Calificacion.objects.filter(novela=obj).count()
    
    def get_is_favorited(self, obj):
        """Verificar si el usuario actual tiene marcado como favorito"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Favorito.objects.filter(user=request.user, novela=obj).exists()

    def get_contenido_pdf_url(self, obj):
        if obj.contenido_pdf:
            request = self.context.get('request')
            url = obj.contenido_pdf.url
            return request.build_absolute_uri(url) if request else url
        return None
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['generos'] = [g.nombre for g in instance.generos.all()]
        return data

    def _set_generos(self, instance, nombres):
        if nombres is None:
            return
        tags = []
        for nombre in nombres:
            tag, _ = GeneroTag.objects.get_or_create(nombre=nombre, tipo=GeneroTag.TipoMaterial.NOVELA)
            tags.append(tag)
        instance.generos.set(tags)

    def create(self, validated_data):
        generos = validated_data.pop('generos', None)
        novela = super().create(validated_data)
        self._set_generos(novela, generos)
        return novela

    def update(self, instance, validated_data):
        generos = validated_data.pop('generos', None)
        instance = super().update(instance, validated_data)
        self._set_generos(instance, generos)
        return instance

class RegistroLecturaSerializer(serializers.ModelSerializer):
    # Campos de solo lectura para mostrar información del material
    titulo_material = serializers.SerializerMethodField(read_only=True)
    tipo_material = serializers.SerializerMethodField(read_only=True)
    material_info = serializers.SerializerMethodField(read_only=True)

    # Campos de entrada para crear/actualizar
    tipo = serializers.CharField(write_only=True, required=True)
    libro = serializers.PrimaryKeyRelatedField(queryset=Libro.objects.all(), write_only=True, required=False, allow_null=True)
    manga = serializers.PrimaryKeyRelatedField(queryset=Manga.objects.all(), write_only=True, required=False, allow_null=True)
    novela = serializers.PrimaryKeyRelatedField(queryset=Novela.objects.all(), write_only=True, required=False, allow_null=True)

    class Meta:
        model = RegistroLectura
        fields = ['id', 'titulo', 'titulo_material', 'tipo_material', 'material_info', 'pagina_actual', 'estado', 'tipo', 'libro', 'manga', 'novela']
        read_only_fields = ['id', 'titulo_material', 'tipo_material', 'material_info']

    def validate(self, attrs):
        # Solo validar campos de material si estamos creando (POST), no si estamos actualizando (PATCH)
        # En PATCH, solo se envían los campos que se van a actualizar
        if not self.instance:  # self.instance es None en POST (create), tiene valor en PATCH (update)
            tipo = attrs.get('tipo')
            libro = attrs.get('libro')
            manga = attrs.get('manga')
            novela = attrs.get('novela')

            # Validar que coincidan tipo y material enviado
            materiales = {'libro': libro, 'manga': manga, 'novela': novela}
            if tipo not in materiales:
                raise serializers.ValidationError({"tipo": "Tipo debe ser libro, manga o novela."})

            # Debe enviarse exactamente un material
            materiales_enviados = [m for m in materiales.values() if m is not None]
            if len(materiales_enviados) != 1:
                raise serializers.ValidationError("Debes enviar exactamente un material (libro, manga o novela) según el tipo.")

            # Validar correspondencia tipo-material
            if tipo == 'libro' and not libro:
                raise serializers.ValidationError({"libro": "Debes enviar libro cuando tipo=libro."})
            if tipo == 'manga' and not manga:
                raise serializers.ValidationError({"manga": "Debes enviar manga cuando tipo=manga."})
            if tipo == 'novela' and not novela:
                raise serializers.ValidationError({"novela": "Debes enviar novela cuando tipo=novela."})

        return attrs

    def create(self, validated_data):
        # Extraer y remover campos auxiliares
        tipo = validated_data.pop('tipo')
        libro = validated_data.pop('libro', None)
        manga = validated_data.pop('manga', None)
        novela = validated_data.pop('novela', None)

        user = self.context['request'].user

        # Buscar o crear MaterialGeneral para este usuario y material específico
        material_general, _ = MaterialGeneral.objects.get_or_create(
            user=user,
            tipo=tipo,
            libro=libro if tipo == 'libro' else None,
            manga=manga if tipo == 'manga' else None,
            novela=novela if tipo == 'novela' else None,
        )

        registro = RegistroLectura.objects.create(
            user=user,
            material=material_general,
            **validated_data
        )
        return registro

    def get_titulo_material(self, obj):
        mat = obj.material
        if not mat:
            return None
        if mat.tipo == 'libro' and mat.libro:
            return mat.libro.titulo
        if mat.tipo == 'manga' and mat.manga:
            return mat.manga.titulo
        if mat.tipo == 'novela' and mat.novela:
            return mat.novela.titulo
        return None

    def get_tipo_material(self, obj):
        return obj.material.tipo if obj.material else None

    def get_material_info(self, obj):
        """Devuelve información completa del material para el frontend"""
        mat = obj.material
        if not mat:
            return None
        
        request = self.context.get('request')
        material_obj = None
        
        if mat.tipo == 'libro' and mat.libro:
            material_obj = mat.libro
        elif mat.tipo == 'manga' and mat.manga:
            material_obj = mat.manga
        elif mat.tipo == 'novela' and mat.novela:
            material_obj = mat.novela
        
        if not material_obj:
            return None
        
        # Construir URL completa de la imagen
        imagen_url = None
        if material_obj.portada:
            imagen_url = request.build_absolute_uri(material_obj.portada.url) if request else material_obj.portada.url
        
        return {
            'id': material_obj.id,
            'tipo': mat.tipo,
            'titulo': material_obj.titulo,
            'autor': material_obj.autor,
            'imagen': imagen_url,
            'anio_publicacion': getattr(material_obj, 'anio_publicacion', None),
            'editorial': getattr(material_obj, 'editorial', None),
        }

class MaterialGeneralSerializer(serializers.ModelSerializer):
    titulo_material = serializers.SerializerMethodField()

    class Meta:
        model = MaterialGeneral
        fields = ['id', 'tipo', 'libro', 'manga', 'novela', 'titulo_material']

    def get_titulo_material(self, obj):
        if obj.tipo == 'libro' and obj.libro:
            return obj.libro.titulo
        elif obj.tipo == 'manga' and obj.manga:
            return obj.manga.titulo
        elif obj.tipo == 'novela' and obj.novela:
            return obj.novela.titulo
        return "Sin material"

class ComentariosSerializer(serializers.ModelSerializer):
    titulo_material = serializers.SerializerMethodField()
    tipo_material = serializers.SerializerMethodField()
    nombre_usuario = serializers.SerializerMethodField()

    class Meta:
        model = Comentarios
        fields = [
            'id',
            'user',
            'nombre_usuario',
            'libro',
            'manga',
            'novela',
            'descripcion',
            'fecha',
            'titulo_material',
            'tipo_material'
        ]
        read_only_fields = ['id', 'user', 'nombre_usuario', 'titulo_material', 'tipo_material', 'fecha']

    def validate_descripcion(self, value):
        """Validar que el comentario no contenga palabras inapropiadas"""
        # Lista de palabras prohibidas (puedes expandirla)
        palabras_prohibidas = [
            'idiota', 'estupido', 'tonto', 'imbecil', 'pendejo', 'cabron', 
            'mierda', 'puto', 'puta', 'joder', 'maldito', 'carajo',
            'basura', 'porqueria', 'estafa', 'fraude', 'spam',
            # Palabras más fuertes (censura según contexto)
            'kill', 'muerte', 'odio', 'violencia', 'racista', 'nazi'
        ]
        
        descripcion_lower = value.lower()
        
        for palabra in palabras_prohibidas:
            if palabra in descripcion_lower:
                raise serializers.ValidationError(
                    "⚠️ No se permiten comentarios con lenguaje inapropiado u ofensivo. "
                    "Si continúas intentando publicar este tipo de contenido, tu cuenta será suspendida."
                )
        
        # Validar longitud mínima
        if len(value.strip()) < 3:
            raise serializers.ValidationError("El comentario es demasiado corto. Escribe al menos 3 caracteres.")
        
        # Validar que no sea spam (muchos caracteres repetidos)
        if len(set(value.replace(' ', ''))) < 3:
            raise serializers.ValidationError("El comentario parece spam. Por favor, escribe un comentario válido.")
        
        return value

    def create(self, validated_data):
        """Crear comentario y enviar notificación de bienvenida"""
        comentario = super().create(validated_data)
        user_email = comentario.user.email
        user_username = comentario.user.username
        material_titulo = self.get_titulo_material(comentario)
        
        # Enviar email de confirmación de comentario publicado
        try:
            subject = "✅ Tu comentario en Libris ha sido publicado"
            message = f"""Hola {user_username},

¡Gracias por comentar en "{material_titulo}"!

Tu comentario ha sido publicado exitosamente y es visible para otros usuarios.

¡Esperamos que disfrutes interactuando con nuestra comunidad!
"""
            send_email_async(subject, message, user_email)
        except Exception as e:
            print(f"⚠️ Error al enviar correo de confirmación de comentario: {e}")
        
        return comentario

    def get_nombre_usuario(self, obj):
        return obj.user.username if obj.user else '[Usuario eliminado]'

    def get_titulo_material(self, obj):
        if obj.libro:
            return obj.libro.titulo
        if obj.manga:
            return obj.manga.titulo
        if obj.novela:
            return obj.novela.titulo
        return "Sin material"

    def get_tipo_material(self, obj):
        if obj.libro:
            return "libro"
        if obj.manga:
            return "manga"
        if obj.novela:
            return "novela"
        return "desconocido"


# Serializer para GeneroTag
class GeneroTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneroTag
        fields = ['id', 'nombre', 'tipo']


# Serializers para Calificaciones y Favoritos
class CalificacionSerializer(serializers.ModelSerializer):
    nombre_usuario = serializers.CharField(source='user.username', read_only=True)
    material_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Calificacion
        fields = ['id', 'user', 'nombre_usuario', 'libro', 'manga', 'novela', 'rating', 'fecha', 'material_info']
        read_only_fields = ['user', 'nombre_usuario', 'fecha']
    
    def get_material_info(self, obj):
        if obj.libro:
            return {'tipo': 'libro', 'id': obj.libro.id, 'titulo': obj.libro.titulo}
        elif obj.manga:
            return {'tipo': 'manga', 'id': obj.manga.id, 'titulo': obj.manga.titulo}
        elif obj.novela:
            return {'tipo': 'novela', 'id': obj.novela.id, 'titulo': obj.novela.titulo}
        return None


class FavoritoSerializer(serializers.ModelSerializer):
    nombre_usuario = serializers.CharField(source='user.username', read_only=True)
    material_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Favorito
        fields = ['id', 'user', 'nombre_usuario', 'libro', 'manga', 'novela', 'fecha_agregado', 'material_info']
        read_only_fields = ['user', 'nombre_usuario', 'fecha_agregado']
    
    def get_material_info(self, obj):
        if obj.libro:
            return {'tipo': 'libro', 'id': obj.libro.id, 'titulo': obj.libro.titulo}
        elif obj.manga:
            return {'tipo': 'manga', 'id': obj.manga.id, 'titulo': obj.manga.titulo}
        elif obj.novela:
            return {'tipo': 'novela', 'id': obj.novela.id, 'titulo': obj.novela.titulo}
        return None


# Serializer para estadísticas del usuario
class EstadisticasUsuarioSerializer(serializers.Serializer):
    total_libros_leidos = serializers.IntegerField()
    total_comentarios = serializers.IntegerField()
    generos_favoritos = serializers.ListField()
    calificacion_promedio_dada = serializers.FloatField()
    total_favoritos = serializers.IntegerField()

