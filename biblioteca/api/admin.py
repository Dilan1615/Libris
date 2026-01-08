from django.contrib import admin
from .models import (
    CustomUser,
    Libro,
    Manga,
    Novela,
    MaterialGeneral,
    RegistroLectura,
    Comentarios
)
admin.site.register(CustomUser)
admin.site.register(Libro)
admin.site.register(Manga)
admin.site.register(Novela)
admin.site.register(MaterialGeneral)
admin.site.register(RegistroLectura)
admin.site.register(Comentarios)