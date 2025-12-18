<template>
  <div class="classification-container">
    <!-- Header -->
    <div class="tech-header">
      <div class="tech-line left"></div>
      <h1><span class="highlight">眼底图像分类识别</span></h1>
      <div class="tech-line right"></div>
    </div>

    <!-- Create New Case Button -->
    <div class="action-area">
      <el-button type="primary" class="create-case-btn" @click="showCreateCaseDialog">
        <i class="el-icon-plus"></i> 创建新病例
      </el-button>
    </div>

    <!-- Filters -->
    <div class="filter-area">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="患者姓名">
          <el-input v-model="searchForm.patientName" placeholder="请输入患者姓名" class="filter-input" clearable></el-input>
        </el-form-item>
        <el-form-item label="身份证/医保号">
          <el-input v-model="searchForm.diagnosis" placeholder="请输入身份证/医保号" class="filter-input" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="search-btn" @click="searchPatients" :loading="searchingPatients">
            <i v-if="!searchingPatients" class="el-icon-search"></i> 搜索
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Image Uploaders -->
    <div class="tech-content">
      <ImageUploader
        ref="leftUploader"
        side="left"
        label="左眼影像"
        @image-selected="handleImageSelected"
        @image-cleared="handleImageCleared"
        @show-preview="showImageDialog"
        class="upload-column"
      />
      <ImageUploader
        ref="rightUploader"
        side="right"
        label="右眼影像"
        @image-selected="handleImageSelected"
        @image-cleared="handleImageCleared"
        @show-preview="showImageDialog"
        class="upload-column"
      />
    </div>

    <!-- Analyze Button -->
    <div class="action-area">
      <el-button
        type="primary"
        class="analyze-button"
        :disabled="!canAnalyze || isProcessing"
        :loading="isProcessing"
        @click="startAnalysis"
      >
        <i v-if="!isProcessing" class="el-icon-video-play"></i>
        {{ isProcessing ? '分析中...' : '开始智能分析' }}
      </el-button>
    </div>

    <!-- Result Area -->
    <div class="result-area" v-if="analysisResult && analysisResult.length > 0">
      <div class="result-header">
        <div class="tech-line left"></div>
        <h2>分析结果</h2>
        <div class="tech-line right"></div>
      </div>
      <div class="result-cards">
        <div class="result-card" v-for="(result) in analysisResult" :key="result.side">
           <div class="result-image">
            <img
              :src="getImageSrc(result.side)"
              :alt="`${result.side === 'left' ? '左' : '右'}眼影像`"
              class="preview-image"
              @click="showImageDialog(getImageSrc(result.side))"
            >
          </div>
          <div class="result-info">
            <div class="result-title">
              {{ result.side === 'left' ? '左眼' : '右眼' }}分析结果
              <el-tag v-if="result.error" type="danger" size="mini" style="margin-left: 10px;">分析失败</el-tag>
            </div>
            <div v-if="!result.error" class="result-details">
              <!-- Use item.id from backend if available, otherwise fallback -->
              <div class="result-item" v-for="(item, i) in result.items" :key="item.id || `${result.side}-${item.name}-${i}`">
                <span class="item-name">{{ item.name }}:</span>
                <span class="item-value" :class="{ 'abnormal': item.abnormal }">
                  {{ item.value }}
                  <i v-if="item.abnormal" class="el-icon-warning-outline" style="color: #ff6b6b;"></i>
                </span>
              </div>
              <div class="result-conclusion" :class="{ 'abnormal': result.abnormal }">
                <i :class="result.abnormal ? 'el-icon-warning' : 'el-icon-success'"></i>
                <span>{{ result.conclusion }}</span>
              </div>
              <div class="inference-time">推理耗时: {{ typeof result.timeSeconds === 'string' ? result.timeSeconds : (result.timeSeconds?.toFixed(2) ?? 'N/A') }}s</div>
            </div>
            <div v-else class="result-conclusion abnormal error-msg">
              <i class="el-icon-error"></i> <span>{{ result.conclusion }}</span>
            </div>
          </div>
        </div>
        <!-- Placeholder maintains alignment if only one result exists -->
        <div v-if="analysisResult && analysisResult.length === 1" class="result-card placeholder" aria-hidden="true"></div>
      </div>
    </div>
    <!-- No Result Message -->
    <div class="result-area no-result" v-else-if="analysisAttempted && (!analysisResult || analysisResult.length === 0)">
      <el-alert
        title="分析未完成或无结果"
        type="info"
        center
        show-icon
        :closable="false"
      >
        请上传图像并点击开始分析，或检查分析过程中是否出现错误。
      </el-alert>
    </div>

    <!-- Medical Advice Form Component -->
    <MedicalAdviceForm
      ref="adviceForm"
      v-if="showAdviceForm"
      :initial-data="currentCaseAdvice"
      :advice-templates="adviceTemplates"
      :common-advices="commonAdvices"
      :frequencies="frequencies"
      :durations="durations"
      :analysis-context="analysisResult"
      :saving="savingAdvice"
      @update:advice="handleAdviceUpdate"
      @save-advice="handleSaveAdvice"
      @print-advice="printMedicalAdvice"
      @manage-templates="showTemplateManagerDialog"
      class="medical-advice-area"
    />

    <!-- Processing Overlay with Progress Bar -->
    <div class="processing-overlay" v-if="isProcessing">
      <div class="processing-content">
        <div class="tech-spinner">
          <div class="spinner-ring"></div><div class="spinner-core"></div>
        </div>
        <div class="processing-text">正在进行智能分析...</div>
        <el-progress
            :percentage="analysisProgress"
            :stroke-width="12"
            status="success"
            :text-inside="false"
            class="analysis-progress-bar"
        ></el-progress>
      </div>
    </div>

    <!-- Create Case Dialog -->
    <el-dialog
      title="创建新病例"
      :visible.sync="createCaseDialogVisible"
      class="create-case-dialog"
      :close-on-click-modal="True"
      width="600px"
      custom-class="optimized-dialog"
      @close="resetCreateCaseForm"
    >
       <el-form :model="newCaseForm" label-width="100px" ref="newCaseFormRef">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="患者姓名" prop="patientName" :rules="{ required: true, message: '请输入患者姓名', trigger: 'blur' }">
                 <el-input v-model="newCaseForm.patientName" placeholder="必填" ref="patientNameInput"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="患者年龄" prop="patientAge" :rules="[{ required: true, message: '请输入年龄'}, { type: 'number', message: '年龄必须为数字值', transform: value => Number(value) }]">
                <el-input-number
                    v-model="newCaseForm.patientAge"
                    :min="0"
                    :max="150"  
                    placeholder="必填"
                    style="width: 100%;" 
                  ></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
             <el-col :span="12">
               <el-form-item label="患者性别" prop="patientSex" :rules="{ required: true, message: '请选择性别', trigger: 'change' }">
                 <el-radio-group v-model="newCaseForm.patientSex">
                   <el-radio label="Male">男</el-radio>
                   <el-radio label="Female">女</el-radio>
                 </el-radio-group>
               </el-form-item>
             </el-col>
             <el-col :span="12">
                <el-form-item label="就诊日期" prop="consultationDate" :rules="{ required: true, message: '请选择就诊日期', trigger: 'change' }">
                  <el-date-picker v-model="newCaseForm.consultationDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" :picker-options="pickerOptions" style="width: 100%;"></el-date-picker>
                </el-form-item>
             </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
                <el-form-item label="病例编号" prop="caseId">
                  <el-input v-model="newCaseForm.caseId" placeholder="可选 (留空自动生成)"></el-input>
                </el-form-item>
            </el-col>
            <el-col :span="12">
                 <el-form-item label="主治医师" prop="doctorName">
                   <el-input v-model="newCaseForm.doctorName" placeholder="可选"></el-input>
                 </el-form-item>
            </el-col>
          </el-row>
          <!-- 添加联系方式字段 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="联系方式" prop="contact" :rules="[
                { required: true, message: '请输入联系方式', trigger: 'blur' },
                { pattern: /^(?:(?:\+|00)86)?1[3-9]\d{9}$/, message: '请输入有效的11位中国大陆手机号码', trigger: 'blur' }
              ]">
                <el-input v-model="newCaseForm.contact" placeholder="请输入11位手机号" maxlength="11"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 添加身份证/医保号字段 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="身份证/医保号" prop="idNumber" :rules="[
                { required: true, message: '请输入身份证或医保卡号', trigger: 'blur' },
                { pattern: /(^\d{18}$)|(^\d{17}(\d|X|x)$)|(^\d{15,20}$)/, message: '请输入有效的18位身份证号或15-20位医保卡号', trigger: 'blur' }
              ]">
                <el-input v-model="newCaseForm.idNumber" placeholder="请输入身份证号或医保卡号" maxlength="20"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="病程记录" prop="medicalHistory">
            <el-input type="textarea" :rows="3" v-model="newCaseForm.medicalHistory" placeholder="可选"></el-input>
          </el-form-item>
       </el-form>
       <div slot="footer">
         <el-button @click="cancelCreateCase">取消</el-button>
         <el-button type="primary" @click="submitNewCase" :loading="creatingCase" :disabled="creatingCase || submitLock">提交</el-button>
       </div>
     </el-dialog>

    <!-- Image Preview Dialog -->
    <el-dialog
      title="图像预览"
      :visible.sync="imageDialogVisible"
      class="image-preview-dialog"
      append-to-body
      width="60%"
      :close-on-click-modal="true"
    >
      <img :src="previewImage" class="preview-image-large" alt="图像预览"/>
      <div slot="footer"><el-button @click="imageDialogVisible = false">关闭</el-button></div>
    </el-dialog>

    <!-- TemplateManagerDialog Component -->
    <TemplateManagerDialog
      :visible.sync="templateDialogVisible"
      @templates-updated="handleTemplatesUpdated"
    />

    <!-- Print Area (Hidden) - Structure matches print CSS -->
    <div ref="printArea" style="display: none;">
       <div class="print-wrapper">
         <!-- Header -->
         <div class="print-header">
           <!-- Ensure logo path is correct relative to built assets -->
           <img src="@/assets/logo.png" alt="机构Logo" class="hospital-logo">
           <div class="hospital-info">
                <h1>明眸八极 理光辨微</h1>
                <h2>眼科识别及医嘱单</h2>
           </div>
         </div>

         <!-- Patient Info -->
         <div class="section patient-info-section">
             <h3>患者信息</h3>
             <table class="patient-info-table">
                 <tr>
                     <td><strong>姓名:</strong> <span class="print-field" data-field="patientName"></span></td>
                     <td><strong>性别:</strong> <span class="print-field" data-field="patientSex"></span></td>
                     <td><strong>年龄:</strong> <span class="print-field" data-field="patientAge"></span> 岁</td>
                 </tr>
                 <tr>
                     <td><strong>病例号:</strong> <span class="print-field" data-field="caseId"></span></td>
                     <td><strong>就诊日期:</strong> <span class="print-field" data-field="consultationDate"></span></td>
                     <td><strong>科别:</strong> 眼科</td>
                 </tr>
                 <tr>
                     <td colspan="3"><strong>主诉/病程:</strong> <span class="print-field" data-field="medicalHistory"></span></td>
                 </tr>
             </table>
         </div>

         <!-- Analysis Results - Populated by generateAnalysisPrintHtml -->
         <div class="section analysis-result-section">
             <h3>影像分析结果</h3>
             <div class="print-analysis-results-container">
                 <!-- Dynamic HTML content here -->
             </div>
         </div>

         <!-- Diagnosis - Populated by populatePrintDiagnosis -->
         <div class="section diagnosis-section">
             <h3>诊断意见</h3>
             <div class="print-diagnosis-content">
                 <!-- Dynamic text content here -->
             </div>
         </div>

         <!-- Advice/Treatment Plan - Populated by generateAdvicePrintHtml -->
         <div class="section advice-section">
             <h3>医嘱与建议</h3>
             <div class="print-advice-content-container">
                 <!-- Dynamic HTML content here -->
             </div>
         </div>

         <!-- Footer -->
         <div class="print-footer">
           <div class="footer-item">
              <strong>主治医师:</strong> <span class="print-field" data-field="doctorName"></span>
           </div>
           <div class="footer-item">
               <strong>医师签名:</strong> ___________________
           </div>
           <div class="footer-item print-time">
               <strong>打印时间:</strong> <span class="print-field" data-field="printTimestamp"></span>
           </div>
         </div>
       </div>
     </div>

    <!-- 患者选择对话框 -->
    <el-dialog
      title="选择患者"
      :visible.sync="patientSelectDialogVisible"
      width="70%"
      class="patient-select-dialog"
    >
      <el-table
        :data="patientSearchResults"
        stripe
        border
        style="width: 100%"
        highlight-current-row
        @row-click="selectPatientAndFillForm"
      >
        <el-table-column prop="name" label="姓名" width="120"></el-table-column>
        <el-table-column prop="gender" label="性别" width="80"></el-table-column>
        <el-table-column prop="age" label="年龄" width="80"></el-table-column>
        <el-table-column prop="contact" label="联系方式" width="150"></el-table-column>
        <el-table-column prop="id_number" label="身份证号" width="180"></el-table-column>
        <el-table-column prop="status" label="状态" width="100"></el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="120"
        >
          <template slot-scope="scope">
            <el-button
              @click.stop="selectPatientAndFillForm(scope.row)"
              type="text"
              size="small"
            >
              选择
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelPatientSelection">取消</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios';
import { cloneDeep } from 'lodash-es';
import ImageUploader from './ImageUploader.vue';
import MedicalAdviceForm from './MedicalAdviceForm.vue';
import TemplateManagerDialog from './TemplateManagerDialog.vue';
import { min } from 'lodash-es';
import { max } from 'lodash-es';
import { mapActions, mapState } from 'vuex'; // 确保导入 mapActions

