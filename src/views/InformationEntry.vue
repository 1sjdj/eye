<template>
  <div class="patient-entry-management">
    <!-- 标题区域 -->
    <div class="tech-header">
      <div class="tech-line left"></div>
      <h1><span class="highlight">信息录入</span></h1>
      <div class="tech-line right"></div>
    </div>

    <!-- 患者信息录入卡片 -->
    <el-card class="box-card entry-card" shadow="never">
      <el-form
        ref="patientFormRef"
        :model="patientForm"
        :rules="patientFormRules"
        label-position="top"
        v-loading="loading"
        class="patient-entry-form"
        @submit.native.prevent="submitForm"
        hide-required-asterisk="false"
      >
        <!-- 基本信息区域 -->
        <div class="form-section">
          <h3 class="section-title">基本信息</h3>
          <el-row :gutter="30">
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="姓名" prop="name">
                <el-input 
                  v-model.trim="patientForm.name" 
                  placeholder="请输入患者姓名" 
                  clearable 
                  prefix-icon="el-icon-user"
                  class="tech-input"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="性别" prop="gender">
                <el-select 
                  v-model="patientForm.gender" 
                  placeholder="请选择性别" 
                  style="width: 100%;" 
                  popper-class="tech-select-dropdown"
                  class="tech-select"
                >
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="年龄" prop="age">
                <el-input-number
                  v-model="patientForm.age"
                  :min="0" 
                  :max="150"
                  controls-position="right"
                  placeholder="年龄"
                  style="width: 100%;"
                  class="tech-input-number"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 联系信息区域 -->
        <div class="form-section">
          <h3 class="section-title">联系信息</h3>
          <el-row :gutter="30">
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="出生日期" prop="birthDate">
                <el-date-picker
                  v-model="patientForm.birthDate"
                  type="date"
                  placeholder="选择出生日期"
                  format="yyyy 年 MM 月 dd 日"
                  value-format="yyyy-MM-dd"
                  style="width: 100%;"
                  :picker-options="{ disabledDate(time) { return time.getTime() > Date.now(); } }"
                  prefix-icon="el-icon-date"
                  popper-class="tech-date-picker-dropdown"
                  class="tech-input tech-date-picker"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="联系方式" prop="contact">
                <el-input 
                  v-model.trim="patientForm.contact" 
                  placeholder="请输入11位手机号" 
                  clearable 
                  prefix-icon="el-icon-mobile-phone"
                  class="tech-input"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="8">
              <el-form-item label="身份证号 / 医保卡号" prop="idNumber">
                <el-input 
                  v-model.trim="patientForm.idNumber" 
                  placeholder="18位身份证或医保号" 
                  clearable 
                  prefix-icon="el-icon-postcard"
                  class="tech-input"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 病史信息区域 -->
        <div class="form-section">
          <h3 class="section-title">病史信息</h3>
          <el-form-item label="详细病史" prop="medicalHistory" class="form-item-area">
            <el-input
              type="textarea"
              :rows="3"
              v-model="patientForm.medicalHistory"
              placeholder="请输入患者详细病史（选填，最多500字）"
              maxlength="500"
              show-word-limit
              resize="vertical"
              class="tech-textarea"
            />
          </el-form-item>
        </div>

        <!-- 过敏史部分 -->
        <div class="form-section allergy-section">
          <h3 class="section-title">过敏史</h3>
          <el-form-item label="过敏史分类" prop="allergyOptions" class="allergy-options-item">
            <el-checkbox-group v-model="patientForm.allergyOptions" @change="handleAllergyOptionsChange" class="allergy-checkbox-group">
              <el-checkbox label="无" border size="small" class="allergy-checkbox"></el-checkbox>
              <el-checkbox label="吸入式过敏" border size="small" :disabled="isNoneSelected" class="allergy-checkbox"></el-checkbox>
              <el-checkbox label="食入式过敏" border size="small" :disabled="isNoneSelected" class="allergy-checkbox"></el-checkbox>
              <el-checkbox label="接触式过敏" border size="small" :disabled="isNoneSelected" class="allergy-checkbox"></el-checkbox>
              <el-checkbox label="注射式过敏" border size="small" :disabled="isNoneSelected" class="allergy-checkbox"></el-checkbox>
              <el-checkbox label="其他" border size="small" :disabled="isNoneSelected" class="allergy-checkbox"></el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="过敏史详细描述" prop="allergyHistory" class="form-item-area allergy-desc-item">
            <el-input
              type="textarea"
              :rows="2"
              v-model="patientForm.allergyHistory"
              placeholder="请详细描述具体的过敏物质、反应或情况（选填，最多300字）"
              :disabled="isNoneSelected"
              maxlength="300"
              show-word-limit
              resize="vertical"
              class="tech-textarea"
            />
          </el-form-item>
        </div>

        <!-- 操作按钮 -->
        <el-form-item class="form-actions">
          <el-button type="primary" native-type="submit" :loading="loading" class="submit-button" icon="el-icon-check">确认录入</el-button>
          <el-button @click="resetForm('patientFormRef')" :disabled="loading" icon="el-icon-refresh-left" class="reset-button">重 置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';

