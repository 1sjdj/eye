<template>
  <div class="medical-advice-form">
    <div class="advice-container">
      <!-- Diagnosis Section -->
      <div class="advice-section diagnosis-section">
        <h3 class="section-title">
          <i class="el-icon-document"></i> 诊断意见
          <span class="section-subtitle">（支持AI辅助生成）</span>
        </h3>
        <div class="diagnosis-container">
          <el-input
            type="textarea"
            rows="12"
            v-model.trim="localDiagnosis" 
            placeholder="请输入详细的诊断意见..."
            class="diagnosis-input"
          ></el-input>
        </div>
        
        <!-- AI Assistant -->
        <div class="ai-assistant">
          <el-button
            ref="aiAssistantBtn"
            size="medium"
            @click="requestAISuggestions"
            class="ai-assistant-btn"
            :loading="loadingAISuggestions"
            :disabled="!analysisContext || analysisContext.length === 0"
            aria-label="获取AI辅助诊断建议"
            title="基于影像分析结果获取AI诊断建议"
          >
            <i class="el-icon-magic-stick"></i> A I 辅 助 诊 断 建 议
          </el-button>
        </div>
        
        <!-- AI Suggestions Popover -->
        <el-popover
          ref="aiPopoverRef"
          placement="bottom-start"
          trigger="manual"
          v-model="showAiSuggestionsPopover"
          popper-class="ai-suggestions-popover"
          :reference="$refs.aiAssistantBtn"
          transition="el-zoom-in-top"
          :append-to-body="true"
          :visible-arrow="true"
          :close-on-click-modal="true"
          :open-delay="50"
          :close-delay="50"
        >
          <div class="suggestions-content" v-loading="loadingAISuggestions">
            <div class="suggestions-header" v-if="aiSuggestions && aiSuggestions.length > 0">
              <h4>AI建议</h4>
              <span class="suggestions-tip">点击建议项可添加到诊断中</span>
            </div>
            <div v-if="aiSuggestions && aiSuggestions.length > 0">
              <div
                class="suggestion-item"
                v-for="(item, index) in aiSuggestions"
                :key="index"
                @click="applySuggestion(item)"
                role="button"
                tabindex="0"
                @keydown.enter.space="applySuggestion(item)"
              >
                {{ item }}
              </div>
            </div>
            <div v-else-if="!loadingAISuggestions" class="no-suggestions">
              暂无可用建议或分析结果无异常
            </div>
          </div>
        </el-popover>
      </div>

      <!-- Structured Advice Section -->
      <div class="advice-section structured-advice-section">
        <h3 class="section-title"><i class="el-icon-edit-outline"></i> 医嘱建议</h3>
        <!-- Template Selector -->
        <div class="template-selector">
          <el-select
            v-model="selectedTemplateId" 
            @change="handleTemplateChange"
            placeholder="选择医嘱模板快速填充"
            class="template-select"
            clearable
            filterable
            popper-class="stable-dropdown"
            :popper-append-to-body="false"
            :popper-offset="0"
            :popper-placement="'bottom-start'"
            :popper-visible-arrow="true"
            :popper-close-on-click-modal="false"
            :popper-enter-active-class="'el-zoom-in-top'"
            :popper-leave-active-class="'el-zoom-out-top'"
            aria-label="选择医嘱模板"
          >
            <el-option-group
               v-for="group in groupedTemplates"
               :key="group.label"
               :label="group.label || '未分类'"
             >
               <el-option
                 v-for="item in group.options"
                 :key="item.id"
                 :label="item.name"
                 :value="item.id"
                 :title="item.name"
               >
                 <span style="float: left">{{ item.name }}</span>
                 <span style="float: right; color: #8492a6; font-size: 13px; margin-left: 10px;">{{ item.category }}</span>
               </el-option>
           </el-option-group>
          </el-select>
          <el-button type="text" @click="$emit('manage-templates')" class="manage-templates-btn" title="管理医嘱模板" aria-label="打开医嘱模板管理器">
            <i class="el-icon-folder-opened"></i> 管理模板
          </el-button>
        </div>

        <!-- Structured Advice Input Areas -->
        <div class="structured-advice-categories">
          <div class="advice-category" v-for="(category, catIndex) in localStructuredAdvice" :key="category.name">
            <div class="category-header">
              <h4>{{ category.name }}</h4>
              <el-button size="mini" @click="addAdviceItem(catIndex)" class="add-item-btn" plain title="添加新条目">
                <i class="el-icon-plus"></i> 添加{{ category.name }}条目
              </el-button>
            </div>
            <div class="advice-items">
              <div class="advice-item" v-for="(item, itemIndex) in category.items" :key="item.id || item._temp_id || `${category.name}-${itemIndex}`">
                <div class="advice-header">
                  <div class="advice-title">{{ category.name }}项 #{{ itemIndex+1 }}</div>
                  <el-button
                    icon="el-icon-delete"
                    @click="removeAdviceItem(catIndex, itemIndex)"
                    size="mini"
                    type="danger"
                    plain
                    class="delete-advice-btn-standalone"
                    aria-label="删除此条医嘱"
                    title="删除此条医嘱"
                  >删除</el-button>
                </div>
                <div class="advice-input-wrapper">
                  <el-input
                    v-model.trim="item.content" 
                    :placeholder="`输入${category.name}内容`"
                    class="advice-input"
                    @change="emitAdviceUpdate" 
                    size="small"
                  ></el-input>
                </div>
                <div class="advice-selects-wrapper">
                  <el-select
                    v-model="item.frequency"
                    placeholder="频次"
                    class="frequency-select"
                    clearable
                    filterable
                    allow-create
                    default-first-option
                    popper-class="stable-dropdown"
                    :popper-append-to-body="false"
                    :popper-offset="0"
                    :popper-placement="'bottom-start'"
                    :popper-visible-arrow="true"
                    :popper-close-on-click-modal="false"
                    :popper-enter-active-class="'el-zoom-in-top'"
                    :popper-leave-active-class="'el-zoom-out-top'"
                    @change="emitAdviceUpdate" 
                    size="small"
                    aria-label="选择或输入频次"
                  >
                    <el-option v-for="freq in frequencies" :key="freq.value" :label="freq.label" :value="freq.value"></el-option>
                  </el-select>
                  <el-select
                    v-model="item.duration"
                    placeholder="疗程"
                    class="duration-select"
                    clearable
                    filterable
                    allow-create
                    default-first-option
                    popper-class="stable-dropdown"
                    :popper-append-to-body="false"
                    :popper-offset="0"
                    :popper-placement="'bottom-start'"
                    :popper-visible-arrow="true"
                    :popper-close-on-click-modal="false"
                    :popper-enter-active-class="'el-zoom-in-top'"
                    :popper-leave-active-class="'el-zoom-out-top'"
                    @change="emitAdviceUpdate"
                    size="small"
                    aria-label="选择或输入疗程"
                  >
                    <el-option v-for="dur in durations" :key="dur.value" :label="dur.label" :value="dur.value"></el-option>
                  </el-select>
                </div>
              </div>
               <div v-if="!category.items || category.items.length === 0" class="no-items-placeholder">
                   点击 "添加" 输入 {{ category.name }}
               </div>
            </div>
          </div>
        </div>

        <!-- Common Advice Library -->
        <div class="common-advice-library">
          <h4>常用医嘱库 <el-tooltip content="点击标签可快速添加至'生活方式建议'分类" placement="top"><i class="el-icon-info"></i></el-tooltip></h4>
          <div class="common-advice-tags">
            <el-tag
              v-for="(advice, index) in commonAdvices"
              :key="index"
              @click="addCommonAdvice(advice)"
              class="advice-tag"
              effect="plain"
              role="button"
              tabindex="0"
              @keydown.enter.space="addCommonAdvice(advice)"
            >{{ advice }}</el-tag>
             <span v-if="!commonAdvices || commonAdvices.length === 0" class="no-common-advice">
               (无常用医嘱)
             </span>
          </div>
        </div>
      </div>

      <!-- Template Content Section -->
      <div class="advice-section template-content-section" v-if="showTemplateContent">
        <h3 class="section-title"><i class="el-icon-document-copy"></i> 应用的模板内容</h3>
        <div class="template-content-container">
          <div class="template-header">
            <span class="template-name">{{ appliedTemplate.name }}</span>
            <span class="template-category" v-if="appliedTemplate.category">{{ appliedTemplate.category }}</span>
            <el-button type="text" size="mini" @click="closeTemplateContent" class="close-template-btn">
              <i class="el-icon-close"></i>
            </el-button>
          </div>
          <div class="template-content">
            <pre>{{ formattedTemplateContent }}</pre>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <el-button type="primary" @click="saveAdvice" class="save-btn" :loading="saving" :disabled="saving">
          <i class="el-icon-document-checked"></i> 保存医嘱
        </el-button>
        <el-button @click="$emit('print-advice')" class="print-btn" :disabled="saving">
          <i class="el-icon-printer"></i> 打印医嘱
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { cloneDeep } from 'lodash-es';

