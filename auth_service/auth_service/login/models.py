from django.db import models
from django.contrib.auth.models import AbstractUser

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
