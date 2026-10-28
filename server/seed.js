import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import Project from './models/Project.js';
import TeamMember from './models/TeamMember.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadLegacyData(filename, variableName) {
  const context = { window: {} };
  const source = await fs.readFile(path.join(root, filename), 'utf8');
  vm.runInNewContext(source, context, { filename });
  const records = context.window[variableName];
  if (!Array.isArray(records)) {
    throw new Error(`${filename} must define ${variableName} as an array.`);
  }
  return JSON.parse(JSON.stringify(records));
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Set it in your .env file before seeding.');
  }
  console.log(`Connecting to MongoDB at ${process.env.MONGODB_URI}...`);
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const [projects, team] = await Promise.all([
    loadLegacyData('projects-data.js', 'NEXORA_PROJECT_DATA'),
    loadLegacyData('team-data.js', 'NEXORA_TEAM_DATA')
  ]);
  await Promise.all([
    Project.deleteMany({}),
    TeamMember.deleteMany({})
  ]);
  await Promise.all([
    Project.insertMany(projects),
    TeamMember.insertMany(team)
  ]);
  console.log(`Successfully imported ${projects.length} projects and ${team.length} team profiles into MongoDB.`);
}

seed()
  .catch(error => {
    console.error('\nMongoDB seed notice:');
    if (error.name === 'MongooseServerSelectionError') {
      console.error(`Could not connect to MongoDB server. Ensure your MongoDB service is running (e.g. 'net start MongoDB' or start mongod), or check MONGODB_URI in .env.`);
      console.error(`Note: The web application has automatic fallback to local seed data and will continue to work without seeding.`);
    } else {
      console.error(error.message || error);
    }
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
