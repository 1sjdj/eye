<template>
  <div class="lear-wrapper">
    <div class="lear-login">
      <div class="login-center1">
        <div class="tech-header">
          <div class="tech-line left"></div>
          <h1><span class="highlight">明眸八疾 眼疾识别系统</span></h1>
          <div class="tech-line right"></div>
        </div>

        <el-form ref="loginForm" :model="loginForm" :rules="rules">
          <!-- 用户名 -->
          <el-form-item prop="username">
            <el-input
                v-model="loginForm.username"
                placeholder="请输入您的用户名"
                prefix-icon="el-icon-user"
            ></el-input>
          </el-form-item>

          <!-- 密码 -->
          <el-form-item prop="password">
            <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="el-icon-lock"
                @keyup.enter.native="verifyLogin"
            ></el-input>
          </el-form-item>

          <!-- 验证码 -->
          <el-form-item prop="captcha" class="captcha-item">
            <el-row :gutter="20">
              <el-col :span="14">
                <el-input
                    v-model="loginForm.captcha"
                    placeholder="请输入验证码"
                    @blur="verifyCaptcha"
                ></el-input>
              </el-col>
              <el-col :span="10">
                <canvas
                    id="canvas"
                    width="140"
                    height="65"
                    @click="refreshCaptcha"
                ></canvas>
              </el-col>
            </el-row>
          </el-form-item>

          <!-- 登录按钮 -->
          <el-form-item> <!-- 移除了冒号 -->
            <el-button
                type="primary"
                class="analyze-button"
                :loading="loading"
                @click="verifyLogin"
            >
                <span v-if="!loading">立即登录</span>
                <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="register-link">
          <router-link to="/register">还没有账号？去注册</router-link>
        </div>
      </div>
    </div>
    <transition name="fade">
      <div class="loading-container" v-if="loading">
        <div class="loading-spinner">
          <div class="double-bounce1"></div>
          <div class="double-bounce2"></div>
        </div>
        <div class="loading-text">登录中...</div>
      </div>
    </transition>
  </div>
</template>

