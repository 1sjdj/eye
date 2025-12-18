<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="75%"
    :close-on-click-modal="false"
    @close="handleCloseDialog"
    class="template-manager-dialog optimized-dialog"
    append-to-body
  >
    <!-- Toolbar: Search and Add Button -->
    <div class="manager-toolbar">
      <el-input
        v-model.trim="searchText"
        :placeholder="searchPlaceholder"
        clearable
        @clear="handleSearchClear"
        @keyup.enter.native="fetchTemplates"
        class="search-input"
        prefix-icon="el-icon-search"
        :aria-label="searchPlaceholder"
      >
      </el-input>
      <el-button type="primary" icon="el-icon-plus" @click="handleAddTemplate" :aria-label="addButtonLabel">
        {{ addButtonLabel }}
      </el-button>
    </div>

    <!-- Template Table -->
    <el-table
      :data="filteredTemplates"
      v-loading="loading"
      style="width: 100%; margin-bottom: 20px;"
      height="450px"
      border
      stripe
      highlight-current-row
      :empty-text="emptyText"
      @row-dblclick="handleEditTemplate"
      v-virtual-scroll
    >
      <el-table-column prop="name" :label="templateNameLabel" width="220" sortable show-overflow-tooltip></el-table-column>
      <el-table-column prop="category" :label="templateCategoryLabel" width="150" sortable show-overflow-tooltip>
         <template slot-scope="scope">
             {{ scope.row.category || '未分类' }}
         </template>
      </el-table-column>
      <el-table-column :label="contentPreviewLabel" show-overflow-tooltip>
         <template slot-scope="scope">
            <span class="content-preview" :title="generateContentPreview(scope.row.content_raw, true)">
                {{ generateContentPreview(scope.row.content_raw) }}
            </span>
         </template>
      </el-table-column>
      <el-table-column :label="updatedAtLabel" width="160" sortable prop="updatedAt">
          <template slot-scope="scope">
              {{ formatDateTime(scope.row.updatedAt) }}
          </template>
      </el-table-column>
      <el-table-column :label="operationLabel" width="240" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="info" plain icon="el-icon-view" @click="viewTemplateContent(scope.row)" :aria-label="viewButtonLabel">
            {{ viewButtonLabel }}
          </el-button>
          <el-button size="mini" type="primary" plain icon="el-icon-edit" @click="handleEditTemplate(scope.row)" :aria-label="editButtonLabel">
            {{ editButtonLabel }}
          </el-button>
          <el-popconfirm
            confirm-button-text='确定删除'
            cancel-button-text='取消'
            icon="el-icon-warning"
            icon-color="#f56c6c"
            :title="deleteConfirmTitle"
            @confirm="handleDeleteTemplate(scope.row.id)"
            style="margin-left: 10px;"
          >
            <el-button
              slot="reference"
              size="mini"
              type="danger"
              plain
              icon="el-icon-delete"
              :loading="deletingId === scope.row.id"
              :disabled="deletingId !== null && deletingId !== scope.row.id"
              :aria-label="deleteButtonLabel"
             >
              {{ deleteButtonLabel }}
            </el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add/Edit Template Form Dialog (Nested) -->
    <el-dialog
      :title="formDialogTitle"
      :visible.sync="formDialogVisible"
      width="650px"
      :close-on-click-modal="false"
      append-to-body
      @close="resetForm"
      custom-class="optimized-dialog inner-dialog"
      top="10vh"
    >
      <el-form :model="templateForm" :rules="formRules" ref="templateFormRef" label-width="100px" class="template-form">
        <el-form-item :label="formNameLabel" prop="name">
          <el-input v-model.trim="templateForm.name" :placeholder="formNamePlaceholder" maxlength="100" :aria-label="formNameLabel"></el-input>
        </el-form-item>
        <el-form-item :label="formCategoryLabel" prop="category">
           <el-select
               v-model.trim="templateForm.category"
               :placeholder="formCategoryPlaceholder"
               filterable
               allow-create
               default-first-option
               clearable
               style="width: 100%;"
               :aria-label="formCategoryLabel"
             >
               <el-option v-for="cat in uniqueCategories" :key="cat" :label="cat" :value="cat"></el-option>
             </el-select>
        </el-form-item>
        <el-form-item :label="formContentLabel" prop="content_raw">
          <el-input
            type="textarea"
            :rows="12"
            v-model.trim="templateForm.content_raw"
            :placeholder="formContentPlaceholder"
            @input="validateJsonContentRealtime"
            :aria-label="formContentLabel"
          ></el-input>
           <div v-if="jsonError" class="json-error-tip">
             <i class="el-icon-warning"></i> {{ jsonError }}
            </div>
           <div v-else-if="templateForm.content_raw && !jsonError" class="json-valid-tip">
             <i class="el-icon-success"></i> JSON 格式有效
            </div>
           <div class="json-structure-tip">
             <i class="el-icon-info"></i> {{ jsonStructureTip }}
            </div>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="formDialogVisible = false">{{ formCancelButtonLabel }}</el-button>
        <el-button
           type="primary"
           @click="submitTemplateForm"
           :loading="savingTemplate"
           :disabled="savingTemplate || (!!jsonError && templateForm.content_raw !== '')"
           :aria-label="formSubmitButtonLabel"
        >
          {{ formSubmitButtonLabel }}
        </el-button>
      </div>
    </el-dialog>

    <!-- 模板编辑对话框 -->
    <el-dialog
      title="编辑模板内容"
      :visible.sync="editDialogVisible"
      width="60%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :before-close="() => !isSaving && (editDialogVisible = false)">
      <div class="template-edit-container">
        <p class="template-name">模板名称: <strong>{{ templateToEdit.name }}</strong></p>
        <p class="template-info">分类: {{ templateToEdit.category || '未分类' }}</p>
        
        <div class="json-editor-container">
          <p class="editor-title">模板内容 (JSON格式):</p>
          <el-input
            type="textarea"
            v-model="contentToEdit"
            :rows="15"
            placeholder="请输入有效的JSON格式内容"
            :disabled="isSaving"
            class="json-editor"
            spellcheck="false"
          ></el-input>
          <p class="editor-help">
            标准格式包含两个主要字段:<br>
            <code>"diagnosis"</code>: 诊断内容文本<br>
            <code>"structured"</code>: 结构化建议数组
          </p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false" :disabled="isSaving">取消</el-button>
        <el-button type="primary" @click="saveTemplateEdit" :loading="isSaving">保存</el-button>
      </span>
    </el-dialog>

    <!-- Main Dialog Footer -->
    <div slot="footer">
      <el-button @click="dialogVisible = false">{{ closeButtonLabel }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import Vue from 'vue';
import axios from 'axios';
import { cloneDeep } from 'lodash-es';

// 根据当前环境确定API基础URL
const API_BASE_URL = axios.defaults.baseURL ? '' : '/api';

export default {
  name: 'TemplateManagerDialog',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const validateContentIsJson = (rule, value, callback) => {
      if (!value || !value.trim()) {
          this.jsonError = '';
          return callback(new Error('模板内容不能为空'));
      }
      try {
          const parsed = JSON.parse(value);
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
              throw new Error("内容必须是有效的 JSON 对象格式。");
          }
          this.jsonError = '';
          callback();
      } catch (e) {
           const errorMessage = `JSON 格式错误: ${e.message}`;
           this.jsonError = errorMessage;
           callback(new Error(errorMessage));
      }
    };

    return {
      loading: false,
      savingTemplate: false,
      deletingId: null,
      searchText: '',
      localTemplates: [],
      dialogVisible: this.visible,
      formDialogVisible: false,
      isEditing: false,
      templateForm: {
        name: '',
        category: '',
        content_raw: '{}'
      },
      jsonError: '',
      formRules: {
        name: [
          { required: true, message: '请输入模板名称', trigger: 'blur' },
          { min: 2, max: 100, message: '名称长度应为 2 到 100 个字符', trigger: 'blur' }
        ],
        content_raw: [
          { validator: validateContentIsJson, trigger: 'blur' }
        ],
      },
      dialogTitle: '医嘱模板管理',
      searchPlaceholder: '搜索模板名称或分类',
      addButtonLabel: '新增模板',
      templateNameLabel: '模板名称',
      templateCategoryLabel: '分类',
      contentPreviewLabel: '内容预览',
      updatedAtLabel: '更新时间',
      operationLabel: '操作',
      editButtonLabel: '编辑',
      deleteButtonLabel: '删除',
      deleteConfirmTitle: '确定删除此模板吗？此操作不可撤销。',
      formDialogTitleCreate: '新增模板',
      formDialogTitleEdit: '编辑模板',
      formNameLabel: '模板名称',
      formCategoryLabel: '模板分类',
      formContentLabel: '模板内容',
      formNamePlaceholder: '请输入模板名称 (必填)',
      formCategoryPlaceholder: '选择或输入新分类 (可选)',
      formContentPlaceholder: '请输入 JSON 格式的模板内容 (必填)。\n推荐结构: {"diagnosis":"诊断文本","structured":[{"name":"分类名","items":[{"content":"医嘱内容","frequency":"频次","duration":"疗程"}]}]}',
      formCancelButtonLabel: '取 消',
      formSubmitButtonLabelCreate: '创 建 模 板',
      formSubmitButtonLabelEdit: '保 存 更 新',
      closeButtonLabel: '关 闭',
      emptyText: '暂无模板数据',
      jsonStructureTip: '请确保内容为有效的 JSON 格式。',
      viewButtonLabel: '查看内容',
      editDialogVisible: false,
      isSaving: false,
      templateToEdit: {},
      contentToEdit: '',
    };
  },
  computed: {
    filteredTemplates() {
       if (!this.searchText) {
           return this.localTemplates;
       }
       const lowerSearchText = this.searchText.toLowerCase().trim();
       if (!lowerSearchText) return this.localTemplates;

       return this.localTemplates.filter(template =>
           (template.name && template.name.toLowerCase().includes(lowerSearchText)) ||
           (template.category && template.category.toLowerCase().includes(lowerSearchText))
       );
    },
    uniqueCategories() {
        const cats = new Set(this.localTemplates.map(t => t.category).filter(Boolean));
        return Array.from(cats).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    },
    formDialogTitle() {
        return this.isEditing ? this.formDialogTitleEdit : this.formDialogTitleCreate;
    },
    formSubmitButtonLabel() {
        return this.isEditing ? this.formSubmitButtonLabelEdit : this.formSubmitButtonLabelCreate;
    }
  },
  watch: {
    visible(newVal) {
      this.dialogVisible = newVal;
      if (newVal) {
        this.fetchTemplates();
      }
    },
    dialogVisible(newVal) {
      if (!newVal) {
        this.$emit('update:visible', false);
      }
    },
  },
  methods: {
    getInitialForm() {
      return {
        id: null,
        name: '',
        category: '',
        content_raw: '{}'
      };
    },
    handleCloseDialog() {
      this.searchText = '';
    },
    handleSearchClear() {
      this.searchText = '';
      this.fetchTemplates();
    },
    async fetchTemplates() {
      this.loading = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/templates`, { params: { search: this.searchText } });
        this.localTemplates = this.formatTemplateData(response.data || []);
        console.log("Templates fetched:", this.localTemplates.length);
      } catch (error) {
        console.error('Error fetching templates:', error);
        this.$message.error('获取模板列表失败: ' + (error.response?.data?.error || error.message));
        this.localTemplates = [];
      } finally {
        this.loading = false;
      }
    },
    // 刷新模板列表方法
    refreshTemplates() {
      return this.fetchTemplates();
    },
    handleAddTemplate() {
      this.isEditing = false;
      this.templateForm = this.getInitialForm();
      this.jsonError = '';
      this.formDialogVisible = true;
      this.$nextTick(() => {
         this.$refs.templateFormRef?.clearValidate();
      });
    },
    handleEditTemplate(template) {
      this.isEditing = true;
      this.templateForm = { ...template };
      
      // 确保content_raw是字符串形式
      if (typeof this.templateForm.content_raw === 'string') {
        try {
          // 尝试解析为对象，以便于编辑器显示格式化的内容
          const parsedContent = JSON.parse(this.templateForm.content_raw);
          this.templateForm.content_raw = JSON.stringify(parsedContent, null, 2);
        } catch (e) {
          console.warn("无法解析模板内容为JSON:", e);
          // 保持原样
        }
      } else if (typeof this.templateForm.content_raw === 'object') {
        // 如果已经是对象，格式化为字符串
        this.templateForm.content_raw = JSON.stringify(this.templateForm.content_raw, null, 2);
      }
      
      this.jsonError = '';
      this.formDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.templateFormRef?.clearValidate();
      });
    },
    async handleDeleteTemplate(id) {
        if (!id || this.deletingId !== null) return;
        this.deletingId = id;
        try {
            await axios.delete(`${API_BASE_URL}/templates/${id}`);
            this.$message.success('模板删除成功');
             this.$notify.success({
                 title: '操作成功',
                 message: '医嘱模板删除成功',
                 position: 'top-right'
             });
            await this.fetchTemplates();
            this.$emit('templates-updated');
        } catch (error) {
            console.error('Error deleting template:', error);
            this.$message.error('删除模板失败: ' + (error.response?.data?.error || error.message));
             this.$notify.error({
                 title: '操作失败',
                 message: '删除医嘱模板失败: ' + (error.response?.data?.error || error.message),
                 position: 'top-right'
             });
        } finally {
            this.deletingId = null;
        }
    },
    resetForm() {
      this.$refs.templateFormRef?.resetFields();
      this.templateForm = this.getInitialForm();
      this.isEditing = false;
      this.jsonError = '';
    },
    validateJsonContentRealtime() {
        if (!this.templateForm.content_raw || !this.templateForm.content_raw.trim()) {
            this.jsonError = '';
            return;
        }
        try {
            const parsed = JSON.parse(this.templateForm.content_raw);
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                 throw new Error("内容必须是有效的 JSON 对象格式。");
            }
            this.jsonError = '';
        } catch (e) {
            this.jsonError = `JSON 格式错误: ${e.message}`;
        }
    },
    submitTemplateForm() {
        this.$refs.templateFormRef.validate(async (valid) => {
             if (valid) {
                 if (this.templateForm.content_raw && this.jsonError) {
                      this.$message.warning('请修正模板内容的 JSON 格式错误后再提交。');
                      return;
                 }

                this.savingTemplate = true;
                const payload = {
                     id: this.templateForm.id,
                     name: this.templateForm.name.trim(),
                     category: this.templateForm.category?.trim() || null,
                     content_raw: this.templateForm.content_raw
                };

                try {
                    let response;
                    if (this.isEditing && payload.id) {
                        response = await axios.put(`${API_BASE_URL}/templates/${payload.id}`, payload);
                        this.$message.success('模板更新成功');
                        this.$notify.success({
                             title: '操作成功',
                             message: '医嘱模板已成功更新',
                             position: 'top-right'
                         });
                    } else {
                        response = await axios.post(`${API_BASE_URL}/templates`, payload);
                        this.$message.success('模板创建成功');
                         this.$notify.success({
                             title: '操作成功',
                             message: '医嘱模板已成功创建',
                             position: 'top-right'
                         });
                    }

                    this.formDialogVisible = false;
                    await this.fetchTemplates();
                    this.$emit('templates-updated');

                } catch (error) {
                    console.error('Error saving template:', error);
                    this.$message.error('保存模板失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message));
                    this.$notify.error({
                        title: '操作失败',
                        message: '保存医嘱模板失败: ' + (error.response?.data?.error || error.response?.data?.message || error.message),
                        position: 'top-right'
                    });
                } finally {
                    this.savingTemplate = false;
                }
            } else {
                console.log('Template form validation failed');
                 const firstErrorField = Object.keys(this.formRules).find(key => {
                     let hasError = false;
                     this.$refs.templateFormRef.validateField(key, errorMessage => {
                         if (errorMessage) hasError = true;
                     });
                     return hasError;
                 });
                 this.$message.warning(firstErrorField ? '请检查表单必填项或格式错误。' : '表单验证失败，请检查输入。');
                return false;
            }
        });
    },
     generateContentPreview(contentStr, full = false) {
      if (!contentStr || !contentStr.trim()) return '无内容';
      let preview = '';
      try {
        const parsed = JSON.parse(contentStr);
        preview = `诊断: ${parsed.diagnosis || '(无)'}`;
        if (Array.isArray(parsed.structured)) {
             const sections = parsed.structured
                .map(sec => `${sec.name || '(未命名)'}(${sec.items?.length || 0}项)`)
                .join(', ');
             if (sections) {
                  preview += ` | 建议: ${sections}`;
             }
        }
      } catch (e) {
        preview = contentStr;
      }
      const maxLength = full ? 1000 : 150;
      if (preview.length > maxLength) {
         return preview.substring(0, maxLength - 3) + '...';
      }
      return preview;
    },
    formatDateTime(isoString) {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) {
                 console.warn("Invalid date string encountered:", isoString);
                 return isoString;
            }
            return date.toLocaleString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: false
            }).replace(/\//g, '-');
        } catch (e) {
             console.error("Error formatting date:", isoString, e);
             return isoString;
        }
    },
    isValidTemplate(template) {
        if (!template || !template.content_raw) {
            console.warn(`Template invalid: missing content_raw`, template);
            return false;
        }
        
        try {
            const content = typeof template.content_raw === 'string' 
                ? JSON.parse(template.content_raw) 
                : template.content_raw;
                
            return content && typeof content === 'object' && !Array.isArray(content);
        } catch (e) {
            console.warn(`Template content parsing error:`, e);
            return false;
        }
    },
    formatTemplateData(templates) {
        return templates.map(template => {
            if (typeof template.content_raw === 'string') {
                try {
                    // 尝试解析JSON字符串
                    JSON.parse(template.content_raw);
                    // 如果解析成功，保持原样
                    return template;
                } catch (e) {
                    console.warn(`Fixing invalid JSON in template "${template.name}":`, e);
                    // 如果解析失败，创建一个基本结构
                    return {
                        ...template,
                        content_raw: JSON.stringify({
                            diagnosis: template.name || '',
                            structured: []
                        })
                    };
                }
            } else if (template.content_raw && typeof template.content_raw === 'object') {
                // 对象已经是解析后的，转换为JSON字符串
                return {
                    ...template,
                    content_raw: JSON.stringify(template.content_raw)
                };
            } else {
                // 模板内容缺失，创建基本结构
                return {
                    ...template,
                    content_raw: JSON.stringify({
                        diagnosis: template.name || '',
                        structured: []
                    })
                };
            }
        });
    },
    viewTemplateContent(template) {
      try {
        console.log("Template to view:", template);
        let content = template.content_raw;
        let displayContent = '';
        let contentType = '未知';
        
        // 处理不同类型的content_raw
        if (typeof content === 'string') {
          try {
            // 尝试解析JSON字符串
            const parsedContent = JSON.parse(content);
            
            // 判断模板类型
            if (parsedContent.diagnosis || parsedContent.structured) {
              contentType = '标准格式';
            } else if (parsedContent.lifestyle) {
              contentType = '生活方式建议';
            } else if (parsedContent.medications) {
              contentType = '药物治疗';
            } else if (parsedContent.checkups) {
              contentType = '检查建议';
            } else if (parsedContent.follow_up) {
              contentType = '复诊随访';
            } else if (parsedContent.surgery_notes) {
              contentType = '手术相关';
            }
            
            displayContent = JSON.stringify(parsedContent, null, 2);
          } catch (e) {
            // 如果解析失败，直接显示原始内容
            console.warn("无法解析模板内容为JSON:", e);
            displayContent = content;
            contentType = '无效JSON格式';
          }
        } else if (typeof content === 'object') {
          // 如果已经是对象，直接格式化
          displayContent = JSON.stringify(content, null, 2);
          contentType = '对象格式';
        } else {
          displayContent = String(content);
          contentType = '文本格式';
        }
        
        // 使用Element UI的MessageBox显示内容
        this.$msgbox({
          title: `模板内容: ${template.name} (${contentType})`,
          message: `<pre style="max-height: 400px; overflow: auto; white-space: pre-wrap; word-break: break-word;">${displayContent}</pre>`,
          dangerouslyUseHTMLString: true,
          showCancelButton: false,
          confirmButtonText: '关闭'
        });
      } catch (error) {
        console.error("查看模板内容时出错:", error);
        this.$message.error(`无法显示模板内容: ${error.message}`);
      }
    },
    // 辅助方法：转义HTML特殊字符，防止XSS攻击
    escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    },
    async saveTemplateEdit() {
      this.isSaving = true;
      try {
        // 验证JSON格式
        let contentObj = null;
        try {
          contentObj = JSON.parse(this.contentToEdit);
        } catch (e) {
          this.$message.error('JSON格式无效，请检查格式');
          console.error('Invalid JSON content:', e);
          this.isSaving = false;
          return;
        }
        
        // 识别模板类型并保持原始格式
        const templateFormat = this.identifyTemplateFormat(contentObj);
        console.log(`Template format identified: ${templateFormat}`);
        
        // 更新模板
        const updatedTemplate = {
          ...this.templateToEdit,
          content_raw: JSON.stringify(contentObj)
        };
        
        const response = await axios.put(`${API_BASE_URL}/templates/${this.templateToEdit.id}`, updatedTemplate);
        this.$message.success('模板更新成功');
        this.editDialogVisible = false;
        this.fetchTemplates();
      } catch (error) {
        console.error('Error saving template:', error);
        this.$message.error(`保存失败: ${error.response?.data?.error || error.message || '未知错误'}`);
      } finally {
        this.isSaving = false;
      }
    },
    
    // 识别模板内容的格式类型
    identifyTemplateFormat(content) {
      if (!content || typeof content !== 'object') {
        return 'unknown';
      }
      
      if (content.diagnosis !== undefined || Array.isArray(content.structured)) {
        return 'standard';
      }
      
      if (Array.isArray(content.lifestyle)) {
        return 'lifestyle';
      }
      
      if (Array.isArray(content.medications)) {
        return 'medications';
      }
      
      if (Array.isArray(content.checkups)) {
        return 'checkups';
      }
      
      if (content.follow_up) {
        return 'follow_up';
      }
      
      if (content.surgery_notes) {
        return 'surgery_notes';
      }
      
      return 'unknown';
    },
  },
};
</script>
<style scoped>
/* --- General Dialog Styles (Apply Theme) --- */
/* Style the main dialog container */
.template-manager-dialog :deep(.el-dialog) {
    /* Match background/border from Classification.vue */
    background: linear-gradient(145deg, rgba(10, 26, 56, 0.97), rgba(15, 35, 70, 0.97));
    border-radius: 12px;
    border: 1px solid rgba(57, 175, 253, 0.5);
    box-shadow: 0 8px 40px rgba(57, 175, 253, 0.25);
}
.template-manager-dialog :deep(.el-dialog__header) {
     background-color: rgba(16, 32, 67, 0.3);
     border-bottom: 1px solid rgba(57, 175, 253, 0.3);
     padding: 18px 25px;
}
.template-manager-dialog :deep(.el-dialog__title) {
    color: #a9d1f7;
    font-size: 18px;
    font-weight: 600;
}
.template-manager-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: #a9d1f7;
    font-size: 18px;
}
.template-manager-dialog :deep(.el-dialog__headerbtn .el-dialog__close:hover) { color: #4dbfff; }
.template-manager-dialog :deep(.el-dialog__body) {
  padding: 15px 25px 25px 25px;
  background-color: transparent; /* Inherit gradient */
  color: #cce5ff; /* Default text color */
}
.template-manager-dialog :deep(.el-dialog__footer) {
    background-color: transparent; /* Inherit gradient */
    border-top: 1px solid rgba(57, 175, 253, 0.3);
    padding: 15px 25px;
    text-align: right;
}

/* --- Toolbar --- */
.manager-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.search-input {
    width: 300px;
    margin-right: 15px;
}
/* Style search input internals */
.manager-toolbar :deep(.el-input__inner) {
     background: rgba(16, 32, 67, 0.6) !important;
     border-color: rgba(57, 175, 253, 0.45) !important;
     color: #cce5ff !important;
     box-shadow: none !important; /* Remove default shadow */
}
.manager-toolbar :deep(.el-input__inner:focus) {
    border-color: #4dbfff !important;
}
.manager-toolbar :deep(.el-input__prefix .el-input__icon) {
    color: #8DD1FE;
    line-height: 32px; /* Adjust if input height changes */
}
.manager-toolbar :deep(.el-input__suffix .el-input__icon.el-icon-circle-close) { /* Clear icon */
     color: #8DD1FE;
}

/* --- Table Styles --- */
:deep(.el-table) {
    background-color: rgba(13, 28, 64, 0.4);
    color: #cce5ff;
    border: 1px solid rgba(57, 175, 253, 0.2);
    border-radius: 4px;
}
:deep(.el-table th.el-table__cell),
:deep(.el-table tr) {
    background-color: transparent !important;
    color: inherit;
}
:deep(.el-table th.el-table__cell) {
    color: #8DD1FE;
    background-color: rgba(16, 32, 67, 0.6) !important; /* Header background */
    border-bottom: 1px solid rgba(57, 175, 253, 0.4);
    font-weight: 500;
}
:deep(.el-table td.el-table__cell) {
    border-bottom: 1px solid rgba(57, 175, 253, 0.15);
    padding: 12px 0;
    color: #cce5ff;
    line-height: 1.5;
}
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
    background-color: rgba(57, 175, 253, 0.05) !important;
}
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
    background-color: rgba(57, 175, 253, 0.15) !important;
}
:deep(.el-table__body tr.current-row > td.el-table__cell) {
     background-color: rgba(57, 175, 253, 0.25) !important;
     color: #fff;
}
/* Ensure loading mask matches theme */
:deep(.el-loading-mask) {
    background-color: rgba(13, 28, 64, 0.7);
}
:deep(.el-table__empty-block) {
    background-color: transparent;
    color: #8DD1FE;
    min-height: 150px;
}
:deep(.el-table__empty-text) {
    color: #8DD1FE;
}
:deep(.el-table::before) { height: 0; } /* Remove default bottom border line */

/* Table action buttons */
:deep(.el-table .el-button--primary.is-plain) {
     color: #4dbfff;
     background: transparent;
     border-color: rgba(77, 191, 255, 0.4);
}
:deep(.el-table .el-button--primary.is-plain:hover),
:deep(.el-table .el-button--primary.is-plain:focus) {
     color: #fff;
     background: #4dbfff;
     border-color: #4dbfff;
     outline: none;
}
:deep(.el-table .el-button--danger.is-plain) {
    color: #ff7b7b;
    background: transparent;
    border-color: rgba(255, 123, 123, 0.4);
}
:deep(.el-table .el-button--danger.is-plain:hover),
:deep(.el-table .el-button--danger.is-plain:focus) {
    color: #fff;
    background: #ff7b7b;
    border-color: #ff7b7b;
     outline: none;
}
:deep(.el-table .el-button [class*=el-icon-]+span) { /* Fix spacing with loading icon */
    margin-left: 5px;
}

.content-preview {
    font-size: 13px;
    color: #a9d1f7;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    cursor: default; /* Indicate title attribute has full content */
}

/* --- Inner Form Dialog Styles --- */
/* Use a class specific to the inner dialog for overrides */
:deep(.inner-dialog.el-dialog) {
  background: linear-gradient(145deg, rgba(10, 26, 56, 0.98), rgba(15, 35, 70, 0.98));
  border: 1px solid rgba(57, 175, 253, 0.6);
  box-shadow: 0 6px 30px rgba(57, 175, 253, 0.2);
}
:deep(.inner-dialog .el-dialog__header) {
    background-color: rgba(16, 32, 67, 0.5);
    border-bottom: 1px solid rgba(57, 175, 253, 0.4);
}
:deep(.inner-dialog .el-dialog__title) { color: #a9d1f7; }
:deep(.inner-dialog .el-dialog__headerbtn .el-dialog__close) { color: #a9d1f7; }
:deep(.inner-dialog .el-dialog__body) {
    padding: 30px 25px 15px 25px;
    background-color: transparent;
}
:deep(.inner-dialog .el-dialog__footer) {
     background-color: transparent;
     border-top: 1px solid rgba(57, 175, 253, 0.4);
}

.template-form { max-height: 65vh; overflow-y: auto; padding-right: 10px;} /* Allow form scroll */
.template-form .el-form-item { margin-bottom: 24px; }
.template-form :deep(.el-form-item__label) {
    color: #a9d1f7 !important;
    padding-right: 12px;
    line-height: 1.5; /* Improve label wrapping */
}
.template-form :deep(.el-input__inner),
.template-form :deep(.el-textarea__inner),
.template-form :deep(.el-select .el-input__inner) {
   background: rgba(16, 32, 67, 0.7) !important;
   border: 1px solid rgba(57, 175, 253, 0.55) !important;
   color: #cce5ff !important;
   box-shadow: none;
   line-height: 1.5; /* Ensure consistent line height */
}
.template-form :deep(.el-input__inner:focus),
.template-form :deep(.el-textarea__inner:focus),
.template-form :deep(.el-select .el-input.is-focus .el-input__inner) {
    border-color: #4dbfff !important;
    box-shadow: 0 0 8px rgba(57, 175, 253, 0.3);
    background: rgba(16, 32, 67, 0.9) !important; /* Slightly change background on focus */
}
.template-form :deep(.el-input__inner::placeholder),
.template-form :deep(.el-textarea__inner::placeholder) {
    color: rgba(141, 209, 254, 0.6);
}
/* Error state styling */
.template-form :deep(.el-form-item.is-error .el-input__inner),
.template-form :deep(.el-form-item.is-error .el-textarea__inner),
.template-form :deep(.el-form-item.is-error .el-select .el-input__inner) {
    border-color: #ff7b7b !important;
}
.template-form :deep(.el-form-item__error) {
    color: #ff9f9f;
    padding-top: 3px;
    font-size: 12px;
    line-height: 1.4;
}

/* --- JSON Validation Tips --- */
.json-error-tip, .json-valid-tip, .json-structure-tip {
  font-size: 12px;
  margin-top: 6px;
  line-height: 1.5;
  display: flex;
  align-items: center;
  padding-left: 2px; /* Slight indent */
}
.json-error-tip { color: #ff9f9f; font-weight: bold;}
.json-valid-tip { color: #52cc6a; } /* Brighter green */
.json-structure-tip { color: #8DD1FE; opacity: 0.8; }

.json-error-tip i, .json-valid-tip i, .json-structure-tip i {
  margin-right: 6px;
  font-size: 14px;
  flex-shrink: 0; /* Prevent icon shrinking */
}
.json-valid-tip i { color: #52cc6a; }

/* --- Optimization Class --- */
.optimized-dialog {
  will-change: transform, opacity;
  transform: translateZ(0); /* GPU acceleration hint */
}

/* --- Popconfirm Theming (If needed) --- */
:deep(.el-popconfirm__main) { color: #cce5ff; }
:deep(.el-popconfirm .el-button--primary) { /* Confirm button */
    /* Match theme primary button */
    background: linear-gradient(135deg, #3077b1, #39affd);
    border: none;
}
:deep(.el-popconfirm .el-button--primary:hover) {
    background: linear-gradient(135deg, #39affd, #3077b1);
}
:deep(.el-popconfirm .el-button--text) { /* Cancel button */
    color: #a9d1f7;
}
:deep(.el-popconfirm .el-button--text:hover) {
    color: #fff;
}

.template-edit-container {
  padding: 0 10px;
}

.template-name {
  font-size: 16px;
  margin-bottom: 5px;
}

.template-info {
  color: #666;
  margin-bottom: 15px;
}

.json-editor-container {
  margin-top: 15px;
}

.editor-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.json-editor {
  font-family: monospace;
  font-size: 14px;
  background-color: #f9f9f9;
}

.editor-help {
  font-size: 12px;
  color: #666;
  margin-top: 10px;
  background-color: #f4f4f4;
  padding: 8px;
  border-radius: 4px;
  line-height: 1.5;
}

/* 操作按钮列样式 */
:deep(.el-table .el-button) {
    margin: 3px;
}

/* 表格单元格内容适当间距 */
:deep(.el-table__row .cell) {
    padding: 0 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    justify-content: center;
}

/* 非操作列的内容左对齐 */
:deep(.el-table__row .cell:not(:last-child)) {
    justify-content: flex-start;
}
</style>