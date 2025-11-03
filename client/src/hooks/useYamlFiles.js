import { useState, useCallback } from 'react';
import apiService from '../services/apiService';
import { useAuth } from './useAuth';

export const useYamlFiles = () => {
  const [savedGraphs, setSavedGraphs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Load saved graphs from backend
  const loadSavedGraphs = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedGraphs([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getMyYamlFiles();
      const graphs = response.yamlFiles.map(file => ({
        id: file._id,
        title: file.title,
        description: file.description,
        content: file.content,
        shareId: file.shareId,
        isPublic: file.isPublic,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        tags: file.tags || []
      }));
      setSavedGraphs(graphs);
    } catch (err) {
      console.error('Failed to load saved graphs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Save a new graph
  const saveGraph = useCallback(async (graphData) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required to save graphs');
    }

    // Refresh the API service token to ensure it's up to date
    apiService.refreshToken();

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.saveYamlFile({
        title: graphData.title,
        content: graphData.yamlContent,
        description: graphData.description || '',
        isPublic: graphData.isPublic || false,
        tags: graphData.tags || []
      });

      const newGraph = {
        id: response.yamlFile.id,
        title: response.yamlFile.title,
        description: graphData.description || '',
        content: graphData.yamlContent, // Use the content we sent
        shareId: response.yamlFile.shareId,
        isPublic: response.yamlFile.isPublic || graphData.isPublic,
        createdAt: response.yamlFile.createdAt,
        updatedAt: response.yamlFile.createdAt, // Use createdAt for new files
        tags: graphData.tags || []
      };

      setSavedGraphs(prev => [newGraph, ...prev]);
      return newGraph;
    } catch (err) {
      console.error('Failed to save graph:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update an existing graph
  const updateGraph = useCallback(async (id, graphData) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required to update graphs');
    }

    // Refresh the API service token to ensure it's up to date
    apiService.refreshToken();

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.updateYamlFile(id, {
        title: graphData.title,
        content: graphData.yamlContent,
        description: graphData.description || '',
        isPublic: graphData.isPublic || false,
        tags: graphData.tags || []
      });

      const updatedGraph = {
        id: response.yamlFile.id || id, // Use id from response or fallback to the one we sent
        title: response.yamlFile.title,
        description: graphData.description || '',
        content: graphData.yamlContent, // Use the content we sent, not from response
        shareId: response.yamlFile.shareId,
        isPublic: response.yamlFile.isPublic || graphData.isPublic,
        createdAt: response.yamlFile.createdAt || (prev => prev.find(g => g.id === id)?.createdAt) || new Date().toISOString(),
        updatedAt: response.yamlFile.updatedAt,
        tags: graphData.tags || []
      };

      setSavedGraphs(prev => {
        const existingGraph = prev.find(g => g.id === id);
        const finalGraph = {
          ...updatedGraph,
          // Ensure we preserve original createdAt if backend doesn't send it
          createdAt: response.yamlFile.createdAt || existingGraph?.createdAt || updatedGraph.createdAt
        };
        return prev.map(graph => graph.id === id ? finalGraph : graph);
      });

      return updatedGraph;
    } catch (err) {
      console.error('Failed to update graph:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Delete a graph
  const deleteGraph = useCallback(async (id) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required to delete graphs');
    }

    // Refresh the API service token to ensure it's up to date
    apiService.refreshToken();

    setLoading(true);
    setError(null);

    try {
      await apiService.deleteYamlFile(id);
      setSavedGraphs(prev => prev.filter(graph => graph.id !== id));
    } catch (err) {
      console.error('Failed to delete graph:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load a shared graph
  const loadSharedGraph = useCallback(async (shareId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getSharedYamlFile(shareId);
      return {
        id: response.yamlFile._id,
        title: response.yamlFile.title,
        description: response.yamlFile.description,
        content: response.yamlFile.content,
        shareId: response.yamlFile.shareId,
        isPublic: response.yamlFile.isPublic,
        createdAt: response.yamlFile.createdAt,
        updatedAt: response.yamlFile.updatedAt,
        tags: response.yamlFile.tags || [],
        owner: response.yamlFile.owner
      };
    } catch (err) {
      console.error('Failed to load shared graph:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear saved graphs (for logout)
  const clearSavedGraphs = useCallback(() => {
    setSavedGraphs([]);
    setError(null);
  }, []);

  return {
    savedGraphs,
    loading,
    error,
    loadSavedGraphs,
    saveGraph,
    updateGraph,
    deleteGraph,
    loadSharedGraph,
    clearSavedGraphs,
  };
};