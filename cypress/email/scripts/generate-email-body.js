const fs = require('fs');
const path = require('path');

/**
 * Lee los archivos de reporte .json del directorio 'cypress/reports',
 * cuenta el número de escenarios pasados y fallidos, y devuelve los totales.
 * Esta versión está ajustada para funcionar correctamente dentro del workflow de GitHub Actions
 * al leer el reporte desde un artifact descargado.
 */
function getTestResults() {
    // --- RUTA CORREGIDA Y DEFINITIVA ---
    // Esta ruta funciona porque el artifact se descarga en 'cypress/reports',
    // y el script se ejecuta desde 'cypress/email/scripts'.
    const reportsDir = path.join(__dirname, '..', '..', 'reports');
    let totalPassed = 0;
    let totalFailed = 0;

    try {
        console.log(`Buscando archivos de reporte en el directorio: ${reportsDir}`);
        const reportFiles = fs.readdirSync(reportsDir).filter(file => file.endsWith('.json'));

        if (reportFiles.length === 0) {
            console.log('ADVERTENCIA: No se encontraron archivos .json en el directorio de reportes.');
            return { totalPassed: 0, totalFailed: 0 };
        }

        console.log(`Archivos .json encontrados: ${reportFiles.join(', ')}`);

        for (const file of reportFiles) {
            // Se añade un bloque try/catch individual para que un archivo
            // dañado no detenga todo el proceso.
            try {
                const filePath = path.join(reportsDir, file);
                const reportData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                if (!Array.isArray(reportData)) {
                    console.log(`ADVERTENCIA: El archivo ${file} no contiene un arreglo y será ignorado.`);
                    continue;
                }

                reportData.forEach(feature => {
                    if (feature.elements) {
                        feature.elements.forEach(scenario => {
                            let scenarioFailed = false;
                            if (scenario.steps) {
                                scenario.steps.forEach(step => {
                                    if (step.result && step.result.status === 'failed') {
                                        scenarioFailed = true;
                                    }
                                });
                            }
                            if (scenarioFailed) {
                                totalFailed++;
                            } else {
                                totalPassed++;
                            }
                        });
                    }
                });
            } catch (error) {
                console.error(`ERROR: No se pudo procesar el archivo de reporte "${file}". Será ignorado.`);
            }
        }
    } catch (e) {
        console.error(`ERROR CRÍTICO: No se pudo leer el directorio de reportes: ${reportsDir}.`, e);
    }

    return { totalPassed, totalFailed };
}

// --- LÓGICA PRINCIPAL DEL SCRIPT ---

const status = process.env.STATUS || 'desconocido';
const pagesUrl = process.env.PAGES_URL || '#';
const cloudUrl = process.env.CLOUD_URL || '#';

const { totalPassed, totalFailed } = getTestResults();
const totalTests = totalPassed + totalFailed;

const templatePath = path.join(__dirname, '..', 'templates', 'email-template.html');
let emailTemplate = fs.readFileSync(templatePath, 'utf-8');

emailTemplate = emailTemplate.replace(/{{status}}/g, status === 'success' ? 'Éxito' : 'Fallo');
emailTemplate = emailTemplate.replace(/{{statusColor}}/g, status === 'success' ? '#28a745' : '#dc3545');
emailTemplate = emailTemplate.replace('{{totalPassed}}', totalPassed);
emailTemplate = emailTemplate.replace('{{totalFailed}}', totalFailed);
emailTemplate = emailTemplate.replace('{{totalTests}}', totalTests);
emailTemplate = emailTemplate.replace('{{pagesReportUrl}}', pagesUrl);
emailTemplate = emailTemplate.replace('{{cypressCloudUrl}}', cloudUrl);

// Se define la ruta de salida para guardar el archivo en la raíz del proyecto.
const outputPath = path.join(__dirname, '..', '..', '..', 'email-body.html');
fs.writeFileSync(outputPath, emailTemplate);

console.log(`Cuerpo del correo generado en: ${outputPath}`);
console.log(`Resultados finales: ${totalPassed} Pasadas, ${totalFailed} Fallidas, ${totalTests} Totales.`);