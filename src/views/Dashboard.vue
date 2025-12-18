<template>
  <div class="dashboard">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <h1>欢迎使用明眸八疾眼疾智能分析平台</h1>
        <p>集成先进算法，提供眼底图像分类、分析、调节及智能辅助功能</p>
      </div>
      <div class="user-greeting">
        <span>您好，{{ username }}</span>
        <span class="last-login">上次登录: {{ lastLoginTime }}</span>
      </div>
    </div>

    <!-- 功能卡片区域 -->
    <div class="features-grid">
      <!-- 分类识别功能 -->
      <div class="feature-card">
        <div class="feature-icon">
          <i class="el-icon-view"></i>
        </div>
        <div class="feature-content">
          <h3>分类识别</h3>
          <p>基于深度学习模型，自动识别多种眼底疾病类型</p>
          <div class="feature-tips">
            <ul>
              <li>支持多种常见眼底疾病的自动分类</li>
              <li>提供诊断类别建议和置信度评分</li>
              <li>利用大规模标注数据集训练</li>
            </ul>
          </div>
          <el-button type="primary" @click="$router.push('/classification')" class="feature-button">
            开始诊断
          </el-button>
        </div>
      </div>

      <!-- 智能助手功能 -->
      <div class="feature-card">
        <div class="feature-icon">
          <i class="el-icon-chat-dot-round"></i>
        </div>
        <div class="feature-content">
          <h3>智能助手</h3>
          <p>集成大语言模型，提供智能问答与报告辅助生成</p>
          <div class="feature-tips">
            <ul>
              <li>提供专业的眼科医学知识问答</li>
              <li>辅助解读图像分析结果</li>
              <li>根据分析结果生成初步诊断报告建议</li>
            </ul>
          </div>
          <el-button type="primary" @click="$router.push('/llms')" class="feature-button">
            咨询助手
          </el-button>
        </div>
      </div>

      <!-- 亮度调节功能 -->
      <div class="feature-card">
        <div class="feature-icon">
          <!-- Using 'sunny' icon for brightness -->
          <i class="el-icon-sunny"></i>
        </div>
        <div class="feature-content">
          <h3>亮度调节</h3>
          <p>调整眼底图像的亮度与对比度，优化视觉呈现效果</p>
          <div class="feature-tips">
            <ul>
              <li>提供直观的滑块进行亮度/对比度调整</li>
              <li>实时预览调整后的图像效果</li>
              <li>支持重置为原始图像状态</li>
            </ul>
          </div>
          <!-- Ensure this route leads to your brightness adjustment component -->
          <el-button type="primary" @click="$router.push('/BrightnessSlider')" class="feature-button">
            开始调节
          </el-button>
        </div>
      </div>

      <!-- 数据分析 (Augmentation) 功能 -->
      <div class="feature-card">
        <div class="feature-icon">
          <!-- Using 'data-analysis' icon -->
          <i class="el-icon-data-analysis"></i>
        </div>
        <div class="feature-content">
          <h3>数据分析</h3>
          <!-- Updated description to focus on statistical insights -->
          <p>深入洞察平台处理的眼疾数据，生成多维度统计分析报告</p>
          <div class="feature-tips">
            <ul>
              <!-- Refined list items based on your input -->
              <li>可视化分析患者群体的基本特征数据</li> <!-- Visualize analysis of basic patient group characteristics -->
              <li>统计与展示不同眼疾类型的分布情况</li> <!-- Statistics and display of the distribution of different eye disease types -->
              <li>追踪关键诊断指标随时间的变化趋势</li> <!-- Track trends in key diagnostic indicators over time -->
            </ul>
          </div>
           <!-- Ensure this route points to the correct statistical analysis component -->
          <el-button type="primary" @click="$router.push('/data-analysis')" class="feature-button">
            查看报告
          </el-button> <!-- Changed button text -->
        </div>
      </div>
    </div>

    <!-- 使用指南区域 -->
    <div class="usage-guide">
      <h2>快速上手指南</h2>
      <div class="guide-steps">
        <div class="guide-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>上传图像</h4>
            <p>在各功能模块中上传您需要处理的眼底图像</p>
          </div>
        </div>
        <div class="guide-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>选择功能</h4>
            <p>根据需求选择分类、调节、分析或咨询助手</p>
          </div>
        </div>
        <div class="guide-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>获取结果</h4>
            <p>系统将自动处理并以可视化方式展示结果</p>
          </div>
        </div>
        <div class="guide-step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h4>查看/导出</h4>
            <p>查看分析详情、咨询助手或导出处理后数据</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统状态信息 -->
    <div class="system-status">
      <div class="status-item">
        <i class="el-icon-cpu"></i>
        <span>系统状态: 正常运行中</span>
      </div>
      <div class="status-item">
        <i class="el-icon-refresh"></i>
        <!-- Update this date as needed -->
        <span>最近更新: 2024-07-27</span>
      </div>
      <div class="status-item">
        <i class="el-icon-document"></i>
        <!-- Link triggers the dialog -->
        <span><a href="#" @click.prevent="showDocumentationDialog">查看完整使用文档</a></span>
      </div>
    </div>

    <!-- 文档显示弹窗 -->
    <el-dialog
      title="使用文档"
      :visible.sync="docDialogVisible"
      width="70%"
      top="5vh"
      custom-class="doc-dialog"
      append-to-body>
      <div v-if="docLoading" class="doc-loading">
        <i class="el-icon-loading"></i> 文档加载中...
      </div>
      <div v-else-if="docError" class="doc-error">
        <i class="el-icon-warning-outline"></i> 加载文档失败: {{ docError }}
      </div>
      <!-- Rendered Markdown HTML -->
      <div v-else v-html="readmeHtml" class="markdown-body"></div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="docDialogVisible = false">关 闭</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import { marked } from 'marked'; // Import marked library

