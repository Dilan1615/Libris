from django.db import models
from django.contrib.auth.models import AbstractUser

class Genero(models.TextChoices):
    FICCION = 'FICCION', 'FICCION'
    MISTERIO = 'MISTERIO', 'MISTERIO'
    FANTASIA = 'FANTASIA', 'FANTASIA'
    CIENCIA_FICCION = 'CIENCIA_FICCION', 'CIENCIA_FICCION'
    ROMANCE = 'ROMANCE', 'ROMANCE'
    TERROR = 'TERROR', 'TERROR'
    AVENTURA = 'AVENTURA', 'AVENTURA'
    HISTORICO = 'HISTORICO', 'HISTORICO'
    BIOGRAFIA = 'BIOGRAFIA', 'BIOGRAFIA'
    AUTOAYUDA = 'AUTOAYUDA', 'AUTOAYUDA'
    COMEDIA = 'COMEDIA', 'COMEDIA'
    DRAMA = 'DRAMA', 'DRAMA'
    CIENCIAS = 'CIENCIAS', 'CIENCIAS'
    


class EstadoLectura(models.TextChoices):
    LEIDO = 'LEIDO', 'Leido'
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    FAVORITO = 'FAVORITO', 'Favorito'
    ABANDONADO = 'ABANDONADO', 'Abandonado'

