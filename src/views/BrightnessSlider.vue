<template>
  <div class="brightness-container">
    <!-- Header -->
    <div class="tech-header">
      <div class="tech-line left"></div>
      <h1><span class="highlight">眼底图像亮度调节</span></h1>
      <div class="tech-line right"></div>
    </div>
    <p class="component-description">
      上传左右眼眼底图像，通过调节亮度增强图像细节，便于观察。调整后的图像可下载或直接导入分类识别模块。
    </p>

    <!-- Main Content Area (Left/Right Eye Sections) -->
    <div class="main-content">
      <!-- Left Eye Section -->
      <div class="eye-section left-eye-section">
        <h2 class="section-title">
          <i class="el-icon-view"></i> 左眼 (OS) 图像处理
        </h2>
        <image-processor
          ref="leftProcessor"
          eye-side="left"
          :tech-style="true"
          @request-send-to-classification="handleSendToClassification"
          @processing-start="handleProcessingStart('left')"
          @processing-end="handleProcessingEnd('left')"
          @image-cleared="resetEyeState('left')"
          @show-preview="showPreviewDialog"
        />
      </div>

      <!-- Right Eye Section -->
      <div class="eye-section right-eye-section">
        <h2 class="section-title">
          <i class="el-icon-view"></i> 右眼 (OD) 图像处理
        </h2>
        <image-processor
          ref="rightProcessor"
          eye-side="right"
          :tech-style="true"
          @request-send-to-classification="handleSendToClassification"
          @processing-start="handleProcessingStart('right')"
          @processing-end="handleProcessingEnd('right')"
          @image-cleared="resetEyeState('right')"
          @show-preview="showPreviewDialog"
        />
      </div>
    </div>

    <!-- Global Actions (Optional) -->
    <!-- <div class="global-actions">
      <el-button type="danger" icon="el-icon-refresh" @click="resetAll" :disabled="!hasAnyImage">
        全部重置
      </el-button>
    </div> -->

    <!-- Image Preview Dialog -->
    <el-dialog
      title="图像预览"
      :visible.sync="previewDialogVisible"
      class="image-preview-dialog"
      append-to-body
      width="70%"
      :close-on-click-modal="true"
      @close="previewImageUrl = ''"
    >
      <div class="preview-dialog-content">
        <img
          v-if="previewImageUrl"
          :src="previewImageUrl"
          class="preview-image-large"
          alt="图像预览"
        />
        <p v-else>无法加载预览图像。</p>
      </div>
      <div slot="footer">
        <el-button @click="previewDialogVisible = false" type="primary">关闭</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { debounce } from 'lodash-es'; // 使用 lodash 的 debounce
import { mapActions } from 'vuex'; // 引入 mapActions
import ImageProcessor from './ImageProcessor.vue'; // 确保路径正确

