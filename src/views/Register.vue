<template>
  <!-- 移除了 :style 绑定，避免找不到图片和语法错误 -->
  <div class="lear-wrapper">
    <div class="lear-login">
      <div class="login-center1">
        <div class="tech-header">
          <div class="tech-line left"></div>
          <h1><span class="highlight">用户注册</span></h1>
          <div class="tech-line right"></div>
        </div>

        <el-form ref="registerForm" :model="registerForm" :rules="rules">
          <!-- 用户名 -->
          <el-form-item prop="username">
            <el-input
                v-model="registerForm.username"
                placeholder="设置您的用户名 (3-20位)"
                prefix-icon="el-icon-user"
            ></el-input>
          </el-form-item>

          <!-- 密码 -->
          <el-form-item prop="password">
            <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="设置密码 (6-20位, 含大小写字母和数字)"
                prefix-icon="el-icon-lock"
                show-password
            ></el-input>
          </el-form-item>

          <!-- 重复密码 -->
          <el-form-item prop="repassword">
            <el-input
                v-model="registerForm.repassword"
                type="password"
                placeholder="请再次输入密码"
                prefix-icon="el-icon-lock"
                show-password
                @keyup.enter.native="handleRegister"
            ></el-input>
          </el-form-item>

          <!-- 验证码 -->
          <el-form-item prop="captcha" class="captcha-item">
            <el-row :gutter="20">
              <el-col :span="14">
                <el-input
                    v-model="registerForm.captcha"
                    placeholder="请输入验证码"
                ></el-input>
              </el-col>
              <el-col :span="10">
                <canvas
                    id="canvas"
                    width="140"
                    height="65"
                    @click="refreshCaptcha"
                    title="点击刷新验证码"
                ></canvas>
              </el-col>
            </el-row>
          </el-form-item>

          <!-- 注册按钮 -->
          <!-- 注意: 这里之前写的是 el-form-item:last-child，这是无效的语法 -->
          <!-- 应该直接是 el-form-item -->
          <el-form-item>
            <el-button
                type="primary"
                class="analyze-button"
                :loading="loading"
                @click="handleRegister"
            >
              <span v-if="!loading">立即注册</span>
              <span v-else>注册中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="register-link">
          <router-link to="/">已有账号？返回登录</router-link>
        </div>
      </div>
    </div>
    <transition name="fade">
      <div class="loading-container" v-if="loading">
        <div class="loading-spinner">
          <div class="double-bounce1"></div>
          <div class="double-bounce2"></div>
        </div>
        <div class="loading-text">注册中...</div>
      </div>
    </transition>
  </div>
</template>

<script>

