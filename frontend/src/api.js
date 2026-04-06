import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const res = await api.post('/auth/login', formData);
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  }
};

export const classroomAPI = {
  getClassrooms: async () => {
    const res = await api.get('/classrooms');
    return res.data;
  },
  createClassroom: async (name) => {
    const res = await api.post('/classrooms', { name });
    return res.data;
  },
  joinClassroom: async (join_code) => {
    const res = await api.post('/classrooms/join', { join_code });
    return res.data;
  },
  getDetails: async (id) => {
    const res = await api.get(`/classrooms/${id}`);
    return res.data;
  },
  getLeaderboard: async (classroom_id) => {
    const res = await api.get(`/classrooms/${classroom_id}/leaderboard`);
    return res.data;
  }
};

export const contentAPI = {
  uploadDocument: async (classroom_id, file, description) => {
    const formData = new FormData();
    formData.append('classroom_id', classroom_id);
    formData.append('file', file);
    formData.append('description', description);
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  chat: async (message, classroom_id) => {
    const res = await api.post('/chat', { message, classroom_id });
    return res.data;
  }
};

export const assignmentAPI = {
  createAssignment: async (data) => {
    const res = await api.post('/assignments', data);
    return res.data;
  },
  submitAssignment: async (assignment_id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/assignments/${assignment_id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getSubmissions: async (classroom_id, assignment_id) => {
    const res = await api.get(`/classrooms/${classroom_id}/assignments/${assignment_id}/submissions`);
    return res.data;
  },
  getMySubmissions: async (classroom_id) => {
    const res = await api.get(`/classrooms/${classroom_id}/my-submissions`);
    return res.data;
  }
};

export const quizAPI = {
  generate: async (topic, classroom_id, difficulty, num_questions) => {
    const res = await api.post('/quiz/generate', { topic, classroom_id, difficulty, num_questions });
    return res.data;
  },
  submit: async (topic, classroom_id, difficulty, submitted_answers, original_quiz) => {
    const res = await api.post('/quiz/submit', {
      topic,
      classroom_id,
      difficulty,
      submitted_answers,
      original_quiz
    });
    return res.data;
  }
};

export const notesAPI = {
  getNotes: async (classroom_id) => {
    const res = await api.get(`/classrooms/${classroom_id}/notes`);
    return res.data;
  },
  addNote: async (classroom_id, noteData) => {
    const res = await api.post(`/classrooms/${classroom_id}/notes`, noteData);
    return res.data;
  }
};

export default api;
