const fs = require('fs');
const path = require('path');

// --- FUNCIÓN PARA CONTAR RESULTADOS DESDE LOS ARCHIVOS JSON (VERSIÓN CORREGIDA) ---
function getTestResults() {
    // Se define la ruta al directorio que contiene los reportes.
    const reportsDir = path.join(__dirname, '..', '..', 'reports');
    let totalPassed = 0;
    let totalFailed = 0;

    // Se leen todos los archivos que terminen en .json dentro del directorio de reportes.
    const reportFiles = fs.readdirSync(reportsDir).filter(file => file.endsWith('.json'));

    // Se itera sobre cada archivo de reporte encontrado.
    for (const file of reportFiles) {
        // El bloque try...catch se usa para procesar cada archivo de forma independiente.
        // Si un archivo falla, el script no se detendrá y continuará con los demás.
        try {
            const filePath = path.join(reportsDir, file);
            const reportData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            // Se valida que el contenido del JSON sea un arreglo.
            // Si no lo es, se ignora el archivo y se pasa al siguiente.
            if (!Array.isArray(reportData)) {
                console.log(`ADVERTENCIA: El archivo ${file} no contiene un arreglo de features y será ignorado.`);
                continue; // Salta a la siguiente iteración del bucle.
            }

            // Iterar sobre cada "feature" en el archivo JSON.
            reportData.forEach(feature => {
                // Se verifica que la feature contenga scenarios (elements).
                if (feature.elements) {
                    feature.elements.forEach(scenario => {
                        let scenarioFailed = false;
                        // Se verifica que el scenario contenga pasos (steps).
                        if (scenario.steps) {
                            scenario.steps.forEach(step => {
                                // Se busca si algún paso ha fallado.
                                if (step.result && step.result.status === 'failed') {
                                    scenarioFailed = true;
                                }
                            });
                        }
                        // Se incrementa el contador correspondiente.
                        if (scenarioFailed) {
                            totalFailed++;
                        } else {
                            totalPassed++;
                        }
                    });
                }
            });
        } catch (error) {
            // Si ocurre un error al leer o procesar un archivo, se reporta y se ignora.
            console.error(`ERROR: No se pudo procesar el archivo de reporte "${file}". Será ignorado.`, error);
        }
    }

    return { totalPassed, totalFailed };
}
// --- FIN DE LA FUNCIÓN ---


// Obtener datos de las variables de entorno pasadas por el pipeline.
const status = process.env.STATUS || 'desconocido';
const pagesUrl = process.env.PAGES_URL || '#';
const cloudUrl = process.env.CLOUD_URL || '#';

// Llamar a la función para obtener los resultados de las pruebas.
const { totalPassed, totalFailed } = getTestResults();
const totalTests = totalPassed + totalFailed;

// Leer la plantilla HTML del correo.
const templatePath = path.join(__dirname, '..', 'templates', 'email-template.html');
let emailTemplate = fs.readFileSync(templatePath, 'utf-8');

// Reemplazar los placeholders en la plantilla con los datos reales.
emailTemplate = emailTemplate.replace(/{{status}}/g, status === 'success' ? 'Éxito' : 'Fallo');
emailTemplate = emailTemplate.replace(/{{statusColor}}/g, status === 'success' ? '#28a745' : '#dc3545');
emailTemplate = emailTemplate.replace('{{totalPassed}}', totalPassed);
emailTemplate = emailTemplate.replace('{{totalFailed}}', totalFailed);
emailTemplate = emailTemplate.replace('{{totalTests}}', totalTests);
emailTemplate = emailTemplate.replace('{{pagesReportUrl}}', pagesUrl);
emailTemplate = emailTemplate.replace('{{cypressCloudUrl}}', cloudUrl);

// Guardar el cuerpo del correo procesado en un archivo para que el siguiente paso del pipeline lo use.
const outputPath = path.join(__dirname, '..', '..', 'email-body.html');
fs.writeFileSync(outputPath, emailTemplate);

console.log('Cuerpo del correo generado exitosamente en:', outputPath);
console.log(`Resultados: ${totalPassed} Pasadas, ${totalFailed} Fallidas, ${totalTests} Totales.`);