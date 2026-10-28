import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import Enquiry from './models/Enquiry.js';
import Project from './models/Project.js';
import TeamMember from './models/TeamMember.js';

const app = express();
const port = Number(process.env.PORT) || 5000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientBuild = path.join(root, 'client', 'dist');
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

function normalizeProjects(projects) {
  return projects.map(project => ({
    ...project,
    categories: Array.isArray(project.categories) && project.categories.length
      ? project.categories
      : project.category ? [project.category] : []
  }));
}

// Helper to load sample/seed data directly from JS files
async function loadDataFile(filename, variableName) {
  try {
    const context = { window: {} };
    const source = await fs.readFile(path.join(root, filename), 'utf8');
    vm.runInNewContext(source, context, { filename });
    const records = context.window[variableName];
    if (Array.isArray(records)) {
      return JSON.parse(JSON.stringify(records));
    }
  } catch (error) {
    console.error(`Could not read fallback data from ${filename}:`, error.message);
  }
  return [];
}

app.get('/api/health', (_req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    database: isDbConnected ? 'connected' : 'disconnected (using local storage fallback)'
  });
});

app.get('/api/projects', async (_req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let projects = await Project.find().sort({ createdAt: 1 }).select('-_id -__v').lean();
      if (!projects || projects.length === 0) {
        const seedProjects = await loadDataFile('projects-data.js', 'NEXORA_PROJECT_DATA');
        if (seedProjects.length > 0) {
          await Project.insertMany(seedProjects).catch(() => {});
          projects = seedProjects;
        }
      }
      return res.json(normalizeProjects(projects));
    }
    // Fallback if MongoDB is not connected
    const fallbackProjects = await loadDataFile('projects-data.js', 'NEXORA_PROJECT_DATA');
    res.json(normalizeProjects(fallbackProjects));
  } catch (error) {
    next(error);
  }
});

app.get('/api/team', async (_req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let members = await TeamMember.find().sort({ createdAt: 1 }).select('-_id -__v').lean();
      if (!members || members.length === 0) {
        const seedTeam = await loadDataFile('team-data.js', 'NEXORA_TEAM_DATA');
        if (seedTeam.length > 0) {
          await TeamMember.insertMany(seedTeam).catch(() => {});
          members = seedTeam;
        }
      }
      return res.json(members);
    }
    // Fallback if MongoDB is not connected
    const fallbackTeam = await loadDataFile('team-data.js', 'NEXORA_TEAM_DATA');
    res.json(fallbackTeam);
  } catch (error) {
    next(error);
  }
});

app.post('/api/enquiries', async (req, res, next) => {
  const { name, email, company = '', interest = 'general', message, _honey = '' } = req.body ?? {};

  if (_honey) {
    return res.status(400).json({ message: 'The enquiry could not be accepted.' });
  }
  if (typeof name !== 'string' || !name.trim()
    || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || typeof company !== 'string'
    || typeof message !== 'string' || !message.trim()
    || typeof interest !== 'string') {
    return res.status(400).json({ message: 'Enter a valid name, email address, and message.' });
  }

  try {
    if (mongoose.connection.readyState === 1) {
      await Enquiry.create({ name, email, company, interest, message });
    } else {
      // Persist to local JSON file when MongoDB is offline
      const dataDir = path.join(root, 'server', 'data');
      await fs.mkdir(dataDir, { recursive: true }).catch(() => {});
      const enquiriesPath = path.join(dataDir, 'enquiries.json');
      let enquiries = [];
      try {
        const fileContent = await fs.readFile(enquiriesPath, 'utf8');
        enquiries = JSON.parse(fileContent);
      } catch {
        enquiries = [];
      }
      enquiries.push({
        name,
        email,
        company,
        interest,
        message,
        createdAt: new Date().toISOString()
      });
      await fs.writeFile(enquiriesPath, JSON.stringify(enquiries, null, 2), 'utf8').catch(err => {
        console.warn('Could not write enquiries.json to disk:', err.message);
      });
    }

    res.status(201).json({
      saved: true,
      message: 'Your enquiry was saved.'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check the enquiry fields and try again.' });
    }
    next(error);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }));
app.get('/app.js', (_req, res) => res.sendFile(path.join(root, 'app.js')));
app.get('/styles.css', (_req, res) => res.sendFile(path.join(root, 'styles.css')));
app.get('/projects-data.js', (_req, res) => res.sendFile(path.join(root, 'projects-data.js')));
app.get('/team-data.js', (_req, res) => res.sendFile(path.join(root, 'team-data.js')));
app.use(express.static(clientBuild));
app.get(/.*/, (_req, res, next) => {
  res.sendFile(path.join(clientBuild, 'index.html'), error => {
    if (error) next(error);
  });
});

app.use((error, _req, res, _next) => {
  console.error('Request failed:', error);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

app.listen(port, () => {
  console.log(`Nexora API listening on http://localhost:${port}`);
  if (!process.env.MONGODB_URI) {
    console.log('Notice: MONGODB_URI is not set. Running with local storage fallback.');
    return;
  }
  mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
    .then(() => console.log('Connected to MongoDB.'))
    .catch(error => {
      console.warn(`MongoDB not available (${error.message}). Running with local storage fallback.`);
    });
});
