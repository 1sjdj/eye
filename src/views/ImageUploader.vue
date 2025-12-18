<template>
  <div class="upload-card" :class="[`${side}-card`, { 'drag-over': isDragOver }]" :aria-labelledby="`${side}-card-header`">
    <div class="card-header" :id="`${side}-card-header`">
      <i class="el-icon-camera" aria-hidden="true"></i>
      <span>{{ label }}</span>
      <el-button
        v-if="imageSrc"
        type="text"
        icon="el-icon-delete"
        @click="clearImage"
        class="clear-btn"
        :aria-label="`清除${label}`"
        title="清除图像"
      ></el-button>
    </div>
    <div class="card-body">
      <!-- Upload Area (Visible when no image) -->
      <div
        v-if="!imageSrc"
        class="upload-area"
        role="button"
        tabindex="0"
        :aria-label="`点击或拖拽上传${label}`"
        @click="triggerUpload"
        @keydown.enter.space="triggerUpload"
        @drop.prevent="handleDrop"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
      >
        <input
          type="file"
          :ref="`${side}FileInput`"
          style="display: none"
          :accept="acceptedFormatsString"
          @change="handleFileChange"
          aria-hidden="true"
        />
        <div class="upload-icon" aria-hidden="true">
          <i class="el-icon-upload"></i>
        </div>
        <div class="upload-text" aria-hidden="true">点击上传或拖拽图片</div>
        <div class="upload-hint" aria-hidden="true">(支持 JPG, PNG, BMP, DCM)</div>
      </div>

      <!-- Preview Area (Visible when image is loaded) -->
      <div class="preview-area" v-else>
        <img
          :src="imageSrc"
          :alt="label"
          @click="previewImage"
          class="preview-image"
          tabindex="0"
          :aria-label="`预览${label}图像 - 点击放大查看`"
          @keydown.enter.space="previewImage"
         />
        <!-- Progress Bar (Used during file read, not actual upload) -->
        <div class="image-progress" v-if="uploading && progress < 100">
          <div class="progress-bar" :style="{ width: progress + '%' }" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
            <span class="sr-only">{{ progress }}% 文件读取中</span>
          </div>
        </div>
         <!-- Optional: Display filename -->
         <div v-if="currentFile" class="file-info" :title="currentFile.name">
            {{ truncateFilename(currentFile.name) }}
         </div>
      </div>
    </div>
  </div>
</template>

<script>
// --- Configuration Constants ---
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'application/dicom']; // Corrected DICOM MIME type
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'bmp', 'dcm'];
const MAX_FILE_SIZE_MB = 10;