export default {
  name: 'Dashboard',
  data() {
    return {
      username: localStorage.getItem('username') || '访客',
      lastLoginTime: this.formatDate(new Date()),
      docDialogVisible: false, // Controls the visibility of the documentation dialog
      readmeMarkdown: '', // Stores the raw Markdown content
      readmeHtml: '',     // Stores the rendered HTML content
      docLoading: false,  // Loading state for the doc
      docError: null,     // Error message if doc fails to load
    }
  },
  methods: {
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    showDocumentationDialog() {
      this.docDialogVisible = true;
      // Fetch and render the README only if it hasn't been loaded yet or failed previously
      if (!this.readmeHtml && !this.docLoading) {
        this.fetchAndRenderReadme();
      }
    },
    async fetchAndRenderReadme() {
      this.docLoading = true;
      this.docError = null;
      this.readmeMarkdown = '';
      this.readmeHtml = '';
      try {
        // Fetch README.md from the root URL.
        // Adjust '/README.md' if your file is served from a different path.
        const response = await fetch('/README.md');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        this.readmeMarkdown = await response.text();
        // Configure marked (optional: add syntax highlighting, etc.)
        marked.setOptions({
          gfm: true, // Use GitHub Flavored Markdown
          breaks: false, // Don't convert single line breaks to <br>
          pedantic: false,
          smartLists: true,
          smartypants: false,
        });
        this.readmeHtml = marked(this.readmeMarkdown); // Convert Markdown to HTML
      } catch (error) {
        console.error('Error fetching or rendering README.md:', error);
        this.docError = error.message || '无法获取文件内容';
        this.readmeHtml = '<p>无法加载文档内容，请稍后重试或联系管理员。</p>'; // Provide fallback message
      } finally {
        this.docLoading = false;
      }
    }
  }
}
</script>

<style lang="less" scoped>
/* --- Base Dashboard Styles (Keep your enhanced styles) --- */
.dashboard {
  min-height: 100vh;
  background: #0a1639; /* Deep blue background */
  padding: 30px;
  color: #E0E0E0; /* Light base text color for contrast */
}

.welcome-banner {
  background: linear-gradient(90deg, rgba(13, 28, 64, 0.9) 0%, rgba(26, 54, 121, 0.9) 100%);
  border-radius: 10px;
  padding: 20px 30px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); /* Slightly increased shadow */
  border: 1px solid rgba(57, 175, 253, 0.4); /* Slightly stronger border */
}

.welcome-text h1 {
  color: #39AFFD; /* Bright blue for primary heading */
  margin: 0 0 10px 0;
  font-size: 26px; /* Slightly larger */
  font-weight: 600;
  text-shadow: 0 0 10px rgba(57, 175, 253, 0.4);
}

.welcome-text p {
  color: #B0C4DE; /* Light steel blue for description */
  margin: 0;
  font-size: 16px;
}

.user-greeting {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #B0C4DE; /* Match paragraph color */
  text-align: right; /* Ensure text alignment */
}

.user-greeting span:first-child {
  font-weight: 500; /* Slightly bolder username */
}

.last-login {
  font-size: 12px;
  margin-top: 5px;
  opacity: 0.8;
}

.features-grid {
  display: grid;
  // grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); /* Slightly larger min width */
  grid-template-columns: repeat(4, 1fr); /* Force 4 columns */
  gap: 25px; /* Slightly increased gap */
  margin-bottom: 30px;
}