// 根据当前环境确定API基础URL
// 修复: 当axios.defaults.baseURL为undefined时的问题
const API_BASE_URL = (axios.defaults.baseURL && axios.defaults.baseURL !== 'undefined') 
  ? `${axios.defaults.baseURL}/api` 
  : '/api';  // 如果baseURL未定义，则使用相对路径

console.log('使用API基础URL:', API_BASE_URL); // 添加日志以便调试
const PLACEHOLDER_IMAGE_PATH = '@/assets/placeholder-eye.png';
function dataURLtoFile(dataurl, filename) {
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
        const finalFilename = filename || `image_${Date.now()}.${mime.split('/')[1] || 'png'}`;
        return new File([u8arr], finalFilename, {type:mime});
    } catch (e) {
        console.error("Error converting DataURL to File:", e);
        return null;
    }
}
export default {
  name: 'Classification',
  components: {
    ImageUploader,
    MedicalAdviceForm,
    TemplateManagerDialog,
  },
  data() {
    return {
      hasCheckedVuexData: false,
      leftEyeFile: null,
      rightEyeFile: null,
      leftEyeDataUrl: null,
      rightEyeDataUrl: null,
      isProcessing: false,
      analysisProgress: 0,
      analysisProgressInterval: null,
      analysisResult: null,
      analysisAttempted: false,

      createCaseDialogVisible: false,
      creatingCase: false,
      newCaseForm: this.getInitialCaseForm(),
      submitLock: false,
      currentPatientId: null, // 添加患者ID字段

      searchingCases: false,
      searchForm: { patientName: '', diagnosis: '' },
      searchResults: [],

      // 添加患者搜索相关变量
      searchingPatients: false,
      patientSearchResults: [],
      selectedPatient: null,
      patientSelectDialogVisible: false,

      imageDialogVisible: false,
      previewImage: '',
      templateDialogVisible: false,

      currentCaseAdvice: this.getInitialAdvice(),
      savingAdvice: false,

      adviceTemplates: [],
      commonAdvices: [],
      frequencies: [],
      durations: [],

      currentDateTimeForPrint: '',
      placeholderImageSrc: '',

      pickerOptions: {
         disabledDate(time) { return time.getTime() > Date.now(); },
      },
    };
  },
  computed: {
    ...mapState([
        'apiUrlBase', // 假设 API 地址基础部分在 state 中
        'leftEyeForClassification', // 映射 Vuex state
        'rightEyeForClassification' // 映射 Vuex state
    ]), // 假设 API 地址基础部分在 state 中
    API_BASE_URL() {
        // 提供一个默认值，以防 Vuex state 尚未初始化
        return this.apiUrlBase || 'http://localhost:5000/api'; 
    },
    canAnalyze() {
      return (this.leftEyeFile || this.rightEyeFile) && !this.isProcessing;
    },
    showAdviceForm() {
      return this.analysisAttempted &&
             this.analysisResult &&
             this.analysisResult.length > 0 &&
             this.analysisResult.some(r => !r.error);
    },
    printConsultationDate() {
      return this.newCaseForm.consultationDate || '未填写';
    }
  },
  created() {
      try {
          this.placeholderImageSrc = require(`${PLACEHOLDER_IMAGE_PATH}`);
      } catch (e) {
          console.error("Failed to load placeholder image:", PLACEHOLDER_IMAGE_PATH, e);
          this.placeholderImageSrc = '';
      }
  },
  activated() {
    console.log('Classification component activated.');
    // 每次激活时检查 Vuex 数据
    this.checkAndImportFromVuex();
    // 重置标志，允许下次激活时再次检查（如果需要）
    this.hasCheckedVuexData = false;
  },
  mounted() {
    this.fetchInitialData();
      console.log("Classification component mounted.");
      // 首次挂载时也检查一次
      if (!this.hasCheckedVuexData) {
          this.checkAndImportFromVuex();
      }
  },
  methods: {

    ...mapActions([
        'createPatientAndCase',
        'clearClassificationImage', // 映射 Vuex action
        'updatePatientAction', // 确保已映射
        'fetchPatientsAction', // 确保已映射
        'getPatientDetailAction', // 确保已映射
        // ... 其他需要的 actions
    ]),
      // --- 新增方法：检查并导入来自 Vuex 的数据 ---
      checkAndImportFromVuex() {
      if (this.hasCheckedVuexData) {
        // console.log('Already checked Vuex data in this lifecycle.');
        return; // 如果已检查过，则跳过
      }

      let imported = false; // 标记是否有图像被导入

      // 检查左眼数据
      if (this.leftEyeForClassification && this.leftEyeForClassification.dataUrl) {
        console.log('Found left eye data from BrightnessSlider in Vuex.');
        const { dataUrl, fileInfo } = this.leftEyeForClassification;
        this.processImportedImage('left', dataUrl, fileInfo);
        // 清除 Vuex 中的数据
        this.clearClassificationImage('left');
        imported = true;
      }

      // 检查右眼数据
      if (this.rightEyeForClassification && this.rightEyeForClassification.dataUrl) {
        console.log('Found right eye data from BrightnessSlider in Vuex.');
        const { dataUrl, fileInfo } = this.rightEyeForClassification;
        this.processImportedImage('right', dataUrl, fileInfo);
        // 清除 Vuex 中的数据
        this.clearClassificationImage('right');
        imported = true;
      }

      if (imported) {
        this.$message.success('已从亮度调节模块导入图像！');
        this.resetAnalysisState(); // 导入新图后重置之前的分析结果
      }

      this.hasCheckedVuexData = true; // 标记为已检查
    },

    // --- 新增方法：处理单张导入的图像 ---
    processImportedImage(side, dataUrl, fileInfo) {
      // 1. 生成模拟的 File 对象 (如果需要)
      // 如果你的后端或分析逻辑必须接收 File 对象，则需要转换
      // 否则，可以直接使用 dataUrl
      const filename = fileInfo?.name || `${side}_eye_adjusted_${Date.now()}.png`;
      const mockFile = dataURLtoFile(dataUrl, filename);

      if (!mockFile) {
          this.$message.error(`无法处理导入的${side === 'left' ? '左' : '右'}眼图像数据。`);
          return;
      }

      // 2. 更新 Classification 组件的内部状态
      if (side === 'left') {
        this.leftEyeFile = mockFile;
        this.leftEyeDataUrl = dataUrl;
      } else {
        this.rightEyeFile = mockFile;
        this.rightEyeDataUrl = dataUrl;
      }

      // 3. 更新对应的 ImageUploader 子组件显示
      const uploaderRef = side === 'left' ? this.$refs.leftUploader : this.$refs.rightUploader;
      if (uploaderRef && typeof uploaderRef.setImageExternally === 'function') {
        // 调用子组件的方法来更新其内部状态和预览
        uploaderRef.setImageExternally(mockFile, dataUrl);
      } else {
        console.warn(`无法调用 ${side}Uploader.setImageExternally 方法。请确保该方法已在 ImageUploader.vue 中定义。`);
        // 作为备选方案，可以尝试强制重新渲染子组件，但这通常不是最佳实践
        // uploaderRef.$forceUpdate();
        // 或者，确保 ImageUploader 设计为响应式地接收来自父组件的数据变化
      }
      console.log(`${side} eye image imported and processed.`);
    },
    getInitialCaseForm() {
        // 创建包含默认值的新病例表单
        // 注意：这里直接调用getCurrentDate()而不是在返回对象中引用this.getCurrentDate()
        // 这确保当方法被调用时能获取到当前日期，而不是依赖于实例方法
        const currentDate = this.getCurrentDate();
        
        return {
            patientName: '',
            patientAge: '',
            patientSex: '',
            contact: '', // 确保初始化联系方式字段
            birthDate: null,
            idNumber: '',
            medicalHistory: '',
            consultationDate: this.formatDateToString(new Date()), // 默认当天
            doctorName: '系统', // 默认医生
            caseId: null, // 用于存储创建后的病例ID
        };
    },
    getInitialAdvice() {
        return {
            diagnosis: '',
            structuredAdvice: this.getDefaultStructuredAdvice()
        };
    },
    getDefaultStructuredAdvice() {
         return [
             { name: "药物治疗", items: [] },
             { name: "检查建议", items: [] },
             { name: "生活方式建议", items: [] }
         ];
     },
    getCurrentDate() {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    getCurrentDateTime() {
      return new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    },
    async fetchInitialData() {
        await this.fetchTemplates();
        this.fetchCommonAdvices();
        this.fetchFrequenciesAndDurations();
    },
    handleImageSelected({ side, file, dataUrl }) {
      console.log(`${side} image selected via uploader:`, file.name);
      // 确保这是一个有效的文件对象
      if (file instanceof File) {
        this[side + 'EyeFile'] = file;
        this[side + 'EyeDataUrl'] = dataUrl;
        this.resetAnalysisState();
      } else {
        console.error(`无效的文件对象: ${side}眼`, file);
        this.$message.error(`上传的${side === 'left' ? '左' : '右'}眼图像无效，请重新上传`);
      }
      // 如果是通过上传组件选择的，清除可能来自 Vuex 的旧数据（可选）
      this.clearClassificationImage(side);
    },
    handleImageCleared(side) {
      console.log(`${side} image cleared via uploader`);
      this[side + 'EyeFile'] = null;
      this[side + 'EyeDataUrl'] = null;

      // 清除分析结果相关逻辑 (保持不变)
      if (this.analysisResult) {
         // ... (保持不变)
      }
      // 如果清除了图像，也应该清除 Vuex 中对应的预导入数据（以防万一）
      this.clearClassificationImage(side);
    },
    resetAnalysisState() {
        console.log("Resetting analysis state.");
        this.analysisResult = null;
        this.analysisAttempted = false;
        this.currentCaseAdvice = this.getInitialAdvice();
        this.analysisProgress = 0;
        if (this.analysisProgressInterval) {
            clearInterval(this.analysisProgressInterval);
            this.analysisProgressInterval = null;
        }
    },
    getImageSrc(side) {
      return this[side + 'EyeDataUrl'] || this.placeholderImageSrc;
    },
    showImageDialog(imageSrc) {
      if (imageSrc && imageSrc !== this.placeholderImageSrc) {
          this.previewImage = imageSrc;
          this.imageDialogVisible = true;
      } else if (imageSrc === this.placeholderImageSrc) {
          this.$message.info("尚未上传该侧眼底图像");
      }
    },
    async startAnalysis() {
      if (!this.canAnalyze) return;

      const totalTasks = (this.leftEyeFile ? 1 : 0) + (this.rightEyeFile ? 1 : 0);
      if (totalTasks === 0) {
           this.$message.warning("请至少上传一侧眼底图像进行分析。");
           return;
      }

      this.isProcessing = true;
      this.analysisProgress = 0;
      this.analysisResult = [];
      this.analysisAttempted = true;
      if (this.analysisProgressInterval) {
        clearInterval(this.analysisProgressInterval);
        this.analysisProgressInterval = null;
      }

      const tasks = [];
      const sides = [];

      const estimatedDuration = 5000;
      const intervalTime = 50;
      const progressStep = (intervalTime / estimatedDuration) * 100;
      const maxSimulatedProgress = 95;

      this.analysisProgressInterval = setInterval(() => {
        if (this.analysisProgress < maxSimulatedProgress) {
          this.analysisProgress = Math.min(this.analysisProgress + progressStep, maxSimulatedProgress);
        } else {
          clearInterval(this.analysisProgressInterval);
          this.analysisProgressInterval = null;
        }
      }, intervalTime);

      const processSingleEye = async (file, side) => {
        try {
            console.log(`处理${side}眼图像:`, file);
            if (!file || !(file instanceof File)) {
                throw new Error(`${side}眼图像无效或未上传`);
            }
            return await this.classifyEye(file, side);
        } catch(err) {
            console.error(`Error processing ${side} eye:`, err);
            return {
                error: true,
                message: err.message || '未知处理错误',
                side: side,
                isSuccess: false
            };
        }
      };

      if (this.leftEyeFile) {
        // 确保文件对象有效
        if (this.leftEyeFile instanceof File) {
        tasks.push(processSingleEye(this.leftEyeFile, 'left'));
        sides.push('left');
        } else {
            console.error("左眼文件对象无效:", this.leftEyeFile);
            this.analysisResult.push({
                error: true,
                message: "左眼图像文件无效",
                side: 'left',
                isSuccess: false
            });
        }
      }
      
      if (this.rightEyeFile) {
        // 确保文件对象有效
        if (this.rightEyeFile instanceof File) {
        tasks.push(processSingleEye(this.rightEyeFile, 'right'));
        sides.push('right');
        } else {
            console.error("右眼文件对象无效:", this.rightEyeFile);
            this.analysisResult.push({
                error: true,
                message: "右眼图像文件无效",
                side: 'right',
                isSuccess: false
            });
        }
      }

      try {
        const results = await Promise.all(tasks);

        if (this.analysisProgressInterval) {
            clearInterval(this.analysisProgressInterval);
            this.analysisProgressInterval = null;
        }
        this.analysisProgress = 100;

        const formattedResults = results.map((resultData, index) =>
          this.formatResultForDisplay(resultData, sides[index])
        ).filter(Boolean);

        this.analysisResult = formattedResults;

        const errorCount = this.analysisResult.filter(r => r.error).length;
        if (this.analysisResult.length === 0 || errorCount === this.analysisResult.length) {
          this.$message.error("所有图像分析均失败或无有效结果");
        } else if (errorCount > 0) {
          this.$message.warning("部分图像分析失败，请检查结果");
        } else {
          this.$message.success("智能分析完成！");
          this.fetchAiSuggestion(); // Fetch AI suggestion after successful analysis
        }

        this.autoPopulateDiagnosis();

      } catch (error) {
        console.error("Error during parallel analysis execution:", error);
        this.$message.error("分析过程中发生意外错误，请重试");
        this.analysisResult = [];
        if (this.analysisProgressInterval) {
            clearInterval(this.analysisProgressInterval);
            this.analysisProgressInterval = null;
        }
        this.analysisProgress = 0;
      } finally {
        if (this.analysisProgressInterval) {
            clearInterval(this.analysisProgressInterval);
            this.analysisProgressInterval = null;
        }
        this.analysisProgress = 100;

        setTimeout(() => {
            this.isProcessing = false;
             this.analysisProgress = 0;
        }, 800);
      }
    },
    async classifyEye(file, side) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        console.log(`准备发送${side}眼图像分析请求:`, file.name, file.type, file.size);
        
        const response = await axios.post(`${API_BASE_URL}/classify`, formData, {
            timeout: 90000,
            headers: {
              'Content-Type': 'multipart/form-data', // 明确设置Content-Type
            }
        });

        if (response.status === 200 && response.data && !response.data.error) {
          return { ...response.data, side: side, isSuccess: true };
        } else {
          const errorMsg = response.data?.error || `分析失败 (HTTP ${response.status})`;
          console.warn(`Analysis failed for ${side} eye via API response: ${errorMsg}`, response.data);
          return { error: true, message: errorMsg, side: side, isSuccess: false };
        }
      } catch (error) {
        console.error(`Network/Request Error analyzing ${side} eye:`, error);
        let errorMsg = `连接失败或服务器无响应`;
        if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
             errorMsg = '请求超时，服务器处理时间过长或网络不稳定';
        } else if (error.response) {
            errorMsg = error.response.data?.error || error.response.data?.message || `服务器错误 (代码: ${error.response.status})`;
        } else if (error.request) {
            errorMsg = '无法连接到分析服务器，请检查网络或服务状态';
        } else {
            errorMsg = `客户端请求错误: ${error.message}`;
        }
        return { error: true, message: errorMsg, side: side, isSuccess: false };
      }
    },
    formatResultForDisplay(resultData, side) {
         if (!resultData) {
              console.error(`Cannot format null/undefined result for ${side} eye.`);
              return { 
                  side: side, 
                  abnormal: true, 
                  conclusion: `${side === 'left' ? '左' : '右'}眼分析数据无效`, 
                  items: [], 
                  error: true, 
                  timeSeconds: 'N/A', 
                  raw: null 
              };
         }

         console.log(`API结果数据(${side}眼):`, JSON.stringify(resultData));

         if (resultData.error || !resultData.isSuccess) {
              const errorMsg = resultData.message || '未知分析错误';
              console.error(`Formatting error result for ${side} eye: ${errorMsg}`);
              return { 
                  side: side, 
                  abnormal: true, 
                  conclusion: `${side === 'left' ? '左' : '右'}眼分析失败: ${errorMsg}`, 
                  items: [], 
                  error: true, 
                  timeSeconds: 'N/A', 
                  raw: resultData 
              };
         }

         try {
             const allProbs = resultData.all_probs ?? {};
             console.log(`解析all_probs(${side}眼):`, allProbs);
             
             const items = Object.entries(allProbs)
                .map(([name, prob]) => {
                    // 确保prob是数值类型
                    const probValue = typeof prob === 'string' ? parseFloat(prob) : (typeof prob === 'number' ? prob : 0);
                    return {
                        name: name,
                        value: `${(probValue * 100).toFixed(1)}%`,
                        abnormal: name !== '正常' && probValue >= 0.10,
                    };
                })
                .sort((a, b) => parseFloat(b.value) - parseFloat(a.value));

             const className = resultData.class_name ?? '未知结果';
             // 确保confidence是数值
             const confidenceRaw = resultData.confidence;
             const confidence = typeof confidenceRaw === 'string' ? parseFloat(confidenceRaw) : 
                               (typeof confidenceRaw === 'number' ? confidenceRaw : 0);
             
             const isOverallAbnormal = className !== '正常';

             let conclusion = `${side === 'left' ? '左眼' : '右眼'} - `;
             if (isOverallAbnormal) {
                 conclusion += `主要发现: ${className} (可能性: ${(confidence * 100).toFixed(1)}%)`;
             } else {
                 conclusion += `未见明显异常 (正常可能性: ${(confidence * 100).toFixed(1)}%)`;
                 const topNonNormal = items.find(item => item.name !== '正常');
                 if (confidence < 0.90 && topNonNormal) {
                     conclusion += `；低可能性提示: ${topNonNormal.name} (${topNonNormal.value})`;
                 }
             }
             
             // 正确处理timeSeconds
             let processedTimeSeconds = 'N/A';
             if (resultData.time_seconds !== undefined && resultData.time_seconds !== null) {
                 if (typeof resultData.time_seconds === 'number') {
                     processedTimeSeconds = resultData.time_seconds.toFixed(2);
                 } else if (typeof resultData.time_seconds === 'string' && !isNaN(parseFloat(resultData.time_seconds))) {
                     processedTimeSeconds = parseFloat(resultData.time_seconds).toFixed(2);
                 }
             }
             
             console.log(`推理耗时(${side}眼):`, resultData.time_seconds, "=>", processedTimeSeconds);

             return {
                 side: side,
                 abnormal: isOverallAbnormal,
                 conclusion: conclusion,
                 items: items,
                 error: false,
                 timeSeconds: processedTimeSeconds,
                 raw: resultData
             };
         } catch (formatError) {
              console.error(`Error formatting successful result data for ${side} eye:`, formatError, "Raw Data:", resultData);
              return {
                   side: side,
                   abnormal: true,
                   conclusion: `${side === 'left' ? '左' : '右'}眼分析结果解析失败`,
                   items: [],
                   error: true,
                   timeSeconds: 'N/A',
                   raw: resultData
              };
         }
    },
    autoPopulateDiagnosis() {
        if (!this.showAdviceForm || !this.analysisResult) {
            if (this.currentCaseAdvice) this.currentCaseAdvice.diagnosis = '';
            return;
        }

        let diagnoses = [];
        let allNormal = true;
        let hasError = false;
        let hasAbnormal = false;
        let errorMessages = [];

        this.analysisResult.forEach(r => {
            if (r.error) {
                hasError = true;
                errorMessages.push(`${r.side === 'left' ? '左' : '右'}眼分析失败: ${r.message}`);
            } else if (r.abnormal) {
                allNormal = false; 
                hasAbnormal = true;
                const mainFinding = r.raw?.class_name || '异常';
                diagnoses.push(`${r.side === 'left' ? '左眼' : '右眼'}: ${mainFinding}`);
            } else {
                allNormal = allNormal && !r.abnormal;
            }
        });

        let autoDiagnosis = '';
        if (hasAbnormal) {
            autoDiagnosis = diagnoses.join('；');
            autoDiagnosis += hasError ? '（部分影像分析失败，诊断仅供参考）' : '（AI分析结果，请结合临床）';
        } else if (allNormal && !hasError) {
            autoDiagnosis = "双眼：未见明显异常（AI分析结果）";
        } else if (hasError && !hasAbnormal) {
             autoDiagnosis = `（影像分析失败或未见异常，请结合临床判断。失败详情: ${errorMessages.join('; ')}）`;
        } else {
            autoDiagnosis = '（请根据影像和临床表现填写诊断）';
        }

         if (this.currentCaseAdvice) {
             this.currentCaseAdvice.diagnosis = autoDiagnosis;
         } else {
             console.warn("Cannot auto-populate diagnosis: currentCaseAdvice is null");
         }
    },
    async fetchAiSuggestion() {
        if (!this.showAdviceForm || !this.analysisResult || this.isProcessing) return;
        try {
            // 构建查询
            const eyeConditions = this.analysisResult
                .filter(r => !r.error)
                .map(r => `${r.side === 'left' ? '左眼' : '右眼'}: ${r.raw?.class_name || '未知'}(置信度: ${(r.raw?.confidence * 100).toFixed(1)}%)`)
                .join(', ');
            
            // 确保患者信息被正确获取和传递
            const patientAge = this.newCaseForm?.patientAge ? Number(this.newCaseForm.patientAge) : 40;
            const patientSex = this.newCaseForm?.patientSex || '未知';
            
            console.log(`正在获取AI建议，患者信息: 年龄=${patientAge}, 性别=${patientSex}`);
            console.log(`AI建议请求URL: ${API_BASE_URL}/ai-suggestion`);
                
            const response = await axios.post(`${API_BASE_URL}/ai-suggestion`, {
                query: `根据眼底影像分析结果生成诊断建议。检测到的情况: ${eyeConditions}`,
                patient_age: patientAge,
                patient_sex: patientSex,
                // 添加完整的分析上下文
                context: this.analysisResult.map(r => ({
                    eye_side: r.side,
                    predicted_class: r.raw?.class_name || '未知',
                    confidence: r.raw?.confidence || 0,
                    all_probs: r.raw?.all_probs || {},
                    error: r.error,
                    time_seconds: r.timeSeconds
                }))
            });
            
            if (response.status === 200 && response.data) {
                console.log("AI建议响应数据:", response.data);
                
                // 处理诊断建议
                if (response.data.diagnosis_suggestion) {
                    // 如果有诊断建议字段
                    this.currentCaseAdvice.diagnosis = response.data.diagnosis_suggestion;
                    this.$message.success("AI 诊断建议已更新！");
                    
                    // 处理结构化建议
                    const structuredAdvice = [];
                    
                    // 处理药物治疗
                    if (response.data.drug_therapy && response.data.drug_therapy.length > 0) {
                        structuredAdvice.push({
                            name: "药物治疗", 
                            items: response.data.drug_therapy.map(item => ({
                                content: item,
                                frequency: "",
                                duration: ""
                            }))
                        });
                    }
                    
                    // 处理检查建议
                    if (response.data.checkups && response.data.checkups.length > 0) {
                        structuredAdvice.push({
                            name: "检查建议",
                            items: response.data.checkups.map(item => ({
                                content: item,
                                frequency: "",
                                duration: ""
                            }))
                        });
                    }
                    
                    // 处理生活方式建议
                    if (response.data.lifestyle && response.data.lifestyle.length > 0) {
                        structuredAdvice.push({
                            name: "生活方式建议",
                            items: response.data.lifestyle.map(item => ({
                                content: item,
                                frequency: "",
                                duration: "长期"
                            }))
                        });
                    }
                    
                    // 更新结构化建议（如果有内容）
                    if (structuredAdvice.length > 0) {
                        this.currentCaseAdvice.structuredAdvice = structuredAdvice;
                    }
                    
                } else if (response.data.response) {
                    // 兼容之前的API格式
                    this.currentCaseAdvice.diagnosis = response.data.response;
                    this.$message.success("AI 诊断建议已更新！");
                } else if (response.data.drug_therapy) {
                    // 旧 API 格式兼容
                    this.currentCaseAdvice.structuredAdvice = [
                        { name: "药物治疗", items: response.data.drug_therapy.map(item => ({ content: item })) },
                        { name: "检查建议", items: response.data.checkups.map(item => ({ content: item })) },
                        { name: "生活方式建议", items: response.data.lifestyle.map(item => ({ content: item })) }
                    ];
                    this.currentCaseAdvice.diagnosis = response.data.diagnosis_suggestion || this.currentCaseAdvice.diagnosis;
                    this.$message.success("AI 建议已更新！");
                } else {
                    throw new Error("API 返回了不支持的格式");
                }
            } else {
                this.$message.error("获取 AI 建议失败，请重试或稍后查看");
                console.error("AI建议获取失败:", response.status, response.data);
            }
        } catch (error) {
            console.error("获取AI建议时出错:", error);
            if (error.response) {
                console.error("  状态码:", error.response.status);
                console.error("  响应数据:", error.response.data);
            } else if (error.request) {
                console.error("  未收到响应，请求对象:", error.request);
            } else {
                console.error("  错误信息:", error.message);
            }
            this.$message.error("获取 AI 建议时发生错误: " + (error.response?.data?.error || error.message || "请检查网络连接"));
        }
    },
    showCreateCaseDialog() {
      // 若不是从搜索患者功能进入，则重置表单和患者关联
      if (!this.selectedPatient) {
      this.newCaseForm = this.getInitialCaseForm(); // 重置表单数据
        this.currentPatientId = null; // 重置患者ID
      }
      
      // 无论何种情况下，都重置以下状态
      this.submitLock = false; // 重置提交锁
      this.createCaseDialogVisible = true; // 显示对话框

      // 使用 $nextTick 确保对话框及其内容已渲染到 DOM
      this.$nextTick(() => {
        // 清除可能存在的旧校验状态
        this.$refs.newCaseFormRef?.clearValidate();

        // 如果是新建病例（不是从搜索患者进入），才聚焦输入框
        if (!this.selectedPatient && this.$refs.patientNameInput) {
            this.$refs.patientNameInput.focus();
            console.log('Focus set to patientNameInput'); // 调试日志
        } else {
            console.log('Form populated with selected patient, no focus needed'); // 调试日志
        }
      });
    },
    cancelCreateCase() {
        // 取消按钮点击时完全重置表单和状态
        this.newCaseForm = this.getInitialCaseForm();
        this.currentPatientId = null; // 重置患者ID
        this.selectedPatient = null;  // 清除选中的患者
        this.createCaseDialogVisible = false;
    },
    resetCreateCaseForm() {
        // 对话框关闭时不完全重置表单数据，仅重置验证状态
        const formRef = this.$refs.newCaseFormRef;
        if (formRef) {
            formRef.clearValidate();
        }
        // 重置患者ID (可选，取决于您的需求)
        // this.currentPatientId = null;
        // 不要重置表单，这样可以保留已创建的病例信息
        // this.newCaseForm = this.getInitialCaseForm();
    },
    async submitNewCase() {
        const formRef = this.$refs.newCaseFormRef;
      if (!formRef) {
        this.$message.error("表单引用错误，无法提交");
        console.error("错误：表单引用丢失");
        return;
      }
        if (this.submitLock) return;

        formRef.validate(async (valid) => {
            if (valid) {
                this.creatingCase = true;
                this.submitLock = true;
          console.log("开始提交新病例数据 (Vuex)");

          try {
            // 准备提交给 action 的数据
            // 确保 consultationDate 是 YYYY-MM-DD 格式
            let formattedConsultationDate = this.newCaseForm.consultationDate;
            if (formattedConsultationDate instanceof Date) {
              formattedConsultationDate = this.formatDateToString(formattedConsultationDate);
            } else if (typeof formattedConsultationDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(formattedConsultationDate)) {
              // 如果格式不正确或不是字符串，则使用当前日期
              console.warn("无效的就诊日期格式，将使用当前日期:", this.newCaseForm.consultationDate);
              formattedConsultationDate = this.formatDateToString(new Date());
            }

            // 如果当前已有关联的患者ID（通过搜索选择的患者），则直接创建病例
            if (this.currentPatientId && this.selectedPatient) {
              console.log("使用已选择的患者创建病例，患者ID:", this.currentPatientId);
              
              // 构造病例数据
              const casePayload = {
                patientId: this.currentPatientId,
                consultationDate: formattedConsultationDate,
                doctorName: this.newCaseForm.doctorName || '系统',
                caseId: this.newCaseForm.caseId || `C${Date.now()}`
              };
              
              try {
                // 直接调用后端API创建病例
                const caseResponse = await axios.post(`${API_BASE_URL}/cases`, casePayload);
                console.log("直接创建病例响应:", caseResponse.data);
                
                // 处理创建病例的响应
                const caseResult = caseResponse.data;
                if (caseResult && (caseResult.id || caseResult.case_id)) {
                  // 设置病例ID
                  this.newCaseForm.caseId = caseResult.case_display_id || caseResult.id;
                  
                  // 成功后关闭对话框
                    this.createCaseDialogVisible = false;

                  // 提示成功
                  this.$message.success(`已成功为患者 ${this.selectedPatient.name} 创建病例`);
                  
                  // 引导用户下一步操作
                    this.$nextTick(() => {
                        this.$message({
                      type: 'info',
                            message: '病例创建成功！您现在可以上传眼底图像并进行分析。分析完成后点击"打印医嘱"即可查看包含患者信息的完整报告。',
                            duration: 5000,
                            showClose: true
                        });
                    });
                } else {
                  throw new Error("创建病例响应格式不正确");
                }
              } catch (caseError) {
                console.error("直接创建病例失败:", caseError);
                this.$message.error("创建病例失败: " + (caseError.response?.data?.error || caseError.message || "未知错误"));
              }
            } else {
              // 常规流程：创建患者并创建病例
              const casePayload = {
                ...this.newCaseForm,
                // 确保日期是格式化后的字符串
                consultationDate: formattedConsultationDate,
                // 年龄需要是数字
                patientAge: Number(this.newCaseForm.patientAge) 
              };
              
              console.log("准备调用 Vuex Action: createPatientAndCase, Payload:", JSON.stringify(casePayload));

              // 调用 Vuex action
              const result = await this.createPatientAndCase(casePayload);
              
              console.log("Vuex Action 'createPatientAndCase' 返回结果:", JSON.stringify(result));

              // 根据 action 返回结果处理 UI
              if (result && result.success) {
                // 检查是否是已存在患者的情况
                if (result.message && result.message.includes('已找到使用该身份证号的患者')) {
                  // 获取返回的患者信息
                  const existingPatient = result.rawResponse?.patient?.patient || result.rawResponse?.patient;
                  if (existingPatient) {
                    // 保存当前患者ID，以便后续操作
                    this.currentPatientId = existingPatient.id;
                    this.selectedPatient = existingPatient;
                      
                    const patientName = existingPatient.name;
                    const currentStatus = existingPatient.status || '待检查';
                    let newStatus = '';
                    
                    // 根据当前状态决定新状态
                    if (currentStatus === '待检查') {
                      newStatus = '已诊断';
                    } else if (currentStatus === '已诊断') {
                      newStatus = '复诊';
                    } else if (currentStatus === '复诊') {
                      newStatus = '复诊';
                    } else {
                      newStatus = '已诊断'; // 默认设为已诊断
                    }
                    
                    // 更新患者状态
                    try {
                      const updateResult = await this.$store.dispatch('updatePatientAction', {
                        id: existingPatient.id,
                        patientData: { ...existingPatient, status: newStatus }
                      });
                      
                      console.log("患者状态更新结果:", updateResult);
                      
                      // 友好提示
                      this.$message({
                        type: 'success',
                        message: `您已接诊患者 ${patientName}，状态已从"${currentStatus}"更新为"${newStatus}"`,
                        duration: 5000,
                        showClose: true
                      });
                    } catch (updateError) {
                      console.error("更新患者状态失败:", updateError);
                      this.$message({
                        type: 'warning',
                        message: `已找到患者 ${patientName}，但无法更新状态: ${updateError.message || '未知错误'}`,
                        duration: 5000,
                        showClose: true
                      });
                    }
                    } else {
                    this.$message({
                      type: 'info',
                      message: result.message,
                      duration: 5000,
                      showClose: true
                    });
                  }
                } else {
                  this.$message.success(result.message || `病例 "${this.newCaseForm.patientName}" 创建成功`);
                  
                  // 保存当前患者ID，以便后续操作
                  if (result.patientId) {
                    this.currentPatientId = result.patientId;
                  }
                }
                
                // 更新表单中的 caseId (如果 action 返回了它)
                // action 应负责返回标准化后的病例信息，包括 caseId 或 case_display_id
                if (result.caseData && (result.caseData.case_display_id || result.caseData.id)) {
                  this.newCaseForm.caseId = result.caseData.case_display_id || result.caseData.id.toString();
                  console.log("从Action结果更新 caseId:", this.newCaseForm.caseId);
                } else {
                  console.warn("Action 未返回有效的 caseId");
                  // 可以选择生成临时 ID 或采取其他措施
                  this.newCaseForm.caseId = `temp_${Date.now()}`; 
                }

                this.createCaseDialogVisible = false;

                // 创建成功后引导用户下一步操作
                this.$nextTick(() => {
                  this.$message({
                    type: 'success',
                    message: '病例创建成功！您现在可以上传眼底图像并进行分析。分析完成后点击"打印医嘱"即可查看包含患者信息的完整报告。',
                    duration: 5000,
                    showClose: true
                  });
                });
                
                // 检查localStorage中是否有临时保存的医嘱，如果有则恢复
                this.restoreTempAdviceIfExists();
              } else {
                // Action 返回失败或错误信息
                const errorMessage = result?.error || result?.message || '创建病例失败，请检查提交信息或联系管理员。';
                console.error("病例创建失败:", errorMessage, "详细信息:", result);
                this.$message.error(errorMessage);
              }
            }
          } catch (error) {
            console.error("创建病例时发生错误:", error);
            let errMsg = "创建病例失败，请稍后重试";
            
            if (error.response && error.response.data && error.response.data.error) {
              errMsg = `提交失败: ${error.response.data.error}`;
            } else if (error.message) {
              errMsg = `提交失败: ${error.message}`;
            }
            this.$message.error(errMsg);
                } finally {
            // 无论成功或失败，都重置加载和锁定状态
                    this.creatingCase = false;
                        this.submitLock = false;
            console.log("结束提交新病例数据 (Vuex)");
                }
            } else {
          console.log('表单验证失败');
          this.$message.warning('请检查表单填写是否完整且正确');
                return false;
            }
        });
    },
    // 新增方法：从localStorage恢复临时保存的医嘱
    restoreTempAdviceIfExists() {
      if (!this.currentPatientId || !this.newCaseForm.caseId) {
        console.log("无法恢复临时医嘱：缺少患者ID或病例ID");
        return;
      }
      
      // 查找所有以tempAdvice_开头的localStorage项
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tempAdvice_')) {
          try {
            const adviceData = JSON.parse(localStorage.getItem(key));
            console.log(`检测到临时保存的医嘱: ${key}`, adviceData);
            
            // 提示用户是否要恢复临时医嘱
            this.$confirm('检测到有临时保存的医嘱数据，是否恢复?', '提示', {
              confirmButtonText: '恢复',
              cancelButtonText: '忽略',
              type: 'info'
            }).then(() => {
              // 用户选择恢复
              if (adviceData) {
                this.currentCaseAdvice = adviceData;
                this.$message.success('临时医嘱数据已恢复');
                
                // 自动保存到服务器
                this.handleSaveAdvice(adviceData);
                
                // 删除localStorage中的临时数据
                localStorage.removeItem(key);
              }
            }).catch(() => {
              // 用户选择忽略
              localStorage.removeItem(key);
              this.$message.info('已忽略临时医嘱数据');
            });
            
            // 只处理第一个找到的临时医嘱
            break;
          } catch (error) {
            console.error(`解析临时医嘱数据失败: ${key}`, error);
            localStorage.removeItem(key); // 删除无效数据
          }
        }
      }
    },
    async searchCases() {
       if (this.searchingCases) return;
       this.searchingCases = true;
       this.searchResults = [];
       try {
         console.log("Searching cases with criteria:", this.searchForm);
         const response = await axios.get(`${API_BASE_URL}/cases`, { params: this.searchForm });
         this.searchResults = response.data.cases; // Backend returns cases under 'cases' key
         console.log("Search results:", this.searchResults);

         if (this.searchResults && this.searchResults.length > 0) {
            this.$message.success(`找到 ${response.data.pagination.totalItems} 个病例 (显示前 ${this.searchResults.length} 个)`);
         } else {
            this.$message.info("未找到符合条件的病例");
         }

       } catch (error) {
         console.error("Error searching cases:", error);
         this.$message.error(error?.response?.data?.error || error?.message || "搜索病例时发生错误");
       } finally {
         this.searchingCases = false;
       }
     },
    handleAdviceUpdate(newAdviceData) {
        this.currentCaseAdvice = cloneDeep(newAdviceData);
    },
    async handleSaveAdvice(adviceDataToSave) {
       if (this.savingAdvice) return;
       this.savingAdvice = true;
       try {
        if (!this.currentPatientId) {
          // 如果没有关联的患者ID，将医嘱保存到localStorage中
          console.log("无关联患者ID，将医嘱保存到localStorage");
          const key = `tempAdvice_${Date.now()}`;
          localStorage.setItem(key, JSON.stringify(adviceDataToSave));
          this.$message.success("医嘱已临时保存到本地，请在创建病例后重新保存。");
          return;
        }
            
        // 确保有效的caseId
        if (!this.newCaseForm.caseId) {
          throw new Error("病例ID缺失，请先创建病例记录");
        }
            
            const payload = {
                 advice: adviceDataToSave,
                 caseInfo: {
            patientId: this.currentPatientId, // 添加patientId字段
            caseId: this.newCaseForm.caseId, // 必需字段，后端依赖此字段查找病例
                     patientName: this.newCaseForm.patientName,
                     consultationDate: this.newCaseForm.consultationDate,
                     doctorName: this.newCaseForm.doctorName,
                 },
                 analysisSummary: this.analysisResult
                    ?.filter(r => !r.error)
                    .map(r => ({
                        side: r.side,
                        predictedClass: r.raw?.class_name ?? '未知',
                        confidence: r.raw?.confidence ?? 0,
              allProbabilities: r.raw?.all_probs ?? {},
              timeSeconds: r.timeSeconds
            })) || []
             };

        console.log("保存医嘱，发送数据:", JSON.stringify(payload));
             const response = await axios.post(`${API_BASE_URL}/advice`, payload);
        console.log("保存医嘱响应:", response.data);

        this.$message.success("医嘱保存成功");
            
        // 成功保存医嘱后更新患者状态
        this.updatePatientStatus();
       } catch (error) {
        console.error("保存医嘱失败:", error);
        let errorMessage = "保存医嘱时发生错误";
        if (error.response && error.response.data) {
          errorMessage += ": " + (error.response.data.error || JSON.stringify(error.response.data));
        } else if (error.message) {
          errorMessage += ": " + error.message;
        }
        this.$message.error(errorMessage);
       } finally {
           this.savingAdvice = false;
       }
    },
    showTemplateManagerDialog() {
       this.templateDialogVisible = true;
     },
    async handleTemplatesUpdated() {
        console.log("Template list potentially updated, refreshing local list...");
        this.$message.success("医嘱模板库已更新");
        await this.fetchTemplates();
    },
    async fetchTemplates() {
        console.log("正在获取模板数据...", `${API_BASE_URL}/templates`);
        try {
            const response = await axios.get(`${API_BASE_URL}/templates`);
            this.adviceTemplates = response.data || [];
            console.log("模板数据获取成功，共", this.adviceTemplates.length, "条记录");
        } catch (error) {
            console.error("获取模板数据失败:", error);
            if (error.response) {
                console.error("  状态码:", error.response.status);
                console.error("  响应数据:", error.response.data);
            } else if (error.request) {
                console.error("  未收到响应，请求对象:", error.request);
            } else {
                console.error("  错误信息:", error.message);
            }
            this.$message.error("获取医嘱模板列表失败: " + (error.response?.data?.error || error.message));
            this.adviceTemplates = [];
        }
     },
     async fetchCommonAdvices() {
        console.log("正在获取常用医嘱数据...", `${API_BASE_URL}/config/common-advices`);
        try {
            const response = await axios.get(`${API_BASE_URL}/config/common-advices`);
            this.commonAdvices = response.data || [];
            console.log("常用医嘱数据获取成功，共", this.commonAdvices.length, "条记录");
        } catch (error) {
            console.error("获取常用医嘱数据失败:", error);
            if (error.response) {
                console.error("  状态码:", error.response.status);
                console.error("  响应数据:", error.response.data);
            }
            this.$message.error("获取常用医嘱列表失败: " + (error.response?.data?.error || error.message));
            this.commonAdvices = [];
        }
     },
     async fetchFrequenciesAndDurations() {
        console.log("正在获取频次和疗程数据...");
        try {
            const freqPromise = axios.get(`${API_BASE_URL}/config/frequencies`);
            const durPromise = axios.get(`${API_BASE_URL}/config/durations`);
            
            console.log("  频次请求URL:", `${API_BASE_URL}/config/frequencies`);
            console.log("  疗程请求URL:", `${API_BASE_URL}/config/durations`);
            
            const [freqResponse, durResponse] = await Promise.all([freqPromise, durPromise]);
            
            this.frequencies = freqResponse.data || [];
            this.durations = durResponse.data || [];
            
            console.log("频次和疗程数据获取成功:", 
                this.frequencies.length, "条频次记录,", 
                this.durations.length, "条疗程记录");
        } catch (error) {
            console.error("获取频次或疗程数据失败:", error);
            if (error.response) {
                console.error("  状态码:", error.response.status);
                console.error("  响应数据:", error.response.data);
            }
            this.$message.error("获取频次或疗程数据失败: " + (error.response?.data?.error || error.message));
            // 设置一些默认值
            this.frequencies = [];
            this.durations = [];
        }
     },
     async printMedicalAdvice() { // <--- 确保这是 async 函数
         // 1. 更新打印时间戳 (如果需要最新的)
         this.currentDateTimeForPrint = this.getCurrentDateTime();
         // 2. 确保 printArea ref 存在
         const printArea = this.$refs.printArea;
         if (!printArea) {
             this.$message.error("打印模板加载失败，无法打印。");
             console.error("Print area ref ('printArea') not found.");
             return;
         }
         // 3. 确保关键数据已准备好 (例如诊断意见)
         if (!this.currentCaseAdvice || !this.currentCaseAdvice.diagnosis) {
             this.$message.warning("诊断信息不完整，无法打印。");
             return;
         }
         // 可选：检查患者姓名
         if (!this.newCaseForm.patientName) {
             this.$message.warning("患者信息不完整，打印结果可能不完整。");
         }

         // 4. (关键) 确保所有数据填充方法在获取 innerHTML 之前执行完毕
         this.populatePrintFields(printArea);
         this.populatePrintAnalysis(printArea);
         this.populatePrintDiagnosis(printArea);
         this.populatePrintAdvice(printArea);

         // 5. (关键) 使用 $nextTick 确保 DOM 更新完成
         await this.$nextTick(); // 等待 DOM 更新

         try {
             const printContent = printArea.innerHTML;
             const printStyle = this.getEnhancedPrintStyles(); // 使用您选择的 V4 或 V5 版本样式
             const printWindow = window.open('', '_blank', 'height=800,width=1000,scrollbars=yes,status=yes');

             if (!printWindow) {
                 this.$message.error("无法打开打印窗口。请检查浏览器是否阻止了弹出窗口。");
                 return;
             }

             const patientName = this.newCaseForm.patientName || '病例';
             printWindow.document.write(`<!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                  <meta charset="UTF-8">
                  <title>眼科检查及医嘱单 - ${patientName}</title>
                  ${printStyle}
                </head>
                <body>
                  <div class="print-wrapper"> <!-- 确保内容被包裹 -->
                     ${printContent}
                  </div>
                </body>
                </html>`);
             printWindow.document.close();

             // 等待内容加载和渲染
             // 如果打印空白或样式不全，可以尝试增加延时
             setTimeout(() => {
                 printWindow.focus();
                 printWindow.print();
                 // 可选：打印后自动关闭窗口
                 // setTimeout(() => { printWindow.close(); }, 1000);
             }, 500); // 延时 500ms

         } catch (printError) {
             console.error("Error during printing process:", printError);
             this.$message.error(`打印失败: ${printError.message}`);
         }
    },
    populatePrintFields(printArea) {
        try {
            const fields = printArea.querySelectorAll('.print-field[data-field]');
            const dataContext = {
                ...this.newCaseForm,
                patientSex: {'Male': '男', 'Female': '女'}[this.newCaseForm.patientSex] || '未选择',
                patientAge: this.newCaseForm.patientAge ?? '未填写',
                caseId: this.newCaseForm.caseId || '未编号',
                consultationDate: this.printConsultationDate,
                doctorName: this.newCaseForm.doctorName || '未指定',
                medicalHistory: this.newCaseForm.medicalHistory || '无',
                printTimestamp: this.currentDateTimeForPrint,
            };
            
            console.log("Populating print fields with data:", dataContext);
    
            fields.forEach(field => {
                 const fieldName = field.dataset.field;
                 field.textContent = dataContext[fieldName] ?? '未填写';
             });
        } catch (error) {
            console.error("Error populating print fields:", error);
            this.$message.error("填充打印字段时出错");
        }
    },
    populatePrintAnalysis(printArea) {
        const analysisContainer = printArea.querySelector('.print-analysis-results-container');
        if (analysisContainer) {
            analysisContainer.innerHTML = this.generateAnalysisPrintHtml();
        } else {
            console.error("Print Error: '.print-analysis-results-container' element not found.");
        }
    },
    populatePrintDiagnosis(printArea) {
        const diagnosisContainer = printArea.querySelector('.print-diagnosis-content');
         if (diagnosisContainer) {
             // 更改为支持换行的白色空间
             diagnosisContainer.style.whiteSpace = 'pre-wrap';
             diagnosisContainer.textContent = this.currentCaseAdvice?.diagnosis?.trim() || '未填写诊断意见';
         } else {
             console.error("Print Error: '.print-diagnosis-content' element not found.");
         }
    },
    populatePrintAdvice(printArea) {
        const adviceContainer = printArea.querySelector('.print-advice-content-container');
        if (adviceContainer) {
            adviceContainer.innerHTML = this.generateAdvicePrintHtml();
        } else {
            console.error("Print Error: '.print-advice-content-container' element not found.");
        }
    },
    generateAnalysisPrintHtml() {
        let html = '';
        if (Array.isArray(this.analysisResult) && this.analysisResult.length > 0) {
            html += '<div class="print-analysis-cards">';

            this.analysisResult.forEach(result => {
                const sideLabel = result.side === 'left' ? '左眼 (OS)' : '右眼 (OD)';
                const imgSrc = this.getImageSrc(result.side);
                const hasActualImage = imgSrc && imgSrc !== this.placeholderImageSrc;

                html += `<div class="print-analysis-card ${result.error ? 'error' : ''} ${result.side}">`;
                html += `  <div class="print-analysis-header">${sideLabel} ${result.error ? '<span class="error-tag">[分析失败]</span>' : ''}</div>`;
                html += `  <div class="print-analysis-body">`;
                html += `    <div class="print-analysis-image-container">`;
                html += hasActualImage
                          ? `<img src="${imgSrc}" alt="${sideLabel} 眼底图像" class="print-analysis-image">`
                          : `<div class="print-image-placeholder">无图像</div>`;
                html += `    </div>`;
                html += `    <div class="print-analysis-details">`;
                if (!result.error) {
                    html += `    <div class="print-conclusion ${result.abnormal ? 'abnormal' : ''}">${result.conclusion || '无结论'}</div>`;
                    if (result.items && result.items.length > 0) {
                       html += `    <table class="probability-table">`;
                       const itemsToDisplay = result.items.slice(0, 5);
                       itemsToDisplay.forEach(item => {
                           html += `<tr><td>${item.name}</td><td class="${item.abnormal ? 'abnormal-prob' : ''}">${item.value}</td></tr>`;
                       });
                       if (result.items.length > 5) {
                           html += `<tr><td colspan="2" class="more-probs">...</td></tr>`;
                       }
                       html += `    </table>`;
                    } else {
                       html += `<p class="no-prob-data">无详细概率信息</p>`;
                    }
                    html += `    <div class="print-inference-time">分析耗时: ${result.timeSeconds}s</div>`;
                } else {
                    html += `<div class="print-analysis-error-details">${result.conclusion}</div>`;
                }
                html += `    </div>`;
                html += `  </div>`;
                html += `</div>`;
            });

             if (this.analysisResult.length === 1) {
                 html += `<div class="print-analysis-card placeholder" aria-hidden="true"></div>`;
             }

            html += '</div>';
        } else if (this.analysisAttempted) {
            html = '<p class="no-data">未获得有效分析结果。</p>';
        } else {
             html = '<p class="no-data">未进行影像分析。</p>';
        }
        return html;
    },
    generateAdvicePrintHtml() {
        let adviceHtml = '';
        let hasAdvice = false;
        const structuredAdvice = this.currentCaseAdvice?.structuredAdvice;

        if (Array.isArray(structuredAdvice) && structuredAdvice.length > 0) {
            structuredAdvice.forEach(category => {
                const validItems = category.items?.filter(item => item.content && item.content.trim() !== '');
                if (validItems && validItems.length > 0) {
                    if (!hasAdvice) {
                        adviceHtml += '<dl class="advice-list">';
                        hasAdvice = true;
                    }
                    adviceHtml += `<dt>${category.name}</dt>`;
                    validItems.forEach((item, index) => {
                        adviceHtml += `<dd>${index + 1}. ${item.content.trim()}`;
                        if (item.frequency && item.frequency.trim()) {
                            adviceHtml += ` (${item.frequency.trim()})`;
                        }
                        if (item.duration && item.duration.trim()) {
                            adviceHtml += ` [持续时间: ${item.duration.trim()}]`;
                        }
                        adviceHtml += `</dd>`;
                    });
                }
            });
        }

        if (hasAdvice) {
            adviceHtml += '</dl>';
        } else {
            adviceHtml = '<p class="no-data">无具体医嘱建议。</p>';
        }
        return adviceHtml;
    },
        /**
     * 返回专门为打印布局设计的、优化后的 CSS 字符串。
     * 此版本目标是生成一个外观专业的正式医疗报告。
     */
     getEnhancedPrintStyles() {
      // 优化后的打印样式 V5 (专注正式报告风格)
      return `
<style>
  /* --- 基础页面设置 --- */
  @page {
    size: A4; /* 设置页面为 A4 大小 */
    margin: 18mm 15mm; /* 上下边距稍大，左右适中 */
  }
  body {
    font-family: "Microsoft YaHei", SimHei, Arial, sans-serif; /* 使用更常见的中文打印字体 */
    margin: 0;
    padding: 0;
    background: #fff !important; /* 强制打印背景为白色 */
    color: #000 !important; /* 强制打印文字为黑色 */
    font-size: 11pt; /* 标准报告字体大小 */
    line-height: 1.7; /* 稍大的行高，提高易读性 */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* 打印包装器，限制报告内容区域 */
  .print-wrapper {
    width: 100%;
    max-width: 100%; /* 宽度由页面边距控制 */
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* --- 报告页眉 (医院信息) --- */
  .print-header {
    display: flex;
    align-items: center;
    border-bottom: 2px solid #000; /* 黑色实线 */
    padding-bottom: 15px;
    margin-bottom: 25px; /* 页眉与下方内容距离增大 */
  }
  .hospital-logo {
    height: 65px; /* 可根据实际 Logo 调整 */
    width: auto;
    margin-right: 25px;
    flex-shrink: 0;
    object-fit: contain;
  }
  .hospital-info {
    text-align: center;
    flex-grow: 1;
  }
  .hospital-info h1 {
    font-size: 20pt; /* 主标题醒目 */
    font-family: "SimHei", serif; /* 可选用宋体等更正式的标题字体 */
    margin: 0 0 8px 0;
    font-weight: bold;
    color: #000 !important;
    letter-spacing: 1px;
  }
  .hospital-info h2 {
    font-size: 14pt; /* 副标题 */
    margin: 0;
    font-weight: normal;
    color: #000 !important;
  }

  /* --- 报告章节 --- */
  .section {
    margin-bottom: 22px; /* 增加章节间距 */
    padding-bottom: 0; /* 移除章节内边距，靠内容自身控制 */
    border-bottom: none; /* 移除章节间的虚线，靠间距分隔 */
    page-break-inside: avoid;
  }
  .section:last-child {
    margin-bottom: 0;
  }
  .section h3 {
    font-size: 14pt; /* 章节标题加大 */
    color: #000 !important;
    margin: 0 0 15px 0; /* 标题与下方内容间距 */
    padding-bottom: 5px;
    border-bottom: 1px solid #000; /* 标题下用黑色细线 */
    font-weight: bold; /* 加粗 */
    page-break-after: avoid; /* 避免标题后直接分页 */
  }

  /* --- 患者信息表格 --- */
  .patient-info-section h3 { margin-bottom: 12px; } /* 患者信息标题下间距稍小 */
  .patient-info-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11pt;
    margin-bottom: 15px; /* 表格下方间距 */
  }
  .patient-info-table td {
    padding: 8px 12px 8px 0; /* 单元格内边距 */
    vertical-align: middle; /* 垂直居中更好看 */
    line-height: 1.6;
    border-bottom: 1px solid #eee; /* 非常淡的行分隔线 */
  }
   .patient-info-table tr:last-child td {
       border-bottom: none; /* 最后一行无分隔线 */
   }
  .patient-info-table strong {
    display: inline-block; /* 行内块，方便控制宽度 */
    width: 70px; /* 固定标签宽度，使其对齐 */
    margin-right: 8px;
    font-weight: bold; /* 标签加粗 */
    color: #000 !important;
  }
  .patient-info-table td[colspan="3"] {
    padding-top: 10px;
    /* 对于跨列表格，标签可能需要不同处理 */
  }
   .patient-info-table td[colspan="3"] strong {
     width: auto; /* 取消固定宽度 */
     display: block; /* 单独一行 */
     margin-bottom: 4px;
   }
  .patient-info-table span.print-field {
    color: #000 !important; /* 患者信息内容黑色 */
  }

  /* --- 分析结果卡片 (Flexbox) --- */
  .analysis-result-section h3 { margin-bottom: 15px; }
  .print-analysis-results-container {
    margin-top: 0;
  }
  .print-analysis-cards {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 20px; /* 增加卡片间距 */
      box-sizing: border-box;
      page-break-inside: avoid;
  }
  .print-analysis-card {
      width: calc(50% - 10px); /* 对应 20px gap */
      border: 1px solid #888; /* 使用中灰色边框 */
      border-radius: 0; /* 直角更正式 */
      overflow: hidden;
      background: #fff !important; /* 强制白色背景 */
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
      box-sizing: border-box;
      min-height: 260px; /* 调整最小高度 */
  }
  .print-analysis-card.placeholder {
      border: none;
      background: none;
      visibility: hidden;
      margin-bottom: 0;
      padding: 0;
      min-height: 260px;
  }
  .print-analysis-header {
    background: #f0f0f0 !important; /* 浅灰色背景 */
    padding: 10px 15px;
    font-weight: bold;
    font-size: 12pt;
    border-bottom: 1px solid #888; /* 与卡片边框同色 */
    text-align: center;
    color: #000 !important;
  }
  .print-analysis-header .error-tag {
    color: #000 !important; /* 错误也用黑色文字 */
    font-weight: bold !important;
    margin-left: 10px;
    font-size: 10pt;
  }
  .print-analysis-body {
    display: flex;
    padding: 15px;
    gap: 18px; /* 图片与详情间距 */
    flex-grow: 1;
  }
  .print-analysis-image-container {
    width: 150px; /* 调整图片容器宽度 */
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f8f8 !important; /* 图片区域背景 */
    border: 1px solid #ccc;
    border-radius: 0;
    min-height: 140px;
  }
  .print-analysis-image {
    max-width: 100%;
    max-height: 140px;
    display: block;
    object-fit: contain;
  }
  .print-image-placeholder {
    font-size: 10pt;
    color: #333 !important;
    text-align: center;
    padding: 10px;
  }
  .print-analysis-details {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    font-size: 10.5pt;
    justify-content: flex-start; /* 从顶部开始排列 */
  }
  .print-conclusion {
    margin-bottom: 15px; /* 结论下方间距 */
    padding: 8px 12px;
    border-radius: 0;
    background: none !important; /* 无背景色 */
    border: 1px solid #000; /* 结论用黑色边框包围 */
    font-weight: bold;
    line-height: 1.6;
    color: #000 !important;
  }
  /* 异常结论在 @media print 中处理 */

  .probability-table {
    width: 100%;
    font-size: 10pt;
    border-collapse: collapse;
    margin-bottom: 15px; /* 表格下方间距 */
    table-layout: fixed;
  }
  .probability-table td {
    padding: 6px 6px;
    border-bottom: 1px solid #ccc; /* 更清晰的行分隔线 */
    line-height: 1.5;
    color: #000 !important;
  }
   .probability-table tr:first-child td {
       border-top: 1px solid #ccc; /* 给表格加上顶边框 */
   }
  .probability-table td:first-child {
    width: 60%;
    word-wrap: break-word;
    font-weight: normal; /* 非加粗 */
  }
  .probability-table td:last-child {
    text-align: right;
    font-weight: bold; /* 概率值加粗 */
    width: 40%;
  }
  .probability-table tr:last-child td {
    border-bottom: 1px solid #ccc; /* 表格底部也加边框 */
  }
  /* 异常概率在 @media print 中处理 */

  .print-inference-time {
    font-size: 9pt; /* 最小字体 */
    color: #333 !important; /* 深灰色 */
    text-align: right;
    margin-top: auto; /* 推到底部 */
    padding-top: 8px;
    border-top: 1px dotted #aaa; /* 点状分隔线 */
  }
  /* 错误详情在 @media print 中处理 */

  /* --- 诊断意见 --- */
  .diagnosis-section h3 { margin-bottom: 12px; }
  .print-diagnosis-content {
    padding: 15px;
    background: none !important; /* 无背景 */
    border: 1px solid #000; /* 黑色边框 */
    border-radius: 0;
    min-height: 70px;
    white-space: pre-wrap;
    line-height: 1.7;
    color: #000 !important;
    font-size: 11pt;
  }

  /* --- 医嘱与建议 --- */
  .advice-section h3 { margin-bottom: 12px; }
  .print-advice-content-container {
    padding-left: 0;
  }
  .advice-list dt { /* 类别 */
    font-weight: bold; /* 加粗 */
    margin-top: 18px; /* 类别间距 */
    margin-bottom: 8px;
    color: #000 !important;
    font-size: 12pt; /* 类别标题 */
    border-bottom: 1px solid #eee; /* 类别下淡分隔线 */
    padding-bottom: 4px;
  }
   .advice-list dt:first-of-type {
      margin-top: 5px;
  }
  .advice-list dd { /* 项目 */
    margin-left: 0; /* 不缩进，靠编号 */
    margin-bottom: 10px; /* 项目间距 */
    line-height: 1.6;
    font-size: 11pt;
    color: #000 !important;
    padding-left: 1.5em; /* 用 padding 代替 margin 缩进编号 */
    text-indent: -1.5em; /* 编号悬挂缩进 */
  }
   .advice-list dd span { /* 频率/疗程 */
      font-style: normal;
      color: #000 !important;
      margin-left: 8px;
      font-size: 10.5pt;
  }

  /* --- 报告页脚 --- */
  .print-footer {
    margin-top: 40px; /* 页脚与上方内容距离增大 */
    padding-top: 15px;
    border-top: 2px solid #000; /* 页脚顶部粗黑线 */
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 11pt;
    page-break-before: auto;
    color: #000 !important;
  }
  .footer-item {
    flex: 1;
    padding: 0 15px;
  }
  .footer-item:first-child { padding-left: 0; }
  .footer-item:last-child { padding-right: 0; }
  .footer-item.print-time {
    text-align: right;
    font-size: 10pt; /* 打印时间稍小 */
    color: #000 !important;
    flex-grow: 0.6; /* 调整空间占比 */
    white-space: nowrap;
  }
  .footer-item strong {
    font-weight: bold; /* 标签加粗 */
  }

  /* --- 隐藏非打印元素 (关键) --- */
  @media print {
    /* ！！！请务必替换为实际的应用 UI 元素选择器！！！ */
    .tech-header, /* 隐藏页面标题 */
    .action-area, /* 隐藏操作按钮区域 */
    .filter-area, /* 隐藏搜索过滤区域 */
    .upload-column, /* 隐藏上传组件本身 */
    .processing-overlay, /* 隐藏处理遮罩层 */
    .el-dialog__wrapper, /* 隐藏所有 Element UI 对话框 */
    .medical-advice-area .el-button, /* 可能需要隐藏医嘱表单的按钮 */
    /* --- 根据你的应用结构，添加其他需要隐藏的选择器 --- */
    /* 例如: #app-header, .main-sidebar, .page-controls */
    #app > .el-header, /* 假设 Element UI 布局的页头 */
    #app > .el-aside,  /* 假设 Element UI 布局的侧边栏 */
    .el-backtop /* 隐藏返回顶部按钮 */
    {
       display: none !important;
       visibility: hidden !important;
       position: absolute !important; /* 彻底移出布局流 */
       width: 0 !important;
       height: 0 !important;
       overflow: hidden !important;
    }

    /* 确保打印内容区域可见（如果父级被隐藏了） */
    /* 通常不需要，除非 body > * 被隐藏了 */
    /* .print-wrapper, .print-wrapper * { */
    /*    display: block !important; */
    /*    visibility: visible !important; */
    /* } */

    /* 强制纯白背景和纯黑文字 */
    body, html, .print-wrapper, .print-analysis-card, .print-diagnosis-content, .print-analysis-image-container, .hospital-info, .patient-info-table, .advice-list {
        background: #fff !important;
        color: #000 !important;
    }
    /* 强制所有文字颜色为黑色 */
    *, *::before, *::after {
        color: #000 !important;
         background-color: transparent !important; /* 强制透明背景，除非特定元素覆盖 */
    }
    /* 强制边框可见且为黑色或灰色 */
    .print-header, .section h3, .patient-info-table td, .print-analysis-card, .print-analysis-header, .print-analysis-image-container, .print-conclusion, .probability-table td, .print-diagnosis-content, .print-footer, .probability-table tr:first-child td, .probability-table tr:last-child td {
        border-color: #000 !important; /* 重要分隔线用黑色 */
    }
     .patient-info-table td, .probability-table td {
         border-color: #ccc !important; /* 表格内部分隔线用灰色 */
     }


     /* 对异常/错误状态的打印处理 */
     .print-conclusion.abnormal, .print-analysis-error-details {
         border: 1.5px solid #000 !important; /* 异常用稍粗黑边框 */
         font-weight: bold !important; /* 加粗强调 */
         background: none !important;
         color: #000 !important;
     }
      .print-analysis-header .error-tag {
          font-weight: bold !important;
          color: #000 !important; /* 错误标签也用黑色粗体 */
      }
     .abnormal-prob { /* 异常概率值 */
         font-weight: bold !important;
         color: #000 !important;
     }
     /* 移除图标，因为颜色可能失效 */
     .result-conclusion i, .item-value i {
         display: none !important;
     }

    /* 移除所有阴影 */
    * {
       box-shadow: none !important;
       text-shadow: none !important;
    }
     /* 确保链接在打印时不像链接（可选） */
     a, a:visited {
         color: #000 !important;
         text-decoration: none !important;
     }
  }
</style>`;
    },

    // 添加日期格式化辅助方法
    formatDateToString(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // 获取当前日期的YYYY-MM-DD格式
    getCurrentDate() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    async searchPatients() {
      if (this.searchingPatients) return;
      
      // 检查是否有搜索条件
      const searchByName = this.searchForm.patientName.trim();
      const searchById = this.searchForm.diagnosis.trim(); // 这里存储的是身份证/医保号
      
      if (!searchByName && !searchById) {
        this.$message.warning('请输入患者姓名或身份证/医保号进行搜索');
        return;
      }
      
      this.searchingPatients = true;
      this.patientSearchResults = [];
      
      try {
        console.log("搜索患者，条件:", searchByName || searchById);
        
        // 使用 Vuex action 搜索患者，根据输入内容确定使用哪个字段搜索
        const searchQuery = searchById || searchByName; // 优先使用身份证号搜索
        
        const response = await this.$store.dispatch('fetchPatientsAction', {
          query: searchQuery,
          page: 1,
          pageSize: 10
        });
        
        console.log("患者搜索结果:", response);
        
        if (response.success && response.patients && response.patients.length > 0) {
          this.patientSearchResults = response.patients;
          
          if (this.patientSearchResults.length === 1) {
            // 如果只有一个匹配的患者，直接选择并填充表单
            this.selectPatientAndFillForm(this.patientSearchResults[0]);
            
            // 获取当前状态并确定新状态
            const patient = this.patientSearchResults[0];
            const currentStatus = patient.status || '待检查';
            let newStatus = '';
            
            // 根据当前状态决定新状态
            if (currentStatus === '待检查') {
              newStatus = '已诊断';
            } else if (currentStatus === '已诊断') {
              newStatus = '复诊';
            } else if (currentStatus === '复诊') {
              newStatus = '复诊';
            } else {
              newStatus = '已诊断'; // 默认设为已诊断
            }
            
            // 更新患者状态
            try {
              await this.$store.dispatch('updatePatientAction', {
                id: patient.id,
                patientData: { ...patient, status: newStatus }
              });
              
              // 更新成功后显示信息
              this.$message({
                type: 'success',
                message: `您已接诊患者 ${patient.name}，状态已从"${currentStatus}"更新为"${newStatus}"`,
                duration: 5000,
                showClose: true
              });
            } catch (updateError) {
              console.error("更新患者状态失败:", updateError);
              this.$message({
                type: 'warning',
                message: `已找到患者 ${patient.name}，但无法更新状态: ${updateError.message || '未知错误'}`,
                duration: 5000,
                showClose: true
              });
            }
          } else {
            // 如果有多个匹配的患者，显示选择对话框
            this.patientSelectDialogVisible = true;
            this.$message.success(`找到 ${this.patientSearchResults.length} 名匹配的患者，请选择一个`);
          }
        } else {
          this.$message.info("未找到匹配的患者");
        }
      } catch (error) {
        console.error("搜索患者失败:", error);
        this.$message.error(error?.response?.data?.message || error.message || "搜索患者时发生错误");
      } finally {
        this.searchingPatients = false;
      }
    },
    
    selectPatientAndFillForm(patient) {
      console.log("选择患者，填充表单:", patient);
      this.selectedPatient = patient;
      
      // 填充表单数据
      this.newCaseForm.patientName = patient.name;
      this.newCaseForm.patientAge = patient.age || '';
      this.newCaseForm.patientSex = patient.gender === '男' ? 'Male' : 
                              patient.gender === '女' ? 'Female' : '';
      this.newCaseForm.contact = patient.contact || '';
      this.newCaseForm.birthDate = patient.date_of_birth || patient.birthDate || null;
      this.newCaseForm.idNumber = patient.id_number || patient.idNumber || '';
      this.newCaseForm.medicalHistory = patient.medical_history || patient.medicalHistory || '';
      
      // 保存当前患者ID，以便后续操作
      this.currentPatientId = patient.id;
      
      // 如果选择对话框是打开的，则关闭它
      if (this.patientSelectDialogVisible) {
        this.patientSelectDialogVisible = false;
      }
      
      // 如果不是通过单一搜索结果自动选择的患者（即用户手动选择的），则更新状态
      if (this.patientSearchResults.length > 1) {
        // 获取当前状态并确定新状态
        const currentStatus = patient.status || '待检查';
        let newStatus = '';
        
        // 根据当前状态决定新状态
        if (currentStatus === '待检查') {
          newStatus = '已诊断';
        } else if (currentStatus === '已诊断') {
          newStatus = '复诊';
        } else if (currentStatus === '复诊') {
          newStatus = '复诊';
        } else {
          newStatus = '已诊断'; // 默认设为已诊断
        }
        
        // 更新患者状态
        this.$store.dispatch('updatePatientAction', {
          id: patient.id,
          patientData: { ...patient, status: newStatus }
        }).then(() => {
          // 更新成功后显示信息
          this.$message({
            type: 'success',
            message: `您已接诊患者 ${patient.name}，状态已从"${currentStatus}"更新为"${newStatus}"`,
            duration: 5000,
            showClose: true
          });
        }).catch(updateError => {
          console.error("更新患者状态失败:", updateError);
          this.$message({
            type: 'warning',
            message: `已找到患者 ${patient.name}，但无法更新状态: ${updateError.message || '未知错误'}`,
            duration: 5000,
            showClose: true
          });
        });
      }
      
      // 如果新建病例对话框尚未打开，则打开它
      if (!this.createCaseDialogVisible) {
        this.showCreateCaseDialog();
      }
    },
    
    cancelPatientSelection() {
      this.patientSelectDialogVisible = false;
      this.patientSearchResults = [];
    },
    
    async searchCases() {
       if (this.searchingCases) return;
       this.searchingCases = true;
       this.searchResults = [];
       try {
         console.log("Searching cases with criteria:", this.searchForm);
         const response = await axios.get(`${API_BASE_URL}/cases`, { params: this.searchForm });
         this.searchResults = response.data.cases; // Backend returns cases under 'cases' key
         console.log("Search results:", this.searchResults);

         if (this.searchResults && this.searchResults.length > 0) {
            this.$message.success(`找到 ${response.data.pagination.totalItems} 个病例 (显示前 ${this.searchResults.length} 个)`);
         } else {
            this.$message.info("未找到符合条件的病例");
         }

       } catch (error) {
         console.error("Error searching cases:", error);
         this.$message.error(error?.response?.data?.error || error?.message || "搜索病例时发生错误");
       } finally {
         this.searchingCases = false;
       }
     },
    // 新增方法：更新患者状态
    async updatePatientStatus() {
      if (!this.currentPatientId) {
        console.log("无关联患者ID，不更新状态");
        return;
      }

      try {
        // 先获取最新的患者信息
        const patientResponse = await this.$store.dispatch('getPatientDetailAction', this.currentPatientId);
        
        if (!patientResponse || !patientResponse.success || !patientResponse.patient) {
          console.error("获取患者详情失败:", patientResponse);
          throw new Error("无法获取患者信息");
        }

        const patient = patientResponse.patient;
        const currentStatus = patient.status || '待检查';
        let newStatus = '';
        
        // 根据当前状态决定新状态
        if (currentStatus === '待检查') {
          newStatus = '已诊断';
        } else if (currentStatus === '已诊断') {
          newStatus = '复诊';
        } else if (currentStatus === '复诊') {
          newStatus = '复诊';
        } else {
          newStatus = '已诊断'; // 默认设为已诊断
        }
        
        // 如果状态没变，不需要更新
        if (currentStatus === newStatus) {
          console.log(`患者 ${patient.name} 状态已经是 "${newStatus}"，无需更新`);
          return;
        }
        
        // 更新患者状态
        const updateResult = await this.$store.dispatch('updatePatientAction', {
          id: this.currentPatientId,
          patientData: { ...patient, status: newStatus }
        });
        
        console.log("患者状态更新结果:", updateResult);
        this.$message.success(`患者 ${patient.name} 状态已更新为"${newStatus}"`);
        
        return updateResult;
      } catch (error) {
        console.error("更新患者状态失败:", error);
        throw error;
      }
    },
  },
};
</script>