export default {
name: 'ImageUploader',
props: {
  side: {
    type: String,
    required: true,
    validator: (value) => ['left', 'right'].includes(value),
  },
  label: {
    type: String,
    required: true,
  },
  initialImage: {
    type: String,
    default: null,
  }
},
data() {
  return {
    imageSrc: this.initialImage,
    progress: 0,
    uploading: false, // Represents file reading process
    currentFile: null,
    isDragOver: false, // Add state for drag-over visual feedback
  };
},
computed: {
   acceptedFormatsString() {
      // Combine MIME types and extensions for the accept attribute
      const extensions = ALLOWED_EXTENSIONS.map(ext => `.${ext}`);
      return [...ALLOWED_MIME_TYPES, ...extensions].join(',');
   }
},
watch: {
  initialImage(newVal) {
    if (newVal !== this.imageSrc) {
        console.log(`ImageUploader (${this.side}): Initial image prop updated.`);
        // If initialImage changes, treat it like an external set without a File object initially
        this.imageSrc = newVal;
        this.currentFile = null; // No file object associated with initial prop change directly
        this.uploading = false;
        this.progress = newVal ? 100 : 0;
        // Decide if a prop change should emit 'image-selected' or 'image-cleared'
        if (newVal) {
            // Emit with null file? Or maybe parent handles this?
            // For simplicity, let's assume initialImage is just for initial display
        } else {
             this.$emit('image-cleared', this.side);
        }
    }
  }
},
methods: {
  triggerUpload() {
    this.clearInputAndClick();
  },
  clearInputAndClick() {
    // Helper method to clear input and trigger click
    const fileInput = this.$refs[`${this.side}FileInput`];
    if (fileInput) {
      fileInput.value = null; // Clear the input value to allow selecting the same file again
      fileInput.click();
    } else {
      console.error(`ImageUploader (${this.side}): File input ref '${this.side}FileInput' not found.`);
    }
  },
  handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
        this.processFile(file);
    }
  },
  handleDrop(event) {
    event.preventDefault(); // Prevent default browser behavior (opening file)
    if (window.navigator.vibrate) {
        try { // Vibration might fail in some contexts
            window.navigator.vibrate(50);
        } catch (e) { console.warn("Vibration failed:", e); }
    }
    this.isDragOver = false; // Reset drag over state
    const file = event.dataTransfer?.files?.[0];
     if (file) {
         this.processFile(file);
     } else {
         this.$message.warning('无法获取拖拽的文件。');
     }
  },
  handleDragOver(event) {
      event.preventDefault(); // Necessary to allow drop
      this.isDragOver = true; // Set drag over state for visual feedback
  },
  handleDragLeave(event) {
      // Check if the leave is to an element within the drop zone
      // This simple implementation resets on any leave
      event.preventDefault();
      this.isDragOver = false; // Reset drag over state when leaving area
  },
  validateFile(file) {
      if (!file) return { valid: false, error: '未选择文件。' };

      const fileSizeMB = file.size / 1024 / 1024;
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

      if (fileSizeMB <= 0) {
          return { valid: false, error: '文件大小无效或文件为空。' };
      }
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        return { valid: false, error: `文件过大 (${fileSizeMB.toFixed(1)}MB)，请上传小于 ${MAX_FILE_SIZE_MB}MB 的图片。` };
      }

      // Prioritize MIME type check, fallback to extension
      if (ALLOWED_MIME_TYPES.includes(file.type)) {
          return { valid: true, error: null };
      } else if (file.type === '' && fileExtension === 'dcm') {
          // Handle DICOM files that might lack a standard MIME type
          console.warn(`ImageUploader (${this.side}): Empty MIME type for .dcm file, accepting based on extension.`);
          return { valid: true, error: null };
      } else if (ALLOWED_EXTENSIONS.includes(fileExtension)) {
           console.warn(`ImageUploader (${this.side}): MIME type '${file.type}' not recognized, accepting based on extension '.${fileExtension}'.`);
           return { valid: true, error: null };
      } else {
          return { valid: false, error: `不支持的文件类型: ${file.type || `.${fileExtension}`}. 支持类型: ${ALLOWED_EXTENSIONS.join(', ')}.` };
      }
  },
  processFile(file) {
    const validation = this.validateFile(file);
    if (!validation.valid) {
        this.$message.error(validation.error);
        this.clearInputOnError(); // Clear input if validation fails
        return;
    }

    this.currentFile = file; // Store the File object
    this.uploading = true; // Indicate reading process started
    this.progress = 0;
    this.imageSrc = null; // Clear previous preview immediately

    const reader = new FileReader();

    reader.onload = (e) => {
      this.imageSrc = e.target.result; // Set the preview source (Data URL)
      this.progress = 100;
      this.uploading = false;
      // Emit event AFTER processing is complete
      this.$emit('image-selected', {
          side: this.side,
          file: this.currentFile, // Send the actual File object
          dataUrl: this.imageSrc // Send the Data URL for convenience
      });
      console.log(`ImageUploader (${this.side}): File "${file.name}" processed and selected event emitted.`);
    };

    reader.onerror = (e) => {
      console.error(`ImageUploader (${this.side}): FileReader error for "${file.name}":`, e);
      this.$message.error('文件读取失败，请检查文件是否损坏或浏览器权限。');
      this.clearImage(); // Clear state on error
      this.uploading = false;
    };

    reader.onprogress = (e) => {
        if (e.lengthComputable) {
            // Update progress smoothly
            this.progress = Math.round((e.loaded / e.total) * 100);
        } else {
             // Fallback for non-computable progress (less common for readAsDataURL)
             // Maybe show an indeterminate state or a fixed progress step
             this.progress = this.progress < 50 ? this.progress + 10 : this.progress;
        }
    };

    reader.readAsDataURL(file); // Read the file content as Data URL
  },
  clearImage() {
    console.log(`ImageUploader (${this.side}): Clearing image and resetting state.`);
    this.imageSrc = null;
    this.progress = 0;
    this.uploading = false;
    this.currentFile = null;
    this.clearInputOnError(); // Clear the file input value
    this.$emit('image-cleared', this.side); // Notify parent
  },
  clearInputOnError() {
      // Helper to reset the file input value
      const fileInput = this.$refs[`${this.side}FileInput`];
      if (fileInput) {
          fileInput.value = null; // Allows selecting the same file again after an error
      }
  },
  previewImage() {
     if (this.imageSrc) {
         this.$emit('show-preview', this.imageSrc); // Emit event for parent to handle preview dialog
     }
  },
  truncateFilename(name, maxLength = 25) { // Slightly shorter max length
      if (!name) return '';
      if (name.length <= maxLength) return name;
      const extDotIndex = name.lastIndexOf('.');
      if (extDotIndex === -1 || extDotIndex < name.length - 6) { // No extension or very long extension
        return `${name.slice(0, maxLength - 3)}...`;
      }
      const ext = name.slice(extDotIndex); // Includes the dot
      const base = name.slice(0, extDotIndex);
      const maxBaseLength = maxLength - ext.length - 3; // Reserve space for '...' and extension
      if (maxBaseLength <= 0) { // Extension itself is too long
          return `...${ext.slice(0, maxLength-3)}`;
      }
      return `${base.slice(0, maxBaseLength)}...${ext}`;
  },
  getFile() {
      // Method for parent component to potentially get the file object if needed
      return this.currentFile;
  },

  // --- NEW METHOD: To be called by the parent component (Classification.vue) ---
  setImageExternally(file, dataUrl) {
      console.log(`ImageUploader (${this.side}): Setting image externally.`);
      if (!(file instanceof File)) {
          console.error(`ImageUploader (${this.side}): setImageExternally expects a File object.`);
          // Optionally create a dummy file if only dataUrl is critical, but better to have the File
          // file = new File(["dummy"], file?.name || "external_image.png", { type: file?.type || 'image/png' });
          // For now, let's just warn and proceed if dataUrl exists
          if (!dataUrl) {
              this.$message.error(`外部设置图像失败：缺少有效的图像数据 (${this.side})。`);
              return;
          }
      }
       if (!dataUrl || !dataUrl.startsWith('data:image')) {
           console.error(`ImageUploader (${this.side}): setImageExternally expects a valid image DataURL.`);
           this.$message.error(`外部设置图像失败：图像数据格式无效 (${this.side})。`);
           return;
       }

      // 1. Update internal state
      this.currentFile = file;
      this.imageSrc = dataUrl;
      this.uploading = false; // Assume external setting means reading is done
      this.progress = 100;

      // 2. Clear the native file input (important!)
      // This prevents confusion if the user later clicks the upload area
      this.clearInputOnError();

      // 3. Emit 'image-selected' event to notify the parent (Classification.vue)
      // This keeps the logic consistent, as if the user selected the file
      this.$emit('image-selected', {
          side: this.side,
          file: this.currentFile,
          dataUrl: this.imageSrc
      });
      console.log(`ImageUploader (${this.side}): Image set externally, 'image-selected' event emitted.`);
    }
},
};
</script>

