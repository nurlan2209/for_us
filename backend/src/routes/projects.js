// backend/src/routes/projects.js
const express = require('express');
const { z } = require('zod');
const { 
  getProjects, 
  getProjectById, 
  addProject, 
  updateProject, 
  deleteProject 
} = require('../services/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { deleteFile } = require('../services/minio');

const router = express.Router();

// Validation schemas
const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  technologies: z.string().min(1, 'Technologies are required').max(200, 'Technologies list too long'),
  imageUrl: z.string().url('Must be a valid URL').optional(),
  projectUrl: z.string().url('Must be a valid URL').optional(),
  githubUrl: z.string().url('Must be a valid URL').optional(),
  featured: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published', 'archived']).optional().default('published'),
  sortOrder: z.number().int().min(0).optional().default(0)
});

const updateProjectSchema = projectSchema.partial();

/**
 * GET /api/projects
 * Get all projects (public endpoint)
 */
router.get('/', (req, res) => {
  try {
    const { status = 'published', featured, limit, offset = 0 } = req.query;
    
    let projects = getProjects();
    
    // Filter by status (default: published only)
    if (status !== 'all') {
      projects = projects.filter(project => project.status === status);
    }
    
    // Filter by featured
    if (featured === 'true') {
      projects = projects.filter(project => project.featured === true);
    }
    
    // Sort by sortOrder, then by createdAt (newest first)
    projects.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Apply pagination
    const totalCount = projects.length;
    const startIndex = parseInt(offset);
    const endIndex = limit ? startIndex + parseInt(limit) : projects.length;
    
    projects = projects.slice(startIndex, endIndex);
    
    res.json({
      projects,
      pagination: {
        total: totalCount,
        offset: startIndex,
        limit: limit ? parseInt(limit) : null,
        hasMore: endIndex < totalCount
      }
    });
    
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch projects'
    });
  }
});

/**
 * GET /api/projects/:id
 * Get single project by ID (public endpoint)
 */
router.get('/:id', (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Project ID must be a number'
      });
    }
    
    const project = getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: `Project with ID ${projectId} does not exist`
      });
    }
    
    // Only show published projects to non-admin users
    if (project.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project is not available'
      });
    }
    
    res.json({ project });
    
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch project'
    });
  }
});

/**
 * POST /api/projects
 * Create new project (admin only)
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Validate request body
    const validationResult = projectSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid project data',
        details: validationResult.error.errors
      });
    }
    
    const projectData = validationResult.data;
    
    // Add project to database
    const newProject = await addProject(projectData);
    
    res.status(201).json({
      message: 'Project created successfully',
      project: newProject
    });
    
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create project'
    });
  }
});

/**
 * PUT /api/projects/:id
 * Update project (admin only)
 */
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Project ID must be a number'
      });
    }
    
    // Validate request body
    const validationResult = updateProjectSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid project data',
        details: validationResult.error.errors
      });
    }
    
    const updateData = validationResult.data;
    
    // Update project in database
    const updatedProject = await updateProject(projectId, updateData);
    
    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
    
  } catch (error) {
    console.error('Update project error:', error);
    
    if (error.message === 'Project not found') {
      return res.status(404).json({
        error: 'Project not found',
        message: `Project with ID ${req.params.id} does not exist`
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update project'
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project (admin only)
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Project ID must be a number'
      });
    }
    
    // Get project before deletion (to clean up files)
    const project = getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: `Project with ID ${projectId} does not exist`
      });
    }
    
    // Delete project from database
    const deletedProject = await deleteProject(projectId);
    
    // Clean up associated files (if any)
    if (project.imageUrl && project.imageUrl.includes('minio')) {
      try {
        // Extract filename from URL
        const urlParts = project.imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          await deleteFile(`images/${fileName}`);
        }
      } catch (fileError) {
        console.error('Error deleting project image:', fileError);
        // Don't fail the entire operation if file deletion fails
      }
    }
    
    res.json({
      message: 'Project deleted successfully',
      project: deletedProject
    });
    
  } catch (error) {
    console.error('Delete project error:', error);
    
    if (error.message === 'Project not found') {
      return res.status(404).json({
        error: 'Project not found',
        message: `Project with ID ${req.params.id} does not exist`
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete project'
    });
  }
});

/**
 * GET /api/projects/admin/all
 * Get all projects including drafts and archived (admin only)
 */
router.get('/admin/all', verifyToken, requireAdmin, (req, res) => {
  try {
    const projects = getProjects();
    
    // Sort by sortOrder, then by updatedAt (newest first)
    projects.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    
    res.json({ projects });
    
  } catch (error) {
    console.error('Get admin projects error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch projects'
    });
  }
});

module.exports = router;