<script>
// import md5 from 'js-md5'; // <-- 不再需要前端 MD5

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: '', // <-- 存储明文密码
        captcha: ''
      },
      show_num: [],
      loading: false,
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度在3到20个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          // 如果后端没有强制密码长度，可以放宽前端限制，但至少要求非空
          // { min: 6, max: 20, message: '密码长度在6到20个字符', trigger: 'blur' }
        ],
        captcha: [
          { required: true, message: '请输入验证码', trigger: 'blur' }
        ]
      }
    };
  },
  mounted() {
    this.drawPic();
  },
  methods: {
    drawPic() {
      // --- 保持不变 ---
      const canvas = document.getElementById('canvas');
      const width = canvas.width;
      const height = canvas.height;
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = this.randomColor(220, 250); // 调整背景色范围，使其更柔和
      ctx.fillRect(0, 0, width, height);

      const sCode = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; // 移除了容易混淆的 1, l, 0, o, I
      const aCode = sCode.split("");
      this.show_num = [];

      // 增加干扰线
      for (let j = 0; j < 5; j++) {
        ctx.strokeStyle = this.randomColor(180, 230);
        ctx.beginPath();
        ctx.moveTo(this.randomNum(0, width), this.randomNum(0, height));
        ctx.lineTo(this.randomNum(0, width), this.randomNum(0, height));
        ctx.stroke();
      }
       // 增加干扰点
      for (let k = 0; k < 30; k++) {
          ctx.fillStyle = this.randomColor(150, 200);
          ctx.beginPath();
          ctx.arc(this.randomNum(0, width), this.randomNum(0, height), 1, 0, 2 * Math.PI);
          ctx.fill();
      }

      for (let i = 0; i < 4; i++) {
        const txt = aCode[this.randomNum(0, aCode.length)];
        this.show_num.push(txt.toLowerCase()); // 仍然使用小写比较
        ctx.fillStyle = this.randomColor(50, 160);
        ctx.font = `bold ${this.randomNum(28, 36)}px Arial`; // 字体调整
        const x = 15 + i * (width / 4.5); // 调整字符间距
        const y = this.randomNum(35, 55); // 调整垂直位置
        const deg = this.randomNum(-15, 15); // 减小旋转角度

        ctx.translate(x, y);
        ctx.rotate(deg * Math.PI / 180);
        ctx.fillText(txt, 0, 0);
        ctx.rotate(-deg * Math.PI / 180);
        ctx.translate(-x, -y);
      }
    },

    refreshCaptcha() {
      this.drawPic();
      this.loginForm.captcha = '';
    },

    randomNum(min, max) {
      // --- 保持不变 ---
      return Math.floor(Math.random() * (max - min) + min);
    },

    randomColor(min, max) {
      // --- 保持不变 ---
      const r = this.randomNum(min, max);
      const g = this.randomNum(min, max);
      const b = this.randomNum(min, max);
      return `rgb(${r},${g},${b})`;
    },

    verifyCaptcha() {
      // --- 保持不变 ---
      const captcha_num = this.loginForm.captcha.toLowerCase();
      const real_num = this.show_num.join('');

      if (!captcha_num) {
        return false; // 返回 false 或其他表示未验证的值
      }
      // 可以在这里添加一个简单的长度检查
      if (captcha_num.length !== 4) {
           console.warn('Captcha input length mismatch');
           // 可以选择在这里提示用户，或者让后续逻辑处理
           // return false;
      }
      return captcha_num === real_num;
    },

    verifyLogin() {
      this.$refs.loginForm.validate(valid => {
        if (!valid) {
          this.$message.warning('请完善登录信息');
          return;
        }

        if (!this.verifyCaptcha()) {
          this.$message.warning('验证码错误，请重新输入');
          this.refreshCaptcha();
          return;
        }

        this.loading = true;

        // --- 修改: 直接调用 handleLogin，不再需要先验证用户名 ---
        // 后端登录接口会同时验证用户名和密码
        this.handleLogin();

        // --- 移除旧的用户名验证逻辑 ---
        // this.$axios.get(`/login/loginVerifyUsername/${this.loginForm.username}`)
        //   .then(res => { ... })
        //   .catch(err => { ... });
      });
    },

    handleLogin() {
      // --- 修改: 发送明文密码 ---
      const loginData = {
        username: this.loginForm.username,
        password: this.loginForm.password // 直接发送明文密码
      };

      // --- 修改: 使用 POST 方法，将数据放在请求体中 ---
      this.$axios.post('/login/verifyLogin', loginData) // 第二个参数是请求体
        .then(res => {
          // 后端成功响应 (HTTP 200 OK)
          if (res.data.code === 100) {
            // 登录成功 (根据后端返回的 code 判断)
            localStorage.setItem('username', this.loginForm.username);
            localStorage.setItem('userRole', res.data.extend.role || 'user'); // 使用后端返回的角色

             // 添加登录成功的动画类
            const loginCenter = document.querySelector('.login-center1');
            if (loginCenter) {
                loginCenter.classList.add('login-success');
            } else {
                 console.warn("Could not find '.login-center1' element for animation.");
            }


            // 显示成功提示
            this.$message({
              message: '登录成功',
              type: 'success',
              duration: 1500 // 保持提示时间
            });

            // 延迟跳转，等待动画完成
            setTimeout(() => {
               this.$router.push('/dashboard'); // 跳转到后端指定的 URL 或默认 dashboard
            }, 800); // 增加延迟以匹配动画时间

          } else {
            // 后端返回了自定义的错误 code (例如密码错误、用户不存在等)
            // 注意：后端现在统一返回 401，所以这里可能不会执行
            this.$message.error(res.data.msg || '登录失败，请检查用户名或密码');
            this.refreshCaptcha();
             this.loading = false; // 明确停止 loading
          }
        })
        .catch(err => {
          // 处理 HTTP 错误 (例如 401 Unauthorized, 400 Bad Request, 500 Internal Server Error)
          console.error('登录错误:', err.response || err.message || err); // 打印更详细的错误信息
          if (err.response) {
            // 如果有响应体，尝试显示后端返回的错误信息
            const errorMsg = err.response.data?.error || err.response.data?.msg || '登录失败，请检查您的用户名或密码。';
             this.$message.error(errorMsg);
            // 特别处理 401 错误，提示用户名或密码错误
            // if (err.response.status === 401) {
            //    this.$message.error('用户名或密码错误，请重试');
            // } else {
            //    this.$message.error(`登录失败: ${errorMsg}`);
            // }
          } else {
            // 网络错误或其他前端错误
            this.$message.error('登录请求失败，请检查网络连接或稍后重试');
          }
          this.refreshCaptcha();
           this.loading = false; // 明确停止 loading
        });
        // .finally(() => { // finally 块移到 catch 之后，确保错误时也停止 loading
        //   this.loading = false;
        // }); // .finally 导致 loading 在 catch 的 message 弹出前就结束了，移到各自逻辑里控制
    }
  }
};
</script>