<style scoped>
/* --- Base Layout & Theme Styles --- */
.classification-container {
  background: transparent; /* Assume parent provides background */
  width: 100%;
  min-height: calc(100vh - 60px); /* Adjust if header height is different */
  padding: 20px 30px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow-x: hidden; /* Prevent horizontal scroll */
  overflow-y: auto; /* Allow vertical scroll */
  color: #fff; /* Default text color for the theme */
}

/* Header */
.tech-header { display: flex; align-items: center; justify-content: center; margin-bottom: 25px; position: relative; }
.tech-header h1 { color: #8DD1FE; font-size: 26px; margin: 0 20px; text-shadow: 0 0 12px rgba(57, 175, 253, 0.6); font-weight: 600; }
.highlight { color: #4dbfff; }
.tech-line { height: 2px; width: 120px; position: relative; }
.tech-line.left { background: linear-gradient(to right, rgba(57, 175, 253, 0), #39AFFD); }
.tech-line.right { background: linear-gradient(to left, rgba(57, 175, 253, 0), #39AFFD); }

/* Action Buttons Area */
.action-area { display: flex; justify-content: center; margin-bottom: 25px; gap: 20px; }

/* Filter Area */
.filter-area { margin-bottom: 25px; }
.filter-form { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 20px; background: rgba(13, 28, 64, 0.3); padding: 15px 20px; border-radius: 8px; border: 1px solid rgba(57, 175, 253, 0.25); }
:deep(.filter-input .el-input__inner) { background: rgba(16, 32, 67, 0.5); border: 1px solid rgba(57, 175, 253, 0.35); color: #bde2ff; width: 220px; transition: all 0.3s ease; }
:deep(.filter-input .el-input__inner:hover),
:deep(.filter-input .el-input__inner:focus) { border-color: #39AFFD; box-shadow: 0 0 6px rgba(57, 175, 253, 0.4); }
:deep(.filter-input .el-input__inner::placeholder) { color: rgba(141, 209, 254, 0.6); }
.filter-area .el-form-item { margin-bottom: 0 !important; }
:deep(.filter-area .el-form-item__label) { color: #9acffc !important; padding-right: 8px; font-weight: 500;}

/* Upload Area */
.tech-content { display: flex; justify-content: space-between; gap: 25px; width: 100%; margin-bottom: 25px; }
.upload-column { flex: 1; min-width: 300px; } /* Ensure columns have a minimum width */

/* Buttons Styling */
.analyze-button, .create-case-btn, .search-btn {
  background: linear-gradient(135deg, #3077b1, #39affd); border: none; padding: 10px 28px; font-size: 15px;
  border-radius: 5px; box-shadow: 0 4px 15px rgba(57, 175, 253, 0.2); transition: all 0.3s ease; color: white; cursor: pointer;
  font-weight: 500; letter-spacing: 0.5px;
}
.analyze-button i, .create-case-btn i, .search-btn i { margin-right: 6px; }
.analyze-button:hover:not(:disabled), .create-case-btn:hover:not(:disabled), .search-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #39affd, #3077b1); box-shadow: 0 6px 20px rgba(57, 175, 253, 0.4); transform: translateY(-2px);
}
.analyze-button:disabled, .create-case-btn:disabled, .search-btn:disabled {
  /* Use more specific selectors or !important if Element UI overrides */
  background: rgba(57, 175, 253, 0.25) !important;
  color: rgba(255, 255, 255, 0.5) !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
  transform: none !important;
}
.el-button.is-loading { position: relative; pointer-events: none; }
.el-button.is-loading:before { pointer-events: none; content: ''; position: absolute; left: -1px; top: -1px; right: -1px; bottom: -1px; border-radius: inherit; background-color: hsla(0,0%,100%,.35); }

/* Result Area */
.result-area { margin-top: 30px; padding-bottom: 30px; width: 100%; }
.result-header { display: flex; align-items: center; justify-content: center; margin-bottom: 25px; }
.result-header h2 { color: #8DD1FE; font-size: 22px; margin: 0 20px; font-weight: 600; }
.result-cards {
    display: flex;
    justify-content: space-between; /* Space out even if only one real card + placeholder */
    flex-wrap: wrap;
    gap: 25px;
    box-sizing: border-box;
}
.result-card {
   flex: 1 1 calc(50% - 15px); /* Adjust basis calculation slightly based on gap */
   min-width: calc(50% - 15px);
   max-width: calc(50% - 15px);
   display: flex;
   background: rgba(13, 28, 64, 0.6);
   border-radius: 8px;
   border: 1px solid rgba(57, 175, 253, 0.35);
   overflow: hidden;
   transition: transform 0.3s ease, box-shadow 0.3s ease;
   margin-bottom: 20px;
   box-shadow: 0 5px 15px rgba(57, 175, 253, 0.1);
   box-sizing: border-box;
   min-height: 250px; /* Ensure cards have a minimum height */
}
/* Placeholder styling: takes up space but invisible */
.result-card.placeholder {
    background: transparent;
    border: none;
    box-shadow: none;
    visibility: hidden;
    margin-bottom: 0;
    padding: 0;
    min-height: 0; /* No min-height needed for placeholder */
}
.result-card:hover:not(.placeholder) { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(57, 175, 253, 0.25); }
.result-image { width: 40%; max-width: 200px; padding: 15px; display: flex; align-items: center; justify-content: center; border-right: 1px solid rgba(57, 175, 253, 0.25); flex-shrink: 0; background: rgba(0,0,0,0.15); box-sizing: border-box; }
.result-image img { max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 4px; cursor: pointer; transition: transform 0.2s ease; }
.result-image img:hover { transform: scale(1.05); }
.result-info { flex-grow: 1; padding: 15px 20px; display: flex; flex-direction: column; box-sizing: border-box; }
.result-title { color: #4dbfff; font-size: 17px; font-weight: bold; margin-bottom: 15px; text-align: center; border-bottom: 1px solid rgba(57, 175, 253, 0.25); padding-bottom: 12px; display: flex; justify-content: center; align-items: center; flex-wrap: wrap; /* Allow tag to wrap if needed */ }
.result-details { flex-grow: 1; display: flex; flex-direction: column; }
.result-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 9px; font-size: 13.5px; line-height: 1.6; }
.item-name { color: #a9d1f7; padding-right: 10px; flex-shrink: 0; }
.item-value { color: #cce5ff; text-align: right; font-weight: 500; flex-grow: 1; word-break: break-all; /* Prevent long values overflowing */ }
.item-value.abnormal { color: #ffabab; font-weight: bold; }
.item-value i { margin-left: 6px; font-size: 14px; vertical-align: middle; }
.result-conclusion { margin-top: 15px; padding: 10px 12px; background: rgba(16, 32, 67, 0.7); border-radius: 4px; color: #4dbfff; display: flex; align-items: flex-start; font-weight: bold; font-size: 14px; line-height: 1.6; border: 1px solid rgba(57, 175, 253, 0.3); }
.result-conclusion.abnormal { color: #ffabab; background: rgba(255, 107, 107, 0.2); border-color: rgba(255, 107, 107, 0.35); }
.result-conclusion.error-msg { color: #ff8f8f; background: rgba(255, 80, 80, 0.2); border-color: rgba(255, 80, 80, 0.35); font-weight: normal; /* Errors might not need bold */ }
.result-conclusion i { margin-right: 10px; font-size: 16px; flex-shrink: 0; margin-top: 2px; /* Align icon better */ }
.result-conclusion span { flex-grow: 1; word-break: break-word; }
.inference-time { font-size: 11.5px; color: #8DD1FE; text-align: right; margin-top: auto; /* Push to bottom */ padding-top: 12px; opacity: 0.8; }

/* No Result Alert */
.result-area.no-result { margin-top: 30px; text-align: center; }
:deep(.result-area.no-result .el-alert) { background-color: rgba(13, 28, 64, 0.5); color: #a9d1f7; border: 1px solid rgba(57, 175, 253, 0.3); }
:deep(.result-area.no-result .el-alert__title) { color: #bde2ff; font-size: 15px; }
:deep(.result-area.no-result .el-alert__description) { color: #a9d1f7; }
:deep(.result-area.no-result .el-alert__icon) { color: #4dbfff; font-size: 18px; }

/* Processing Overlay */
.processing-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(5, 18, 49, 0.9); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(6px); }
.processing-content { background: rgba(13, 28, 64, 0.95); border-radius: 12px; padding: 40px 50px 50px; width: 420px; text-align: center; border: 1px solid rgba(57, 175, 253, 0.45); box-shadow: 0 0 35px rgba(57, 175, 253, 0.35); }
.tech-spinner { position: relative; width: 75px; height: 75px; margin: 0 auto 30px; }
.spinner-ring { position: absolute; width: 100%; height: 100%; border: 5px solid transparent; border-top-color: #39AFFD; border-left-color: #39AFFD; border-radius: 50%; animation: spin 1.2s linear infinite; }
.spinner-core { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 65%; height: 65%; background: radial-gradient(circle, rgba(57, 175, 253, 0.8) 0%, rgba(57, 175, 253, 0) 75%); border-radius: 50%; animation: pulse 1.8s ease-in-out infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.85); } 50% { opacity: 0.9; transform:translate(-50%, -50%) scale(1.1); } }
.processing-text { color: #bde2ff; font-size: 19px; margin-bottom: 18px; font-weight: 500; }
.analysis-progress-bar { margin-top: 25px; }
:deep(.analysis-progress-bar .el-progress-bar__outer) { background-color: rgba(57, 175, 253, 0.2); border-radius: 100px; }
:deep(.analysis-progress-bar .el-progress-bar__inner) { background: linear-gradient(90deg, #3077b1 0%, #4dbfff 100%); border-radius: 100px; transition: width 0.5s ease-out; /* Faster transition for updates */ position: relative; overflow: hidden; }
:deep(.analysis-progress-bar .el-progress-bar__inner::after) { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%; background: linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 100%); border-radius: 100px 100px 0 0; opacity: 0.8; }
/* Show progress text outside the bar */
:deep(.analysis-progress-bar ) { display: block; color: #a9d1f7; font-size: 13px !important; margin-left: 10px; line-height: 1; }

/* --- Dialog Base Styles --- */
:deep(.el-dialog__wrapper) { backdrop-filter: blur(3px); }
:deep(.create-case-dialog .el-dialog),
:deep(.image-preview-dialog .el-dialog) {
  background: linear-gradient(145deg, rgba(10, 26, 56, 0.97), rgba(15, 35, 70, 0.97));
  border-radius: 12px;
  border: 1px solid rgba(57, 175, 253, 0.5);
  box-shadow: 0 8px 40px rgba(57, 175, 253, 0.25);
  overflow: hidden; /* Clip inner content */
}
:deep(.el-dialog__header) { border-bottom: 1px solid rgba(57, 175, 253, 0.3); padding: 18px 25px; background: rgba(16, 32, 67, 0.3); }
:deep(.el-dialog__title) { color: #a9d1f7; font-size: 18px; font-weight: 600; }
:deep(.el-dialog__headerbtn .el-dialog__close) { color: #a9d1f7; font-size: 18px; }
:deep(.el-dialog__headerbtn .el-dialog__close:hover) { color: #4dbfff; }
:deep(.el-dialog__body) { padding: 30px 25px; color: #cce5ff; max-height: 65vh; overflow-y: auto; }
:deep(.el-dialog__footer) { border-top: 1px solid rgba(57, 175, 253, 0.3); padding: 15px 25px; background: rgba(16, 32, 67, 0.2); text-align: right; }

/* Create Case Dialog Specific Styles */
:deep(.create-case-dialog .el-form-item__label) { color: #a9d1f7 !important; font-weight: 500; }
:deep(.create-case-dialog .el-input__inner),
:deep(.create-case-dialog .el-textarea__inner) {
   background: rgba(16, 32, 67, 0.6) !important; border-color: rgba(57, 175, 253, 0.45) !important; color: #cce5ff !important;
   transition: border-color 0.3s, box-shadow 0.3s;
}
:deep(.create-case-dialog .el-input__inner:focus),
:deep(.create-case-dialog .el-textarea__inner:focus) { border-color: #4dbfff !important; box-shadow: 0 0 8px rgba(57, 175, 253, 0.4); }
:deep(.create-case-dialog .el-input__inner::placeholder),
:deep(.create-case-dialog .el-textarea__inner::placeholder) { color: rgba(141, 209, 254, 0.6); }
:deep(.create-case-dialog .el-radio__label) { color: #cce5ff !important; }
:deep(.create-case-dialog .el-radio__inner) { border-color: rgba(57, 175, 253, 0.6); background: transparent; }
:deep(.create-case-dialog .el-radio__input.is-checked .el-radio__inner) { border-color: #39AFFD; background: #39AFFD; }
:deep(.create-case-dialog .el-radio__input.is-checked + .el-radio__label) { color: #4dbfff !important; }
:deep(.create-case-dialog .el-date-editor.el-input),
:deep(.create-case-dialog .el-date-editor.el-input__inner) { width: 100%; }
:deep(.create-case-dialog .el-form-item.is-error .el-input__inner),
:deep(.create-case-dialog .el-form-item.is-error .el-textarea__inner) { border-color: #ff7b7b !important; }
:deep(.create-case-dialog .el-form-item__error) { color: #ff9f9f; padding-top: 2px;}

/* Image Preview Dialog */
.preview-image-large { display: block; max-width: 100%; max-height: 75vh; object-fit: contain; margin: 0 auto; border-radius: 6px; background-color: rgba(0,0,0,0.3); }

/* Medical Advice Form Area */
.medical-advice-area { margin-top: 35px; }

/* Dialog Optimization Hint */
.optimized-dialog {
  will-change: transform, opacity; /* Hint for browser optimization */
  transform: translateZ(0); /* Promote to composite layer */
}

/* Responsive Adjustments */
@media (max-width: 992px) { /* Target tablets and smaller */
  .tech-content { flex-direction: column; } /* Stack uploaders */
  .result-cards { justify-content: center; } /* Center cards when stacked */
  .result-card, .result-card.placeholder {
      flex-basis: 100%; /* Take full width */
      min-width: 90%; /* Allow some margin */
      max-width: 100%;
  }
   /* Hide placeholder completely on small screens as stacking handles alignment */
   .result-card.placeholder { display: none; }
  .filter-form { justify-content: flex-start; } /* Align filters left */
}
@media (max-width: 768px) { /* Target phones */
   .tech-header h1 { font-size: 22px; margin: 0 10px;}
   .tech-line { width: 80px; }
   .filter-form { gap: 10px; padding: 10px 15px; }
   :deep(.filter-input .el-input__inner) { width: 180px; }
   .result-card { flex-direction: column; /* Stack image and info */ min-height: auto; }
   .result-image { width: 100%; max-width: none; border-right: none; border-bottom: 1px solid rgba(57, 175, 253, 0.25); padding: 10px; }
   .result-image img { max-height: 150px; }
   .result-info { padding: 15px; }
   .result-title { font-size: 16px; }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 15px;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
/* --- 修正垂直对齐问题后的 [ - ] [ 输入框 ] [ + ] 布局样式 --- */

/* 使 el-input-number 容器成为 flex 容器 */
:deep(.create-case-dialog .el-input-number) {
  display: flex;
  /* 尝试 center 对齐，而不是 stretch */
  align-items: center;
  width: 100%;
  height: 38px; /* 给容器也设定一个明确的高度 */
}

/* 设置 Flex Order 来调整视觉顺序 */
/* 1. 减号按钮 */
:deep(.create-case-dialog .el-input-number .el-input-number__decrease) {
  order: 1;
  flex-shrink: 0; /* 防止按钮被压缩 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px !important;
  height: 96%; /* 高度撑满父容器 (38px) */
  line-height: 38px !important; /* 行高与高度一致 */
  background: rgba(20, 40, 80, 0.7) !important;
  border: 1px solid rgba(57, 175, 253, 0.45) !important;
  color: #8DD1FE !important;
  border-radius: 4px 0 0 4px !important;
  border-right: none !important;
  padding: 0;
  margin: 0;
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease;
  box-sizing: border-box; /* 确保 padding 和 border 计算在内 */
}

/* 2. 输入框容器 */
:deep(.create-case-dialog .el-input-number .el-input) {
  order: 2;
  flex-grow: 1;
  height: 100%; /* 高度撑满父容器 (38px) */
  margin: 0 !important;
  /* 确保内部 input 垂直居中 (如果 align-items: center 对 el-input 不直接生效) */
  display: flex;
  align-items: center;
}

/* 3. 加号按钮 */
:deep(.create-case-dialog .el-input-number .el-input-number__increase) {
  order: 3;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px !important;
  height: 96%; /* 高度撑满父容器 (38px) */
  line-height: 37px !important;
  background: rgba(20, 40, 80, 0.7) !important;
  border: 1px solid rgba(57, 175, 253, 0.45) !important;
  color: #8DD1FE !important;
  border-radius: 0 4px 4px 0 !important;
  border-left: none !important;
  padding: 0;
  margin: 0;
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease;
  box-sizing: border-box;
}

/* 实际输入框 <input> 的样式 */
:deep(.create-case-dialog .el-input-number .el-input__inner) {
  background: rgba(16, 32, 67, 0.6) !important;
  border: 1px solid rgba(57, 175, 253, 0.45) !important;
  color: #cce5ff !important;
  border-radius: 0 !important;
  /* 确保左右边框作为分隔 */
  border-left: 1px solid rgba(57, 175, 253, 0.3) !important;
  border-right: 1px solid rgba(57, 175, 253, 0.3) !important;
  text-align: center;
  height: 100%; /* 输入框高度撑满其父容器 (.el-input) */
  line-height: 36px; /* 微调 line-height，有时需要比 height 略小一点点 */
  padding: 0 5px;
  width: 100%;
  box-sizing: border-box; /* 明确指定 */
}

/* 输入框聚焦时的样式 */
:deep(.create-case-dialog .el-input-number .el-input__inner:focus) {
   border-color: #4dbfff !important;
   box-shadow: 0 0 8px rgba(57, 175, 253, 0.4);
   position: relative;
   z-index: 1;
}

/* 悬停状态 (按钮) */
:deep(.create-case-dialog .el-input-number .el-input-number__decrease:hover),
:deep(.create-case-dialog .el-input-number .el-input-number__increase:hover) {
  background: rgba(57, 175, 253, 0.3) !important;
  z-index: 1;
}

/* 激活状态 (按钮) */
:deep(.create-case-dialog .el-input-number .el-input-number__decrease:active),
:deep(.create-case-dialog .el-input-number .el-input-number__increase:active) {
  background: rgba(57, 175, 253, 0.5) !important;
}

/* --- 图标颜色调整 --- */
:deep(.create-case-dialog .el-input-number .el-input-number__decrease i),
:deep(.create-case-dialog .el-input-number .el-input-number__increase i) {
  color: #8DD1FE !important; /* ! 默认图标颜色 ! */
  font-weight: bold;
}
:deep(.create-case-dialog .el-input-number .el-input-number__decrease:hover i),
:deep(.create-case-dialog .el-input-number .el-input-number__increase:hover i) {
  color: #ffffff !important; /* ! 悬停图标颜色 ! */
}
:deep(.create-case-dialog .el-input-number .el-input-number__decrease:active i),
:deep(.create-case-dialog .el-input-number .el-input-number__increase:active i) {
  color: #ffffff !important; /* ! 点击图标颜色 ! */
}
:deep(.create-case-dialog .el-input-number.is-disabled .el-input-number__decrease i),
:deep(.create-case-dialog .el-input-number.is-disabled .el-input-number__increase i) {
  color: rgba(141, 209, 254, 0.4) !important; /* ! 禁用图标颜色 ! */
  font-weight: normal;
}

/* --- 禁用状态整体样式 --- */
:deep(.create-case-dialog .el-input-number.is-disabled .el-input__inner) {
    background-color: rgba(16, 32, 67, 0.4) !important;
    border-color: rgba(57, 175, 253, 0.2) !important;
    color: rgba(204, 229, 255, 0.5) !important;
    cursor: not-allowed;
}
:deep(.create-case-dialog .el-input-number.is-disabled .el-input-number__decrease),
:deep(.create-case-dialog .el-input-number.is-disabled .el-input-number__increase) {
    background-color: rgba(16, 32, 67, 0.5) !important;
    border-color: rgba(57, 175, 253, 0.2) !important;
    cursor: not-allowed;
}
/* 禁用时输入框分隔线颜色调整 */
:deep(.create-case-dialog .el-input-number.is-disabled .el-input__inner) {
  border-left-color: rgba(57, 175, 253, 0.15) !important;
  border-right-color: rgba(57, 175, 253, 0.15) !important;
}

/* --- 验证信息定位 --- */
:deep(.create-case-dialog .el-form-item--medium .el-form-item__content) {
    line-height: normal; /* 重置可能影响布局的 line-height */
    display: block;
    /* 移除可能导致高度问题的行高 */
    /* line-height: 38px; */
}
:deep(.create-case-dialog .el-form-item--medium .el-form-item__error) {
    padding-top: 1px;
    position: absolute;
    left: 0;
    top: 100%; /* 确保在下方 */
}

/* --- 修正对齐后样式结束 --- */

.el-icon-edit, .el-icon-delete {
  font-size: 16px;
}

/* 患者选择对话框样式 */
.patient-select-dialog /deep/ .el-dialog__body {
  padding: 15px 20px;
}

.patient-select-dialog /deep/ .el-table {
  background: rgba(10, 22, 50, 0.8);
  color: #E0F2FF;
  border: 1px solid rgba(57, 175, 253, 0.3);
}

.patient-select-dialog /deep/ .el-table th {
  background-color: rgba(57, 175, 253, 0.15);
  color: #8DD1FE;
  font-weight: 500;
}

.patient-select-dialog /deep/ .el-table tr {
  background-color: transparent;
}

.patient-select-dialog /deep/ .el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: rgba(57, 175, 253, 0.05);
}

.patient-select-dialog /deep/ .el-table td, 
.patient-select-dialog /deep/ .el-table th.is-leaf {
  border-bottom: 1px solid rgba(57, 175, 253, 0.2);
}

.patient-select-dialog /deep/ .el-table--border td, 
.patient-select-dialog /deep/ .el-table--border th {
  border-right: 1px solid rgba(57, 175, 253, 0.15);
}

.patient-select-dialog /deep/ .el-table__body tr:hover > td {
  background-color: rgba(57, 175, 253, 0.15) !important;
}

.patient-select-dialog /deep/ .el-button--text {
  color: #39AFFD;
  padding: 0 5px;
}

.patient-select-dialog /deep/ .el-button--text:focus, 
.patient-select-dialog /deep/ .el-button--text:hover {
  color: #8DD1FE;
}

/* 表格行光标样式 */
.patient-select-dialog /deep/ .el-table__body tr {
  cursor: pointer;
}
</style>