.feature-card {
  background: rgba(13, 28, 64, 0.8); /* Slightly more opaque background */
  border-radius: 10px;
  padding: 25px; /* Increased padding */
  transition: all 0.3s ease-in-out; /* Smooth transition */
  height: 100%; /* Ensure cards have same height if content differs */
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(57, 175, 253, 0.4); /* Match banner border */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0; /* Start width at 0 */
  height: 4px; /* Slightly thicker */
  background: linear-gradient(90deg, #39AFFD, #6ad4ff);
  transition: width 0.4s ease-in-out; /* Animate width on hover */
}

.feature-card:hover::before {
  width: 100%; /* Expand top border on hover */
}

.feature-card:hover {
  transform: translateY(-8px); /* More pronounced lift */
  box-shadow: 0 10px 30px rgba(57, 175, 253, 0.25); /* Stronger glow */
  border-color: rgba(57, 175, 253, 0.6); /* Brighter border on hover */
}

.feature-icon {
  font-size: 48px; /* Larger icon */
  color: #39AFFD;
  margin-bottom: 20px;
  text-align: center;
  text-shadow: 0 0 15px rgba(57, 175, 253, 0.5); /* Add glow to icon */
}

.feature-content {
  flex: 1; /* Allow content to grow */
  display: flex;
  flex-direction: column;
  text-align: center; /* Center align content */
}

.feature-content h3 {
  color: #39AFFD;
  margin: 0 0 12px 0; /* Increased margin */
  font-size: 22px; /* Larger title */
  font-weight: 600;
}

.feature-content p {
  color: #B0C4DE; /* Match banner description color */
  margin: 0 0 20px 0; /* Increased margin */
  line-height: 1.6; /* Improve readability */
  min-height: 4.8em; /* ~3 lines to help align buttons */
}

.feature-tips {
  background: rgba(57, 175, 253, 0.1);
  border-radius: 8px;
  padding: 15px 20px; /* Increased padding */
  margin-bottom: 20px;
  flex-grow: 1; /* Allow tips section to take available space */
  text-align: left; /* Align list items left */
  border: 1px dashed rgba(57, 175, 253, 0.3); /* Subtle dashed border */
}

.feature-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #B0C4DE; /* Match description color */
  list-style-type: disc; /* Standard bullets */
}

.feature-tips li {
  margin-bottom: 8px; /* Increased spacing */
  font-size: 14px;
  line-height: 1.5;
}

.feature-tips li:last-child {
  margin-bottom: 0;
}