<style scoped>
/* --- 样式保持不变 --- */
.lear-wrapper {
  position: relative;
  height: 100vh;
  background-size: cover;
  overflow: hidden;
}

.lear-login {
  display: flex !important;
  min-height: 100vh;
  align-items: center !important;
  justify-content: center !important;
  animation: fadeIn 0.8s ease-out;
}

.login-center1 {
  background: rgba(5, 18, 49, 0.75) !important;
  width: 480px;
  padding: 55px 50px 45px;
  border-radius: 30px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37),
              0 2px 10px rgba(141, 209, 254, 0.2),
              inset 0 0 80px rgba(57, 175, 253, 0.1);
  border: 1px solid rgba(141, 209, 254, 0.25);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px); /* 兼容 Safari */
  transform: translateY(0);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.login-center1::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(141, 209, 254, 0.1),
    rgba(141, 209, 254, 0.1),
    transparent
  );
  transition: 0.8s;
  z-index: 0; /* 确保在内容之下 */
}

.login-center1 > * { /* 确保表单等内容在伪元素之上 */
    position: relative;
    z-index: 1;
}


.login-center1:hover::before {
  left: 100%;
}

.login-center1:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 45px rgba(31, 38, 135, 0.47),
              0 5px 20px rgba(141, 209, 254, 0.25);
}

.tech-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 55px;
  position: relative;
  padding-bottom: 25px;
  animation: slideDown 0.6s ease-out;
}

.tech-header h1 {
  color: #8DD1FE;
  font-size: 34px;
  margin: 0 20px;
  text-shadow: 0 0 30px rgba(57, 175, 253, 0.6);
  letter-spacing: 3px;
  font-weight: 600;
  white-space: nowrap;
  background: linear-gradient(120deg, #8DD1FE, #39AFFD);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
}

/* 为了确保在所有浏览器中都能正常显示，添加降级方案 */
@supports not (background-clip: text) {
  .tech-header h1 {
    background: none;
    color: #8DD1FE;
  }
}

.tech-header h1::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 3px;
  background: linear-gradient(90deg,
    rgba(57, 175, 253, 0),
    rgba(141, 209, 254, 1) 50%,
    rgba(57, 175, 253, 0)
  );
}

.highlight {
 /* color: #39AFFD; */ /* 从渐变获取颜色，无需单独设置 */
  font-weight: bold;
}

.tech-line {
  height: 2px;
  width: 40px;
}

