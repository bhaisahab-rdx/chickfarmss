// Test script to verify environment variables
import 'dotenv/config';

console.log('Environment Variable Test');
console.log('------------------------');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'is set (value hidden)' : 'not set');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'is set (value hidden)' : 'not set');
console.log('NOWPAYMENTS_API_KEY:', process.env.NOWPAYMENTS_API_KEY ? 'is set (value hidden)' : 'not set');
console.log('NOWPAYMENTS_IPN_SECRET_KEY:', process.env.NOWPAYMENTS_IPN_SECRET_KEY ? 'is set (value hidden)' : 'not set');