// --- 主组件脚本 ---
export default {
  name: 'BrightnessSlider',
  components: {
    ImageProcessor, // 注册子组件
  },
  data() {
    return {
      // 控制哪个眼睛正在处理（用于全局加载状态，如果需要的话）
      processingState: {
        left: false,
        right: false,
      },
      // 预览对话框
      previewDialogVisible: false,
      previewImageUrl: '',
    };
  },
  computed: {
    // 是否有任何一个眼睛正在处理
    isAnyProcessing() {
      return this.processingState.left || this.processingState.right;
    },
    // 是否有任何图像已加载
    hasAnyImage() {
      // 需要访问子组件的状态，可以使用 refs (确保子组件渲染后访问)
      if (this.$refs.leftProcessor && this.$refs.rightProcessor) {
        return this.$refs.leftProcessor.hasOriginalImage || this.$refs.rightProcessor.hasOriginalImage;
      }
      return false;
    },
  },
  methods: {
    ...mapActions(['setClassificationImageFromBrightness']), // 假设 Vuex action 名称

    // --- 事件处理 ---
    handleProcessingStart(side) {
      this.processingState[side] = true;
      console.log(`${side} eye processing started.`);
      // 可以添加全局加载状态，例如：
      // this.$store.commit('SET_GLOBAL_LOADING', true);
    },
    handleProcessingEnd(side) {
      this.processingState[side] = false;
      console.log(`${side} eye processing ended.`);
      // if (!this.isAnyProcessing) {
      //   this.$store.commit('SET_GLOBAL_LOADING', false);
      // }
    },

    // 重置对应眼睛的状态（由子组件移除事件触发）
    resetEyeState(side) {
       console.log(`Resetting state for ${side} eye initiated by child.`);
       // 状态管理主要在子组件内部，父组件可能不需要做太多
       // 如果有全局依赖于此状态的逻辑，可以在这里处理
       this.processingState[side] = false; // 确保处理状态也重置
    },

    // 处理发送到分类识别的请求
    async handleSendToClassification({ side, dataUrl, originalFile }) {
      if (!dataUrl) return;

      this.$confirm(`确定要将${side === 'left' ? '左' : '右'}眼调整后的图像导入分类识别模块吗？`, '确认导入', {
        confirmButtonText: '确定导入',
        cancelButtonText: '取消',
        type: 'info',
        customClass: 'tech-message-box',
        center: true,
      }).then(async () => {
        console.log(`Sending ${side} eye image to classification module...`);
        this.$message({ type: 'info', message: `正在准备${side === 'left' ? '左' : '右'}眼图像数据...` });

        try {
          // **关键步骤：调用 Vuex Action**
          // 假设 Vuex action 'setClassificationImageFromBrightness' 接受一个对象
          // { side: 'left' | 'right', dataUrl: '...', fileInfo: { name: '...', size: '...', type: '...' } }
          const fileInfo = originalFile ? { name: originalFile.name, size: originalFile.size, type: originalFile.type } : null;

          await this.setClassificationImageFromBrightness({ side, dataUrl, fileInfo });

          this.$message.success(`${side === 'left' ? '左' : '右'}眼图像已成功发送到分类识别模块。`);

          // 可选：成功发送后跳转到分类页面
          // this.$router.push({ name: 'Classification' }); // 假设路由名称是 'Classification'

        } catch (error) {
          console.error(`Error sending ${side} eye image via Vuex:`, error);
          this.$message.error(`发送${side === 'left' ? '左' : '右'}眼图像到分类模块失败: ${error.message || '请检查Vuex配置'}`);
        }
      }).catch(action => {
         if (action === 'cancel') {
             this.$message({ type: 'info', message: '导入操作已取消' });
         }
      });
    },

    // 显示预览对话框
    showPreviewDialog(url) {
      if (url) {
        this.previewImageUrl = url;
        this.previewDialogVisible = true;
      }
    },

    // 重置所有（左右眼）
    resetAll() {
        this.$confirm('确定要重置左右眼的所有图像和调整吗?', '全部重置确认', {
           confirmButtonText: '确定',
           cancelButtonText: '取消',
           type: 'warning',
           distinguishCancelAndClose: true,
           customClass: 'tech-message-box',
           center: true,
        }).then(() => {
          if (this.$refs.leftProcessor) {
            this.$refs.leftProcessor.clearImageData();
          }
          if (this.$refs.rightProcessor) {
            this.$refs.rightProcessor.clearImageData();
          }
          this.$message({ type: 'info', message: '所有图像和调整已重置' });
        }).catch(action => {
           if (action === 'cancel') {
               this.$message({ type: 'info', message: '操作已取消' });
           }
        });
    },

    // --- 辅助函数 ---
    // (如果需要将 DataURL 转回 File 对象)
    dataURLtoFile(dataurl, filename) {
        if (!dataurl) return null;
        try {
            var arr = dataurl.split(','),
                mimeMatch = arr[0].match(/:(.*?);/);
            if (!mimeMatch) return null; // 无法解析 MIME 类型

            var mime = mimeMatch[1],
                bstr = atob(arr[1]), // Base64 解码
                n = bstr.length,
                u8arr = new Uint8Array(n);

            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename || `image_${Date.now()}.png`, {type:mime});
        } catch (e) {
            console.error("Error converting DataURL to File:", e);
            return null;
        }
    }
  },
};
</script>

<style scoped>
/* --- Base Layout & Theme Styles (Borrowed from Classification.vue) --- */
.brightness-container {
  background: transparent; /* Assume parent provides background */
  width: 100%;
  min-height: calc(100vh - 60px); /* Adjust if header height is different */
  padding: 20px 30px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  color: #fff; /* Default text color for the theme */
}

