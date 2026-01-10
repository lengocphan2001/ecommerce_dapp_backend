/**
 * Script to initialize database tables
 * This script temporarily enables synchronize to create tables
 * 
 * Usage: 
 *   npm run db:init
 * 
 * Or directly:
 *   ts-node -r tsconfig-paths/register scripts/init-database.ts
 */

import { DataSource } from 'typeorm';
import { User } from '../src/user/entities/user.entity';
import { Address } from '../src/user/entities/address.entity';
import { Product } from '../src/product/entities/product.entity';
import { Order } from '../src/order/entities/order.entity';
import { Commission } from '../src/affiliate/entities/commission.entity';
import { AuditLog } from '../src/audit-log/entities/audit-log.entity';

async function initializeDatabase() {
  // Environment variables should be loaded from .env file
  // Make sure .env file exists in backend directory

  const dbType = (process.env.DB_TYPE || 'postgres') as any;
  const isMySQL = dbType === 'mysql';
  
  const dataSource = new DataSource({
    type: dbType,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || (isMySQL ? '3306' : '5432'), 10),
    username: process.env.DB_USERNAME || (isMySQL ? 'root' : 'postgres'),
    password: process.env.DB_PASSWORD || (isMySQL ? 'root' : 'postgres'),
    database: process.env.DB_NAME || 'ecommerce_dapp',
    entities: [User, Address, Product, Order, Commission, AuditLog],
    synchronize: true, // Enable synchronize to create tables
    logging: true,
  });

  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Database connected successfully!');
    
    console.log('Synchronizing database schema...');
    await dataSource.synchronize();
    console.log('Database tables created successfully!');
    
    await dataSource.destroy();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