<style scoped>
/* --- Upload Card Base --- */
.upload-card {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 480px; /* Adjusted min-height */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(13, 28, 64, 0.7) 0%, rgba(20, 42, 92, 0.7) 100%);
  border: 1px solid rgba(57, 175, 253, 0.4);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.3),
    inset 0 0 10px rgba(57, 175, 253, 0.1);
  backdrop-filter: blur(5px);
}

.upload-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 10px 25px rgba(57, 175, 253, 0.3),
    inset 0 0 15px rgba(57, 175, 253, 0.2);
}

/* --- Side Specific Styling (Accent Borders) --- */
.left-card { border-left: 3px solid #39AFFD; }
.right-card { border-left: 3px solid #FF6B6B; } /* Kept red for right eye */

/* --- Card Header --- */
.card-header {
  background: rgba(16, 32, 67, 0.8);
  padding: 10px 15px;
  color: #8DD1FE;
  font-size: 16px;
  font-weight: 500; /* Slightly bolder */
  display: flex;
  align-items: center;
  /* justify-content: space-between; */ /* Let button push naturally */
  border-bottom: 1px solid rgba(57, 175, 253, 0.2);
}

.card-header i.el-icon-camera {
  margin-right: 8px;
  color: #4dbfff; /* Brighter icon color */
  font-size: 18px;
}

.card-header span {
    flex-grow: 1; /* Allow label to take space */
    margin-right: 10px; /* Space before clear button */
}

.clear-btn {
  color: #ff8f8f;
  padding: 0 5px;
  /* margin-left: auto; Remove auto margin */
  font-size: 18px; /* Slightly larger icon */
  transition: color 0.2s, transform 0.2s;
  flex-shrink: 0; /* Prevent button from shrinking */
}

.clear-btn:hover,
.clear-btn:focus {
  color: #ff4d4d;
  background-color: transparent;
  transform: scale(1.1); /* Add subtle scale effect */
}

/* --- Card Body --- */
.card-body {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* Important to contain preview image/upload area */
  min-height: 400px; /* Adjusted min-height for body */
}

/* --- Upload Area (No Image) --- */
.upload-area {
  width: 100%;
  height: 100%; /* Take full height of card-body */
  max-height: 400px; /* Limit max height */
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 30px;
  box-sizing: border-box;
  /* min-height: 300px; Remove fixed min-height, let parent control */
  text-align: center;
  color: #8DD1FE;
  border: 2px dashed rgba(57, 175, 253, 0.5);
  background: rgba(16, 32, 67, 0.4); /* Slightly darker background */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.upload-area:hover,
.upload-card.drag-over .upload-area { /* Apply hover style also on drag-over */
  border-color: #4dbfff;
  background: rgba(57, 175, 253, 0.15);
  box-shadow: 0 0 15px rgba(57, 175, 253, 0.2);
}

/* Visual feedback for drag-over */
.upload-card.drag-over .upload-area {
  animation: pulse 1.5s infinite;
}


@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(57, 175, 253, 0.4); border-color: rgba(57, 175, 253, 0.7); }
  70% { box-shadow: 0 0 0 12px rgba(57, 175, 253, 0); border-color: #4dbfff; }
  100% { box-shadow: 0 0 0 0 rgba(57, 175, 253, 0); border-color: rgba(57, 175, 253, 0.7); }
}

.upload-area:focus{ /* Style for keyboard focus */
  border-color: #4dbfff;
  background: rgba(57, 175, 253, 0.1);
  outline: 2px solid #39AFFD;
  outline-offset: 1px;
}

.upload-icon { font-size: 40px; color: rgba(57, 175, 253, 0.7); margin-bottom: 15px; }
.upload-text { margin-bottom: 8px; font-weight: 500; }
.upload-hint { font-size: 12px; color: rgba(141, 209, 254, 0.6); }

/* --- Preview Area (Image Loaded) --- */
.preview-area {
  width: 100%;
  height: 100%; /* Take full height of card-body */
  max-height: 400px; /* Limit max height */
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center content vertically */
  align-items: center;
  padding: 5px; /* Small padding */
  box-sizing: border-box;
}

.preview-image {
  display: block;
  max-width: 100%;
  /* max-height: calc(100% - 40px); Adjust max height dynamically */
  height: auto; /* Let height adjust based on width */
  max-height: 320px; /* Set a reasonable max-height */
  object-fit: contain;
  border-radius: 4px;
  cursor: pointer;
  /* margin-bottom: 10px; Remove bottom margin */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); /* Darker shadow */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: rgba(0, 0, 0, 0.3); /* Simple dark background for contrast */
  /* padding: 5px; Remove padding, apply background directly */
}

.preview-image:hover {
  transform: scale(1.03); /* Slightly larger scale on hover */
  box-shadow:
    0 8px 25px rgba(57, 175, 253, 0.3),
    0 0 0 2px rgba(57, 175, 253, 0.5);
}
.preview-image:focus {
  transform: scale(1.03);
  box-shadow: 0 0 10px rgba(57, 175, 253, 0.3);
  outline: 2px solid #39AFFD;
  outline-offset: 2px;
}

/* --- Image Progress Bar --- */
.image-progress {
  width: 90%;
  max-width: 250px; /* Wider progress bar */
  /* margin-top: auto; Position below the image using flex gap */
  margin-top: 15px; /* Space above file info */
  position: relative;
  overflow: hidden;
  height: 10px; /* Slightly thicker */
  background: rgba(16, 32, 67, 0.7);
  border-radius: 5px; /* Match height */
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.progress-bar {
  height: 100%; /* Fill height */
  background: linear-gradient(90deg, #39affd 0%, #4dbfff 100%); /* Simpler gradient */
  border-radius: 5px;
  transition: width 0.4s ease; /* Smooth progress transition */
  /* Removed animation for simplicity, but can be added back */
}
/* Optional: Add back animation if desired */
/* .progress-bar {
  background: linear-gradient(90deg, #39affd 0%, #4dbfff 50%, #39affd 100%);
  background-size: 200% 100%;
  animation: progressAnimation 2s linear infinite;
}
@keyframes progressAnimation {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
} */

/* --- File Info (Filename Display) --- */
.file-info {
  font-size: 12px;
  color: rgba(141, 209, 254, 0.8);
  margin-top: 10px; /* Space below progress or image */
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 95%; /* Slightly wider */
  padding: 0 5px; /* Add horizontal padding */
  box-sizing: border-box;
}

/* --- Accessibility Helper --- */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
/* 添加响应式设计 */
@media (max-width: 768px) {
  .upload-card {
    min-height: 400px; /* Reduced min-height */
  }
  .card-body {
      min-height: 340px; /* Reduced min-height */
      padding: 15px;
  }
  .preview-image {
     max-height: 260px; /* Adjust max height for smaller screens */
  }
  .card-header {
    padding: 8px 12px;
    font-size: 14px;
  }
  .upload-area {
    padding: 20px;
  }
  .upload-icon {
    font-size: 32px;
  }
  .upload-text {
    font-size: 14px;
  }
   .image-progress {
       max-width: 200px;
       height: 8px;
       margin-top: 10px;
   }
   .file-info {
       margin-top: 8px;
   }
}
.clear-btn {
  transition: all 0.3s ease;
}
</style>