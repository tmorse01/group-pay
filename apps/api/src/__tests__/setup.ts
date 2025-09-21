import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(process.cwd(), '.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
