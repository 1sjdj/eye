<template>
  <div id="app">
    <!-- 只在用户登录且不在登录/注册页面时显示导航栏 -->
    <Header v-if="shouldShowHeader" />
    
    <!-- 背景组件始终显示 -->
    <TechBackground />
    
    <!-- 主要内容区域 -->
    <div id="main" :class="{ 'has-header': shouldShowHeader }">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import Header from '@/components/Header.vue'
import TechBackground from '@/components/TechBackground.vue'

export default {
  name: 'App',
  components: {
    Header,
    TechBackground
  },
  computed: {
    // 计算属性：判断是否应该显示导航栏
    shouldShowHeader() {
      // 检查是否已登录
      const isAuthenticated = localStorage.getItem('username') && localStorage.getItem('userRole');
      // 检查当前路由是否是登录或注册页
      const isAuthPage = this.$route.path === '/' || this.$route.path === '/register';
      
      // 只有在已登录且不在登录/注册页时显示导航栏
      return isAuthenticated && !isAuthPage;
    }
  },
  watch: {
    // 监听路由变化，确保认证状态正确
    '$route'(to) {
      // 如果需要认证的页面但未登录，重定向到登录页
      if (to.meta.requiresAuth && !localStorage.getItem('username')) {
        this.$router.push('/');
      }
    }
  },
  created() {
    // 初始化时检查认证状态
    if (this.$route.meta.requiresAuth && !localStorage.getItem('username')) {
      this.$router.push('/');
    }
  }
}
</script>

<style>
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: auto;
}

#app {
  position: relative;
  min-height: 100vh;
  width: 100%;
}

#main {
  position: relative;
  z-index: 10;
  padding-top: 60px; /* 为顶部导航栏留出空间 */
  padding-bottom: 20px; /* 底部留出空间 */
  min-height: calc(100vh - 80px); /* 确保内容区域高度合适 */
  overflow-y: auto; /* 允许内容区域滚动 */
}

.login-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  position: relative;
  z-index: 10;
}

.scale-enter-active, .scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter, .scale-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

/* 当显示导航栏时，为主内容区域添加上边距 */
#main.has-header {
  padding-top: 60px; /* 根据您的导航栏高度调整 */
}

/* 确保背景组件在最底层 */
.tech-background {
  z-index: 0;
}
</style>