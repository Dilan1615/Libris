# Usa una imagen base de Python
FROM python:3.11-slim

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de requerimientos
COPY requirements.txt .

# Instala dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo el código del proyecto
COPY . .

# Comando para ejecutar el servidor
CMD ["python", "manage.py", "runserver", "0.0.0.1:8003"]