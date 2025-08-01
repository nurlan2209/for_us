// backend/src/routes/projects.js - ОБНОВЛЕННАЯ ВЕРСИЯ с releaseDate
import express from 'express';
import { z } from 'zod';
import { 
  getProjects, 
  getProjectById, 
  addProject, 
  updateProject, 
  deleteProject 
} from '../services/database.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { deleteFile } from '../services/minio.js';

const router = express.Router();

// Validation schemas
const mediaFileSchema = z.object({
  id: z.union([z.string(), z.number()]),
  url: z.string().url('Must be a valid URL'),
  type: z.enum(['image', 'video', 'gif']),
  name: z.string().optional(),
  size: z.number().optional(),
  caption: z.string().optional(),
  thumbnail: z.string().url().optional(),
  alt: z.string().optional(),
});

const customButtonSchema = z.object({
  text: z.string().min(1, 'Button text required'),
  url: z.string().url('Must be a valid URL'),
});

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  technologies: z.string().min(1, 'Technologies are required').max(200, 'Technologies list too long'),
  category: z.string().min(1, 'Category is required').max(50, 'Category name too long'),
  
  // ✅ НОВОЕ ПОЛЕ: Дата выхода
  releaseDate: z.string().min(1, 'Release date is required'),
  
  // Legacy support
  imageUrl: z.string().url('Must be a valid URL').optional(),
  projectUrl: z.string().url('Must be a valid URL').optional(),
  githubUrl: z.string().url('Must be a valid URL').optional(),
  
  // New fields
  mediaFiles: z.array(mediaFileSchema).optional().default([]),
  customButtons: z.array(customButtonSchema).optional().default([]),
  
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
    const { status = 'published', category, limit, offset = 0 } = req.query;
    
    let projects = getProjects();
    
    // Filter by status (default: published only)
    if (status !== 'all') {
      projects = projects.filter(project => project.status === status);
    }
    
    // Filter by category
    if (category && category !== 'ALL') {
      projects = projects.filter(project => project.category === category);
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
 * GET /api/projects/categories
 * Get all unique categories from published projects
 */
router.get('/categories', (req, res) => {
  try {
    const projects = getProjects().filter(project => project.status === 'published');
    const categories = [...new Set(projects.map(project => project.category).filter(Boolean))];
    
    res.json({ categories });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch categories'
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
    
    // ✅ Валидация даты выхода
    try {
      const releaseDate = new Date(projectData.releaseDate);
      if (isNaN(releaseDate.getTime())) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid release date format'
        });
      }
      // Сохраняем как ISO строку
      projectData.releaseDate = releaseDate.toISOString();
    } catch (dateError) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid release date'
      });
    }
    
    // Ensure mediaFiles is initialized
    if (!projectData.mediaFiles) {
      projectData.mediaFiles = [];
    }
    
    // Ensure customButtons is initialized
    if (!projectData.customButtons) {
      projectData.customButtons = [];
    }
    
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
    
    // ✅ Валидация даты выхода при обновлении
    if (updateData.releaseDate) {
      try {
        const releaseDate = new Date(updateData.releaseDate);
        if (isNaN(releaseDate.getTime())) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'Invalid release date format'
          });
        }
        updateData.releaseDate = releaseDate.toISOString();
      } catch (dateError) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid release date'
        });
      }
    }
    
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
    
    // Clean up associated files
    const filesToDelete = [];
    
    // Legacy image cleanup
    if (project.imageUrl && project.imageUrl.includes('minio')) {
      try {
        const urlParts = project.imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          filesToDelete.push(`images/${fileName}`);
        }
      } catch (fileError) {
        console.error('Error preparing legacy image for deletion:', fileError);
      }
    }
    
    // Media files cleanup
    if (project.mediaFiles && Array.isArray(project.mediaFiles)) {
      project.mediaFiles.forEach(mediaFile => {
        if (mediaFile.url && mediaFile.url.includes('minio')) {
          try {
            const urlParts = mediaFile.url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            if (fileName) {
              filesToDelete.push(`images/${fileName}`);
            }
          } catch (fileError) {
            console.error('Error preparing media file for deletion:', fileError);
          }
        }
        
        // Clean up thumbnails
        if (mediaFile.thumbnail && mediaFile.thumbnail.includes('minio')) {
          try {
            const urlParts = mediaFile.thumbnail.split('/');
            const fileName = urlParts[urlParts.length - 1];
            if (fileName) {
              filesToDelete.push(`images/${fileName}`);
            }
          } catch (fileError) {
            console.error('Error preparing thumbnail for deletion:', fileError);
          }
        }
      });
    }
    
    // Delete files from MinIO
    for (const fileName of filesToDelete) {
      try {
        await deleteFile(fileName);
      } catch (fileError) {
        console.error(`Error deleting file ${fileName}:`, fileError);
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

export default router;