// 根据当前环境确定API基础URL
const API_BASE_URL = axios.defaults.baseURL ? '' : '/api';
const LIFESTYLE_CATEGORY_NAME = "生活方式建议";

export default {
  name: 'MedicalAdviceForm',
  props: {
    initialData: {
      type: Object,
      default: () => ({ diagnosis: '', structuredAdvice: null })
    },
    adviceTemplates: { type: Array, default: () => [] },
    commonAdvices: { type: Array, default: () => [] },
    frequencies: { type: Array, default: () => [] },
    durations: { type: Array, default: () => [] },
    analysisContext: { type: Array, default: null },
    saving: { type: Boolean, default: false }
  },
  data() {
    return {
      localDiagnosis: this.initialData.diagnosis || '',
      localStructuredAdvice: this.createInitialStructuredAdvice(this.initialData.structuredAdvice),
      selectedTemplateId: '',
      loadingAISuggestions: false,
      aiSuggestions: [],
      showAiSuggestionsPopover: false,
      aiAssistantBtn: null,
      showTemplateContent: false,
      appliedTemplate: null,
      formattedTemplateContent: '',
    };
  },
   computed: {
     groupedTemplates() {
         const groups = {};
         this.adviceTemplates.forEach(template => {
             const category = template.category?.trim() || '未分类';
             if (!groups[category]) {
                 groups[category] = { label: category, options: [] };
             }
             groups[category].options.push(template);
         });
         return Object.values(groups).sort((a, b) => {
             if (a.label === '未分类') return 1;
             if (b.label === '未分类') return -1;
             return a.label.localeCompare(b.label, 'zh-CN');
         });
     }
   },
   watch: {
       initialData: {
           handler(newData) {
               this.resetForm(newData); // Call resetForm method to update data
           },
           deep: false
       }
   },
   mounted() {
       this.aiAssistantBtn = this.$refs.aiAssistantBtn;
   },
  methods: {
    createInitialStructuredAdvice(initialStructure = null) {
        const defaultStructure = [
             { name: "药物治疗", items: [] },
             { name: "检查建议", items: [] },
             { name: LIFESTYLE_CATEGORY_NAME, items: [] }
         ];
         if (initialStructure && Array.isArray(initialStructure) && initialStructure.every(cat => cat && typeof cat.name === 'string' && Array.isArray(cat.items))) {
             return cloneDeep(initialStructure);
         }
         return cloneDeep(defaultStructure);
    },
    resetForm(newData) {
        this.localDiagnosis = newData.diagnosis || '';
        this.localStructuredAdvice = this.createInitialStructuredAdvice(newData.structuredAdvice);
        this.selectedTemplateId = '';
        this.aiSuggestions = [];
        this.showAiSuggestionsPopover = false;
        this.showTemplateContent = false;
        this.appliedTemplate = null;
        this.formattedTemplateContent = '';
    },
    updateDiagnosis(value) {
      this.localDiagnosis = value;
      this.emitAdviceUpdate();
    },
    async requestAISuggestions() {
      if (!this.analysisContext || this.analysisContext.length === 0) {
           this.$message.warning("需要先完成影像分析才能获取AI建议。");
           return;
       }
      this.loadingAISuggestions = true;
      
      // 不再显示弹出框
      this.showAiSuggestionsPopover = false;
      
      console.log("Requesting AI suggestions with context:", this.analysisContext);
      try {
          // 根据分析结果构建查询
          const eyeConditions = this.analysisContext
            .filter(r => !r.error)
            .map(r => `${r.eye_side === 'left' ? '左眼' : '右眼'}: ${r.predicted_class || '未知'}(置信度: ${(r.confidence * 100).toFixed(1)}%)`)
            .join(', ');
            
          const response = await axios.post(`${API_BASE_URL}/ai-suggestion`, {
              query: `根据眼底影像分析结果生成诊断建议。检测到的情况: ${eyeConditions}`,
              // 尝试从父组件或外部源获取患者信息
              patient_age: this.$parent?.patientAge || 40,
              patient_sex: this.$parent?.patientGender || '未知',
              // 添加分析上下文，包含完整的分析结果，确保包含所有类别的概率
              context: this.analysisContext
          });
          
          console.log("AI建议响应数据:", response.data);
          
          // 处理不同部分的AI建议
          const aiData = response.data;
          const suggestions = [];
          
          // 添加诊断建议
          if (aiData.diagnosis_suggestion) {
              suggestions.push(`【诊断概要】\n${aiData.diagnosis_suggestion}`);
          }
          
          // 添加药物治疗建议
          if (aiData.drug_therapy && aiData.drug_therapy.length > 0) {
              const drugList = aiData.drug_therapy.map((item, index) => `${index + 1}. ${item}`).join('\n');
              suggestions.push(`【药物治疗建议】\n${drugList}`);
          }
          
          // 添加检查建议
          if (aiData.checkups && aiData.checkups.length > 0) {
              const checkupList = aiData.checkups.map((item, index) => `${index + 1}. ${item}`).join('\n');
              suggestions.push(`【检查建议】\n${checkupList}`);
          }
          
          // 添加生活方式建议
          if (aiData.lifestyle && aiData.lifestyle.length > 0) {
              const lifestyleList = aiData.lifestyle.map((item, index) => `${index + 1}. ${item}`).join('\n');
              suggestions.push(`【生活方式建议】\n${lifestyleList}`);
          }
          
          // 如果没有提取到结构化内容，可以尝试使用原始响应
          if (suggestions.length === 0 && aiData.raw_response) {
              suggestions.push(aiData.raw_response);
          } else if (suggestions.length === 0 && aiData.response) {
              suggestions.push(aiData.response);
          }
          
          // 确保有建议内容
          if (suggestions.length === 0) {
              suggestions.push("暂无AI诊断建议");
          }
          
          // 直接将所有建议添加到诊断意见中
          const currentDiagnosis = this.localDiagnosis.trim();
          const separator = currentDiagnosis ? '\n\n' : '';
          this.localDiagnosis = currentDiagnosis + separator + suggestions.join('\n\n');
          
          // 更新父组件
          this.emitAdviceUpdate();
          
          // 显示成功消息
          this.$message.success("AI辅助诊疗建议已添加到诊断意见中");
          
      } catch (err) {
           console.error("Error fetching AI suggestions:", err);
           this.$message.error("获取AI建议失败: " + (err.response?.data?.error || err.message || '请检查网络连接'));
      } finally {
           this.loadingAISuggestions = false;
      }
    },
    applySuggestion(suggestion) {
       if (suggestion.includes("失败") || suggestion.includes("出错") || suggestion.includes("无法生成") || suggestion.includes("暂无")) {
           this.$message.info("此条信息无法直接应用为诊断。");
           this.showAiSuggestionsPopover = false;
           return;
       }
       
       // 获取当前诊断文本
       const currentDiagnosis = this.localDiagnosis.trim();
       const separator = currentDiagnosis ? '\n\n' : '';
       
       // 将建议添加到诊断文本
       this.localDiagnosis = currentDiagnosis + separator + suggestion;

       this.showAiSuggestionsPopover = false;
       this.emitAdviceUpdate();
    },
    handleTemplateChange(templateId) {
        this.selectedTemplateId = templateId;
        if (!templateId) {
            return;
        }
        const template = this.adviceTemplates.find(t => t.id === templateId);
        if (template) {
             this.applyTemplate(template);
        } else {
             console.warn(`Template with ID ${templateId} not found in local list.`);
             this.$message.warning("选择的模板未找到。");
        }
    },
    applyTemplate(template) {
      console.log("Applying template:", template.name, template);

      if (!template.content_raw) {
          this.$message.error(`模板 "${template.name}" 内容为空或无效。`);
          return;
      }

      try {
          let parsedContent;
          
          // 确保content_raw是字符串并尝试解析
          if (typeof template.content_raw === 'string') {
              try {
                  parsedContent = JSON.parse(template.content_raw);
              } catch (parseError) {
                  console.error(`Failed to parse template content for "${template.name}":`, parseError);
                  console.log("Invalid content_raw:", template.content_raw);
                  this.$message.error(`模板 "${template.name}" 内容格式无效，无法应用。`);
                  return;
              }
          } else if (typeof template.content_raw === 'object') {
              // 如果content_raw已经是对象，直接使用
              parsedContent = template.content_raw;
          } else {
              this.$message.error(`模板 "${template.name}" 内容格式错误。`);
              return;
          }

          if (typeof parsedContent !== 'object' || parsedContent === null) {
              this.$message.error(`模板 "${template.name}" 内容必须是有效的 JSON 对象。`);
              return;
          }
          
          console.log("解析后的模板内容:", parsedContent);
          
          // 将模板内容标准化为所需的结构
          const structuredAdviceArray = [];
          
          // 处理诊断内容
          let diagnosisText = "";
          
          // 如果有diagnosis字段，直接使用
          if (parsedContent.diagnosis) {
              diagnosisText = parsedContent.diagnosis;
          } 
          // 处理各种不同类型的模板内容
          else if (parsedContent.lifestyle && Array.isArray(parsedContent.lifestyle)) {
              diagnosisText = `生活方式建议：\n${parsedContent.lifestyle.map((item, index) => `${index + 1}. ${item}`).join('\n')}`;
          }
          else if (parsedContent.medications && Array.isArray(parsedContent.medications)) {
              diagnosisText = `药物治疗建议：\n${parsedContent.medications.map((item, index) => 
                  `${index + 1}. ${item.name} ${item.dosage || ''} ${item.frequency || ''} ${item.duration || ''}`
              ).join('\n')}`;
          }
          else if (parsedContent.checkups && Array.isArray(parsedContent.checkups)) {
              diagnosisText = `检查建议：\n${parsedContent.checkups.map((item, index) => `${index + 1}. ${item}`).join('\n')}`;
          }
          else if (parsedContent.follow_up) {
              diagnosisText = `随访建议：\n${parsedContent.follow_up}`;
          }
          else if (parsedContent.surgery_notes) {
              diagnosisText = `手术相关：\n${parsedContent.surgery_notes}`;
          }
          // 否则，根据模板类型生成一个简单的诊断内容
          else if (template.category) {
              diagnosisText = `${template.name} (${template.category})`;
          } else {
              diagnosisText = `应用模板: ${template.name}`;
          }
          
          // 处理结构化建议
          // 1. 如果有structured字段且是数组，直接使用
          if (Array.isArray(parsedContent.structured) && parsedContent.structured.length > 0) {
              parsedContent.structured.forEach(category => {
                  structuredAdviceArray.push(category);
              });
          } 
          // 2. 处理lifestyle数组
          else if (Array.isArray(parsedContent.lifestyle) && parsedContent.lifestyle.length > 0) {
              structuredAdviceArray.push({
                  name: "生活方式建议",
                  items: parsedContent.lifestyle.map(item => ({
                      content: item,
                      frequency: "",
                      duration: "长期"
                  }))
              });
          }
          // 3. 处理medications数组
          else if (Array.isArray(parsedContent.medications) && parsedContent.medications.length > 0) {
              structuredAdviceArray.push({
                  name: "药物治疗",
                  items: parsedContent.medications.map(med => ({
                      content: med.name,
                      frequency: med.frequency || "",
                      duration: med.duration || "",
                      dosage: med.dosage || ""
                  }))
              });
          }
          // 4. 处理checkups数组
          else if (Array.isArray(parsedContent.checkups) && parsedContent.checkups.length > 0) {
              structuredAdviceArray.push({
                  name: "检查建议",
                  items: parsedContent.checkups.map(item => ({
                      content: item,
                      frequency: "一次",
                      duration: ""
                  }))
              });
          }
          // 5. 处理follow_up字段
          else if (parsedContent.follow_up) {
              structuredAdviceArray.push({
                  name: "复诊与随访",
                  items: [{
                      content: parsedContent.follow_up,
                      frequency: "一次",
                      duration: ""
                  }]
              });
          }
          // 6. 处理surgery_notes字段
          else if (parsedContent.surgery_notes) {
              structuredAdviceArray.push({
                  name: "手术相关",
                  items: [{
                      content: parsedContent.surgery_notes,
                      frequency: "",
                      duration: ""
                  }]
              });
          }
          
          console.log("转换后的结构化医嘱:", structuredAdviceArray);
          
          // 将内容添加到现有诊断内容中，而不是覆盖
          const currentDiagnosis = this.localDiagnosis.trim();
          const separator = currentDiagnosis ? '\n\n' : '';
          // this.localDiagnosis = currentDiagnosis + separator + diagnosisText;
          
          // 合并结构化建议
          if (structuredAdviceArray.length > 0) {
              this.localStructuredAdvice = this.mergeStructuredAdvice(
                  this.localStructuredAdvice, 
                  structuredAdviceArray
              );
          }
          
          this.$message.success(`已成功应用模板 "${template.name}"`);
          this.emitAdviceUpdate();

          // 添加模板内容显示区域
          this.showTemplateContent = true;
          this.appliedTemplate = template;
          this.formattedTemplateContent = JSON.stringify(parsedContent, null, 2);
      } catch (e) {
          console.error(`Error applying template "${template.name}":`, e);
          this.$message.error(`应用模板时发生错误: ${e.message}`);
      }
  },
    // 合并现有的结构化建议和模板中的结构化建议
    mergeStructuredAdvice(currentAdvice, templateAdvice) {
        const result = cloneDeep(currentAdvice);
        // 为每个模板分类查找对应的现有分类
        templateAdvice.forEach(templateCategory => {
            // 查找当前建议中是否有相同名称的分类
            const existingCategoryIndex = result.findIndex(
                cat => cat.name.toLowerCase() === templateCategory.name.toLowerCase()
            );
            
            if (existingCategoryIndex !== -1) {
                // 如果分类已存在，将模板中的项目添加到该分类
                const existingItems = result[existingCategoryIndex].items;
                const templateItems = templateCategory.items || [];
                
                // 添加新项目，避免重复
                templateItems.forEach(templateItem => {
                    // 检查是否已存在相同的内容
                    const exists = existingItems.some(
                        item => item.content === templateItem.content
                    );
                    if (!exists && templateItem.content) {
                        existingItems.push({
                            ...templateItem,
                            _temp_id: `template_${Date.now()}_${Math.random().toString(16).slice(2)}`
                        });
                    }
                });
            } else {
                // 如果分类不存在，添加新分类
                if (templateCategory.name && Array.isArray(templateCategory.items)) {
                    const newItems = templateCategory.items.filter(item => item.content).map(item => ({
                        ...item,
                        _temp_id: `template_${Date.now()}_${Math.random().toString(16).slice(2)}`
                    }));
                    
                    if (newItems.length > 0) {
                        result.push({
                            name: templateCategory.name,
                            items: newItems
                        });
                    }
                }
            }
        });
        
        return result;
    },
    addAdviceItem(catIndex) {
      const category = this.localStructuredAdvice[catIndex];
      if (category) {
        category.items.push({
           _temp_id: `new_${Date.now()}_${Math.random().toString(16).slice(2)}`,
           content: "",
           frequency: "",
           duration: ""
        });
        this.emitAdviceUpdate();
      } else {
         console.error("Cannot add advice item: Category index out of bounds.");
      }
    },
    removeAdviceItem(catIndex, itemIndex) {
      const category = this.localStructuredAdvice[catIndex];
      if (category?.items) {
        category.items.splice(itemIndex, 1);
        this.emitAdviceUpdate();
      } else {
          console.error("Cannot remove advice item: Category or item index invalid.");
      }
    },
    addCommonAdvice(adviceText) {
       const targetCategoryIndex = this.localStructuredAdvice.findIndex(
           cat => cat.name === LIFESTYLE_CATEGORY_NAME
       );

       const targetIndex = targetCategoryIndex !== -1 ? targetCategoryIndex : this.localStructuredAdvice.length - 1;

       if (targetIndex >= 0 && this.localStructuredAdvice[targetIndex]) {
            const targetCategory = this.localStructuredAdvice[targetIndex];
            const exists = targetCategory.items.some(item => item.content.trim() === adviceText.trim());
            if (!exists) {
                targetCategory.items.push({
                    _temp_id: `common_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                    content: adviceText,
                    frequency: "",
                    duration: "长期"
                });
                this.emitAdviceUpdate();
                this.$message.success(`"${adviceText}" 已添加至 "${targetCategory.name}"`);
            } else {
                 this.$message.info(`"${adviceText}" 已存在于 "${targetCategory.name}" 中`);
            }
       } else {
            console.error("Cannot add common advice: Target category not found or invalid.");
            this.$message.error("无法添加常用医嘱，目标分类不存在。");
       }
    },
    emitAdviceUpdate() {
         this.$nextTick(() => {
             this.$emit('update:advice', {
                 diagnosis: this.localDiagnosis.trim(), // Trim diagnosis here
                 structuredAdvice: cloneDeep(this.localStructuredAdvice)
             });
         });
    },
    saveAdvice() {
        const adviceDataToSave = {
             diagnosis: this.localDiagnosis.trim(),
             structuredAdvice: this.localStructuredAdvice
                 .map(category => ({
                     name: category.name,
                     items: category.items.filter(item => item.content && item.content.trim() !== '')
                 }))
                 .filter(category => category.items.length > 0)
         };

         if (!adviceDataToSave.diagnosis) {
             this.$message.warning("请填写诊断意见后再保存。");
             return;
         }

        // 如果父组件需要处理保存操作，则将数据发送给父组件
        this.$emit('save-advice', adviceDataToSave);
        
        // 作为后备方案，检查是否有 caseId，如果有则直接调用后端 API
        const caseId = this.$parent?.caseId || this.$route?.params?.caseId;
        if (caseId) {
            this.$emit('saving', true); // 通知父组件开始保存
            
            axios.post(`${API_BASE_URL}/advice`, {
                case_id: caseId,
                diagnosis: adviceDataToSave.diagnosis,
                structured_advice: adviceDataToSave.structuredAdvice
            })
            .then(response => {
                this.$message.success('医嘱建议保存成功');
                this.$emit('advice-saved', response.data);
            })
            .catch(error => {
                console.error('Error saving medical advice:', error);
                this.$message.error('保存医嘱建议失败: ' + (error.response?.data?.error || error.message));
            })
            .finally(() => {
                this.$emit('saving', false); // 通知父组件保存完成
            });
        }
    },
    closeTemplateContent() {
      this.showTemplateContent = false;
      this.appliedTemplate = null;
      this.formattedTemplateContent = '';
    },
  }
}
</script>

<style scoped>
.medical-advice-form {
  margin-top: 25px;
  background: rgba(13, 28, 64, 0.5);
  border-radius: 8px;
  padding: 25px;
  border: 1px solid rgba(57, 175, 253, 0.35);
  box-shadow: 0 4px 15px rgba(57, 175, 253, 0.1);
}
.advice-container { display: flex; flex-direction: column; gap: 30px; }
.advice-section {
   background: rgba(16, 32, 67, 0.4);
   border-radius: 6px;
   padding: 20px;
   position: relative;
   border: 1px solid rgba(57, 175, 253, 0.2);
}
.section-title {
    color: #8DD1FE;
    margin: -20px -20px 20px -20px;
    padding: 12px 20px;
    font-size: 17px;
    font-weight: 600;
    border-bottom: 1px solid rgba(57, 175, 253, 0.2);
    background: rgba(16, 32, 67, 0.5);
    border-radius: 6px 6px 0 0;
    display: flex;
    align-items: center;
}
.section-title i {
     margin-right: 8px;
     color: #4dbfff;
     font-size: 18px; /* Make icon slightly larger */
 }

.section-title .section-subtitle {
    font-size: 13px;
    font-weight: normal;
    color: rgba(141, 209, 254, 0.7);
    margin-left: 8px;
}

/* Diagnosis Input */
.diagnosis-container {
  width: 100%;
  margin-bottom: 15px;
}

.diagnosis-input {
  width: 100%;
}

:deep(.diagnosis-input .el-textarea__inner) {
  background: rgba(10, 26, 56, 0.7);
  border: 1px solid rgba(57, 175, 253, 0.4);
  color: #cce5ff;
  min-height: 160px;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
  line-height: 1.5;
  font-size: 16px;
}
:deep(.diagnosis-input .el-textarea__inner:hover) { border-color: #39AFFD; }
:deep(.diagnosis-input .el-textarea__inner:focus) {
    border-color: #4dbfff;
    box-shadow: 0 0 8px rgba(57, 175, 253, 0.4), inset 0 1px 3px rgba(0,0,0,0.2);
    background: rgba(10, 26, 56, 0.8);
}
:deep(.diagnosis-input .el-textarea__inner::placeholder) { color: rgba(141, 209, 254, 0.6); }

/* AI Assistant */
.ai-assistant { 
  margin-top: 30px;
  margin-bottom: 20px;
}

.ai-assistant-btn {
  background: linear-gradient(135deg, rgba(57, 175, 253, 0.2), rgba(57, 175, 253, 0.4));
  border: 1px solid rgba(57, 175, 253, 0.5);
  color: #8DD1FE;
  transition: all 0.3s ease;
  padding: 8px 20px;
  font-size: 14px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.ai-assistant-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(57, 175, 253, 0), rgba(57, 175, 253, 0.3));
  opacity: 0;
  transition: opacity 0.3s;
}

.ai-assistant-btn:hover:not(:disabled)::before, 
.ai-assistant-btn:focus:not(:disabled)::before {
  opacity: 1;
}

.ai-assistant-btn:hover:not(:disabled), .ai-assistant-btn:focus:not(:disabled) {
  background: linear-gradient(135deg, rgba(57, 175, 253, 0.4), rgba(57, 175, 253, 0.6));
  border-color: #39AFFD;
  color: #fff;
  outline: none;
  box-shadow: 0 3px 8px rgba(57, 175, 253, 0.25);
  transform: translateY(-1px);
}

.ai-assistant-btn i {
  margin-right: 8px;
  font-size: 16px;
  vertical-align: middle;
  animation: glow 2s infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0 0 2px rgba(57, 175, 253, 0.5);
  }
  to {
    text-shadow: 0 0 6px rgba(141, 209, 254, 0.8);
  }
}

/* AI Suggestions Popover Styling (Must be global or use :deep()) */
/* If using :deep(), apply it to the popover class */
:deep(.ai-suggestions-popover) {
  background: rgba(13, 28, 64, 0.98) !important;
  border: 1px solid rgba(57, 175, 253, 0.5) !important;
  border-radius: 6px !important;
  padding: 0 !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4) !important;
  min-width: 280px !important;
  max-width: 500px !important;
  z-index: 9999 !important;
  backdrop-filter: blur(5px) !important;
}

/* 样式箭头 */
:deep(.ai-suggestions-popover.el-popper[x-placement^=bottom] .popper__arrow) {
  border-bottom-color: rgba(57, 175, 253, 0.5) !important;
  filter: drop-shadow(0 -1px 2px rgba(0, 0, 0, 0.2)) !important;
}

:deep(.ai-suggestions-popover.el-popper[x-placement^=bottom] .popper__arrow::after) {
  border-bottom-color: rgba(16, 32, 67, 0.98) !important;
}

.suggestions-content {
  max-height: 300px !important;
  overflow-y: auto !important;
  color: #cce5ff !important;
  border-radius: 6px !important;
}

.suggestions-header {
  padding: 12px 15px !important;
  background: rgba(57, 175, 253, 0.15) !important;
  border-bottom: 1px solid rgba(57, 175, 253, 0.25) !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 1 !important;
}

.suggestions-header h4 {
  margin: 0 !important;
  color: #8DD1FE !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

.suggestions-tip {
  font-size: 12px !important;
  color: rgba(141, 209, 254, 0.7) !important;
  font-style: italic !important;
}

.suggestion-item {
  padding: 10px 15px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  border-bottom: 1px solid rgba(57, 175, 253, 0.1) !important;
  position: relative !important;
  overflow: hidden !important;
}

.suggestion-item:last-child {
  border-bottom: none !important;
}

.suggestion-item::before {
  content: '' !important;
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  height: 100% !important;
  width: 0 !important;
  background: linear-gradient(to right, rgba(57, 175, 253, 0.3), transparent) !important;
  transition: width 0.3s ease !important;
}

.suggestion-item:hover,
.suggestion-item:focus {
  background: rgba(57, 175, 253, 0.15) !important;
  color: #fff !important;
  outline: none !important;
}

.suggestion-item:hover::before,
.suggestion-item:focus::before {
  width: 5px !important;
}

.suggestion-item:active {
  background: rgba(57, 175, 253, 0.25) !important;
  transform: translateY(1px) !important;
}

.no-suggestions {
  padding: 20px 15px !important;
  color: rgba(141, 209, 254, 0.7) !important;
  font-size: 14px !important;
  text-align: center !important;
  font-style: italic !important;
}

/* Template Selector */
.template-selector { display: flex; gap: 15px; margin-bottom: 25px; align-items: center; }
.template-select { flex-grow: 1; }
.manage-templates-btn { color: #8DD1FE; flex-shrink: 0; margin-left: 10px; font-size: 14px; transition: color 0.2s; }
.manage-templates-btn:hover, .manage-templates-btn:focus { color: #4dbfff; outline: none; background: transparent;}
.manage-templates-btn i { margin-right: 4px; }

:deep(.template-select .el-input__inner) {
    background: rgba(10, 26, 56, 0.7);
    border-color: rgba(57, 175, 253, 0.4);
    color: #cce5ff;
}
:deep(.template-select .el-input__inner:hover) { border-color: #39AFFD; }
:deep(.template-select .el-input.is-focus .el-input__inner) { border-color: #4dbfff; }

/* Structured Advice Categories */
.structured-advice-categories { display: flex; flex-direction: column; gap: 25px; }
.advice-category {
     padding: 15px;
     border: 1px solid rgba(57, 175, 253, 0.15);
     border-radius: 4px;
     background: rgba(10, 26, 56, 0.3);
}
.category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 10px 15px;
    border-radius: 4px;
    background: rgba(16, 32, 67, 0.6);
    border-left: 3px solid rgba(57, 175, 253, 0.7);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.category-header h4 {
    color: #8DD1FE;
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
}
.category-header h4::before {
    content: '•';
    margin-right: 8px;
    color: #4dbfff;
    font-size: 20px;
}
.add-item-btn {
    padding: 4px 12px;
    font-size: 12px;
    background: rgba(57, 175, 253, 0.15);
    border: 1px solid rgba(57, 175, 253, 0.4);
    color: #8DD1FE;
}
.add-item-btn:hover {
    background: rgba(57, 175, 253, 0.3);
    border-color: #39AFFD;
    color: #fff;
}
.delete-advice-btn {
  color: #ff7b7b;
  transition: all 0.2s;
}

.delete-advice-btn:hover {
  color: #ff4d4d;
  background-color: rgba(255, 77, 77, 0.1);
}

.no-items-placeholder {
    color: rgba(141, 209, 254, 0.6);
    font-size: 13px;
    text-align: center;
    padding: 15px;
    border: 1px dashed rgba(57, 175, 253, 0.25);
    border-radius: 4px;
    margin-top: 10px;
    background: rgba(10, 26, 56, 0.2);
}

/* Input/Select Styles within Advice Item */
:deep(.advice-input .el-input__inner) {
  background: rgba(10, 26, 56, 0.7);
  border: 1px solid rgba(57, 175, 253, 0.4);
  color: #cce5ff;
  height: 38px;
  border-radius: 4px;
  padding: 0 15px;
  font-size: 14px;
  letter-spacing: 0.2px;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

:deep(.advice-input .el-input__inner:hover) {
  border-color: #39AFFD;
}

:deep(.advice-input .el-input__inner:focus) {
  border-color: #4dbfff;
  box-shadow: 0 0 8px rgba(57, 175, 253, 0.3), inset 0 1px 3px rgba(0, 0, 0, 0.2);
  background: rgba(10, 26, 56, 0.8);
}

:deep(.advice-input .el-input__inner::placeholder) {
  color: rgba(141, 209, 254, 0.6);
  font-style: italic;
}

/* 频次和疗程选择框样式 */
:deep(.frequency-select .el-input__inner),
:deep(.duration-select .el-input__inner) {
  background: rgba(10, 26, 56, 0.7);
  border: 1px solid rgba(57, 175, 253, 0.4);
  color: #cce5ff;
  height: 38px;
  border-radius: 4px;
  padding: 0 30px 0 15px; /* 右侧留出更多空间给下拉箭头 */
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

:deep(.frequency-select .el-input__inner:hover),
:deep(.duration-select .el-input__inner:hover) {
  border-color: #39AFFD;
}

:deep(.frequency-select .el-input.is-focus .el-input__inner),
:deep(.duration-select .el-input.is-focus .el-input__inner) {
  border-color: #4dbfff;
  box-shadow: 0 0 8px rgba(57, 175, 253, 0.3), inset 0 1px 3px rgba(0, 0, 0, 0.2);
  background: rgba(10, 26, 56, 0.8);
}

/* 美化下拉箭头 */
:deep(.el-select .el-input__suffix) {
  right: 8px;
}

:deep(.el-select .el-input__suffix .el-input__icon) {
  color: rgba(141, 209, 254, 0.8);
  transition: transform 0.3s ease;
}

:deep(.el-select:hover .el-input__suffix .el-input__icon) {
  color: #8DD1FE;
}

:deep(.el-select .el-input.is-focus .el-input__suffix .el-input__icon) {
  transform: rotate(180deg);
  color: #8DD1FE;
}

/* Common Advice Library */
.common-advice-library {
  margin-top: 30px;
  background: rgba(10, 26, 56, 0.4);
  border-radius: 6px;
  padding: 15px;
  border: 1px solid rgba(57, 175, 253, 0.2);
}

.common-advice-library h4 {
  color: #8DD1FE;
  margin: 0 0 15px 0;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  border-bottom: 1px solid rgba(57, 175, 253, 0.2);
  padding-bottom: 10px;
}

.common-advice-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 5px;
}

.advice-tag {
  background: rgba(16, 32, 67, 0.5);
  border: 1px solid rgba(57, 175, 253, 0.3);
  color: #a9d1f7;
  transition: all 0.3s ease;
  cursor: pointer;
  font-size: 13px;
  padding: 4px 12px;
  height: auto;
  line-height: 1.5;
  border-radius: 15px;
  position: relative;
  overflow: hidden;
}

.advice-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(57, 175, 253, 0), rgba(57, 175, 253, 0.3));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.advice-tag:hover,
.advice-tag:focus {
  background: rgba(57, 175, 253, 0.2);
  border-color: #4dbfff;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(57, 175, 253, 0.3);
  outline: none;
}

.advice-tag:hover::before,
.advice-tag:focus::before {
  opacity: 1;
}

.advice-tag:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(57, 175, 253, 0.2);
}

.no-common-advice {
  font-size: 13px;
  color: rgba(141, 209, 254, 0.6);
  font-style: italic;
  text-align: center;
  padding: 10px;
  background: rgba(10, 26, 56, 0.3);
  border-radius: 4px;
  border: 1px dashed rgba(57, 175, 253, 0.2);
}

/* Action Buttons */
.action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 30px;
    border-top: 1px solid rgba(57, 175, 253, 0.2);
    padding-top: 20px;
}
.save-btn, .print-btn {
    padding: 9px 25px;
    font-size: 14px;
    border-radius: 4px;
    box-shadow: 0 3px 8px rgba(0,0,0, 0.2);
    transition: all 0.3s ease;
}
.save-btn {
    background: linear-gradient(135deg, #3077b1, #39affd);
    border: none;
    color: white;
}
 .save-btn:hover:not(:disabled), .save-btn:focus:not(:disabled) {
     background: linear-gradient(135deg, #39affd, #3077b1);
     box-shadow: 0 5px 12px rgba(57, 175, 253, 0.3);
     outline: none;
 }
.print-btn {
    background: rgba(108, 117, 125, 0.7); /* Secondary button color */
    color: #e0e0e0;
    border: 1px solid rgba(108, 117, 125, 0.5);
}
 .print-btn:hover:not(:disabled), .print-btn:focus:not(:disabled) {
     background: rgba(108, 117, 125, 0.9);
     border-color: rgba(108, 117, 125, 0.8);
     color: #fff;
     outline: none;
 }
 .save-btn:disabled, .print-btn:disabled {
     opacity: 0.6;
     cursor: not-allowed;
 }
.save-btn i, .print-btn i { margin-right: 6px; }

/* Responsive adjustments */
@media (max-width: 768px) {
    .diagnosis-container {
        flex-direction: column;
        gap: 10px;
    }
    
    .diagnosis-input {
        width: 100%;
    }
    
    .ai-assistant {
        width: 100%;
        margin-top: 10px;
    }
    
    .ai-assistant-btn {
        width: 100%;
        display: block;
        margin: 0 auto;
        font-size: 13px;
    }
    
    .advice-selects-wrapper {
        flex-direction: column;
        gap: 8px;
    }
    
    .frequency-select,
    .duration-select {
        width: 100%;
    }
    
    .action-buttons {
        justify-content: center;
        flex-direction: column;
        gap: 10px;
    }
    
    .save-btn, .print-btn {
        width: 100%;
    }
}

/* Template Content Section */
.advice-section.template-content-section {
  background: rgba(16, 32, 67, 0.4);
  border-radius: 6px;
  padding: 20px;
  position: relative;
  border: 1px solid rgba(57, 175, 253, 0.2);
}
.template-content-container {
  padding: 20px;
  background: rgba(10, 26, 56, 0.3);
  border-radius: 4px;
  position: relative;
}
.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(57, 175, 253, 0.1);
}
.template-name {
  color: #8DD1FE;
  font-size: 15px;
  font-weight: 600;
}
.template-category {
  color: #8492a6;
  font-size: 13px;
}
.close-template-btn {
  color: #8DD1FE;
  background: transparent;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  outline: inherit;
}
.template-content {
  padding: 10px;
  background: rgba(10, 26, 56, 0.7);
  border-radius: 4px;
  position: relative;
}

.ai-assistant-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(57, 175, 253, 0.1);
}

.advice-items { display: flex; flex-direction: column; gap: 15px; }
.advice-item { 
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
  background: rgba(10, 26, 56, 0.3);
  border-radius: 6px;
  padding: 12px;
  border: 1px solid rgba(57, 175, 253, 0.15);
}

.advice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  background: rgba(16, 32, 67, 0.6);
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid rgba(57, 175, 253, 0.8);
}

.advice-title {
  font-weight: 600;
  color: #8DD1FE;
  font-size: 14px;
}

.advice-input-wrapper {
  width: 100%;
  position: relative;
}

.advice-selects-wrapper {
  display: flex;
  gap: 10px;
  width: 100%;
}

.advice-input {
  width: 100%;
}

.frequency-select,
.duration-select {
  flex: 1;
  min-width: 120px;
}

/* 使用普通选择器替代deep选择器 */
.add-item-btn.el-button--default.is-plain {
    color: #8DD1FE;
    background: rgba(57, 175, 253, 0.15);
    border-color: rgba(141, 209, 254, 0.5);
}
.add-item-btn.el-button--default.is-plain:hover,
.add-item-btn.el-button--default.is-plain:focus {
     color: #fff;
     background: rgba(57, 175, 253, 0.3);
     border-color: #4dbfff;
     outline: none;
}

.delete-advice-btn-standalone {
  margin-left: 10px;
  color: #ff8f8f;
  background: rgba(255, 143, 143, 0.1);
  border: 1px solid rgba(255, 143, 143, 0.4);
  padding: 5px 10px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.delete-advice-btn-standalone:hover,
.delete-advice-btn-standalone:focus {
  color: #fff;
  background: rgba(255, 77, 77, 0.8);
  border-color: #ff4d4d;
  transform: translateY(-1px);
}

/* 稳定下拉菜单样式 */
:deep(.stable-dropdown) {
  position: absolute !important;
  margin-top: 0 !important;
  background: rgba(16, 32, 67, 0.95) !important;
  border: 1px solid rgba(57, 175, 253, 0.5) !important;
  border-radius: 4px !important;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3) !important;
  max-height: 300px !important;
  overflow-y: auto !important;
  z-index: 9999 !important;
  transform-origin: center top !important;
  transition: transform 0.2s ease-out !important;
}

:deep(.stable-dropdown .el-select-dropdown__item) {
  color: #cce5ff !important;
  padding: 0 15px !important;
  height: 34px !important;
  line-height: 34px !important;
  position: relative !important;
  z-index: 1 !important;
}

:deep(.stable-dropdown .el-select-dropdown__item.hover), 
:deep(.stable-dropdown .el-select-dropdown__item:hover) {
  background-color: rgba(57, 175, 253, 0.2) !important;
  z-index: 2 !important;
}

:deep(.stable-dropdown .el-select-dropdown__item.selected) {
  color: #fff !important;
  background-color: rgba(57, 175, 253, 0.4) !important;
  font-weight: bold !important;
  z-index: 2 !important;
}

:deep(.stable-dropdown .popper__arrow) {
  border-bottom-color: rgba(57, 175, 253, 0.5) !important;
  border-top-color: rgba(57, 175, 253, 0.5) !important;
  z-index: 3 !important;
}

:deep(.stable-dropdown .popper__arrow::after) {
  border-bottom-color: rgba(16, 32, 67, 0.95) !important;
  border-top-color: rgba(16, 32, 67, 0.95) !important;
}

/* 优化下拉菜单的滚动条 */
:deep(.stable-dropdown::-webkit-scrollbar) {
  width: 6px !important;
  height: 6px !important;
}

:deep(.stable-dropdown::-webkit-scrollbar-track) {
  background: rgba(10, 26, 56, 0.5) !important;
  border-radius: 3px !important;
}

:deep(.stable-dropdown::-webkit-scrollbar-thumb) {
  background: rgba(57, 175, 253, 0.5) !important;
  border-radius: 3px !important;
}

:deep(.stable-dropdown::-webkit-scrollbar-thumb:hover) {
  background: rgba(57, 175, 253, 0.8) !important;
}

/* 添加下拉菜单的过渡动画 */
:deep(.el-zoom-in-top-enter-active),
:deep(.el-zoom-in-top-leave-active) {
  opacity: 1;
  transform: scaleY(1);
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}

:deep(.el-zoom-in-top-enter),
:deep(.el-zoom-in-top-leave-to) {
  opacity: 0;
  transform: scaleY(0);
}

:deep(.el-zoom-out-top-enter-active),
:deep(.el-zoom-out-top-leave-active) {
  opacity: 1;
  transform: scaleY(1);
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}

:deep(.el-zoom-out-top-enter),
:deep(.el-zoom-out-top-leave-to) {
  opacity: 0;
  transform: scaleY(0);
}
</style>