.feature-button {
  align-self: center;
  width: 100%; /* Full width button */
  padding: 12px 0; /* Larger button */
  font-size: 16px; /* Larger text */
  font-weight: 500;
  background: linear-gradient(to right, #3077b1, #39AFFD);
  border: none;
  border-radius: 6px; /* Slightly rounded corners */
  transition: all 0.3s ease;
  margin-top: auto; /* Push button to bottom */
}

.feature-button:hover {
  background: linear-gradient(to right, #39AFFD, #3077b1); /* Reverse gradient on hover */
  box-shadow: 0 0 15px rgba(57, 175, 253, 0.6); /* Stronger glow */
  transform: scale(1.02); /* Slight scale effect */
}

.usage-guide {
  background: rgba(13, 28, 64, 0.8); /* Match card background */
  border-radius: 10px;
  padding: 30px; /* Increased padding */
  margin-bottom: 30px;
  border: 1px solid rgba(57, 175, 253, 0.4); /* Match card border */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.usage-guide h2 {
  color: #39AFFD;
  margin: 0 0 25px 0; /* Increased margin */
  text-align: center;
  font-size: 24px; /* Larger title */
  font-weight: 600;
}

.guide-steps {
  display: grid;
  // grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); /* Adjust min width */
  grid-template-columns: repeat(4, 1fr); /* Force 4 columns */
  gap: 25px; /* Increased gap */
}

.guide-step {
  display: flex;
  align-items: flex-start;
  background: rgba(57, 175, 253, 0.05); /* Very subtle background */
  padding: 15px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.guide-step:hover {
   background: rgba(57, 175, 253, 0.1); /* Highlight on hover */
}

.step-number {
  background: linear-gradient(135deg, #3077b1, #39AFFD);
  color: white;
  width: 35px; /* Larger number circle */
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px; /* Larger number font */
  margin-right: 15px;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.step-content h4 {
  color: #6ad4ff; /* Lighter blue for step title */
  margin: 0 0 8px 0; /* Increased margin */
  font-size: 17px; /* Slightly larger step title */
  font-weight: 500;
}

.step-content p {
  color: #B0C4DE;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.system-status {
  background: rgba(13, 28, 64, 0.8); /* Match card background */
  border-radius: 10px;
  padding: 20px 30px; /* Adjusted padding */
  display: flex;
  justify-content: space-around; /* Space out items evenly */
  flex-wrap: wrap;
  border: 1px solid rgba(57, 175, 253, 0.4); /* Match card border */
  margin-top: 30px; /* Ensure spacing from guide */
}

.status-item {
  color: #B0C4DE;
  display: flex;
  align-items: center;
  margin: 10px 15px; /* Add vertical and horizontal margin for spacing */
  font-size: 14px; /* Consistent font size */
}

.status-item i {
  margin-right: 10px; /* Increased icon spacing */
  font-size: 18px; /* Slightly larger icons */
  color: #39AFFD; /* Color icons */
}

.status-item a {
  color: #6ad4ff; /* Lighter blue for link */
  text-decoration: none;
  transition: color 0.3s ease;
}

.status-item a:hover {
  color: #ffffff; /* White on hover */
  text-decoration: underline;
}

/* --- Documentation Dialog Styles --- */
/* Scoped styles won't apply inside v-html, so use deep selector or global styles */
/* Using deep selector here */
/deep/ .doc-dialog .el-dialog__body {
  padding: 10px 25px 20px 25px; // Adjust padding
  max-height: 75vh; // Limit height and enable scrolling
  overflow-y: auto;
  color: #d3d3d3; // Light text color for markdown content
  background-color: #162a50; // Slightly different background for contrast
}

.doc-loading, .doc-error {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #aaa;
}
.doc-error {
  color: #f56c6c;
}
.doc-loading i, .doc-error i {
  margin-right: 8px;
  font-size: 20px;
}

/* Basic Markdown Styling (applied via v-html) */
/deep/ .markdown-body {
  line-height: 1.7;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";

  h1, h2, h3, h4, h5, h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
    color: #6ad4ff; // Heading color
    border-bottom: 1px solid rgba(106, 212, 255, 0.2);
    padding-bottom: 0.3em;
  }
  h1 { font-size: 2em; }
  h2 { font-size: 1.5em; }
  h3 { font-size: 1.25em; }

  p {
    margin-bottom: 16px;
  }

  a {
    color: #39AFFD;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }

  ul, ol {
    padding-left: 2em;
    margin-bottom: 16px;
  }

  li > p { // Reset margin for paragraphs inside list items
      margin-bottom: 4px;
  }

  code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(110,118,129,0.2);
    border-radius: 6px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
  }

  pre {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #1e355f; // Code block background
    border-radius: 6px;
    margin-bottom: 16px;
  }

  pre code {
    display: inline;
    padding: 0;
    margin: 0;
    overflow: visible;
    line-height: inherit;
    word-wrap: normal;
    background-color: transparent;
    border: 0;
  }

  blockquote {
    margin: 0 0 16px 0;
    padding: 0 1em;
    color: #9eadc8; // Blockquote text color
    border-left: 0.25em solid rgba(57, 175, 253, 0.4);
  }

  hr {
      height: .25em;
      padding: 0;
      margin: 24px 0;
      background-color: rgba(57, 175, 253, 0.2);
      border: 0;
  }

  table {
      border-collapse: collapse;
      margin-bottom: 16px;
      width: 100%;
  }
  th, td {
      border: 1px solid rgba(106, 212, 255, 0.3);
      padding: 8px 12px;
  }
  th {
      background-color: rgba(13, 28, 64, 0.9);
      font-weight: bold;
  }
}


/* Responsive adjustments */
@media (max-width: 1200px) { /* Adjust breakpoint for 4 cards */
  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Fallback to auto-fit */
  }
   .guide-steps {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); /* Fallback */
   }
}


@media (max-width: 768px) {
  .dashboard {
    padding: 20px; /* Reduce padding on smaller screens */
  }

  .welcome-banner {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .welcome-text h1 { font-size: 22px; }
  .welcome-text p { font-size: 14px; }

  .user-greeting { align-items: center; margin-top: 15px; }

  .features-grid { grid-template-columns: 1fr; gap: 20px; } /* Stack cards */
  .feature-card { padding: 20px; }
  .feature-content p { min-height: auto; } /* Allow variable height on mobile */

  .usage-guide { padding: 20px; }
  .usage-guide h2 { font-size: 20px; }
  .guide-steps { grid-template-columns: 1fr; gap: 15px; } /* Stack steps */

  .system-status { flex-direction: column; align-items: center; padding: 15px 20px; }
  .status-item { margin: 8px 0; }

  /deep/ .el-dialog { // Make dialog take more width on mobile
    width: 90% !important;
  }
}

</style>