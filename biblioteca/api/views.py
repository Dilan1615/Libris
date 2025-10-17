from rest_framework import viewsets
from api.models import Persona, Cuenta, MaterialLectura, Libro, Manga, Novela, RegistroLectura
from .serializers import PersonaSerializer, CuentaSerializer, LibroSerializer, MangaSerializer, NovelaSerializer, RegistroLecturaSerializer




class PersonaViewSet(viewsets.ModelViewSet):
    queryset = Persona.objects.all()
    serializer_class = PersonaSerializer

class CuentaViewSet(viewsets.ModelViewSet):
    queryset = Cuenta.objects.all()
    serializer_class = CuentaSerializer

class LibroViewSet(viewsets.ModelViewSet):
    queryset = Libro.objects.all()
    serializer_class = LibroSerializer

class MangaViewSet(viewsets.ModelViewSet):
    queryset = Manga.objects.all()
    serializer_class = MangaSerializer

class NovelaViewSet(viewsets.ModelViewSet):
    queryset = Novela.objects.all()
    serializer_class = NovelaSerializer

class RegistroLecturaViewSet(viewsets.ModelViewSet):
    queryset = RegistroLectura.objects.all()
    serializer_class = RegistroLecturaSerializer