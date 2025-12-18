// --- main.js ---
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import DataV from '@jiaminghi/data-view'
import axios from 'axios' // 引入全局 axios
import "swiper/swiper.min.css"
import * as echarts from 'echarts'
import "@/utils/echarts-wordcloud.min.js"

// --- 配置 axios 全局默认设置 ---
// 设置后端 API 的基础 URL (确保这是你 Flask 后端的正确地址和端口)
axios.defaults.baseURL = process.env.VUE_APP_API_URL || 'http://localhost:5000';

// 设置默认请求头
axios.defaults.headers.common['Content-Type'] = 'application/json'; // 默认 JSON
axios.defaults.headers.post['Content-Type'] = 'application/json'; // POST 请求也默认 JSON

// 设置请求超时时间
axios.defaults.timeout = 60000; // 60 秒

// *** 允许跨域请求携带凭证 (非常重要，用于 Session Cookie) ***
axios.defaults.withCredentials = true;

// --- 请求拦截器 (保持不变) ---
axios.interceptors.request.use(
  config => {
    // 可以在这里添加逻辑，例如从 localStorage 读取 token 并添加到 headers
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// --- 响应拦截器 (保持不变) ---
axios.interceptors.response.use(
  response => {
    // 可以对成功的响应进行处理，例如只返回 data 部分
    // return response.data; // 但这里我们选择返回完整响应，避免破坏性更改
    return response;
  },
  error => {
    // 统一错误处理
    const status = error.response?.status;
    let errorMessage = '发生未知错误';

    if (status === 401) {
      errorMessage = error.response?.data?.error || error.response?.data?.msg || '未授权或登录已过期，请重新登录';
      // 可以在这里触发跳转到登录页的逻辑
      // store.dispatch('auth/logout'); // 假设你有 Vuex store
      // router.push('/login');
      console.warn("需要重新登录:", errorMessage);
    } else if (status === 403) {
      errorMessage = error.response?.data?.error || error.response?.data?.msg || '无权访问此资源';
      console.warn("访问权限不足:", errorMessage);
    } else if (status === 404) {
      errorMessage = `请求的资源未找到 (${error.config.url})`;
      console.error("资源未找到:", errorMessage);
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = '请求超时，请稍后重试';
      console.error("请求超时");
    } else if (!error.response) {
      errorMessage = '网络错误，请检查您的网络连接';
      console.error("网络错误:", error.message);
    } else {
      errorMessage = error.response?.data?.error || error.response?.data?.msg || `请求失败，状态码: ${status}`;
      console.error(`API错误 (状态码 ${status}):`, errorMessage);
    }

    // 可以考虑在这里用 $message 提示用户，但可能会过于频繁
    // Vue.prototype.$message.error(errorMessage);

    return Promise.reject(error); // 继续抛出错误
  }
);

// --- 将配置好的全局 axios 挂载到 Vue 原型链 ---
Vue.prototype.$http = axios; // $http 常用别名
Vue.prototype.$axios = axios; // $axios 也是常用别名

Vue.config.productionTip = false

Vue.use(ElementUI, { size: 'small' })
Vue.use(DataV)

Vue.prototype.$echarts = echarts

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')