// Function to get initial empty form state
const getInitialPatientForm = () => ({
  name: "",
  gender: "",
  age: null,
  birthDate: null,
  idNumber: "",
  contact: "",
  medicalHistory: "",
  allergyOptions: [],
  allergyHistory: "",
});

export default {
  name: 'PatientEntry',
  data() {
    // --- Custom Validators ---
    const validatePhone = (rule, value, callback) => {
       if (!value) { callback(new Error('请输入联系方式')); }
       else if (!/^(?:(?:\+|00)86)?1[3-9]\d{9}$/.test(value)) { callback(new Error('请输入有效的11位中国大陆手机号码')); }
       else { callback(); }
    };
    const validateIdNumber = (rule, value, callback) => {
       if (!value) { callback(new Error('请输入身份证号或医保卡号')); }
       else if (!/(^\d{18}$)|(^\d{17}(\d|X|x)$)|(^\d{15,20}$)/.test(value)) { callback(new Error('请输入有效的18位身份证号或15-20位医保卡号')); }
       else { callback(); }
    };
    const validateAllergyHistory = (rule, value, callback) => {
        if (!this.isNoneSelected && this.patientForm.allergyOptions.length > 0 && !value?.trim()) {
           callback(new Error('当选择具体过敏分类时，请填写详细描述'));
        } else { callback(); }
     };

    return {
      loading: false,
      patientForm: getInitialPatientForm(),
      patientFormRules: {
        name: [ { required: true, message: '请输入患者姓名', trigger: 'blur' }, { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' } ],
        gender: [ { required: true, message: '请选择性别', trigger: 'change' } ],
        age: [ { required: true, message: '请输入年龄', trigger: ['blur', 'change'] }, { type: 'integer', min: 0, max: 150, message: '请输入有效的年龄 (0-150)', trigger: ['blur', 'change'] } ],
        birthDate: [ { required: true, message: '请选择出生日期', trigger: 'change' } ],
        contact: [ { required: true, validator: validatePhone, trigger: 'blur' } ],
        idNumber: [ { required: true, validator: validateIdNumber, trigger: 'blur' } ],
        medicalHistory: [ { max: 500, message: '病史描述不能超过 500 个字符', trigger: 'blur' } ],
        allergyOptions: [], // No required rule needed here usually
        allergyHistory: [ { validator: validateAllergyHistory, trigger: ['blur', 'change'] }, { max: 300, message: '过敏史描述不能超过 300 个字符', trigger: 'blur' } ]
      },
    };
  },
  computed: {
      isNoneSelected() { return this.patientForm.allergyOptions.includes('无'); }
  },
  methods: {
    handleAllergyOptionsChange(selectedOptions) {
        const noneSelected = selectedOptions.includes('无');
        const hasOtherOptions = selectedOptions.filter(opt => opt !== '无').length > 0;
        if (noneSelected && hasOtherOptions) {
            this.patientForm.allergyOptions = ['无'];
            this.patientForm.allergyHistory = '';
            this.$refs.patientFormRef?.clearValidate('allergyHistory');
        } else if (noneSelected) {
            this.patientForm.allergyHistory = '';
            this.$refs.patientFormRef?.clearValidate('allergyHistory');
        }
        this.$nextTick(() => { this.$refs.patientFormRef?.validateField('allergyHistory'); });
    },
    submitForm() {
      this.$refs.patientFormRef.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          try {
            // 转换数据格式以匹配后端要求 (后端期望驼峰命名)
            // 直接展开 this.patientForm 即可，它包含了所有需要的驼峰字段
            const patientDataToSend = {
              ...this.patientForm
              // 后端 add_patient 会自行处理 allergyOptions 和 allergyHistory
              // status 字段也应该包含在 this.patientForm 中 (如果需要的话)
            };

            // 移除所有不必要的 delete 和手动添加的字段
            // delete patientDataToSend.allergyOptions; // 不删除，后端需要

            console.log('提交患者数据 (纯驼峰): ', patientDataToSend);
            
            // 使用axios实例
            const response = await axios.post('/api/patients', patientDataToSend);
            
            // 从响应中提取数据
            const responseData = response.data || response;
            
            this.$message({ 
              message: `患者 ${patientDataToSend.name} 信息录入成功！`, 
              type: 'success', 
              duration: 3000 
            });
            
            this.resetForm('patientFormRef');
          } catch (error) {
            console.error("信息录入失败:", error);
            const errorMsg = error?.response?.data?.message || error?.message || '操作失败，请稍后重试';
            this.$message({ 
              message: `信息录入失败: ${errorMsg}`, 
              type: 'error', 
              duration: 5000, 
              showClose: true 
            });
          } finally { 
            this.loading = false; 
          }
        } else {
          console.log('表单验证失败!');
          this.$message({ 
            message: '表单包含错误，请检查并修正标红的字段', 
            type: 'warning', 
            duration: 3000 
          });
          
          this.$nextTick(() => {
            const firstErrorField = this.$el.querySelector('.is-error');
            if (firstErrorField) { 
              firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
            }
          });
          
          return false;
        }
      });
    },
    resetForm(formName) {
        if (this.$refs[formName]) { 
          this.$refs[formName].resetFields(); 
        }
        this.patientForm = getInitialPatientForm();
        this.$nextTick(() => { 
          this.$refs.patientFormRef?.clearValidate(); 
        });
    },
  },
};
</script>

