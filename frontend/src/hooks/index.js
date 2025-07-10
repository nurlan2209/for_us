// frontend/src/hooks/index.js
export { default as useAuth } from './useAuth';
export { 
  useProjects, 
  useProject, 
  useAdminProjects, 
  useCreateProject, 
  useUpdateProject, 
  useDeleteProject 
} from './useProjects';
export { 
  useUploadImage, 
  useUploadDocument, 
  useUploadMultiple, 
  useDeleteFile, 
  useDragAndDrop 
} from './useUpload';
export { 
  useLocalStorage, 
  useLocalStorageListener 
} from './useLocalStorage';