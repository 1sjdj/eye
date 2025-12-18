<template>
    <div :class="containerClass" class="image-processor-wrapper">
      <!-- 1. Upload Component -->
      <el-upload
        ref="uploader"
        class="image-uploader"
        action="#"
        :http-request="handleHttpRequest"
        :before-upload="handleBeforeUpload"
        :on-error="handleUploadError"
        :on-remove="handleRemove"
        :show-file-list="true"
        :limit="1"
        list-type="picture-card"
        accept="image/png, image/jpeg, image/bmp, image/webp"
      >
        <i slot="default" class="el-icon-plus"></i>
        <div slot="file" slot-scope="{file}" class="upload-file-slot">
            <img class="el-upload-list__item-thumbnail" :src="file.url" alt="preview">
            <span class="el-upload-list__item-actions">
              <span class="el-upload-list__item-preview" @click="showPreview(originalDataUrl)">
                <i class="el-icon-zoom-in"></i>
              </span>
              <span class="el-upload-list__item-delete" @click="handleRemove">
                <i class="el-icon-delete"></i>
              </span>
            </span>
            <div v-if="uploading && file.status !== 'success'" class="upload-progress">
              <el-progress type="circle" :percentage="file.percentage || 0" :width="60" status="success"></el-progress>
              <span>读取中...</span>
            </div>
        </div>
        <div slot="tip" class="el-upload__tip">
          点击上传{{ eyeSide === 'left' ? '左' : '右' }}眼图像 (JPG/PNG/BMP, <10MB)
        </div>
      </el-upload>
  
      <div v-if="hasOriginalImage" class="processing-area">
         <!-- 2. Preview Area -->
        <div class="preview-section">
            <div class="preview-box original-preview">
                <span class="preview-label">原始图像</span>
                <el-image
                  :src="originalDataUrl || placeholderImage"
                  fit="contain"
                  lazy
                  class="preview-image"
                  :preview-src-list="originalDataUrl ? [originalDataUrl] : []"
                >
                   <div slot="error" class="image-slot-error">
                     <i class="el-icon-picture-outline"></i> <span>加载失败</span>
                   </div>
                   <div slot="placeholder" class="image-slot-placeholder">
                     <i class="el-icon-loading"></i>
                   </div>
                </el-image>
            </div>
            <div class="preview-box adjusted-preview" v-loading="adjustmentProcessing" element-loading-text="正在应用亮度..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(13, 28, 64, 0.7)">
                <span class="preview-label">调整后预览</span>
                <el-image
                  :src="currentPreviewUrl"
                  fit="contain"
                  lazy
                  class="preview-image"
                  :preview-src-list="hasAdjustedImage || hasOriginalImage ? [currentPreviewUrl] : []"
                >
                   <div slot="error" class="image-slot-error">
                     <i class="el-icon-picture-outline"></i> <span>加载失败</span>
                   </div>
                   <div slot="placeholder" class="image-slot-placeholder" v-if="!hasOriginalImage && !hasAdjustedImage">
                     <i class="el-icon-view"></i> <span>待调整</span>
                   </div>
                   <div slot="placeholder" class="image-slot-placeholder" v-else-if="!hasAdjustedImage && hasOriginalImage">
                     <span>原始</span>
                   </div>
                </el-image>
            </div>
        </div>
  
        <!-- 3. Brightness Slider -->
        <div class="slider-container">
          <span class="slider-label">{{ brightnessSliderLabel }}</span>
          <el-slider
            v-model="brightnessValue"
            :min="0"
            :max="100"
            :step="1"
            :disabled="!hasOriginalImage || uploading || adjustmentProcessing"
            :show-tooltip="false"
            @input="handleBrightnessChange"
            class="brightness-slider"
          ></el-slider>
          <el-tooltip content="重置亮度" placement="top">
            <el-button
              icon="el-icon-refresh-left"
              circle
              size="mini"
              @click="resetBrightness"
              :disabled="brightnessValue === 50 || !hasOriginalImage || uploading || adjustmentProcessing"
              class="reset-button"
            ></el-button>
          </el-tooltip>
        </div>
  
        <!-- 4. Action Buttons -->
        <div class="action-buttons">
          <el-button
            type="primary"
            icon="el-icon-download"
            @click="downloadAdjustedImage"
            :disabled="!hasOriginalImage || uploading || adjustmentProcessing"
            size="small"
            class="action-btn download-btn"
          >
            下载 {{ hasAdjustedImage ? '调整后' : '原始' }}图像
          </el-button>
          <el-button
            type="success"
            icon="el-icon-s-promotion"
            @click="requestSendToClassification"
            :disabled="!hasOriginalImage || uploading || adjustmentProcessing"
            size="small"
            class="action-btn send-btn"
          >
            导入分类识别
          </el-button>
        </div>
      </div>
      <div v-else class="placeholder-text">
         请先上传{{ eyeSide === 'left' ? '左' : '右' }}眼图像...
      </div>
    </div>
  </template>
  
  <script>
  import { debounce } from 'lodash-es';
  
  export default {
    name: 'ImageProcessor',
    props: {
      eyeSide: {
        type: String,
        required: true,
        validator: value => ['left', 'right'].includes(value),
      },
      techStyle: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        originalFile: null,
        originalDataUrl: null,
        adjustedDataUrl: null, // 调整后的图像 Data URL
        brightnessValue: 50, // 亮度值 (0-100, 50 为原始)
        isProcessing: false, // 是否正在处理（上传或亮度调整）
        uploading: false, // 是否正在上传
        adjustmentProcessing: false, // 是否正在应用亮度调整
        canvasElement: null, // 离屏 Canvas
        ctx: null, // Canvas 2D Context
        originalImageData: null, // 缓存原始像素数据，提高性能
        originalWidth: 0,
        originalHeight: 0,
        placeholderImage: require('@/assets/placeholder-eye.png'), // 引入占位图
      };
    },
    computed: {
       // 是否有原始图像已加载
      hasOriginalImage() {
        return !!this.originalDataUrl;
      },
      // 是否有调整后的图像（意味着亮度被改变过）
      hasAdjustedImage() {
        return !!this.adjustedDataUrl;
      },
      // 获取当前应显示的预览图 (优先显示调整后的，否则显示原始)
      currentPreviewUrl() {
        return this.adjustedDataUrl || this.originalDataUrl || this.placeholderImage;
      },
      // 根据主题选择样式类
      containerClass() {
        // 注意：这个计算属性可能需要调整，取决于你是否真的需要基于 techStyle 添加类
        // return this.techStyle ? 'image-processor-tech' : 'image-processor-default';
        // 暂时返回空字符串或固定类名
        return '';
      },
      // 下载按钮的文件名
      downloadFilename() {
          const sideLabel = this.eyeSide === 'left' ? 'OS' : 'OD';
          const originalName = this.originalFile?.name.split('.')[0] || 'eye_image';
          return `${originalName}_${sideLabel}_brightness_${this.brightnessValue}.png`;
      },
      // 亮度滑块的标签
      brightnessSliderLabel() {
          const diff = this.brightnessValue - 50;
          if (diff === 0) return '亮度: 原始';
          return `亮度: ${diff > 0 ? '+' : ''}${diff}`;
      },
    },
    created() {
      this.debouncedApplyBrightness = debounce(this.applyBrightnessImmediately, 300);
    },
    beforeDestroy() {
      if (this.debouncedApplyBrightness && this.debouncedApplyBrightness.cancel) {
        this.debouncedApplyBrightness.cancel();
      }
      this.releaseCanvasResources();
    },
    methods: {
      // --- 上传处理 ---
      handleBeforeUpload(file) {
        this.uploading = true;
        this.$emit('processing-start');
        const isImage = file.type.startsWith('image/');
        // 10MB size limit
        const isLt10M = file.size / 1024 / 1024 < 10;
  
        if (!isImage) {
          this.$message.error(`文件 "${file.name}" 不是有效的图像格式!`);
          this.uploading = false;
          this.$emit('processing-end');
          return false;
        }
        if (!isLt10M) {
          this.$message.error(`上传图像大小不能超过 10MB! 文件 "${file.name}" 过大。`);
          this.uploading = false;
          this.$emit('processing-end');
          return false;
        }
        this.resetAdjustmentState();
        return true;
      },
      handleUploadSuccess(response, file, fileList) {
         console.log("Default upload success (should not happen with custom request):", response, file);
      },
      handleUploadError(err, file, fileList) {
        this.uploading = false;
        this.$emit('processing-end');
        console.error('Upload Error:', err);
        let errorMessage = `图像 "${file.name}" 上传失败`;
        try {
          const errorResponse = JSON.parse(err.message);
          if (errorResponse && errorResponse.message) {
            errorMessage += `: ${errorResponse.message}`;
          }
        } catch (e) {
           errorMessage += `，请重试或检查文件。`;
        }
        this.$message.error(errorMessage);
        this.clearImageData();
      },
      handleHttpRequest(options) {
        const file = options.file;
        this.originalFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.originalDataUrl = e.target.result;
          this.loadImageAndCachePixels(this.originalDataUrl)
            .then(() => {
              this.$message.success(`"${file.name}" 读取成功，可以开始调整亮度。`);
              this.uploading = false;
              this.$emit('processing-end');
              options.onSuccess({ message: 'File read successfully' }, file);
            })
            .catch(error => {
              console.error("Error loading image for canvas:", error);
              this.$message.error(`读取图像 "${file.name}" 时出错，无法进行处理。`);
              this.clearImageData();
              this.uploading = false;
              this.$emit('processing-end');
              options.onError(new Error('Failed to process image data'));
            });
        };
        reader.onerror = (e) => {
          console.error('FileReader error:', e);
          this.$message.error(`读取文件 "${file.name}" 失败!`);
          this.clearImageData();
          this.uploading = false;
          this.$emit('processing-end');
          options.onError(new Error('FileReader failed'));
        };
        reader.readAsDataURL(file);
      },
      async loadImageAndCachePixels(dataUrl) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            this.originalWidth = img.width;
            this.originalHeight = img.height;
            if (!this.canvasElement) {
              this.canvasElement = document.createElement('canvas');
            }
            this.canvasElement.width = this.originalWidth;
            this.canvasElement.height = this.originalHeight;
            if (!this.ctx) {
              this.ctx = this.canvasElement.getContext('2d', { willReadFrequently: true });
               if (!this.ctx) {
                   return reject(new Error("无法获取 Canvas 2D context。"));
               }
            }
            try {
              this.ctx.drawImage(img, 0, 0, this.originalWidth, this.originalHeight);
              this.originalImageData = this.ctx.getImageData(0, 0, this.originalWidth, this.originalHeight);
              console.log(`(${this.eyeSide}) Image loaded and pixels cached: ${this.originalWidth}x${this.originalHeight}`);
              resolve();
            } catch (error) {
                console.error(`(${this.eyeSide}) Error getting image data from canvas:`, error);
                if (error.name === 'SecurityError') {
                     reject(new Error("无法访问图像像素数据，可能是安全限制（例如 CORS）。"));
                } else {
                     reject(new Error(`处理图像像素时出错: ${error.message}`));
                }
            }
          };
          img.onerror = (error) => {
            console.error(`(${this.eyeSide}) Failed to load image from DataURL:`, error);
            reject(new Error("无法加载图像资源。"));
          };
          img.src = dataUrl;
        });
      },
      handleRemove() {
        this.$confirm('确定要移除当前图像及其调整吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
           distinguishCancelAndClose: true,
           customClass: 'tech-message-box',
           center: true,
        }).then(() => {
          this.clearImageData();
          this.$message({ type: 'info', message: '图像已移除' });
          this.$emit('image-cleared');
        }).catch(action => {
           if (action === 'cancel') {
               this.$message({ type: 'info', message: '操作已取消' });
           }
        });
      },
      clearImageData() {
        this.originalFile = null;
        this.originalDataUrl = null;
        this.adjustedDataUrl = null;
        this.brightnessValue = 50;
        this.originalImageData = null;
        this.originalWidth = 0;
        this.originalHeight = 0;
        this.isProcessing = false;
        this.uploading = false;
        this.adjustmentProcessing = false;
        if (this.$refs.uploader) {
          // 确保 ref 存在再调用
          this.$refs.uploader.clearFiles();
        }
      },
      resetAdjustmentState() {
          this.adjustedDataUrl = null;
          this.brightnessValue = 50;
          this.adjustmentProcessing = false;
      },
      // --- 亮度调节核心逻辑 ---
      handleBrightnessChange(value) {
        this.brightnessValue = value;
        if (this.originalImageData) {
          this.adjustmentProcessing = true;
          this.$emit('processing-start');
          this.debouncedApplyBrightness();
        }
      },
      applyBrightnessImmediately() {
        if (!this.originalImageData || !this.ctx) {
          console.warn(`(${this.eyeSide}) Cannot apply brightness: missing image data or canvas context.`);
          this.adjustmentProcessing = false;
          this.$emit('processing-end');
          return;
        }
        console.log(`(${this.eyeSide}) Applying brightness: ${this.brightnessValue}`);
        const startTime = performance.now();
        const currentPixelData = new Uint8ClampedArray(this.originalImageData.data);
        const data = currentPixelData;
        const offset = (this.brightnessValue - 50) * 2;
  
        for (let i = 0; i < data.length; i += 4) {
          data[i]     = this.originalImageData.data[i] + offset;
          data[i + 1] = this.originalImageData.data[i + 1] + offset;
          data[i + 2] = this.originalImageData.data[i + 2] + offset;
        }
        const newImageData = new ImageData(currentPixelData, this.originalWidth, this.originalHeight);
        this.ctx.putImageData(newImageData, 0, 0);
        this.adjustedDataUrl = this.canvasElement.toDataURL('image/png');
        const endTime = performance.now();
        console.log(`(${this.eyeSide}) Brightness applied in ${((endTime - startTime) / 1000).toFixed(3)} seconds.`);
        this.adjustmentProcessing = false;
        this.$emit('processing-end');
      },
      resetBrightness() {
          this.brightnessValue = 50;
          this.adjustedDataUrl = null;
          this.$message.info(`(${this.eyeSide}) 亮度已重置为原始状态`);
      },
      // --- 其他操作 ---
      downloadAdjustedImage() {
        const urlToDownload = this.adjustedDataUrl || this.originalDataUrl;
        if (!urlToDownload) {
          this.$message.warning(`(${this.eyeSide}) 没有可下载的图像。`);
          return;
        }
        const link = document.createElement('a');
        link.href = urlToDownload;
        link.download = this.downloadFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.$message.success(`(${this.eyeSide}) 图像已开始下载: ${this.downloadFilename}`);
      },
      requestSendToClassification() {
          const imageDataToSend = this.hasAdjustedImage ? this.adjustedDataUrl : this.originalDataUrl;
          if (!imageDataToSend) {
              this.$message.warning(`(${this.eyeSide}) 没有可导入的图像。`);
              return;
          }
           this.$emit('request-send-to-classification', {
             side: this.eyeSide,
             dataUrl: imageDataToSend,
             originalFile: this.originalFile
           });
      },
      showPreview(url) {
          // 直接emit事件，让父组件处理对话框
          if (url && url !== this.placeholderImage) {
            this.$emit('show-preview', url);
          } else {
            this.$message.info(`(${this.eyeSide}) 当前没有可预览的图像。`);
          }
      },
      releaseCanvasResources() {
          if (this.ctx) {
              this.ctx.clearRect(0, 0, this.canvasElement?.width || 0, this.canvasElement?.height || 0);
          }
          this.canvasElement = null;
          this.ctx = null;
          this.originalImageData = null;
          console.log(`(${this.eyeSide}) Canvas resources released.`);
      },
    },
  };
  </script>
  
  <style scoped>
  /* ImageProcessor.vue -> <style scoped> */

