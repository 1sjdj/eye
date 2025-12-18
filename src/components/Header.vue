<template>
  <div id="header">
    <!-- 左侧 Logo -->
    <div id="header-left">
      <img src="@/assets/logo.png" alt="Logo" class="logo" />
    </div>
    <!-- 中间导航栏 -->
    <div id="header-nav">
      <div
          :class="['header-nav-item', $route.path === item.path ? 'active' : '', 'cool-border']"
          @click="routerChange(item.path)"
          v-for="item in filteredRoutes"
          :key="item.path"
      >
        <router-link class="nav content" :to="item.path">
          {{ item.meta.name }}
        </router-link>
        <!-- 四个装饰角 -->
        <div :class="[$route.path === item.path ? 'top-left' : '', 'corner']"></div>
        <div :class="[$route.path === item.path ? 'top-right' : '', 'corner']"></div>
        <div :class="[$route.path === item.path ? 'bottom-left' : '', 'corner']"></div>
        <div :class="[$route.path === item.path ? 'bottom-right' : '', 'corner']"></div>
      </div>
    </div>
    <!-- 右侧时间显示 -->
    <div id="header-time">
      {{ currentDateTime }}
    </div>
    <div class="Login" @click="handleLogout">
      退出
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      routerLink: [],
      currentDateTime: '', 
      interval: null  // 添加interval引用
    };
  },
  computed: {
    filteredRoutes() {
      // 只显示有name属性且用户有权限访问的路由
      return this.routerLink.filter(route => {
        return route.meta && route.meta.name && this.hasPermission(route);
      });
    },
    currentUser() {
      return {
        username: localStorage.getItem('username'),
        role: localStorage.getItem('userRole')
      };
    }
  },
  methods: {
     // --- 新增 getCurrentDateTime 方法 ---
     getCurrentDateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      // 返回你想要的日期时间格式
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    // 添加权限检查方法
    hasPermission(route) {
      if (!route.meta || !route.meta.roles) return true;
      return route.meta.roles.includes(this.currentUser.role);
    },
    
    handleLogout() {
      // 先清除本地存储的所有认证信息
      localStorage.removeItem('username');
      localStorage.removeItem('userRole');
      
      // 调用后端登出接口
      this.$axios.post('/api/users/logout')
        .then(() => {
          this.$message.success('已退出登录');
          // 使用 Vue Router 导航回登录页
          this.$router.push('/');
        })
        .catch(err => {
          console.error('登出错误:', err);
          this.$message.warning('登出请求失败，但已清除本地登录状态');
          // 即使后端请求失败，也要确保前端登出
          this.$router.push('/');
        });
    },
    
    routerChange(path) {
      if (path === this.$route.path) return;  // 避免重复导航
      this.$router.push(path);
    }
  },
  created() {
    this.routerLink = this.$router.options.routes;
    // --- 在 created 中首次设置时间 ---
    this.currentDateTime = this.getCurrentDateTime();
    // --- 设置定时器 ---
    this.interval = setInterval(() => {
      this.currentDateTime = this.getCurrentDateTime();
    }, 1000);
  },
  beforeDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
};
</script>

<style lang="less" scoped>
#header {
  display: flex;
  padding: 10px 50px;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: rgba(5, 18, 49, 0.8);
  backdrop-filter: blur(5px);
  height: 60px;

  #header-left {
    display: flex;
    align-items: center;

    .logo {
      height: 100px; // 根据 Logo 图片大小调整高度
      width: auto; // 保持图片比例
    }
  }

  #header-nav {
    display: flex;
    margin-left: 50px;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }

    .header-nav-item {
      margin-right: 18px;
      padding: 8px 20px;
      border: 1px solid transparent;
      border-radius: 80px;
      white-space: nowrap;
    }

    .header-nav-item.active {
      background: #1b2d4a;
    }

    .nav {
      text-decoration: none;
      color: #52a2e4;
      font-size: 15px;
    }
  }

  #header-time {
    color: #52a2e4;
    font-size: 17px;
    margin-left: auto;
    margin-right: 20px;
  }
}

/* 登录注册按钮容器样式 */
.Login {
  text-decoration: none;
  color: #52a2e4;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-weight: 500;
  letter-spacing: 0.5px;
  padding: 5px 15px;
}

/* 鼠标悬停状态 */
.Login:hover {
  color: #6ab7ff;
  transform: translateY(-1px);

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -4px;
    height: 2px;
    background: linear-gradient(90deg, #6ab7ff 0%, #52a2e4 100%);
    animation: underline 0.3s forwards;
  }
}

/* 点击状态 */
.Login:active {
  transform: translateY(1px);
  color: #3d8bc9;
}

/* 下划线动画 */
@keyframes underline {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* 角落装饰 */
.corner {
  position: absolute;
  width: 0;
  height: 0;
  border: 0px solid transparent;
}

.top-left {
  top: 0;
  left: 0;
  border-top-color: #fff;
  border-left-color: #fff;
}
.top-right {
  top: 0;
  right: 0;
  border-top-color: #fff;
  border-right-color: #fff;
}
.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom-color: #fff;
  border-left-color: #fff;
}
.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom-color: #fff;
  border-right-color: #fff;
}

.content {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>