.tech-line.left {
  background: linear-gradient(to right, rgba(57, 175, 253, 0), #39AFFD);
}

.tech-line.right {
  background: linear-gradient(to right, #39AFFD, rgba(57, 175, 253, 0));
}

/* 移除 tech-header::after，避免与 h1::after 重叠 */
/* .tech-header::after { ... } */


.analyze-button {
  height: 55px !important;
  /* line-height: 55px !important; */ /* flex 布局下不需要 */
  width: 240px !important;
  border-radius: 20px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  box-shadow: 0 5px 15px rgba(57, 175, 253, 0.3),
              inset 0 1px 2px rgba(255, 255, 255, 0.2);
  margin: 45px auto 0;
  display: flex !important; /* 保持 flex */
  justify-content: center !important; /* 水平居中 */
  align-items: center !important; /* 垂直居中 */
  border: none;
  position: relative;
  overflow: hidden;
  padding: 0 !important; /* flex 布局下不需要 padding */
  text-align: center;
  background: linear-gradient(45deg, #39AFFD, #2186d1); /* 默认背景色 */
  color: white; /* 按钮文字颜色 */
  transition: all 0.3s ease; /* 添加过渡 */
}


.analyze-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.analyze-button:hover::before {
  left: 100%;
}

.analyze-button:hover {
  background: linear-gradient(45deg, #4cc2ff, #39affd); /* 悬停时更亮的背景 */
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(57, 175, 253, 0.4),
              inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.help-block {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #8DD1FE;
}

.captcha-item {
  margin-bottom: 45px !important;
}

.captcha-item .el-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 0 !important;
}

.captcha-item .el-col {
  display: flex;
  align-items: center;
  height: 55px;
  padding: 0 !important;
}

.captcha-item .el-input__inner {
  padding-left: 25px !important;
}

#canvas {
  cursor: pointer;
  width: 140px !important;
  height: 55px !important;
  border-radius: 20px;
  border: 2px solid rgba(141, 209, 254, 0.25);
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(57, 175, 253, 0.1);
  display: block; /* 确保是块级元素 */
  margin-left: auto; /* 将画布推到右边 */
}


#canvas:hover {
  transform: scale(1.02);
  border-color: #39AFFD;
  box-shadow: 0 0 15px rgba(57, 175, 253, 0.2);
}

.register-link {
  margin-top: 35px;
  text-align: center;
  position: relative;
  padding-top: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(141, 209, 254, 0),
    rgba(141, 209, 254, 0.6),
    rgba(141, 209, 254, 0)
  );
}

.register-link a {
  font-size: 17px;
  color: #8DD1FE;
  text-decoration: none;
  transition: all 0.3s ease;
  padding: 12px 35px;
  border-radius: 20px;
  display: inline-block;
  background: rgba(57, 175, 253, 0.05);
  border: 1px solid rgba(141, 209, 254, 0.1);
  text-align: center;
  min-width: 240px;
}

.register-link a:hover {
  color: #39AFFD;
  background: rgba(57, 175, 253, 0.15);
  text-shadow: 0 0 8px rgba(57, 175, 253, 0.4);
  border-color: rgba(141, 209, 254, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(57, 175, 253, 0.2);
}

/* 修改Element UI组件样式 */
::v-deep .el-input__inner {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 2px solid rgba(141, 209, 254, 0.25);
  height: 55px !important;
  line-height: 55px !important; /* 保持行高 */
  padding: 0 25px 0 60px !important; /* 右边也加 padding */
  font-size: 17px;
  letter-spacing: 1px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  color: #8DD1FE !important; /* 文字颜色 */
  caret-color: #8DD1FE; /* 光标颜色 */
}

/* 输入框聚焦样式 */
::v-deep .el-input__inner:focus {
  border-color: #39AFFD;
  box-shadow: 0 0 15px rgba(57, 175, 253, 0.2);
  background: rgba(255, 255, 255, 0.05) !important; /* 聚焦时背景略微变亮 */
}


/* 表单项间距调整 */
::v-deep .el-form-item {
  margin-bottom: 30px !important;
  position: relative;
}

/* 错误提示样式 */
::v-deep .el-form-item__error {
  color: #ff6b6b !important; /* 明确错误颜色 */
  font-size: 14px;
  padding-top: 5px; /* 减小与输入框的距离 */
  position: absolute;
  bottom: -20px; /* 调整位置 */
  left: 25px;
  transform: translateY(0);
  transition: all 0.3s ease;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
  z-index: 1;
}


/* 输入框placeholder样式 */
::v-deep .el-input__inner::placeholder {
  color: rgba(141, 209, 254, 0.6) !important;
  font-size: 16px;
  letter-spacing: 1px;
  /* line-height: 55px !important; */ /* 移除，让浏览器自动处理 */
}

/* 验证码区域样式优化 */
.captcha-item {
  margin-bottom: 45px !important; /* 增加验证码和按钮之间的距离 */
}

.captcha-item .el-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 0 !important;
}

.captcha-item .el-col {
  display: flex;
  align-items: center;
  height: 55px;
  padding: 0 !important;
}

/* 验证码输入框 */
.captcha-item .el-input__inner {
  padding-left: 25px !important; /* 左侧 padding */
}

/* 验证码画布 */
#canvas {
  cursor: pointer;
  width: 140px !important;
  height: 55px !important;
  border-radius: 20px;
  border: 2px solid rgba(141, 209, 254, 0.25);
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(57, 175, 253, 0.1);
  display: block;
}