/* --- 容器和基础布局 --- */
.image-processor-wrapper {
  background: rgba(13, 28, 64, 0.5); /* 稍微调亮一点背景 */
  border: 1px solid rgba(57, 175, 253, 0.35); /* 边框稍微清晰一点 */
  border-radius: 8px;
  padding: 25px; /* 增加内边距 */
  display: flex;
  flex-direction: column;
  gap: 25px; /* 增大主要区域间距 */
  min-height: 550px; /* 稍微增加最小高度以容纳内容 */
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
  overflow: hidden;
  box-shadow: inset 0 0 8px rgba(57, 175, 253, 0.1); /* 添加内部阴影增加层次感 */
}
.image-processor-wrapper:hover {
   box-shadow: 0 0 18px rgba(57, 175, 253, 0.25); /* 悬浮时阴影更明显 */
   border-color: rgba(57, 175, 253, 0.5);
}

/* --- 上传组件区域 --- */
.image-uploader {
  text-align: center;
  margin-bottom: 10px; /* 与下方处理区域的间距 */
}
/* 调整上传卡片大小和样式 */
:deep(.image-uploader .el-upload--picture-card) {
  background-color: rgba(16, 32, 67, 0.6);
  border: 1px dashed rgba(57, 175, 253, 0.6);
  width: 148px; /* 稍微增大 */
  height: 148px;
  line-height: 148px;
  border-radius: 6px; /* 更圆润的边角 */
}
:deep(.image-uploader .el-upload--picture-card:hover) {
  border-color: #4dbfff;
  background-color: rgba(57, 175, 253, 0.1);
}
:deep(.image-uploader .el-upload--picture-card i) {
  color: rgba(141, 209, 254, 0.9);
  font-size: 32px; /* 增大图标 */
}
/* 调整已上传文件列表项的大小 */
:deep(.image-uploader .el-upload-list--picture-card .el-upload-list__item) {
  width: 148px;
  height: 148px;
  border-radius: 6px;
  border-color: rgba(57, 175, 253, 0.5);
  background-color: rgba(13, 28, 64, 0.8); /* 更深的背景 */
}
:deep(.image-uploader .el-upload-list__item-thumbnail) {
   object-fit: contain; /* 让缩略图完整显示 */
}
/* 操作按钮样式 */
:deep(.el-upload-list__item-actions span) {
    cursor: pointer;
    font-size: 20px; /* 增大操作图标 */
    color: #fff;
    opacity: 0.8;
    transition: opacity 0.3s, transform 0.3s;
}
:deep(.el-upload-list__item-actions span:hover) {
    opacity: 1;
    transform: scale(1.1);
}
:deep(.el-upload-list__item-actions .el-upload-list__item-delete) {
    color: #ff7b7b; /* 删除按钮用红色区分 */
}
/* 提示文字 */
:deep(.image-uploader .el-upload__tip) {
    color: rgba(141, 209, 254, 0.9);
    margin-top: 10px;
    font-size: 13px;
    line-height: 1.5;
}

