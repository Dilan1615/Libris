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
    
    def __str__(self):
        return self.username

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
    tomo = models.PositiveIntegerField(default=1)

    def __str__(self):
        return self.titulo

class Novela(MaterialLectura):
    volumen = models.PositiveIntegerField(default=1)

    def __str__(self):
        return self.titulo

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
    if not self.titulo:  # solo si el usuario no escribio titulo
        if self.material.tipo == "libro":
            self.titulo = self.material.libro.titulo
        elif self.material.tipo == "manga":
            self.titulo = self.material.manga.titulo
        elif self.material.tipo == "novela":
            self.titulo = self.material.novela.titulo

    super().save(*args, **kwargs)


    def __str__(self):
        return f"{self.user.username} - {self.titulo}"
    
class Comentarios(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

    libro = models.ForeignKey(Libro, null=True, blank=True, on_delete=models.CASCADE)
    manga = models.ForeignKey(Manga, null=True, blank=True, on_delete=models.CASCADE)
    novela = models.ForeignKey(Novela, null=True, blank=True, on_delete=models.CASCADE)

    descripcion = models.TextField()
    fecha = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"{self.user.username}: {self.descripcion[:30]}"
