// scripts/seed.js - Populate database with demo data
const bcrypt = require('bcryptjs');
const db = require('../db');

console.log('🌱 Seeding database...');

// ── Zones ────────────────────────────────────────────────────────────────────
const zones = [
  { name: 'Zone A - North', description: 'Northern residential area' },
  { name: 'Zone B - South', description: 'Southern residential area' },
  { name: 'Zone C - East',  description: 'Eastern residential area' },
  { name: 'Zone D - West',  description: 'Western residential area' },
];

const insertZone = db.prepare(
  'INSERT OR IGNORE INTO zones (name, description) VALUES (?, ?)'
);
zones.forEach(z => insertZone.run(z.name, z.description));
console.log('✅ Zones seeded');

// ── Users ─────────────────────────────────────────────────────────────────────
const password = bcrypt.hashSync('password123', 10);

const users = [
  { name: 'Admin User',     email: 'admin@waste.com',    role: 'admin',    zone: null },
  { name: 'Worker Ravi',    email: 'worker1@waste.com',  role: 'worker',   zone: 'Zone A - North' },
  { name: 'Worker Priya',   email: 'worker2@waste.com',  role: 'worker',   zone: 'Zone B - South' },
  { name: 'Resident Arun',  email: 'resident1@waste.com',role: 'resident', zone: 'Zone A - North' },
  { name: 'Resident Meena', email: 'resident2@waste.com',role: 'resident', zone: 'Zone B - South' },
];

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (name, email, password, role, zone) VALUES (?, ?, ?, ?, ?)'
);
users.forEach(u => insertUser.run(u.name, u.email, password, u.role, u.zone));
console.log('✅ Users seeded');

// ── Sample Pickup Requests ────────────────────────────────────────────────────
const resident1 = db.prepare("SELECT id FROM users WHERE email = 'resident1@waste.com'").get();
const resident2 = db.prepare("SELECT id FROM users WHERE email = 'resident2@waste.com'").get();
const worker1   = db.prepare("SELECT id FROM users WHERE email = 'worker1@waste.com'").get();

const insertReq = db.prepare(`
  INSERT OR IGNORE INTO pickup_requests 
  (resident_id, zone, address, waste_type, description, status, worker_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertReq.run(resident1.id, 'Zone A - North', '12, Gandhi Street', 'general',    'Weekly garbage bags',      'pending',   null);
insertReq.run(resident1.id, 'Zone A - North', '12, Gandhi Street', 'bulky',      'Old sofa and mattress',    'assigned',  worker1.id);
insertReq.run(resident2.id, 'Zone B - South', '45, Anna Nagar',   'recyclable', 'Cardboard boxes and cans', 'completed', null);
insertReq.run(resident2.id, 'Zone B - South', '45, Anna Nagar',   'hazardous',  'Old paint cans',           'pending',   null);
console.log('✅ Sample pickup requests seeded');

console.log('\n🎉 Seed complete! Demo credentials:');
console.log('  Admin:    admin@waste.com    / password123');
console.log('  Worker:   worker1@waste.com  / password123');
console.log('  Resident: resident1@waste.com / password123');
