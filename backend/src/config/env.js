import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'campus-qa-super-secret-jwt-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  institutionDomain: process.env.INSTITUTION_EMAIL_DOMAIN || 'university.edu',
  institutionName: process.env.INSTITUTION_NAME || 'Northfield Institute of Technology',
  databaseUrl: process.env.DATABASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
  useInMemoryDb: process.env.USE_IN_MEMORY_DB === 'true' || !process.env.DATABASE_URL,
};