class CustomUser(AbstractUser):
    
    class Roles(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        USER = 'USER', 'User'

    rol = models.CharField(
        max_length=5,
        choices=Roles.choices,
        default=Roles.USER
    )
    
    foto_perfil = models.ImageField(
        upload_to='perfiles/',
        null=True,
        blank=True,
        help_text='Imagen de perfil del usuario'
    )
    
    def __str__(self):
        return self.username

class MaterialLectura(models.Model):
    titulo = models.CharField(max_length=255)
    autor = models.CharField(max_length=255)
    anio_publicacion = models.PositiveIntegerField()
    # Nota: se reemplaza el campo unico "genero" por una relación M2M en las subclases
    editorial = models.CharField(max_length=255)

    class Meta:
        abstract = True  # Solo las subclases tendrán tabla en DB

class Libro(MaterialLectura):
    # Soporte de múltiples géneros para libros
    generos = models.ManyToManyField('GeneroTag', blank=True, related_name='libros')
    isbn = models.CharField(max_length=13)
    numero_paginas = models.PositiveIntegerField(null=True, blank=True)
    portada = models.ImageField(upload_to='portadas/libros/', null=True, blank=True)
    descripcion = models.TextField(null=True, blank=True)
    contenido_pdf = models.FileField(upload_to='contenidos/libros/', null=True, blank=True)

    def __str__(self):
        return self.titulo

class Manga(MaterialLectura):
    # Soporte de múltiples géneros para mangas (con conjunto distinto)
    generos = models.ManyToManyField('GeneroTag', blank=True, related_name='mangas')
    tomo = models.PositiveIntegerField(default=1)
    capitulos = models.PositiveIntegerField(null=True, blank=True)
    estado_publicacion = models.CharField(max_length=20, choices=[
        ('EN_CURSO', 'En curso'),
        ('FINALIZADO', 'Finalizado'),
        ('HIATUS', 'Hiatus')
    ], default='EN_CURSO')
    portada = models.ImageField(upload_to='portadas/mangas/', null=True, blank=True)
    descripcion = models.TextField(null=True, blank=True)
    contenido_pdf = models.FileField(upload_to='contenidos/mangas/', null=True, blank=True)

    def __str__(self):
        return self.titulo

class Novela(MaterialLectura):
    # Soporte de múltiples géneros para novelas
    generos = models.ManyToManyField('GeneroTag', blank=True, related_name='novelas')
    volumen = models.PositiveIntegerField(default=1)
    numero_capitulos = models.PositiveIntegerField(null=True, blank=True)
    tipo = models.CharField(max_length=20, choices=[
        ('LIGERA', 'Ligera'),
        ('WEB', 'Web'),
        ('VISUAL', 'Visual')
    ], default='LIGERA')
    portada = models.ImageField(upload_to='portadas/novelas/', null=True, blank=True)
    descripcion = models.TextField(null=True, blank=True)
    contenido_pdf = models.FileField(upload_to='contenidos/novelas/', null=True, blank=True)

    def __str__(self):
        return self.titulo

# Nuevo modelo para géneros por tipo de material
class GeneroTag(models.Model):
    class TipoMaterial(models.TextChoices):
        LIBRO = 'LIBRO', 'Libro'
        MANGA = 'MANGA', 'Manga'
        NOVELA = 'NOVELA', 'Novela'

    nombre = models.CharField(max_length=50)
    tipo = models.CharField(max_length=10, choices=TipoMaterial.choices)

    class Meta:
        unique_together = ('nombre', 'tipo')

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"

class MaterialGeneral(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=50, choices=[
        ('libro', 'Libro'),
        ('manga', 'Manga'),
        ('novela', 'Novela'),
    ])
    libro = models.ForeignKey('api.Libro', on_delete=models.CASCADE, null=True, blank=True)
    manga = models.ForeignKey('api.Manga', on_delete=models.CASCADE, null=True, blank=True)
    novela = models.ForeignKey('api.Novela', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        if self.tipo == 'libro' and self.libro:
            return f"Libro: {self.libro.titulo}"
        elif self.tipo == 'manga' and self.manga:
            return f"Manga: {self.manga.titulo}"
        elif self.tipo == 'novela' and self.novela:
            return f"Novela: {self.novela.titulo}"
        return "Sin material"



class RegistroLectura(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    material = models.ForeignKey(MaterialGeneral, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=255, blank=True)  # campo opcional
    pagina_actual = models.PositiveIntegerField(default=1)
    estado = models.CharField(max_length=10, choices=EstadoLectura.choices, default=EstadoLectura.PENDIENTE)

    def save(self, *args, **kwargs):
        # Autocompletar título si no se proporcionó
        if not self.titulo and self.material:
            if self.material.tipo == "libro" and self.material.libro:
                self.titulo = self.material.libro.titulo
            elif self.material.tipo == "manga" and self.material.manga:
                self.titulo = self.material.manga.titulo
            elif self.material.tipo == "novela" and self.material.novela:
                self.titulo = self.material.novela.titulo
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.titulo}"

# ============================================
# Modelo para Calificaciones y Favoritos
# ============================================
class Calificacion(models.Model):
    """Modelo para guardar calificaciones (1-5 estrellas) de usuarios en materiales"""
    RATING_CHOICES = [
        (1, '⭐'),
        (2, '⭐⭐'),
        (3, '⭐⭐⭐'),
        (4, '⭐⭐⭐⭐'),
        (5, '⭐⭐⭐⭐⭐'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='calificaciones')
    
    # Relaciones con los materiales (solo uno será utilizado)
    libro = models.ForeignKey(Libro, null=True, blank=True, on_delete=models.CASCADE, related_name='calificaciones')
    manga = models.ForeignKey(Manga, null=True, blank=True, on_delete=models.CASCADE, related_name='calificaciones')
    novela = models.ForeignKey(Novela, null=True, blank=True, on_delete=models.CASCADE, related_name='calificaciones')
    
    rating = models.IntegerField(choices=RATING_CHOICES, help_text='Calificación de 1 a 5 estrellas')
    fecha = models.DateTimeField(auto_now=True)
    
    class Meta:
        # Un usuario solo puede calificar una vez cada material
        unique_together = [
            ('user', 'libro'),
            ('user', 'manga'),
            ('user', 'novela'),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.rating} estrellas"
    
class Favorito(models.Model):
    """Modelo para guardar materiales favoritos del usuario"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='favoritos')
    
    # Relaciones con los materiales
    libro = models.ForeignKey(Libro, null=True, blank=True, on_delete=models.CASCADE, related_name='favoritos_usuarios')
    manga = models.ForeignKey(Manga, null=True, blank=True, on_delete=models.CASCADE, related_name='favoritos_usuarios')
    novela = models.ForeignKey(Novela, null=True, blank=True, on_delete=models.CASCADE, related_name='favoritos_usuarios')
    
    fecha_agregado = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        # Un usuario no puede agregar el mismo material dos veces a favoritos
        unique_together = [
            ('user', 'libro'),
            ('user', 'manga'),
            ('user', 'novela'),
        ]
    
    def __str__(self):
        material = self.libro or self.manga or self.novela
        return f"{self.user.username} - {material.titulo}"
    
class Comentarios(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    libro = models.ForeignKey(Libro, null=True, blank=True, on_delete=models.CASCADE)
    manga = models.ForeignKey(Manga, null=True, blank=True, on_delete=models.CASCADE)
    novela = models.ForeignKey(Novela, null=True, blank=True, on_delete=models.CASCADE)

    descripcion = models.TextField()
    fecha = models.DateTimeField(auto_now=True)


    def __str__(self):
        username = self.user.username if self.user else '[Usuario eliminado]'
        return f"{username}: {self.descripcion[:30]}"
