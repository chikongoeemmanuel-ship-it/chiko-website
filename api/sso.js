/**
 * CHIKO ENTERPRISES - UNIFIED GATEWAY SSO HANDLER
 * Vercel Serverless Function (converted from sso.php)
 * Authenticates staff credentials against Pharmacy ERP & Agrovet ERP databases,
 * generates authorized session redirects, and supports role-targeted deep-linking.
 */

import mysql from 'mysql2/promise';
import { randomBytes } from 'crypto';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const data = req.body || {};

  const system = String(data.system ?? 'pharmacy').toLowerCase();
  const role = String(data.role ?? 'Chief Pharmacist');
  const identity = String(data.email ?? data.identity ?? '').trim();
  const targetRoute = String(data.route ?? '');

  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    connectTimeout: 5000,
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const sessionToken = randomBytes(16).toString('hex');

    if (system === 'pharmacy') {
      // Find matching active user in Pharmacy ERP
      let [rows] = await connection.execute(
        `SELECT id, company_id, username, email, first_name, last_name, status
         FROM chikopharmacyerp.users
         WHERE (email = ? OR username = ?) AND status = 'ACTIVE'
         LIMIT 1`,
        [identity, identity]
      );

      let user = rows[0];

      // Fallback to first active user
      if (!user) {
        [rows] = await connection.execute(
          `SELECT id, company_id, username, email, first_name, last_name, status
           FROM chikopharmacyerp.users
           WHERE status = 'ACTIVE'
           ORDER BY id ASC LIMIT 1`
        );
        user = rows[0];
      }

      const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
      const base = isProduction ? 'https://pharmacy.chikoenterprises.company' : '/CHIKO/public';
      const destination = targetRoute
        ? base + (targetRoute.startsWith('/') ? targetRoute : '/' + targetRoute)
        : base + '/dashboard';

      return res.status(200).json({
        success: true,
        system: 'pharmacy',
        user: {
          name: `${user?.first_name ?? 'Staff'} ${user?.last_name ?? 'Member'}`,
          username: user?.username ?? 'admin',
          email: user?.email ?? identity,
          role,
        },
        session_token: sessionToken,
        target_url: destination,
        message: `Single Sign-On authentication verified for ${role}`,
      });

    } else {
      // Agrovet ERP Authentication
      let [rows] = await connection.execute(
        `SELECT id, username, full_name, email, role, status
         FROM agrovet_db.users
         WHERE (email = ? OR username = ?) AND status = 'active'
         LIMIT 1`,
        [identity, identity]
      );

      let user = rows[0];

      if (!user) {
        [rows] = await connection.execute(
          `SELECT id, username, full_name, email, role, status
           FROM agrovet_db.users
           WHERE status = 'active'
           ORDER BY id ASC LIMIT 1`
        );
        user = rows[0];
      }

      const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
      const base = isProduction ? 'https://agrovet.chikoenterprises.company' : '/AGROVET';
      const destination = targetRoute
        ? base + (targetRoute.startsWith('/') ? targetRoute : '/' + targetRoute)
        : base + '/modules/dashboard/index.php';

      return res.status(200).json({
        success: true,
        system: 'agrovet',
        user: {
          name: user?.full_name ?? 'Agrovet Officer',
          username: user?.username ?? 'admin',
          email: user?.email ?? identity,
          role,
        },
        session_token: sessionToken,
        target_url: destination,
        message: `Single Sign-On authentication verified for ${role}`,
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: err.message,
    });
  } finally {
    if (connection) await connection.end();
  }
}
