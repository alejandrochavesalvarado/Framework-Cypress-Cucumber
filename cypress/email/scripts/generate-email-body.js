const fs = require('fs');
const path = require('path');

// Obtener datos de las variables de entorno pasadas por el pipeline
const status = process.env.STATUS || 'desconocido';
const totalPassed = parseInt(process.env.TOTAL_PASSED || '0', 10);
const totalFailed = parseInt(process.env.TOTAL_FAILED || '0', 10);
const pagesUrl = process.env.PAGES_URL || '#';
const cloudUrl = process.env.CLOUD_URL || '#';

const totalTests = totalPassed + totalFailed;

// Leer la plantilla HTML desde su ubicación correcta
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

console.log('Cuerpo del correo generado exitosamente en email-body.html');