export default {
  name: 'Register',
  data() {
    // --- Custom Validators ---

    // 异步验证用户名是否存在
    const validateUsername = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('用户名不能为空'));
      }
      // 简单的长度检查由其他规则处理，这里专注于存在性检查
      // 实际应用中防抖动检查会很有用
      this.$axios.get(`/login/loginVerifyUsername/${value}`)
        .then(res => {
          if (res.data.code === 100) { // 假设 100 表示存在
            callback(new Error('该用户名已被注册'));
          } else if (res.data.code === 200) { // 假设 200 表示可用
             callback();
          } else {
             callback(new Error(res.data.msg || '用户名验证失败'));
          }
        })
        .catch(() => {
          callback(new Error('网络错误，无法验证用户名'));
        });
    };

    // 验证密码复杂度
    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('密码不能为空'));
      } else if (value.length < 6 || value.length > 20) {
        callback(new Error('密码长度需在6到20个字符')); // 与 min/max 规则消息一致
      }
      // 示例：要求至少一个小写、一个大写、一个数字
      else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,20}$/.test(value)) {
        callback(new Error('密码需包含大小写字母和数字'));
      } else {
        // 如果密码有效，触发重复密码字段的验证
        if (this.registerForm.repassword) {
          this.$refs.registerForm.validateField('repassword');
        }
        callback();
      }
    };

    // 验证两次密码是否一致
    const validateRepassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入密码'));
      } else if (value !== this.registerForm.password) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };

    // --- Component Data ---
    return {
      registerForm: {
        username: '',
        password: '',
        repassword: '',
        captcha: ''
      },
      show_num: [], // 存储当前验证码的字符
      loading: false, // 控制加载状态和遮罩层
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度需在3到20个字符', trigger: 'blur' },
          { validator: validateUsername, trigger: 'blur' } // 使用异步验证器
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          // min/max 长度检查在 validatePassword 内处理以获得更好的反馈
          { validator: validatePassword, trigger: 'blur' }
        ],
        repassword: [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          { validator: validateRepassword, trigger: 'blur' }
        ],
        captcha: [
          { required: true, message: '请输入验证码', trigger: 'blur' }
          // 验证码正确性在提交前手动检查
        ]
      }
    };
  },
  mounted() {
    // 组件挂载时绘制初始验证码
    this.drawPic();
    // 如果需要设置背景图片，可以在这里或者CSS中处理
    // 例如，确保你的图片在 `src/assets/images/login_bg.jpg`
    // 然后可以在 <style> 中取消注释并调整 CSS 规则
    // const bgImage = require('@/assets/images/login_bg.jpg');
    // document.querySelector('.lear-wrapper').style.backgroundImage = `url(${bgImage})`;
  },
  methods: {
    // --- Captcha Methods (与登录页相同) ---
    drawPic() {
      const canvas = document.getElementById('canvas');
       if (!canvas) {
         console.error("未找到用于验证码的Canvas元素。");
         return;
       }
      const width = canvas.width;
      const height = canvas.height;
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'bottom';
      // 如果需要，可以使用稍浅的背景色以获得更好的对比度
      ctx.fillStyle = this.randomColor(230, 250); // 浅色背景
      ctx.fillRect(0, 0, width, height);

      const sCode = "ABCDEFGHJKMNPQRSTWXYZ123456789"; // 移除了易混淆的字符 (I, O, 0, l)
      const aCode = sCode.split("");
      this.show_num = [];

      for (let i = 0; i < 4; i++) {
        const txt = aCode[this.randomNum(0, aCode.length)];
        this.show_num.push(txt.toLowerCase()); // 存储小写字母以便不区分大小写检查
        ctx.fillStyle = this.randomColor(50, 160); // 深色文本
        // 稍大字体适应 55px 高度的画布
        ctx.font = `bold ${this.randomNum(30, 40)}px Arial`; // 加粗字体
        const x = 20 + i * (width / 5); // 调整间距
        const y = this.randomNum(height - 25, height - 5); // 调整Y位置
        const deg = this.randomNum(-25, 25); // 稍小的旋转角度

        ctx.translate(x, y);
        ctx.rotate(deg * Math.PI / 180);
        ctx.fillText(txt, 0, 0);
        ctx.rotate(-deg * Math.PI / 180);
        ctx.translate(-x, -y);
      }

      // 添加干扰线/点以提高安全性 (可选)
      for (let i = 0; i < 5; i++) {
         ctx.strokeStyle = this.randomColor(180, 230);
         ctx.beginPath();
         ctx.moveTo(this.randomNum(0, width), this.randomNum(0, height));
         ctx.lineTo(this.randomNum(0, width), this.randomNum(0, height));
         ctx.stroke();
      }
      for (let i = 0; i < 30; i++) {
         ctx.fillStyle = this.randomColor(180, 230);
         ctx.beginPath();
         ctx.arc(this.randomNum(0, width), this.randomNum(0, height), 1, 0, 2 * Math.PI);
         ctx.fill();
      }
    },

    refreshCaptcha() {
      this.drawPic();
      this.registerForm.captcha = ''; // 刷新时清除验证码输入
      // 可选：如果验证码字段显示错误，则重新验证它
      // this.$refs.registerForm.validateField('captcha');
    },

    randomNum(min, max) {
      return Math.floor(Math.random() * (max - min) + min);
    },

    randomColor(min, max) {
      const r = this.randomNum(min, max);
      const g = this.randomNum(min, max);
      const b = this.randomNum(min, max);
      return `rgb(${r},${g},${b})`;
    },

    // --- 手动验证码验证 (辅助方法) ---
    verifyCaptchaInput() {
        const userInputLower = this.registerForm.captcha.toLowerCase();
        const correctCaptchaLower = this.show_num.join('');
        return userInputLower === correctCaptchaLower;
    },


    // --- 注册处理程序 ---
    handleRegister() {
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          // 首先，在基本验证通过后手动检查验证码
          if (!this.verifyCaptchaInput()) {
            this.$message.warning('验证码错误，请重新输入');
            this.refreshCaptcha(); // 错误时自动刷新验证码
            return; // 停止注册过程
          }

          // 所有检查通过，继续注册
          this.loading = true;

          const formData = {
            username: this.registerForm.username,
            password: this.registerForm.password
            // 'role' 可能在后端注册时设置
          };

          this.$axios.post('/login/register', formData)
            .then(res => {
              if (res.data.code === 100) { // 假设 100 表示成功
                this.$message({
                    message: '注册成功！即将跳转到登录页面...',
                    type: 'success',
                    duration: 2000 // 稍长持续时间
                });
                // 可选：添加类似登录的成功动画?
                // document.querySelector('.login-center1').classList.add('register-success'); // 需要为此添加 CSS

                setTimeout(() => {
                  this.$router.push('/'); // 重定向到登录页面
                }, 1500); // 稍微延迟重定向
              } else {
                // 处理来自后端的特定注册错误
                this.$message.error(res.data.msg || '注册失败，请稍后重试');
                this.refreshCaptcha(); // 失败时刷新验证码
              }
            })
            .catch(err => {
              console.error('注册请求失败:', err);
              this.$message.error('注册请求失败，请检查网络连接');
              this.refreshCaptcha(); // 网络错误时刷新验证码
            })
            .finally(() => {
              this.loading = false; // 无论结果如何都隐藏加载指示器
            });

        } else {
          // 表单验证失败 (由 Element UI 消息处理)
          console.log('注册表单验证失败');
          this.$message.warning('请检查并完善注册信息');
          // 检查验证码是否为空，并且如果它是*唯一*缺失的字段则刷新
          // if (!this.registerForm.captcha && !this.registerForm.username && !this.registerForm.password && !this.registerForm.repassword) {
             // 仅当验证码是唯一问题时才刷新，否则可能令人讨厌
             // this.refreshCaptcha();
          // }
          return false;
        }
      });
    }
  }
};
</script>

