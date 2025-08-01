// backend/src/services/database.js - ОБНОВЛЕННАЯ ВЕРСИЯ с миграцией releaseDate
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
    studio: {
      aboutText: "",
      clients: [],
      services: [],
      recognitions: []
    },
    contact: {
      contactButtons: []
    }
  }
};

let db = null;

/**
 * ✅ МИГРАЦИЯ: Добавляет releaseDate к существующим проектам
 */
async function migrateDatabase() {
  if (!db || !db.data || !db.data.projects) return;
  
  console.log('🔄 Checking for database migrations...');
  
  let needsMigration = false;
  
  // Проверяем каждый проект на наличие releaseDate
  db.data.projects.forEach((project, index) => {
    if (!project.releaseDate) {
      needsMigration = true;
      
      // Используем createdAt как fallback для releaseDate
      const fallbackDate = project.createdAt || new Date().toISOString();
      db.data.projects[index].releaseDate = fallbackDate;
      
      console.log(`✅ Migrated project "${project.title}" - added releaseDate: ${fallbackDate}`);
    }
  });
  
  if (needsMigration) {
    await db.write();
    console.log('✅ Database migration completed - releaseDate field added to projects');
  } else {
    console.log('✅ No migration needed - all projects have releaseDate field');
  }
}

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
    
    // Ensure studio field exists
    if (!db.data.settings.studio) {
      db.data.settings.studio = {
        aboutText: "",
        clients: [],
        services: [],
        recognitions: []
      };
    }
    
    // Ensure contact field exists
    if (!db.data.settings.contact) {
      db.data.settings.contact = { contactButtons: [] };
    }
    
    // ✅ ВЫПОЛНЯЕМ МИГРАЦИЮ
    await migrateDatabase();
    
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
  
  // ✅ Убеждаемся что releaseDate есть
  if (!newProject.releaseDate) {
    newProject.releaseDate = newProject.createdAt;
  }
  
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
  
  // ✅ Убеждаемся что releaseDate есть при обновлении
  if (!projects[projectIndex].releaseDate && projects[projectIndex].createdAt) {
    projects[projectIndex].releaseDate = projects[projectIndex].createdAt;
  }
  
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
  const settings = getDatabase().data.settings;
  
  // Ensure studio field exists
  if (!settings.studio) {
    settings.studio = {
      aboutText: "",
      clients: [],
      services: [],
      recognitions: []
    };
  }
  
  // Ensure contact field exists
  if (!settings.contact) {
    settings.contact = { contactButtons: [] };
  }
  
  return settings;
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