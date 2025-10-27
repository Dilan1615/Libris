# Libris

Este proyecto con enfoque en la seguridad y buenas prácticas en el backend, ofreciendo servicios de autenticación, autorización y gestión de datos de usuarios y libros.

Funcionalidades principales

Autenticación y autorización: Implementación de flujo JWT y OAuth2 completamente funcional, asegurando que solo usuarios autorizados puedan acceder a recursos sensibles.

Políticas de seguridad: Configuración de CORS para controlar el acceso desde distintos orígenes y validaciones de entrada para proteger la integridad de los datos.

Pruebas y documentación: Se incluye una colección de Postman y documentación en Swagger, permitiendo probar los endpoints de autenticación y operaciones sobre recursos de manera sencilla y segura.

Arquitectura visual: Diagramas C4 actualizados, mostrando claramente los componentes relacionados con la seguridad, flujo de datos y estructura del backend.

Tecnologías utilizadas

Python / Django (o Node.js / Express, según corresponda)

JWT / OAuth2

Postman 

C4 Model para diagramas de arquitectura

Políticas CORS y validaciones personalizadas


Todos los endpoints críticos requieren autenticación JWT 

Las solicitudes desde orígenes no autorizados son bloqueadas mediante CORS.

La entrada de datos se valida exhaustivamente para evitar inyecciones y errores de lógica.

Diagramas de arquitectura

Los diagramas C4 incluidos en el proyecto ilustran la relación entre usuarios, servicios, bases de datos y componentes de seguridad, facilitando la comprensión y mantenimiento del sistema.
