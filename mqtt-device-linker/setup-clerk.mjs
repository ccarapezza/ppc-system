#!/usr/bin/env node
// Configurador de Clerk para mqtt-device-linker
import readline from 'readline';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(text) {
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
}

async function configureClerk() {
  console.log('\n🔐 Configurador de Autenticación Clerk 🔐\n');
  console.log('Este script te ayudará a configurar la autenticación Clerk en tu aplicación.\n');
  
  console.log('1. Primero, necesitamos tu clave publicable (Publishable Key) de Clerk');
  console.log('   La puedes encontrar en https://dashboard.clerk.dev/');
  const publishableKey = await question('   Ingresa tu Publishable Key (pk_test_...): ');
  
  console.log('\n2. Ahora, necesitamos tu clave secreta (Secret Key) de Clerk');
  const secretKey = await question('   Ingresa tu Secret Key (sk_test_...): ');
  
  // Extrae el dominio del publishableKey (pk_test_<dominio>_...)
  let domain = 'clerk.accounts.dev';
  try {
    domain = publishableKey.split('_')[2];
  } catch (e) {
    console.log('⚠️  No se pudo extraer el dominio de la clave publicable. Usando valor por defecto.');
  }
  
  console.log(`\n3. Tu dominio de Clerk es: ${domain}`);
  const confirmDomain = await question('   ¿Es correcto? (s/n): ');
  
  let finalDomain = domain;
  if (confirmDomain.toLowerCase() !== 's' && confirmDomain.toLowerCase() !== 'si') {
    finalDomain = await question('   Ingresa tu dominio correcto: ');
  }
  
  // Crear archivo .env
  const envContent = `# Credenciales de Clerk - Configurado automáticamente
CLERK_PUBLISHABLE_KEY=${publishableKey}
CLERK_SECRET_KEY=${secretKey}
CLERK_DOMAIN=${finalDomain}
`;

  try {
    await fs.writeFile(path.join(__dirname, '.env'), envContent);
    console.log('\n✅ Archivo .env creado correctamente');
    
    // Actualizar el index.html para usar index-clerk.html
    try {
      await fs.copyFile(
        path.join(__dirname, 'public', 'index-clerk.html'), 
        path.join(__dirname, 'public', 'index.html')
      );
      console.log('✅ Frontend configurado con autenticación Clerk');
    } catch (e) {
      console.error('❌ Error al actualizar el archivo index.html:', e);
    }
    
    console.log('\n🚀 Configuración completada. Ahora puedes iniciar el servidor con autenticación Clerk:');
    console.log('   npm run start:clerk\n');
    
  } catch (e) {
    console.error('❌ Error al crear el archivo .env:', e);
  }
  
  rl.close();
}

configureClerk().catch(console.error);