/* --- 图像处理区域 (包含预览、滑块、按钮) --- */
.processing-area {
  display: flex;
  flex-direction: column;
  gap: 30px; /* 增大预览、滑块、按钮之间的间距 */
  margin-top: 0; /* 移除顶部间距，由父级 gap 控制 */
  flex-grow: 1;
  width: 100%; /* 确保占满宽度 */
}

/* --- 预览区域 --- */
.preview-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px; /* 增大预览框间距 */
  /* min-height: 220px; */ /* 调整最小高度 */
  height: 240px; /* 固定预览区域高度 */
}
.preview-box {
  border: 1px solid rgba(57, 175, 253, 0.4); /* 边框更明显 */
  border-radius: 6px;
  padding: 15px; /* 增加内边距 */
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(10, 22, 50, 0.4); /* 预览区背景 */
  position: relative;
  overflow: hidden; /* 隐藏内部溢出 */
  justify-content: space-between; /* 让内容上下分布 */
}
.preview-label {
  color: #a9d1f7; /* 标签颜色 */
  font-size: 14px;
  font-weight: 500;
  background: rgba(57, 175, 253, 0.15);
  padding: 4px 10px;
  border-radius: 4px;
  /* margin-bottom: 10px; */ /* 移除底部间距，让图片区域决定 */
  width: fit-content; /* 宽度自适应内容 */
  align-self: center; /* 居中标签 */
}
/* 预览图片容器 */
.preview-image-container {
    flex-grow: 1; /* 占据剩余空间 */
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-top: 10px; /* 与标签的间距 */
    overflow: hidden; /* 确保图片不溢出 */
}
.preview-image {
  display: block; /* 确保是块级元素 */
  max-width: 100%;
  max-height: 100%; /* 限制最大高度为容器高度 */
  height: auto; /* 高度自适应 */
  width: auto; /* 宽度自适应 */
  object-fit: contain;
  background-color: transparent; /* 移除背景色，让父级背景透出 */
  border-radius: 4px;
}

