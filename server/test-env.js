// server/test-env.js
const dotenv = require('dotenv');

console.log('--- Starting Environment Variable Test ---');

// Attempt to load the .env file from the current directory
const result = dotenv.config();

if (result.error) {
  console.error('ERROR reading .env file:', result.error);
} else {
  console.log('.env file seems to be loaded!');
  console.log('Here are the variables found:', result.parsed);
}

console.log('--- Checking specifically for SMTP_HOST ---');
console.log('The value of process.env.SMTP_HOST is:', process.env.SMTP_HOST);

if (process.env.SMTP_HOST) {
  console.log('✅ SUCCESS: The SMTP_HOST variable was found!');
} else {
  console.log('❌ FAILURE: The SMTP_HOST variable is undefined. This confirms the problem is with your .env file name, location, or content.');
}
console.log('--- End of Test ---');