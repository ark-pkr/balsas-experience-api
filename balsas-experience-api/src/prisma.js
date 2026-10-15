import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '../../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
// O adaptador é quem conversa com o PostgreSQL. Da versão 7 em diante ele é obrigatório
config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// Uma instância para o processo inteiro: cada PrismaClient abre um pool de conexões
export const prisma = new PrismaClient({ adapter });