/* Element UI Image 样式覆盖 */
:deep(.preview-box .el-image) {
    width: 100%;
    height: 100%; /* 让 el-image 填满容器 */
    display: flex; /* 方便内部 placeholder 居中 */
    align-items: center;
    justify-content: center;
}
:deep(.preview-box .el-image__inner) {
    /* .preview-image 的样式已经处理了 */
}
:deep(.preview-box .image-slot-error),
:deep(.preview-box .image-slot-placeholder) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4); /* 加载/错误时的背景 */
  color: #8DD1FE;
  font-size: 14px;
  border-radius: 4px; /* 保持圆角 */
}
:deep(.preview-box .image-slot-error i),
:deep(.preview-box .image-slot-placeholder i) {
  font-size: 30px; /* 增大图标 */
  margin-bottom: 8px;
  color: #6ba0c5;
}
:deep(.preview-box .image-slot-error span),
:deep(.preview-box .image-slot-placeholder span) {
  font-size: 13px; /* 增大文字 */
  color: #8cb7d9;
}
/* 加载状态样式 */
:deep(.adjusted-preview .el-loading-spinner .el-icon-loading) {
    font-size: 28px; /* 调整加载图标大小 */
    color: #4dbfff;
}
:deep(.adjusted-preview .el-loading-spinner .el-loading-text) {
    color: #a9d1f7; /* 调整加载文字颜色 */
    margin-top: 5px;
}

