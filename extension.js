const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const https = require('https');

class MyWebviewViewProvider {
    constructor(context) {
        this.context = context;
        this.panel = null;
        this.jsonData = null; // Guardamos el JSON leído aquí
    }

    async resolveWebviewView(webviewView, context, token) {
        webviewView.webview.options = {
            enableScripts: true
        };

        const html = this.getWebviewContent();
        webviewView.webview.html = html;

        webviewView.webview.onDidReceiveMessage(async message => {
            if (message.command === 'openFileDialog') {
                // Abrir diálogo para seleccionar un archivo
                const fileUri = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    openLabel: 'Selecciona un archivo'
                });

                if (fileUri && fileUri[0]) {
                    webviewView.webview.postMessage({
                        command: 'setFilePath',
                        path: fileUri[0].fsPath
                    });
                }
            } else if (message.command === 'readPath') {
                const pathInput = message.path;

                if (fs.existsSync(pathInput)) {
                    fs.readFile(pathInput, 'utf8', (err, data) => {
                        if (err) {
                            vscode.window.showErrorMessage('Error al leer el archivo: ' + err.message);
                            return;
                        }

                        const editor = vscode.window.activeTextEditor;
                        if (editor) {
                            const jsonData = JSON.parse(data);
                            this.jsonData = jsonData; // Guardamos el JSON
                            const prettyJson = JSON.stringify(jsonData, null, 2);

                            editor.edit(editBuilder => {
                                const document = editor.document;
                                const lastLine = document.lineAt(document.lineCount - 1);
                                const range = new vscode.Range(new vscode.Position(0, 0), lastLine.range.end);
                                editBuilder.replace(range, prettyJson);
                            });

                            vscode.window.showInformationMessage('Contenido del archivo insertado en el editor.');

                            const properties = this.extractPropertiesFromJson(jsonData);
                            const itemCount = Array.isArray(jsonData) ? jsonData.length : 0;

                            webviewView.webview.postMessage({
                                command: 'updateProperties',
                                properties: properties,
                                itemCount: itemCount
                            });
                        }
                    });
                } else if (this.isValidUrl(pathInput)) {
                    this.fetchFromUrl(pathInput, (err, data) => {
                        if (err) {
                            vscode.window.showErrorMessage('Error al obtener datos de la URL: ' + err.message);
                            return;
                        }

                        const editor = vscode.window.activeTextEditor;
                        if (editor) {
                            const jsonData = JSON.parse(data);
                            this.jsonData = jsonData; // Guardamos el JSON
                            const prettyJson = JSON.stringify(jsonData, null, 2);

                            editor.edit(editBuilder => {
                                const document = editor.document;
                                const lastLine = document.lineAt(document.lineCount - 1);
                                const range = new vscode.Range(new vscode.Position(0, 0), lastLine.range.end);
                                editBuilder.replace(range, prettyJson);
                            });

                            vscode.window.showInformationMessage('Contenido de la URL insertado en el editor.');

                            const properties = this.extractPropertiesFromJson(jsonData);
                            const itemCount = Array.isArray(jsonData) ? jsonData.length : 0;

                            webviewView.webview.postMessage({
                                command: 'updateProperties',
                                properties: properties,
                                itemCount: itemCount
                            });
                        }
                    });
                } else {
                    vscode.window.showErrorMessage('El path no es válido ni una URL.');
                }
            } else if (message.command === 'saveImages') {
                const property = message.property;
                const jsonData = this.jsonData;
                const images = jsonData.map(item => item[property]);

                const folderUri = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: 'Selecciona una carpeta para guardar las imágenes'
                });

                if (folderUri && folderUri[0]) {
                    const folderPath = folderUri[0].fsPath;

                    images.forEach((imageData, index) => {
                        if (typeof imageData === 'string') {
                            let base64Data;
                            if (imageData.startsWith('data:image')) {
                                // Si el string incluye el prefijo 'data:image'
                                base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
                            } else {
                                // Si el string ya es Base64 sin prefijo
                                base64Data = imageData;
                            }

                            const buffer = Buffer.from(base64Data, 'base64');
                            const filePath = path.join(folderPath, `image_${index + 1}.png`);
                            fs.writeFileSync(filePath, buffer);
                            vscode.window.showInformationMessage(`Imagen guardada: ${filePath}`);
                        } else {
                            vscode.window.showErrorMessage(`El formato de los datos de imagen no es compatible para la propiedad ${property}.`);
                        }
                    });
                } else {
                    vscode.window.showErrorMessage('No se seleccionó ninguna carpeta.');
                }
            } else if (message.command === 'showViewer') {
                // Leer la propiedad seleccionada
                const property = message.property;
                const jsonData = this.jsonData;

                if (jsonData && property) {
                    const selectedData = jsonData.map(item => item[property]);
                    this.openViewer(selectedData);
                } else {
                    vscode.window.showErrorMessage('No se pudo mostrar la propiedad seleccionada.');
                }
            }
        });
    }

    openViewer(contentArray) {
        const panel = vscode.window.createWebviewPanel(
            'viewerPanel', // Identificador del tipo de panel
            'Visualizador', // Título del panel
            vscode.ViewColumn.Beside, // Abrir al lado
            {
                enableScripts: true
            }
        );

        // Definir la ruta donde está el archivo HTML
        const htmlFilePath = path.join(this.context.extensionPath, 'media', 'carousel_viewer.html');

        // Leer el archivo HTML
        let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

        // Generar el contenido del carrusel con las imágenes en base64
        const imagesHtml = contentArray.map((imageData, index) => {
            return `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <img src="data:image/png;base64,${imageData}" class="d-block w-100" alt="Imagen ${index + 1}">
        </div>`;
        }).join('');

        // Insertar las imágenes dentro del HTML leído
        htmlContent = htmlContent.replace('<!-- IMAGES_PLACEHOLDER -->', imagesHtml);

        // Cargar el archivo HTML en el WebviewPanel
        panel.webview.html = htmlContent;
    }


    // Verificar si un string es una URL válida
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (err) {
            return false;
        }
    }

    // Función para realizar una solicitud GET a una URL
    fetchFromUrl(url, callback) {
        const options = { rejectUnauthorized: false };

        https.get(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    callback(null, data);
                } else {
                    callback(new Error(`Error ${res.statusCode}: ${res.statusMessage}`));
                }
            });
        }).on('error', (err) => {
            callback(err);
        });
    }

    // Cargar el contenido HTML desde el archivo `template.html`
    getWebviewContent() {
        const templatePath = path.join(this.context.extensionPath, 'media', 'template.html');
        return fs.readFileSync(templatePath, 'utf8');
    }

    // Extraer las propiedades del JSON
    extractPropertiesFromJson(jsonData) {
        let allProperties = new Set();

        if (Array.isArray(jsonData)) {
            jsonData.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    Object.keys(item).forEach(prop => allProperties.add(prop));
                }
            });
        } else if (typeof jsonData === 'object' && jsonData !== null) {
            Object.keys(jsonData).forEach(prop => allProperties.add(prop));
        }

        return Array.from(allProperties);
    }
}

function activate(context) {
    const provider = new MyWebviewViewProvider(context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('myView', provider)
    );
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