<style scoped>
/* --- Base and Header Styles --- */
.patient-entry-management { 
  width: 100%; 
  min-height: calc(100vh - 60px); 
  padding: 25px; 
  box-sizing: border-box; 
  display: flex; 
  flex-direction: column; 
  background-color: transparent; 
  overflow-y: auto; 
}

.tech-header { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  margin-bottom: 30px; 
  position: relative; 
  flex-shrink: 0; 
}

.tech-header h1 { 
  color: #8DD1FE; 
  font-size: 28px; 
  font-weight: 600; 
  margin: 0 25px; 
  text-shadow: 0 0 12px rgba(57, 175, 253, 0.6); 
}

.highlight { color: #39AFFD; }

.tech-line { 
  height: 2px; 
  width: 180px; 
  position: relative; 
}

.tech-line.left { background: linear-gradient(to right, rgba(57, 175, 253, 0), #39AFFD); }
.tech-line.right { background: linear-gradient(to left, rgba(57, 175, 253, 0), #39AFFD); }

/* --- Card Styles --- */
.box-card.entry-card {
  flex-grow: 1;
  background: rgba(10, 22, 50, 0.85);
  border-radius: 12px;
  border: 1px solid rgba(57, 175, 253, 0.3);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3), 0 0 25px rgba(57, 175, 253, 0.08) inset;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.entry-card /deep/ .el-card__body {
  padding: 35px 40px;
  flex-grow: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(57, 175, 253, 0.4) rgba(10, 22, 50, 0.85);
}

/* --- Form Section Styles --- */
.form-section {
  margin-bottom: 35px;
  padding: 25px;
  background: rgba(0, 15, 40, 0.4);
  border: 1px solid rgba(57, 175, 253, 0.2);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.form-section:hover {
  border-color: rgba(57, 175, 253, 0.4);
  box-shadow: 0 0 15px rgba(57, 175, 253, 0.1);
}

.section-title {
  color: #8DD1FE;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(57, 175, 253, 0.3);
}

/* --- Form Element Styles --- */
.patient-entry-form /deep/ .el-form-item { 
  margin-bottom: 24px; 
}

.patient-entry-form /deep/ .el-form-item__label {
  color: #a0d8ff;
  padding-bottom: 8px;
  line-height: 1.4;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
}

/* Input, Select, DatePicker, InputNumber, Textarea */
.tech-input /deep/ .el-input__inner,
.tech-select /deep/ .el-input__inner,
.tech-textarea /deep/ .el-textarea__inner,
.tech-input-number /deep/ .el-input__inner {
  background-color: rgba(0, 15, 40, 0.7) !important;
  border: 1px solid rgba(57, 175, 253, 0.4) !important;
  border-radius: 6px;
  color: #E0F2FF;
  height: 42px;
  line-height: 42px;
  padding: 0 15px;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.35);
  transition: all 0.3s ease;
}

/* 调整带前缀图标的输入框内边距 */
.tech-input /deep/ .el-input--prefix .el-input__inner {
  padding-left: 40px;
}

/* 调整图标位置 */
.tech-input /deep/ .el-input__prefix {
  left: -3px;
  color: #8DD1FE;
}

.tech-input /deep/ .el-input__icon {
  line-height: 42px;
  color: #8DD1FE;
}

/* 调整字数限制样式 */
.tech-textarea /deep/ .el-input__count {
  background-color: transparent !important;
  color: #8DD1FE;
  font-size: 12px;
  line-height: 1;
  position: absolute;
  bottom: 8px;
  right: 12px;
  padding: 0;
}

.tech-textarea /deep/ .el-input__count-inner {
  background: none !important;
  color: inherit !important;
}

.tech-input /deep/ .el-input__inner:focus,
.tech-select /deep/ .el-input__inner:focus,
.tech-textarea /deep/ .el-textarea__inner:focus,
.tech-input-number /deep/ .el-input__inner:focus {
  background-color: rgba(0, 20, 50, 0.8) !important;
  border-color: #4cb9ff !important;
  box-shadow: 0 0 0 3px rgba(76, 185, 255, 0.2);
  outline: none;
}

.tech-textarea /deep/ .el-textarea__inner {
  height: auto;
  line-height: 1.7;
  padding: 12px 15px;
  min-height: 100px;
}

/* --- Allergy Section Styles --- */
.allergy-section {
  background: rgba(0, 15, 40, 0.4);
  border: 1px solid rgba(57, 175, 253, 0.2);
  border-radius: 8px;
  padding: 25px;
}

.allergy-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.allergy-checkbox {
  margin: 0 !important;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.allergy-checkbox /deep/ .el-checkbox__input .el-checkbox__inner {
  background-color: rgba(0, 15, 40, 0.7);
  border-color: rgba(57, 175, 253, 0.45);
  width: 16px;
  height: 16px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.allergy-checkbox /deep/ .el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: #39AFFD;
  border-color: #39AFFD;
}

/* 添加标签文本颜色样式 */
.allergy-checkbox /deep/ .el-checkbox__label {
  color: #E0F2FF !important; /* 设置为白色 */
  font-size: 14px;
  transition: all 0.2s ease;
}

/* 添加悬停效果 */
.allergy-checkbox:hover /deep/ .el-checkbox__label {
  color: #fff !important;
  text-shadow: 0 0 5px rgba(57, 175, 253, 0.4);
}

/* 禁用状态的颜色 */
.allergy-checkbox.is-disabled /deep/ .el-checkbox__label {
  color: rgba(224, 242, 255, 0.5) !important;
}

/* --- Action Buttons --- */
.form-actions {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid rgba(57, 175, 253, 0.15);
  text-align: center;
}

.submit-button {
  padding: 0 45px;
  font-size: 16px;
  height: 44px;
  line-height: 44px;
  min-width: 160px;
  font-weight: 500;
  background: linear-gradient(135deg, #3077b1, #39affd);
  border: 1px solid #3077b1;
  box-shadow: 0 3px 8px rgba(57, 175, 253, 0.35);
  transition: all 0.3s ease;
}

.submit-button:hover {
  background: linear-gradient(135deg, #39affd, #3077b1);
  border-color: #39affd;
  box-shadow: 0 5px 12px rgba(57, 175, 253, 0.45);
  transform: translateY(-1px);
}

.reset-button {
  height: 44px;
  line-height: 44px;
  padding: 0 35px;
  font-size: 15px;
  background-color: rgba(57, 175, 253, 0.15);
  border-color: rgba(57, 175, 253, 0.4);
  color: #8DD1FE;
  font-weight: 500;
  transition: all 0.3s ease;
}

.reset-button:hover {
  background-color: rgba(57, 175, 253, 0.25);
  border-color: rgba(57, 175, 253, 0.6);
  color: #bde4ff;
  transform: translateY(-1px);
}

/* --- Responsive Adjustments --- */
@media (max-width: 992px) {
  .patient-entry-form /deep/ .el-col-md-8 { 
    width: 50%; 
  }
  .patient-entry-form /deep/ .el-col-md-8:nth-child(3n) { 
    width: 100%; 
  }
}

@media (max-width: 768px) {
  .patient-entry-management { 
    padding: 15px; 
  }
  .entry-card /deep/ .el-card__body { 
    padding: 25px 20px; 
  }
  .tech-header h1 { 
    font-size: 24px; 
  }
  .tech-line { 
    width: 120px; 
  }
  .form-section {
    padding: 20px;
  }
  .patient-entry-form /deep/ .el-col-sm-12, 
  .patient-entry-form /deep/ .el-col-md-8 { 
    width: 100%; 
  }
  .form-actions { 
    margin-top: 30px; 
    padding-top: 20px; 
  }
  .form-actions .el-button { 
    width: calc(50% - 10px); 
    margin: 0 5px 10px 5px !important; 
    height: 40px; 
    line-height: 40px; 
  }
  .submit-button { 
    padding: 0 20px; 
    min-width: auto; 
  }
}

/* --- 日期选择器样式 --- */
.tech-date-picker /deep/ .el-input__prefix {
  left: -3px;
  color: #8DD1FE;
}

.tech-date-picker /deep/ .el-input__icon {
  line-height: 42px;
  color: #8DD1FE;
}

.tech-date-picker /deep/ .el-input__inner {
  padding-left: 40px;
}

/* 日期选择器下拉面板样式 */
.patient-entry-management /deep/ .tech-date-picker-dropdown {
  background-color: rgba(10, 22, 50, 0.95) !important;
  border: 1px solid rgba(57, 175, 253, 0.4) !important;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
}

.patient-entry-management /deep/ .tech-date-picker-dropdown .el-date-table th,
.patient-entry-management /deep/ .tech-date-picker-dropdown .el-date-table td.available span,
.patient-entry-management /deep/ .tech-date-picker-dropdown .el-date-picker__header-label {
  color: #E0F2FF;
}

.patient-entry-management /deep/ .tech-date-picker-dropdown .el-date-table td.current:not(.disabled) span {
  background-color: #39AFFD !important;
  color: #fff;
}

.patient-entry-management /deep/ .tech-date-picker-dropdown .el-date-table td.available:hover span {
  background-color: rgba(57, 175, 253, 0.2);
}

.patient-entry-management /deep/ .tech-date-picker-dropdown .el-picker-panel__content {
  margin: 10px;
}

.patient-entry-management /deep/ .tech-date-picker-dropdown .el-date-picker__header {
  margin: 8px 15px 0;
}
</style>