/* --- 滑块区域 --- */
.slider-container {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 5px; /* 增加垂直内边距，微调水平 */
  border: 1px solid rgba(57, 175, 253, 0.2); /* 给滑块区域加个边框 */
  border-radius: 6px;
  background: rgba(10, 22, 50, 0.2); /* 微妙的背景 */
}
.slider-label {
  color: #a9d1f7;
  font-size: 14px;
  min-width: 85px; /* 调整标签宽度 */
  text-align: right;
  white-space: nowrap;
  font-weight: 500;
}
.brightness-slider {
  flex-grow: 1;
}
/* 滑块样式微调 */
:deep(.brightness-slider .el-slider__runway) {
  background-color: rgba(57, 175, 253, 0.25);
  height: 8px; /* 加粗 */
  border-radius: 4px;
}
:deep(.brightness-slider .el-slider__bar) {
  background: linear-gradient(90deg, #3077b1 0%, #4dbfff 100%);
  height: 8px;
  border-radius: 4px;
}
:deep(.brightness-slider .el-slider__button-wrapper) {
  top: -6px; /* 调整按钮垂直位置 */
}
:deep(.brightness-slider .el-slider__button) {
  width: 18px; /* 增大按钮 */
  height: 18px;
  border: 2px solid #4dbfff;
  background-color: #101c36;
  box-shadow: 0 0 10px rgba(57, 175, 253, 0.5); /* 增强阴影 */
}
.reset-button {
    background: rgba(57, 175, 253, 0.2);
    border-color: rgba(57, 175, 253, 0.5);
    color: #a9d1f7;
    transition: all 0.3s ease;
    /* font-size: 14px; */ /* Element mini 按钮会自动调整 */
}
.reset-button:hover:not(:disabled) {
    background: rgba(57, 175, 253, 0.4);
    border-color: #4dbfff;
    color: #fff;
    transform: scale(1.05);
}

/* --- 动作按钮区域 --- */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 25px; /* 增大按钮间距 */
  margin-top: 10px; /* 与滑块区域的间距 */
  padding-top: 20px; /* 增加顶部内边距 */
  border-top: 1px solid rgba(57, 175, 253, 0.25); /* 分隔线 */
}
.action-btn {
   padding: 9px 24px; /* 调整按钮大小 */
   font-size: 14px; /* 增大字体 */
   border-radius: 5px;
   transition: all 0.3s ease;
   font-weight: 500; /* 加粗字体 */
   letter-spacing: 0.5px; /* 增加字间距 */
}
.action-btn i { margin-right: 6px; }
.download-btn {
    background: linear-gradient(135deg, #3077b1, #39affd);
    border: none; color: white;
    box-shadow: 0 4px 12px rgba(57, 175, 253, 0.2);
}
.download-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #39affd, #3077b1);
    box-shadow: 0 6px 18px rgba(57, 175, 253, 0.35);
    transform: translateY(-2px);
}
.send-btn {
   background: linear-gradient(135deg, #1f9a8b, #28c7b7);
   border: none; color: white;
   box-shadow: 0 4px 12px rgba(40, 199, 183, 0.2);
}
.send-btn:hover:not(:disabled) {
   background: linear-gradient(135deg, #28c7b7, #1f9a8b);
   box-shadow: 0 6px 18px rgba(40, 199, 183, 0.35);
   transform: translateY(-2px);
}
.action-btn:disabled {
   background: rgba(57, 175, 253, 0.2) !important;
   color: rgba(255, 255, 255, 0.4) !important;
   cursor: not-allowed;
   box-shadow: none !important;
   transform: none !important;
   border: 1px solid rgba(57, 175, 253, 0.3) !important; /* 确保边框样式 */
}

/* --- 占位符文本 --- */
.placeholder-text {
   flex-grow: 1;
   display: flex;
   align-items: center;
   justify-content: center;
   color: rgba(141, 209, 254, 0.7); /* 稍微调亮 */
   font-size: 16px; /* 增大字体 */
   text-align: center;
   padding: 40px;
   min-height: 200px;
   border: 1px dashed rgba(57, 175, 253, 0.3); /* 加个虚线框 */
   border-radius: 6px;
   margin-top: 20px; /* 与上传区域的间距 */
}

/* --- 科技感消息框样式 (保持不变) --- */
/* ... .tech-message-box 样式 ... */

/* --- 响应式调整 --- */
@media (max-width: 1200px) {
    .preview-section {
        height: 200px; /* 中等屏幕减小预览高度 */
    }
}

@media (max-width: 992px) {
    .preview-section {
        height: 180px; /* 稍小屏幕再减小 */
    }
    .image-processor-wrapper {
        min-height: 520px;
    }
}

@media (max-width: 768px) {
   /* 父组件的 .main-content 已经处理了堆叠 */
   .image-processor-wrapper {
       padding: 20px;
       min-height: auto; /* 移除最小高度，让内容自适应 */
       gap: 20px;
   }
   :deep(.image-uploader .el-upload--picture-card),
   :deep(.image-uploader .el-upload-list--picture-card .el-upload-list__item) {
       width: 120px;
       height: 120px;
       line-height: 120px;
   }
   :deep(.image-uploader .el-upload--picture-card i) {
       font-size: 28px;
   }
   .preview-section {
      grid-template-columns: 1fr; /* 预览区也改为单列 */
      gap: 15px;
      height: auto; /* 高度自适应 */
      min-height: 360px; /* 保证单列时有足够高度 */
   }
   .preview-box {
       min-height: 170px; /* 单列时预览框最小高度 */
       padding: 10px;
   }
   .preview-image-container {
       margin-top: 8px;
   }
   .preview-image {
       max-height: 120px; /* 减小预览图最大高度 */
   }
   .slider-container {
       flex-direction: column; /* 堆叠滑块和标签 */
       align-items: stretch; /* 拉伸对齐 */
       gap: 10px;
       padding: 10px;
   }
    .slider-label {
        text-align: center; /* 居中标签 */
        min-width: auto;
    }
     /* 在堆叠时，重置按钮可以考虑放在标签旁边或滑块下方 */
     /* .reset-button { ... } */
    .action-buttons {
        flex-direction: column; /* 堆叠按钮 */
        gap: 12px;
        align-items: stretch; /* 拉伸按钮 */
        padding-top: 15px;
        margin-top: 5px;
    }
     .action-btn {
        width: 100%;
     }
     .placeholder-text {
         font-size: 14px;
         padding: 30px;
         margin-top: 15px;
     }
}
    /* --- 复制 ImageProcessor 的 styles 字符串内容到这里 --- */
    .image-processor-wrapper {
        background: rgba(13, 28, 64, 0.5); /* 稍微调亮一点背景 */
        border: 1px solid rgba(57, 175, 253, 0.35); /* 边框稍微清晰一点 */
        border-radius: 8px;
        padding: 25px; /* 增加内边距 */
        display: flex;
        flex-direction: column;
        gap: 25px; /* 增大主要区域间距 */
        min-height: 550px; /* 稍微增加最小高度以容纳内容 */
        transition: box-shadow 0.3s ease, border-color 0.3s ease;
        overflow: hidden;
        box-shadow: inset 0 0 8px rgba(57, 175, 253, 0.1); /* 添加内部阴影增加层次感 */
    }
    .image-processor-wrapper:hover {
        box-shadow: 0 0 18px rgba(57, 175, 253, 0.25); /* 悬浮时阴影更明显 */
        border-color: rgba(57, 175, 253, 0.5);
    }
  
    .image-uploader {
      text-align: center;
      margin-bottom: 10px;
    }
    .image-uploader .el-upload--picture-card {
      background-color: rgba(16, 32, 67, 0.5);
      border: 1px dashed rgba(57, 175, 253, 0.5);
      width: 120px;
      height: 120px;
      line-height: 120px;
      transition: border-color 0.3s ease, background-color 0.3s ease;
    }
    .image-uploader .el-upload--picture-card:hover {
      border-color: #4dbfff;
      background-color: rgba(16, 32, 67, 0.7);
    }
    .image-uploader .el-upload--picture-card i {
      color: rgba(141, 209, 254, 0.8);
      font-size: 28px;
    }
    .image-uploader .el-upload-list--picture-card .el-upload-list__item {
      width: 120px;
      height: 120px;
      border-radius: 6px;
      border-color: rgba(57, 175, 253, 0.4);
      background-color: rgba(13, 28, 64, 0.6);
    }
     .image-uploader .el-upload-list__item-thumbnail {
       object-fit: cover; /* 缩略图覆盖 */
     }
     .upload-file-slot { /* 自定义插槽容器 */
       width: 100%;
       height: 100%;
       position: relative;
     }
     .upload-progress {
       position: absolute;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       background: rgba(0, 0, 0, 0.7);
       display: flex;
       flex-direction: column;
       align-items: center;
       justify-content: center;
       color: #fff;
       font-size: 12px;
       border-radius: 6px;
     }
     .upload-progress .el-progress__text {
       color: #fff !important; /* 强制白色 */
       font-size: 12px !important;
     }
     .upload-progress span {
        margin-top: 5px;
     }
     .image-uploader .el-upload__tip {
        color: rgba(141, 209, 254, 0.8);
        margin-top: 8px;
        font-size: 12px;
        line-height: 1.4;
     }
  
    .processing-area {
      display: flex;
      flex-direction: column;
      gap: 25px; /* 各区域间距 */
      margin-top: 15px;
      flex-grow: 1; /* 占据剩余空间 */
    }
  
    .preview-section {
      display: grid;
      grid-template-columns: 1fr 1fr; /* 左右预览各占一半 */
      gap: 15px;
      min-height: 200px; /* 预览区最小高度 */
    }
    .preview-box {
      border: 1px solid rgba(57, 175, 253, 0.35);
      border-radius: 6px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: rgba(10, 22, 50, 0.3);
      position: relative; /* 为了加载状态 */
      overflow: hidden;
    }
    .preview-label {
      color: #8DD1FE;
      font-size: 13px;
      margin-bottom: 8px;
      font-weight: 500;
      background: rgba(57, 175, 253, 0.1);
      padding: 3px 8px;
      border-radius: 4px;
    }
    .preview-image {
      width: 100%;
      height: 180px; /* 固定预览图像高度 */
      object-fit: contain; /* 保持比例 */
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }
    .el-image__inner { /* 确保图片能被正确显示 */
      display: block;
    }
    .image-slot-error, .image-slot-placeholder {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      color: #8DD1FE;
      font-size: 14px;
    }
    .image-slot-error i, .image-slot-placeholder i {
      font-size: 24px;
      margin-bottom: 6px;
      color: #6ba0c5;
    }
    .image-slot-error span, .image-slot-placeholder span {
      font-size: 12px;
      color: #8cb7d9;
    }
  
    .slider-container {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 10px 0;
    }
    .slider-label {
      color: #a9d1f7;
      font-size: 14px;
      min-width: 80px; /* 固定标签宽度 */
      text-align: right;
      white-space: nowrap;
    }
    .brightness-slider {
      flex-grow: 1; /* 占据剩余空间 */
    }
    /* --- Custom Slider Styles --- */
    .brightness-slider .el-slider__runway {
      background-color: rgba(57, 175, 253, 0.2);
      height: 6px;
      border-radius: 3px;
    }
    .brightness-slider .el-slider__bar {
      background: linear-gradient(90deg, #3077b1 0%, #4dbfff 100%);
      height: 6px;
      border-radius: 3px;
    }
    .brightness-slider .el-slider__button-wrapper {
      top: -5px; /* 微调按钮位置 */
    }
    .brightness-slider .el-slider__button {
      width: 16px;
      height: 16px;
      border: 2px solid #4dbfff;
      background-color: #101c36;
      box-shadow: 0 0 8px rgba(57, 175, 253, 0.4);
    }
    .brightness-slider .el-slider__button:hover {
       transform: scale(1.1);
    }
     .reset-button {
        background: rgba(57, 175, 253, 0.15);
        border-color: rgba(57, 175, 253, 0.4);
        color: #8DD1FE;
        transition: all 0.3s ease;
     }
     .reset-button:hover:not(:disabled) {
        background: rgba(57, 175, 253, 0.3);
        border-color: #4dbfff;
        color: #fff;
     }
  
    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 15px; /* 与上方控件的间距 */
      padding-top: 15px;
      border-top: 1px solid rgba(57, 175, 253, 0.2); /* 分隔线 */
    }
     .action-btn {
       padding: 8px 20px;
       font-size: 13px;
       border-radius: 5px;
       transition: all 0.3s ease;
     }
     .action-btn i { margin-right: 5px; }
     .download-btn {
        background: linear-gradient(135deg, #3077b1, #39affd);
        border: none; color: white;
        box-shadow: 0 4px 10px rgba(57, 175, 253, 0.15);
     }
     .download-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #39affd, #3077b1);
        box-shadow: 0 6px 15px rgba(57, 175, 253, 0.3);
        transform: translateY(-1px);
     }
     .send-btn {
       background: linear-gradient(135deg, #1f9a8b, #28c7b7);
       border: none; color: white;
       box-shadow: 0 4px 10px rgba(40, 199, 183, 0.15);
     }
     .send-btn:hover:not(:disabled) {
       background: linear-gradient(135deg, #28c7b7, #1f9a8b);
       box-shadow: 0 6px 15px rgba(40, 199, 183, 0.3);
       transform: translateY(-1px);
     }
     .action-btn:disabled {
       background: rgba(57, 175, 253, 0.2) !important;
       color: rgba(255, 255, 255, 0.4) !important;
       cursor: not-allowed;
       box-shadow: none;
       transform: none;
       border: 1px solid rgba(57, 175, 253, 0.3);
     }
  
     .placeholder-text {
       flex-grow: 1;
       display: flex;
       align-items: center;
       justify-content: center;
       color: rgba(141, 209, 254, 0.6);
       font-size: 15px;
       text-align: center;
       padding: 40px;
       min-height: 200px;
     }
  
     /* 科技感消息框样式 (如果需要) */
     .tech-message-box {
        background: linear-gradient(145deg, rgba(10, 26, 56, 0.97), rgba(15, 35, 70, 0.97)) !important;
        border: 1px solid rgba(57, 175, 253, 0.5) !important;
        box-shadow: 0 8px 40px rgba(57, 175, 253, 0.25) !important;
        color: #cce5ff !important;
     }
     .tech-message-box .el-message-box__title {
        color: #a9d1f7 !important;
     }
     .tech-message-box .el-message-box__message {
        color: #cce5ff !important;
     }
     .tech-message-box .el-button--primary {
        background: linear-gradient(135deg, #3077b1, #39affd) !important;
        border: none !important;
        color: white !important;
     }
     .tech-message-box .el-button--default {
        background: rgba(57, 175, 253, 0.15) !important;
        border-color: rgba(57, 175, 253, 0.4) !important;
        color: #8DD1FE !important;
     }
     
  </style>