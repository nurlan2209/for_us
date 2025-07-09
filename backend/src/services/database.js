// backend/src/services/database.js
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');

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
    }
  }
};

let db = null;

/**
 * Initialize database and create default admin user
 */
async function initializeDatabase() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    // Initialize LowDB
    const adapter = new JSONFile(DB_PATH);
    db = new Low(adapter, defaultData);
    
    // Read the database
    await db.read();
    
    // If database is empty, set default data
    if (!db.data) {
      db.data = defaultData;
    }
    
    // Ensure all collections exist
    if (!db.data.users) db.data.users = [];
    if (!db.data.projects) db.data.projects = [];
    if (!db.data.settings) db.data.settings = defaultData.settings;
    
    // Create default admin user if doesn't exist
    await createDefaultAdmin();
    
    // Write to file
    await db.write();
    
    console.log('Database initialized successfully');
    return db;
    
  } catch (error) {
    console.error('Error initializing database:', error);
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
    console.log(`Default admin user created: ${adminUsername}`);
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

module.exports = {
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