/* 图标样式优化 */
::v-deep .el-input__prefix {
  left: 22px !important;
  height: 55px !important;
  /* line-height: 55px !important; */ /* flex 布局下不需要 */
  display: flex; /* 使用 flex 居中图标 */
  align-items: center;
  justify-content: center;
  z-index: 2; /* 确保图标在输入框之上 */
}

::v-deep .el-input__prefix i {
  font-size: 20px;
  color: rgba(141, 209, 254, 0.8) !important;
  transition: all 0.3s ease;
}

/* 输入框聚焦时图标颜色变化 */
::v-deep .el-input:focus-within .el-input__prefix i {
  color: #39AFFD !important;
}


/* 登录按钮容器样式 */
::v-deep .el-form-item:last-of-type { /* 使用 :last-of-type 确保选中最后一个表单项 */
  display: flex;
  justify-content: center;
  margin-bottom: 0 !important; /* 移除底部外边距 */
  margin-top: 45px !important; /* 保持顶部外边距 */
}


/* 响应式调整 */
@media (max-width: 480px) {
  .login-center1 {
    width: 92%;
    padding: 40px 25px;
  }

  ::v-deep .el-input__inner {
    font-size: 16px;
    padding: 0 20px 0 50px !important;
  }

  ::v-deep .el-input__prefix {
    left: 18px !important;
  }

  .analyze-button {
    width: 220px !important;
    font-size: 20px;
    letter-spacing: 5px;
  }

  .register-link a {
    min-width: 220px;
    font-size: 16px;
    padding: 10px 30px;
  }

  #canvas {
    width: 120px !important;
  }

  .captcha-item .el-row {
    gap: 10px;
  }
}

/* 添加动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 加载动画容器样式优化 */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(5, 18, 49, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
  z-index: 9999;
  /* animation: fadeIn 0.3s ease-out; */ /* 使用 transition 代替 */
}


/* 加载动画样式优化 */
.loading-spinner {
  width: 60px;
  height: 60px;
  position: relative;
  margin-bottom: 20px; /* 保持间距 */
}

.double-bounce1, .double-bounce2 {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #39AFFD;
  opacity: 0.6;
  position: absolute;
  top: 0;
  left: 0;
  animation: bounce 2.0s infinite ease-in-out;
}

.double-bounce2 {
  animation-delay: -1.0s; /* 第二个球延迟动画 */
}

@keyframes bounce {
  0%, 100% { transform: scale(0.0) }
  50% { transform: scale(1.0) }
}


.loading-text {
  color: #8DD1FE;
  font-size: 20px;
  margin-top: 20px;
  letter-spacing: 4px;
  text-shadow: 0 0 15px rgba(57, 175, 253, 0.5);
  animation: pulse 1.5s infinite;
}

/* 添加脉冲动画 */
@keyframes pulse {
  0% { opacity: 0.6; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1); }
  100% { opacity: 0.6; transform: scale(0.98); }
}

/* 优化过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease; /* 统一过渡时间 */
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 登录成功后的跳转动画 */
@keyframes successFadeOut {
  0% { transform: scale(1) translateY(-8px); opacity: 1; } /* 结束时在悬停位置 */
  100% { transform: scale(1.1) translateY(-8px); opacity: 0; }
}


.login-success {
  animation: successFadeOut 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; /* 使用更平滑的曲线 */
}

</style>