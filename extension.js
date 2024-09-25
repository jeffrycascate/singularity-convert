const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
    let disposable = vscode.commands.registerCommand('singularity-convert.convert', async function () {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;
            const content = document.getText();
            
            try {
                // Parsear el contenido del archivo como JSON
                const jsonData = JSON.parse(content);

                // Verificar si el JSON es una lista (array)
                if (Array.isArray(jsonData)) {
                    // Crear un conjunto para guardar todas las propiedades únicas
                    const propertySet = new Set();

                    // Iterar sobre todos los objetos en el array y obtener sus propiedades
                    jsonData.forEach((item) => {
                        Object.keys(item).forEach(property => propertySet.add(property));
                    });

                    // Convertir el conjunto de propiedades a una lista
                    const properties = Array.from(propertySet);

                    // Mostrar un QuickPick para que el usuario seleccione una propiedad
                    vscode.window.showQuickPick(properties, {
                        placeHolder: 'Selecciona una propiedad para trabajar'
                    }).then(async selectedProperty => {
                        if (selectedProperty) {
                            vscode.window.showInformationMessage(`Propiedad seleccionada: ${selectedProperty}`);

                            // Si la propiedad seleccionada es 'Screenshot', solicitamos una carpeta donde guardar los archivos
                            if (selectedProperty === 'Screenshot') {
                                const folderUri = await vscode.window.showOpenDialog({
                                    canSelectFiles: false,
                                    canSelectFolders: true,
                                    canSelectMany: false,
                                    openLabel: 'Seleccionar carpeta para guardar las capturas'
                                });

                                if (folderUri && folderUri.length > 0) {
                                    const selectedFolderPath = folderUri[0].fsPath;

                                    // Procesar la propiedad seleccionada para cada objeto
                                    jsonData.forEach((item, index) => {
                                        const value = item[selectedProperty];

                                        if (value) {
                                            // Convertir la cadena base64 a binario
                                            const buffer = Buffer.from(value, 'base64');
                                            
                                            // Guardar el archivo como PNG en la carpeta seleccionada
                                            const filePath = path.join(selectedFolderPath, `screenshot_${index + 1}.png`);
                                            fs.writeFileSync(filePath, buffer);

                                            vscode.window.showInformationMessage(`Archivo guardado: ${filePath}`);
                                        }
                                    });
                                } else {
                                    vscode.window.showErrorMessage('No se seleccionó ninguna carpeta.');
                                }
                            }
                        }
                    });
                } else {
                    vscode.window.showErrorMessage('El archivo JSON no contiene una lista.');
                }
            } catch (error) {
                vscode.window.showErrorMessage('El archivo no es un JSON válido o ocurrió un error al procesarlo.');
            }
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