/* Header */
.tech-header { display: flex; align-items: center; justify-content: center; margin-bottom: 15px; position: relative; }
.tech-header h1 { color: #8DD1FE; font-size: 26px; margin: 0 20px; text-shadow: 0 0 12px rgba(57, 175, 253, 0.6); font-weight: 600; }
.highlight { color: #4dbfff; }
.tech-line { height: 2px; width: 120px; position: relative; }
.tech-line.left { background: linear-gradient(to right, rgba(57, 175, 253, 0), #39AFFD); }
.tech-line.right { background: linear-gradient(to left, rgba(57, 175, 253, 0), #39AFFD); }
.component-description {
  text-align: center;
  color: rgba(141, 209, 254, 0.85);
  margin-bottom: 30px;
  font-size: 14px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* Main Content Layout */
.main-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); /* 响应式布局 */
  gap: 30px;
  width: 100%;
  flex-grow: 1; /* 占据剩余垂直空间 */
}

.eye-section {
  display: flex;
  flex-direction: column;
  /* background: rgba(13, 28, 64, 0.4); */
  /* border: 1px solid rgba(57, 175, 253, 0.2); */
  /* border-radius: 8px; */
  /* padding: 20px; */
}

.section-title {
  color: #a9d1f7;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(57, 175, 253, 0.25);
  padding-bottom: 12px;
}
.section-title i {
  margin-right: 8px;
  color: #4dbfff;
}

/* Global Actions */
.global-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(57, 175, 253, 0.2);
  text-align: center;
}

/* --- Dialog Styles (Similar to Classification) --- */
:deep(.el-dialog__wrapper) { backdrop-filter: blur(3px); }
:deep(.image-preview-dialog .el-dialog) {
  background: linear-gradient(145deg, rgba(10, 26, 56, 0.97), rgba(15, 35, 70, 0.97));
  border-radius: 12px;
  border: 1px solid rgba(57, 175, 253, 0.5);
  box-shadow: 0 8px 40px rgba(57, 175, 253, 0.25);
  overflow: hidden;
}
:deep(.image-preview-dialog .el-dialog__header) { border-bottom: 1px solid rgba(57, 175, 253, 0.3); padding: 18px 25px; background: rgba(16, 32, 67, 0.3); }
:deep(.image-preview-dialog .el-dialog__title) { color: #a9d1f7; font-size: 18px; font-weight: 600; }
:deep(.image-preview-dialog .el-dialog__headerbtn .el-dialog__close) { color: #a9d1f7; font-size: 18px; }
:deep(.image-preview-dialog .el-dialog__headerbtn .el-dialog__close:hover) { color: #4dbfff; }
:deep(.image-preview-dialog .el-dialog__body) { padding: 20px; color: #cce5ff; max-height: 75vh; overflow-y: auto; }
:deep(.image-preview-dialog .el-dialog__footer) { border-top: 1px solid rgba(57, 175, 253, 0.3); padding: 15px 25px; background: rgba(16, 32, 67, 0.2); text-align: right; }
.preview-dialog-content {
    text-align: center;
    min-height: 300px; /* 保证最小高度 */
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.2);
    border-radius: 6px;
}
.preview-image-large {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 4px;
}

/* Responsive Adjustments */
@media (max-width: 992px) {
  .main-content {
    /* Grid会自动调整 */
  }
}

@media (max-width: 768px) {
  .brightness-container {
    padding: 15px;
  }
  .main-content {
    grid-template-columns: 1fr; /* 强制单列 */
    gap: 20px;
  }
  .tech-header h1 { font-size: 22px; margin: 0 10px;}
  .tech-line { width: 80px; }
  .component-description {
     font-size: 13px;
     margin-bottom: 20px;
  }
   /* 调整子组件内预览区在小屏幕的布局 */
   :deep(.preview-section) {
      grid-template-columns: 1fr; /* 预览区也改为单列 */
      gap: 10px;
      min-height: auto;
   }
   :deep(.preview-image) {
      height: 150px; /* 减小预览图高度 */
   }
   :deep(.slider-container) {
       flex-direction: column; /* 堆叠滑块和标签 */
       align-items: stretch; /* 拉伸对齐 */
       gap: 8px;
   }
    :deep(.slider-label) {
        text-align: center; /* 居中标签 */
        min-width: auto;
    }
     :deep(.reset-button) {
         position: absolute; /* 绝对定位重置按钮 */
         right: 5px;
         top: 50%;
         transform: translateY(-50%);
     }
    :deep(.action-buttons) {
        flex-direction: column; /* 堆叠按钮 */
        gap: 10px;
        align-items: stretch; /* 拉伸按钮 */
    }
     :deep(.action-btn) {
        width: 100%;
     }
}

/* Add import for the message box style if not globally defined */
/* Ensure this path is correct or define globally */
/* @import url('path/to/your/tech-message-box.css'); */

/* Make sure the placeholder image path is correct */
/* Example if assets folder is at src/assets */
/* :deep(.image-processor-wrapper .placeholder-image) { content: url('~@/assets/placeholder-eye.png'); } */
.brightness-container {
  padding: 25px 40px; /* 调整整体内边距 */
}

.component-description {
  margin-bottom: 35px; /* 增大与下方内容的间距 */
  font-size: 15px; /* 稍微增大描述字体 */
}

.main-content {
  gap: 40px; /* 增大左右眼区域的间距 */
}

.section-title {
  color: #bde2ff; /* 标题颜色更亮 */
  font-size: 20px; /* 增大标题字体 */
  font-weight: 600;
  margin-bottom: 25px; /* 增大标题与内容的间距 */
  padding-bottom: 15px; /* 增加下边距 */
  border-bottom: 1px solid rgba(57, 175, 253, 0.3); /* 调整下划线 */
}
.section-title i {
  margin-right: 10px;
  color: #4dbfff;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .brightness-container {
    padding: 20px 15px; /* 调整小屏幕内边距 */
  }
  .main-content {
    gap: 25px; /* 调整小屏幕间距 */
  }
   .section-title {
      font-size: 18px;
      margin-bottom: 20px;
      padding-bottom: 12px;
   }
}
</style>