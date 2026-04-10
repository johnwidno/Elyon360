import api from './axios';

const worshipService = {
  // Services
  getServices: () => api.get('/worship'),
  getServiceById: (id) => api.get(`/worship/${id}`),
  getPublicServiceById: (id) => api.get(`/worship/public/${id}`),
  createService: (data) => api.post('/worship', data),
  updateService: (id, data) => api.put(`/worship/${id}`, data),
  deleteService: (id) => api.delete(`/worship/${id}`),

  // Blocks
  addBlock: (serviceId, data) => api.post(`/worship/${serviceId}/blocks`, data),
  updateBlock: (id, data) => api.put(`/worship/blocks/${id}`, data),
  deleteBlock: (id) => api.delete(`/worship/blocks/${id}`),
  reorderBlocks: (blocks) => api.put('/worship/blocks/reorder', { blocks }),

  // Sermon
  upsertSermon: (serviceId, data) => api.post(`/worship/${serviceId}/sermon`, data),

  // Songs
  getSongs: () => api.get('/worship/songs/library'),
  addSong: (data) => api.post('/worship/songs', data),

  // Comments
  getComments: (messageId) => api.get(`/worship/comments/${messageId}`),
  addComment: (data) => api.post('/worship/comments', data),
  // Media
  uploadMedia: (formData) => api.post('/worship/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default worshipService;
