# Singularity Convert

**Singularity Convert** es una extensión de Visual Studio Code que te permite procesar archivos JSON con capturas de pantalla codificadas en Base64. Con esta extensión, puedes seleccionar propiedades de objetos JSON y convertir capturas de pantalla en archivos `.png` guardados en la carpeta que elijas.

## Características

- Extrae capturas de pantalla codificadas en Base64 desde archivos JSON.
- Te permite seleccionar las propiedades del JSON que deseas procesar.
- Convierte capturas de pantalla (`Screenshot`) en archivos `.png`.
- Permite al usuario seleccionar una carpeta en la que guardar las capturas.
- **Nuevo en la versión 1.0.1**:
  - Visualización de imágenes codificadas en Base64 directamente en un visor interactivo dentro de Visual Studio Code.
  - Soporte para zoom interactivo en las imágenes utilizando un control deslizante.
  - Navegación entre capturas de pantalla mediante un carrusel de imágenes.
  - Lectura de archivos desde el disco local, permitiendo al usuario seleccionar y cargar JSONs desde su sistema de archivos.
  - Soporte para realizar llamadas a APIs RESTful, permitiendo la obtención de archivos JSON desde URLs externas.
  - La funcionalidad de visualización se activa en el modo "Viewer", permitiendo inspeccionar las imágenes seleccionadas dentro del editor.

## Instalación

1. Descarga e instala la extensión desde el Visual Studio Marketplace.
2. O bien, clona este repositorio y ejecuta la extensión localmente.

```bash
git clone https://github.com/jeffrycascate/singularity-convert.git
cd singularity-convert
npm install
code .
