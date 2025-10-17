from django.db import models
from django.contrib.auth.hashers import make_password
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
# ----------------------------
# Enums
# ----------------------------
class Estado(models.TextChoices):
    ACTIVO = 'A', 'ACTIVO'
    INACTIVO = 'I', 'INACTIVO'
    SUSPENDIDO = 'S', 'SUSPENDIDO'

class Rol(models.TextChoices):
    ADMINISTRADOR = 'AD', 'ADMINISTRADOR'
    USUARIO = 'US', 'USUARIO'

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
    LEYENDO = 'LEYENDO', 'LEYENDO'
    PENDIENTE = 'PENDIENTE', 'PENDIENTE'
    TERMINADO = 'TERMINADO', 'TERMINADO'
    ABANDONADO = 'ABANDONADO', 'ABANDONADO'

# ----------------------------
# Modelos Principales
# ----------------------------

class Persona(models.Model):
    nombre = models.CharField(max_length= 255, null= False, blank=False)
    apellido = models.CharField(max_length= 255, null= False, blank=False)
    telefono = models.CharField(max_length= 20, null= False, blank=False)
    correo = models.EmailField(max_length= 255, null= False, blank=False, unique=True)

    def __str__(self):
        return self.nombre 
 
class Cuenta (models.Model):
    usuario = models.CharField(max_length= 255, null= False, blank=False)
    contrasena = models.CharField(max_length= 255, null= False, blank=False)
    persona = models.ForeignKey(Persona, on_delete=models.CASCADE)
    estado = models.CharField(
        max_length=1,
        choices=Estado.choices,
        default=Estado.ACTIVO,
    )

    rol = models.CharField(
        max_length= 2,
        choices= Rol.choices,
        default= Rol.USUARIO,
    )

    def save(self, *args, **kwargs):
        # Solo hashea si no está ya hasheada
        if not self.contrasena.startswith('pbkdf2_'):
            self.contrasena = make_password(self.contrasena)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.usuario
    

class MaterialLectura(models.Model):
    titulo = models.CharField(max_length= 255, null= False, blank=False)
    autor = models.CharField(max_length= 255, null= False, blank=False)
    anio_publicacion = models.PositiveIntegerField(null= False, blank=False, default=2025)
    genero = models.CharField(max_length=20, choices=Genero.choices, default=Genero.CIENCIAS)
    editorial = models.CharField(max_length= 255, null= False, blank=False)

    class Meta:
        abstract = False  # va a crear una tabla en la base de datos por registro literario
    
    
#modulo lectura
class Libro (MaterialLectura):
    isbn = models.CharField(max_length= 13, null= False, blank=False)  
    

    def __str__(self):
        return self.titulo

class Manga (MaterialLectura):
    volumen = models.PositiveIntegerField(null= False, blank=False,default=1)

    def __str__(self):
        return self.titulo

class Novela (MaterialLectura):
    volumen = models.PositiveIntegerField(null= False, blank=False,default=1)

    def __str__(self):
        return self.titulo
    

class RegistroLectura(models.Model):
    persona = models.ForeignKey(Persona, on_delete=models.CASCADE)
    material = models.ForeignKey(MaterialLectura, on_delete=models.CASCADE)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    pagina_actual = models.PositiveIntegerField()
    estado = models.CharField(max_length=10, choices=EstadoLectura.choices, default=EstadoLectura.PENDIENTE)


    def __str__(self):
        return f"{self.persona} - {self.material} ({self.estado})"