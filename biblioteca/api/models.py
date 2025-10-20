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

class MaterialLectura(models.Model):
    titulo = models.CharField(max_length=255)
    autor = models.CharField(max_length=255)
    anio_publicacion = models.PositiveIntegerField()
    genero = models.CharField(max_length=20, choices=Genero.choices, default=Genero.CIENCIAS)
    editorial = models.CharField(max_length=255)

    class Meta:
        abstract = True  # Solo las subclases tendrán tabla en DB

class Libro(MaterialLectura):
    isbn = models.CharField(max_length=13)

    def __str__(self):
        return self.titulo

class Manga(MaterialLectura):
    volumen = models.PositiveIntegerField(default=1)

    def __str__(self):
        return self.titulo

class Novela(MaterialLectura):
    volumen = models.PositiveIntegerField(default=1)

    def __str__(self):
        return self.titulo

class MaterialGeneral(models.Model):
    """Agrupa cualquier tipo de material"""
    tipo = models.CharField(max_length=50, choices=[
        ('libro', 'Libro'),
        ('manga', 'Manga'),
        ('novela', 'Novela'),
    ])
    id_referencia = models.PositiveIntegerField()
    titulo = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.tipo}: {self.titulo}"


class RegistroLectura(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    material = models.ForeignKey(MaterialGeneral, on_delete=models.CASCADE)
    pagina_actual = models.PositiveIntegerField(default=1)
    estado = models.CharField(max_length=10, choices=EstadoLectura.choices, default=EstadoLectura.PENDIENTE)

    class Meta:
        unique_together = ('user', 'material')
