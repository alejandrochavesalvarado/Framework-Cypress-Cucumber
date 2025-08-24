const fs = require('fs');
const path = require('path');

// --- NUEVA FUNCIÓN PARA CONTAR RESULTADOS DESDE LOS ARCHIVOS JSON ---
function getTestResults() {
    const reportsDir = path.join(__dirname, '..', '..', 'reports');
    let totalPassed = 0;
    let totalFailed = 0;

    try {
        const reportFiles = fs.readdirSync(reportsDir).filter(file => file.endsWith('.json'));

        for (const file of reportFiles) {
            const filePath = path.join(reportsDir, file);
            const reportData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            // Iterar sobre cada "feature" en el archivo JSON
            reportData.forEach(feature => {
                // Iterar sobre cada "scenario" dentro de la feature
                feature.elements.forEach(scenario => {
                    let scenarioFailed = false;
                    // Revisar cada "step" del scenario
                    scenario.steps.forEach(step => {
                        if (step.result && step.result.status === 'failed') {
                            scenarioFailed = true;
                        }
                    });

                    if (scenarioFailed) {
                        totalFailed++;
                    } else {
                        totalPassed++;
                    }
                });
            });
        }
    } catch (error) {
        console.error("No se pudieron procesar los archivos de reporte JSON.", error);
        // Si no se encuentran reportes, los totales permanecerán en 0.
    }

    return { totalPassed, totalFailed };
}
// --- FIN DE LA NUEVA FUNCIÓN ---


// Obtener datos de las variables de entorno pasadas por el pipeline
const status = process.env.STATUS || 'desconocido';
const pagesUrl = process.env.PAGES_URL || '#';
const cloudUrl = process.env.CLOUD_URL || '#';

// Llamar a la nueva función para obtener los resultados
const { totalPassed, totalFailed } = getTestResults();
const totalTests = totalPassed + totalFailed;

// Leer la plantilla HTML
const templatePath = path.join(__dirname, '..', 'templates', 'email-template.html');
let emailTemplate = fs.readFileSync(templatePath, 'utf-8');

// Reemplazar los placeholders con los datos reales
emailTemplate = emailTemplate.replace(/{{status}}/g, status === 'success' ? 'Éxito' : 'Fallo');
emailTemplate = emailTemplate.replace(/{{statusColor}}/g, status === 'success' ? '#28a745' : '#dc3545');
emailTemplate = emailTemplate.replace('{{totalPassed}}', totalPassed);
emailTemplate = emailTemplate.replace('{{totalFailed}}', totalFailed);
emailTemplate = emailTemplate.replace('{{totalTests}}', totalTests);
emailTemplate = emailTemplate.replace('{{pagesReportUrl}}', pagesUrl);
emailTemplate = emailTemplate.replace('{{cypressCloudUrl}}', cloudUrl);

// Guardar el cuerpo del correo en un nuevo archivo que usará el pipeline
fs.writeFileSync('email-body.html', emailTemplate);

console.log(`Cuerpo del correo generado. Pasadas: ${totalPassed}, Fallidas: ${totalFailed}`);