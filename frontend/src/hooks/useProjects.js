// frontend/src/hooks/useProjects.js
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { projectsAPI } from '../utils/api';
import toast from 'react-hot-toast';

// Получение всех проектов (публичных)
export const useProjects = (filters = {}) => {
  return useQuery(
    ['projects', filters],
    () => projectsAPI.getAll(filters),
    {
      select: (response) => response.data.projects,
      staleTime: 5 * 60 * 1000, // 5 минут
    }
  );
};

// Получение проекта по ID
export const useProject = (id) => {
  return useQuery(
    ['project', id],
    () => projectsAPI.getById(id),
    {
      select: (response) => response.data.project,
      enabled: !!id,
    }
  );
};

// Получение всех проектов для админа
export const useAdminProjects = () => {
  return useQuery(
    'admin-projects',
    () => projectsAPI.adminGetAll(),
    {
      select: (response) => response.data.projects,
    }
  );
};

// Создание проекта
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (projectData) => projectsAPI.create(projectData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-projects');
        queryClient.invalidateQueries('projects');
        toast.success('Проект создан успешно!');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Ошибка при создании проекта';
        toast.error(message);
      },
    }
  );
};

// Обновление проекта
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }) => projectsAPI.update(id, data),
    {
      onSuccess: (response, { id }) => {
        queryClient.invalidateQueries('admin-projects');
        queryClient.invalidateQueries('projects');
        queryClient.invalidateQueries(['project', id]);
        toast.success('Проект обновлен успешно!');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Ошибка при обновлении проекта';
        toast.error(message);
      },
    }
  );
};

// Удаление проекта
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (projectId) => projectsAPI.delete(projectId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-projects');
        queryClient.invalidateQueries('projects');
        toast.success('Проект удален успешно!');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Ошибка при удалении проекта';
        toast.error(message);
      },
    }
  );
};