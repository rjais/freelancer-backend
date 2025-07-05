const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let serviceAccount;

try {
  // Try to get service account from environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  }
  // Try to get from file path
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }
} catch (error) {
  console.error('Error loading Firebase service account:', error);
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'people-e6485',
  });
} else {
  // Fallback for development (not recommended for production)
  console.warn('No Firebase service account found. Using default initialization.');
  admin.initializeApp({
    projectId: 'people-e6485',
  });
}

module.exports = admin; 