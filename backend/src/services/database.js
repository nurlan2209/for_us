// backend/src/services/database.js
import { Low } from 'lowdb';
import path from 'path';
import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom JSON File adapter for LowDB v3 + ES modules
class JSONFileAdapter {
  constructor(filename) {
    this.filename = filename;
  }
  
  async read() {
    try {
      const data = await fs.readFile(this.filename, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }
  
  async write(data) {
    const dir = path.dirname(this.filename);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filename, JSON.stringify(data, null, 2), 'utf8');
  }
}

// Database file path
const DB_PATH = path.join(__dirname, '../../data/db.json');

// Default database structure
const defaultData = {
  users: [],
  projects: [],
  settings: {
    siteTitle: "My 3D Portfolio",
    siteDescription: "Welcome to my creative portfolio",
    contactEmail: "contact@portfolio.com",
    socialLinks: {
      github: "",
      linkedin: "",
      twitter: "",
      dribbble: ""
    },
    studio: {
      aboutText: "UNVEIL is a creative studio using technology to expand human creativity. The eye, depicted in our logo, represents our most essential tool in a world overwhelmed with visual stimuli. We collaborate across diverse industries and cultural landscapes, working with brands to translate their vision into reality through innovation. It is backed by thorough research, ensuring that our creative decisions are deliberate and meaningful. No project is too small for us, we see each one as an opportunity to express ourselves. We love what we do.",
      clients: [
        "ALL NIGHT LONG",
        "ANIMALZ",
        "ANNELIESE MICHELSON",
        "ANTHONY CALVDON",
        "ARTCODE",
        "ASSEMBLY GROUP",
        "BOILER ROOM",
        "COTY",
        "DIPLOMATS",
        "DOROTHY ST PICTURES",
        "HELIOT EMIL",
        "LEO BURNETT",
        "LVMH GAIA",
        "MINIMAXXX",
        "NFT PARIS",
        "NOVA CARSON",
        "NTO",
        "PSYCHO",
        "PUMA",
        "RED STAR FC",
        "SILENCIO",
        "TAKE AWAY",
        "VAN CLEEF & ARPELS"
      ],
      services: [
        "CREATIVE DIRECTION",
        "AI",
        "CGI",
        "GRAPHIC IDENTITY",
        "DIGITAL DESIGN",
        "STRATEGY"
      ],
      recognitions: [
        "GEN 48 EDITION #1: FINALIST",
        "GEN 48 EDITION #2: GRAND PRIX",
        "GEN 48 EDITION #3: JURY SELECTION"
      ]
    }
  }
};

let db = null;

/**
 * Initialize database and create default admin user
 */
async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');
    
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    console.log('✅ Data directory created');
    
    // Initialize LowDB with custom adapter
    const adapter = new JSONFileAdapter(DB_PATH);
    db = new Low(adapter, defaultData);
    
    // Read the database
    await db.read();
    console.log('✅ Database file read');
    
    // If database is empty, set default data
    if (!db.data) {
      db.data = defaultData;
      console.log('✅ Default data set');
    }
    
    // Ensure all collections exist
    if (!db.data.users) db.data.users = [];
    if (!db.data.projects) db.data.projects = [];
    if (!db.data.settings) db.data.settings = defaultData.settings;
    
    // Create default admin user if doesn't exist
    await createDefaultAdmin();
    
    // Write to file
    await db.write();
    
    console.log('✅ Database initialized successfully');
    console.log(`📊 Users: ${db.data.users.length}, Projects: ${db.data.projects.length}`);
    return db;
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

/**
 * Create default admin user
 */
async function createDefaultAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  // Check if admin user already exists
  const existingAdmin = db.data.users.find(user => user.username === adminUsername);
  
  if (!existingAdmin) {
    console.log('👤 Creating default admin user...');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const adminUser = {
      id: 1,
      username: adminUsername,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.data.users.push(adminUser);
    console.log(`✅ Default admin user created: ${adminUsername}`);
  } else {
    console.log(`👤 Admin user already exists: ${adminUsername}`);
  }
}

/**
 * Get database instance
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Get all users
 */
function getUsers() {
  return getDatabase().data.users;
}

/**
 * Get user by ID
 */
function getUserById(id) {
  return getUsers().find(user => user.id === parseInt(id));
}

/**
 * Get user by username
 */
function getUserByUsername(username) {
  return getUsers().find(user => user.username === username);
}

/**
 * Get all projects
 */
function getProjects() {
  return getDatabase().data.projects;
}

/**
 * Get project by ID
 */
function getProjectById(id) {
  return getProjects().find(project => project.id === parseInt(id));
}

/**
 * Add new project
 */
async function addProject(projectData) {
  const projects = getProjects();
  const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
  
  const newProject = {
    id: newId,
    ...projectData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  projects.push(newProject);
  await getDatabase().write();
  
  return newProject;
}

/**
 * Update project
 */
async function updateProject(id, updateData) {
  const projects = getProjects();
  const projectIndex = projects.findIndex(project => project.id === parseInt(id));
  
  if (projectIndex === -1) {
    throw new Error('Project not found');
  }
  
  projects[projectIndex] = {
    ...projects[projectIndex],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  await getDatabase().write();
  return projects[projectIndex];
}

/**
 * Delete project
 */
async function deleteProject(id) {
  const db = getDatabase();
  const projects = db.data.projects;
  const projectIndex = projects.findIndex(project => project.id === parseInt(id));
  
  if (projectIndex === -1) {
    throw new Error('Project not found');
  }
  
  const deletedProject = projects.splice(projectIndex, 1)[0];
  await db.write();
  
  return deletedProject;
}

/**
 * Get settings
 */
function getSettings() {
  return getDatabase().data.settings;
}

/**
 * Update settings
 */
async function updateSettings(newSettings) {
  const db = getDatabase();
  db.data.settings = { ...db.data.settings, ...newSettings };
  await db.write();
  return db.data.settings;
}

export {
  initializeDatabase,
  getDatabase,
  getUsers,
  getUserById,
  getUserByUsername,
  getProjects,
  getProjectById,
  addProject,
  updateProject,
  deleteProject,
  getSettings,
  updateSettings
};