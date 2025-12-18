// src/api/settingsService.js
import axios from 'axios'; // 直接引入在 main.js 中配置好的全局 axios

// 全局 axios 实例已在 main.js 中配置了 baseURL, withCredentials 等

export default {
  /**
   * 获取当前登录用户信息
   * GET /api/users/current
   */
  getUserInfo() {
    return axios.get('/api/users/current');
  },

  /**
   * 更新当前用户的个人信息 (不包括密码和头像)
   * PUT /api/users/update
   * @param {object} userInfo - 包含 name, title, department, hospital, bio 的对象
   */
  saveUserInfo(userInfo) {
    return axios.put('/api/users/update', userInfo);
  },

  /**
   * 上传用户头像
   * POST /api/users/avatar
   * @param {FormData} formData - 包含 'file' 字段的 FormData 对象
   */
  uploadUserAvatar(formData) {
    return axios.post('/api/users/avatar', formData, {
      headers: {
        // 对于 FormData, axios 通常会自动设置正确的 Content-Type
        // 'Content-Type': 'multipart/form-data', // 可以省略或保留
      },
    });
  },

  /**
   * 移除用户头像，恢复为默认
   * DELETE /api/users/avatar
   */
  removeUserAvatar() {
    return axios.delete('/api/users/avatar');
  },

  /**
   * 修改当前用户密码
   * PUT /api/users/password
   * @param {object} passwords - 包含 current 和 new 密码的对象 { current: 'xxx', new: 'yyy' }
   */
  changeUserPassword(passwords) {
    return axios.put('/api/users/password', passwords);
  },

  /**
   * 获取报告模板列表
   * GET /api/templates
   */
  getReportTemplates() {
    return axios.get('/api/templates');
  },

  /**
   * 创建新的报告模板
   * POST /api/templates
   * @param {object} templateData - 包含 name 和 content 的对象
   */
  createReportTemplate(templateData) {
    // 将前端的 content 映射到后端的 content_raw
    const dataToSend = { ...templateData, content_raw: templateData.content };
    delete dataToSend.content; // 移除前端使用的字段名
    return axios.post('/api/templates', dataToSend);
  },

  /**
   * 更新指定的报告模板
   * PUT /api/templates/:id
   * @param {number|string} id - 模板 ID
   * @param {object} templateData - 包含 name 和 content 的对象
   */
  updateReportTemplate(id, templateData) {
    // 将前端的 content 映射到后端的 content_raw
    const dataToSend = { ...templateData, content_raw: templateData.content };
    delete dataToSend.content; // 移除前端使用的字段名
    return axios.put(`/api/templates/${id}`, dataToSend);
  },

  /**
   * 删除指定的报告模板
   * DELETE /api/templates/:id
   * @param {number|string} id - 模板 ID
   */
  deleteReportTemplate(id) {
    return axios.delete(`/api/templates/${id}`);
  },

  /**
   * 设置当前用户的默认报告模板
   * PUT /api/users/settings/default-template
   * @param {object} data - 包含 templateId 的对象 { templateId: id }
   */
  setDefaultReportTemplate(data) {
    return axios.put('/api/users/settings/default-template', data);
  },

  /**
   * 获取当前用户的通知设置
   * GET /api/users/settings/notifications
   */
  getNotificationSettings() {
    return axios.get('/api/users/settings/notifications');
  },

  /**
   * 保存当前用户的通知设置
   * PUT /api/users/settings/notifications
   * @param {object} settings - 包含 types, channels, frequency 的设置对象
   */
  saveNotificationSettings(settings) {
    return axios.put('/api/users/settings/notifications', settings);
  },

  /**
   * 用户登出
   * POST /api/users/logout
   */
  logoutUser() { // 给登出接口也加上 /api 前缀 (根据你的后端代码确定)
    return axios.post('/api/users/logout');
  }

  // 注意：如果你的登录接口 /login/verifyLogin 和注册接口 /login/register
  // 在后端没有 /api 前缀，那么调用它们的函数就不需要加 /api
  // 例如:
  /*
  verifyLogin(credentials) {
    return axios.post('/login/verifyLogin', credentials);
  },
  registerUser(userData) {
    return axios.post('/login/register', userData);
  }
  */
};