<style scoped>
/* --- 复制 Login.vue 的所有样式 --- */
.lear-wrapper {
  position: relative;
  height: 100vh;
  background-size: cover;
  overflow: hidden;
  /* 如果不在 mounted() 中处理，则添加背景图片 */
   /* background-image: url('~@/assets/images/login_bg.jpg'); */

   background-position: center center;
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
  width: 480px; /* 保持一致的宽度 */
  padding: 55px 50px 45px;
  border-radius: 30px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37),
              0 2px 10px rgba(141, 209, 254, 0.2),
              inset 0 0 80px rgba(57, 175, 253, 0.1);
  border: 1px solid rgba(141, 209, 254, 0.25);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px); /* Safari 支持 */
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
  margin-bottom: 55px; /* 增加边距，与登录页一致 */
  position: relative;
  padding-bottom: 25px;
  animation: slideDown 0.6s ease-out;
}

.tech-header h1 {
  color: #8DD1FE;
  font-size: 34px; /* 与登录页相同大小 */
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

/* 旧版浏览器后备 */
@supports not (background-clip: text) {
  .tech-header h1 {
    background: none;
    color: #8DD1FE;
  }
}

.tech-header h1::after { /* 标题文本下划线 */
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

.highlight { /* 一致的高亮样式 */
  color: #39AFFD;
  font-weight: bold;
   /* 如果支持，高亮颜色将被渐变覆盖 */
   /* 这作为后备或基础 */
}

.tech-line { /* 标题两侧的线条 */
  height: 2px;
  width: 40px; /* 与登录页相同宽度 */
}

.tech-line.left {
  background: linear-gradient(to right, rgba(57, 175, 253, 0), #39AFFD);
}

.tech-line.right {
  background: linear-gradient(to right, #39AFFD, rgba(57, 175, 253, 0));
}

/* 移除原始 .tech-header::after 的重复下划线 */
/* .tech-header::after { ... } */

.analyze-button { /* 注册按钮使用登录页的按钮样式 */
  height: 55px !important;
  line-height: 55px !important;
  width: 240px !important;
  border-radius: 20px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  box-shadow: 0 5px 15px rgba(57, 175, 253, 0.3),
              inset 0 1px 2px rgba(255, 255, 255, 0.2);
  margin: 45px auto 0; /* 一致的边距 */
  display: flex !important; /* 使用 flex 居中文本/加载器 */
  justify-content: center !important;
  align-items: center !important;
  border: none;
  position: relative;
  overflow: hidden;
  padding: 0 !important;
  text-align: center;
  /* 通过 type="primary" 设置背景或覆盖 */
  background: linear-gradient(120deg, #39AFFD, #8DD1FE); /* 示例渐变 */
  color: #fff; /* 确保文本为白色 */
}

.analyze-button::before { /* 按钮悬停光泽效果 */
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

.analyze-button:not(:disabled):hover { /* 非禁用按钮的悬停样式 */
  background: linear-gradient(45deg, #39affd, #3077b1);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(57, 175, 253, 0.4),
              inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

/* 移除旧的 .help-block 样式 */
/* .help-block { ... } */

.captcha-item { /* 验证码行样式 */
  margin-bottom: 30px !important; /* 边距比登录按钮边距略小 */
}

.captcha-item .el-row {
  display: flex;
  align-items: center;
  gap: 15px; /* 输入框和画布之间的间距 */
  margin: 0 !important;
}

.captcha-item .el-col {
  display: flex;
  align-items: center;
  height: 55px; /* 匹配输入框高度 */
  padding: 0 !important;
}

/* 确保验证码输入文本正确对齐 */
.captcha-item .el-input__inner {
  padding-left: 25px !important; /* 如果没有图标，则减少内边距 */
}

#canvas { /* 验证码画布样式 */
  cursor: pointer;
  width: 140px !important; /* 匹配登录画布大小 */
  height: 55px !important; /* 匹配登录画布大小 */
  border-radius: 20px; /* 匹配输入框圆角 */
  border: 2px solid rgba(141, 209, 254, 0.25);
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(57, 175, 253, 0.1);
  display: block;
}

#canvas:hover {
  transform: scale(1.02);
  border-color: #39AFFD;
  box-shadow: 0 0 15px rgba(57, 175, 253, 0.2);
}

.register-link { /* "返回登录" 链接样式 */
  margin-top: 35px;
  text-align: center;
  position: relative;
  padding-top: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-link::before { /* 链接上方的分隔线 */
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

.register-link a { /* 链接按钮样式 */
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
  min-width: 240px; /* 匹配按钮宽度 */
}

.register-link a:hover {
  color: #39AFFD;
  background: rgba(57, 175, 253, 0.15);
  text-shadow: 0 0 8px rgba(57, 175, 253, 0.4);
  border-color: rgba(141, 209, 254, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(57, 175, 253, 0.2);
}

/* --- Element UI 覆盖 (从 Login.vue 复制) --- */
::v-deep .el-input__inner {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 2px solid rgba(141, 209, 254, 0.25) !important;
  height: 55px !important;
  line-height: 55px !important;
  padding: 0 25px 0 60px !important; /* 为显示密码图标调整右内边距 */
  font-size: 17px;
  letter-spacing: 1px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  color: #8DD1FE !important;
}
/* 为带显示密码图标的密码输入框调整内边距 */
::v-deep .el-input--password .el-input__inner {
  padding-right: 50px !important;
}


/* 输入框聚焦样式 */
::v-deep .el-input__inner:focus {
  border-color: #8DD1FE !important;
  box-shadow: 0 0 15px rgba(141, 209, 254, 0.3);
  background: rgba(255, 255, 255, 0.05) !important; /* 聚焦时稍亮 */
}


/* 表单项边距 */
::v-deep .el-form-item {
  margin-bottom: 30px !important; /* 一致的边距 */
  position: relative;
}

/* 验证错误消息样式 */
::v-deep .el-form-item__error {
  color: #ff8f8f; /* 更亮的红色以提高可见性 */
  font-size: 14px;
  padding-top: 5px; /* 调整间距 */
  position: absolute;
  bottom: -22px; /* 定位在输入框下方 */
  left: 25px;
  line-height: 1;
  transform: translateY(0);
  transition: all 0.3s ease;
  text-shadow: 0 0 8px rgba(255, 107, 107, 0.4);
  z-index: 1;
  font-weight: 500; /* 稍粗 */
}

/* 占位符文本样式 */
::v-deep .el-input__inner::placeholder {
  color: rgba(141, 209, 254, 0.6) !important;
  font-size: 16px;
  letter-spacing: 1px;
  /* line-height 由输入框高度调整 */
}

/* 输入框前缀图标样式 */
::v-deep .el-input__prefix {
  left: 22px !important;
  height: 55px !important;
  line-height: 55px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

::v-deep .el-input__prefix i {
  font-size: 20px;
  color: rgba(141, 209, 254, 0.8) !important;
  transition: all 0.3s ease;
}

/* 输入框后缀图标样式 (用于显示密码) */
::v-deep .el-input__suffix {
    right: 20px !important; /* 调整位置 */
    height: 55px !important;
    line-height: 55px !important;
}
::v-deep .el-input__suffix i {
    font-size: 18px;
    color: rgba(141, 209, 254, 0.7) !important;
    cursor: pointer;
}
::v-deep .el-input__suffix i:hover {
    color: #8DD1FE !important;
}


/* 居中最后一个表单项 (按钮容器) */
/* 修正：直接使用 .el-form-item, :last-child 是 CSS 伪类，不能这样用 */
.el-form-item:last-of-type { /* 使用 last-of-type 选择同类型中的最后一个 */
  display: flex;
  justify-content: center;
  margin-bottom: 0 !important; /* 最后一个项目下方无边距 */
  margin-top: 15px !important; /* 如果需要，调整上边距 */
}

/* --- 响应式调整 (从 Login.vue 复制) --- */
@media (max-width: 480px) {
  .login-center1 {
    width: 92%;
    padding: 40px 25px;
    margin-top: 20px; /* 在小屏幕上添加边距 */
    margin-bottom: 20px;
  }
  .tech-header h1 {
    font-size: 28px; /* 稍小的标题 */
  }
  ::v-deep .el-input__inner {
    font-size: 16px;
    height: 60px !important; /* 稍小的输入框 */
    line-height: 60px !important;
    padding: 0 20px 0 50px !important;
  }
   ::v-deep .el-input--password .el-input__inner {
     padding-right: 45px !important;
   }
  ::v-deep .el-input__prefix {
    left: 18px !important;
    height: 60px !important;
    line-height: 60px !important;
  }
  ::v-deep .el-input__suffix {
    right: 15px !important;
    height: 60px !important;
    line-height: 60px !important;
  }
  .analyze-button {
    width: 100% !important; /* 全宽按钮 */
    max-width: 280px; /* 最大宽度 */
    height: 60px !important;
    line-height: 60px !important;
    font-size: 18px;
    letter-spacing: 4px;
  }
  .register-link a {
    min-width: 0; /* 允许链接收缩 */
    width: 100%;
    max-width: 280px;
    font-size: 16px;
    padding: 10px 20px;
  }
  #canvas {
    width: 120px !important;
    height: 60px !important; /* 匹配输入框高度 */
  }
  .captcha-item .el-row {
    gap: 10px;
  }
  ::v-deep .el-form-item__error {
     left: 15px;
     bottom: -20px;
  }
}

/* --- 动画 (从 Login.vue 复制) --- */
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

/* 加载遮罩层容器 */
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
  -webkit-backdrop-filter: blur(10px);
  z-index: 9999;
  /* 使用 fade 过渡 */
}

/* 加载旋转器动画 */
.loading-spinner {
  width: 60px;
  height: 60px;
  position: relative;
  margin-bottom: 20px;
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
  animation-delay: -1.0s;
}

@keyframes bounce {
  0%, 100% { transform: scale(0.0); }
  50% { transform: scale(1.0); }
}


/* 加载文本 */
.loading-text {
  color: #8DD1FE;
  font-size: 20px;
  margin-top: 20px;
  letter-spacing: 4px;
  text-shadow: 0 0 15px rgba(57, 175, 253, 0.5);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1); }
  100% { opacity: 0.6; transform: scale(0.98); }
}

/* 加载遮罩层的 Fade 过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 可选：为表单项添加微妙的动画 */
.el-form-item {
    animation: fadeInUp 0.5s ease-out both;
}
.el-form-item:nth-child(1) { animation-delay: 0.1s; }
.el-form-item:nth-child(2) { animation-delay: 0.15s; }
.el-form-item:nth-child(3) { animation-delay: 0.2s; }
.el-form-item:nth-child(4) { animation-delay: 0.25s; }
.el-form-item:last-of-type { animation-delay: 0.3s; } /* 按钮 */
.register-link { animation: fadeInUp 0.5s ease-out 0.35s both; }

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(15px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 可选：成功动画 (与登录类似) */
/* 如果在脚本中使用，则定义 .register-success 动画 */

@keyframes successFadeOut {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.1); opacity: 0; }
}
.register-success {
  animation: successFadeOut 0.5s ease-out forwards;
}

</style>