<template>
  <div class="patient-management">
    <!-- 标题区域 -->
    <div class="tech-header">
      <div class="tech-line left"></div>
      <h1><span class="highlight">患者管理</span></h1>
      <div class="tech-line right"></div>
    </div>

    <!-- 筛选和操作区域 -->
      <div class="filters-actions">
      <el-form :inline="true" class="filters-form" size="small">
          <el-form-item>
            <el-input
            v-model="filterQuery"
            placeholder="搜索姓名/联系方式/编号"
              prefix-icon="el-icon-search"
            clearable
            @clear="handleFilterChange"
            @keyup.enter.native="handleFilterChange"
          ></el-input>
          </el-form-item>
          <el-form-item>
            <el-select
            v-model="filterStatus" 
            placeholder="选择状态" 
              clearable
            @change="handleFilterChange"
          >
            <el-option label="待检查" value="待检查"></el-option>
            <el-option label="已诊断" value="已诊断"></el-option>
            <el-option label="复诊" value="复诊"></el-option>
            <el-option label="其他" value="其他"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <div class="actions-right">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAdd">添加患者</el-button>
        <el-button size="small" icon="el-icon-refresh" @click="refreshData">刷新</el-button>
        </div>
      </div>

    <!-- 表格区域 -->
      <el-table
      :data="patients"
        style="width: 100%"
      border
        stripe
      v-loading="loading"
      row-key="id"
      element-loading-text="加载患者数据中..."
      element-loading-spinner="el-icon-loading"
      @row-click="handleRowClick"
    >
      <el-table-column label="姓名" prop="name" min-width="100"></el-table-column>
      <el-table-column label="性别" prop="gender" width="80"></el-table-column>
      <el-table-column label="年龄" prop="age" width="80"></el-table-column>
      <el-table-column label="联系方式" prop="contact" min-width="130"></el-table-column>
      <el-table-column label="上次就诊" prop="last_visit_date" min-width="120"></el-table-column>
      <el-table-column label="状态" width="100">
           <template slot-scope="scope">
             <el-tag :type="getStatusTagType(scope.row.status)" size="small" effect="dark">{{ scope.row.status || '未知' }}</el-tag>
           </template>
         </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
          <el-button
            @click.stop="handleView(scope.row)"
            type="text"
            size="small"
            icon="el-icon-view"
          >查看</el-button>
          <el-button
            @click.stop="handleEdit(scope.row)"
            type="text"
            size="small"
            icon="el-icon-edit"
          >编辑</el-button>
          <el-button
            @click.stop="handleDelete(scope.row)"
            type="text"
            size="small"
            icon="el-icon-delete"
            class="danger-text"
          >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

    <!-- 分页控件 -->
    <div class="pagination-container">
      <el-pagination
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      >
      </el-pagination>
    </div>

    <!-- 患者详情弹窗 -->
    <!-- 患者详情弹窗 -->
    <el-dialog
      title="患者详情"
      :visible.sync="detailDialogVisible"
      width="750px"
      custom-class="tech-dialog patient-detail-dialog"
      append-to-body
    >
      <div v-if="selectedPatient && !detailLoading" class="detail-content">
        <el-descriptions
          :column="2"
          border
          size="medium"
        >
          <!-- Basic fields (likely already correct) -->
          <el-descriptions-item label="姓名" label-class-name="detail-label" content-class-name="detail-value">{{ selectedPatient.name }}</el-descriptions-item>
          <el-descriptions-item label="性别" label-class-name="detail-label" content-class-name="detail-value">{{ selectedPatient.gender }}</el-descriptions-item>
          <el-descriptions-item label="年龄" label-class-name="detail-label" content-class-name="detail-value">{{ selectedPatient.age }}岁</el-descriptions-item>

          <!-- **** CHANGED KEYS TO CAMELCASE **** -->
          <el-descriptions-item label="出生日期" label-class-name="detail-label" content-class-name="detail-value">{{ selectedPatient.dateOfBirth || '未提供' }}</el-descriptions-item>
          <el-descriptions-item label="联系方式" label-class-name="detail-label" content-class-name="detail-value">{{ selectedPatient.contact }}</el-descriptions-item>
          <el-descriptions-item label="身份证号/医保号" label-class-name="detail-label" content-class-name="detail-value" :span="2">{{ selectedPatient.idNumber || '未提供' }}</el-descriptions-item>
          <el-descriptions-item label="详细病史" label-class-name="detail-label" content-class-name="detail-value" :span="2">
             <div class="long-text-display">{{ selectedPatient.medicalHistory || '无' }}</div>
           </el-descriptions-item>
          <el-descriptions-item label="过敏史" label-class-name="detail-label" content-class-name="detail-value" :span="2">
             <div class="long-text-display">{{ selectedPatient.allergyHistory || '无' }}</div>
           </el-descriptions-item>
          <el-descriptions-item label="上次就诊日期" label-class-name="detail-label" content-class-name="detail-value" :span="2">{{ selectedPatient.lastVisitDate || '无记录' }}</el-descriptions-item>
          <!-- **** END OF CHANGES **** -->

          <el-descriptions-item label="状态" label-class-name="detail-label" content-class-name="detail-value" :span="2">
             <el-tag :type="getStatusTagType(selectedPatient.status)" size="small" effect="dark">{{ selectedPatient.status || '未知' }}</el-tag>
           </el-descriptions-item>
         </el-descriptions>

         <h3 class="related-title">相关检查记录</h3>
         <div class="related-placeholder">（此处未来可展示检查记录列表或关联数据）</div>
      </div>
       <div v-else class="detail-loading-placeholder">
           <i class="el-icon-loading"></i> 正在加载患者信息...
       </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关 闭</el-button>
        <!-- Pass the fully loaded selectedPatient to handleEdit -->
        <el-button type="primary" @click="handleEdit(selectedPatient)" :disabled="!selectedPatient || detailLoading">编辑信息</el-button>
      </span>
    </el-dialog>

     <!-- 新增/编辑患者弹窗 -->
     <el-dialog
       :title="dialogTitle"
       :visible.sync="addEditDialogVisible"
      width="750px"
       custom-class="tech-dialog patient-form-dialog"
       append-to-body
     >
       <el-form
         ref="patientFormRef"
         :model="patientForm"
         :rules="patientFormRules"
         label-width="120px"
         v-loading="dialogLoading"
         label-position="right"
         class="patient-edit-form"
       >
         <el-row :gutter="20">
           <el-col :span="12">
             <el-form-item label="姓名" prop="name">
               <el-input v-model="patientForm.name" placeholder="请输入患者姓名" clearable />
             </el-form-item>
           </el-col>
           <el-col :span="12">
             <el-form-item label="性别" prop="gender">
               <el-select v-model="patientForm.gender" placeholder="请选择性别" style="width: 100%;">
                 <el-option label="男" value="男" />
                 <el-option label="女" value="女" />
               </el-select>
             </el-form-item>
           </el-col>
         </el-row>
         <el-row :gutter="20">
           <el-col :span="12">
             <el-form-item label="年龄" prop="age">
               <el-input-number v-model="patientForm.age" :min="0" :max="150" controls-position="right" placeholder="请输入年龄" style="width: 100%;" />
             </el-form-item>
           </el-col>
           <el-col :span="12">
             <el-form-item label="联系方式" prop="contact">
               <el-input v-model="patientForm.contact" placeholder="请输入联系电话" clearable />
             </el-form-item>
           </el-col>
         </el-row>
          <el-form-item label="身份证/医保号" prop="idNumber">
             <el-input v-model="patientForm.idNumber" placeholder="请输入身份证或医保号 (可选)" clearable />
           </el-form-item>
         <el-form-item label="详细病史" prop="medicalHistory">
            <el-input type="textarea" :rows="3" v-model="patientForm.medicalHistory" placeholder="请输入患者详细病史 (可选)" />
          </el-form-item>
         <el-form-item label="过敏史" prop="allergyHistory">
            <el-input type="textarea" :rows="2" v-model="patientForm.allergyHistory" placeholder="请输入患者过敏史 (可选)" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
               <el-select v-model="patientForm.status" placeholder="请选择患者状态" style="width: 100%;">
                 <el-option label="待检查" value="待检查" />
                 <el-option label="已诊断" value="已诊断" />
                 <el-option label="复诊" value="复诊" />
                 <el-option label="其他" value="其他" /> <!-- Added an 'Other' option -->
               </el-select>
             </el-form-item>
          <!-- 编辑模式下显示 ID (只读) -->
         <el-form-item label="患者ID" v-if="dialogMode === 'edit'">
            <el-input :value="patientForm.id" disabled />
         </el-form-item>
       </el-form>
       <span slot="footer" class="dialog-footer">
         <el-button @click="addEditDialogVisible = false" :disabled="dialogLoading">取 消</el-button>
         <el-button type="primary" @click="handleSavePatient" :loading="dialogLoading">
           {{ dialogMode === 'add' ? '确认新增' : '保存修改' }}
         </el-button>
       </span>
     </el-dialog>

     <!-- 删除确认弹窗 -->
    <el-dialog
        title="确认删除"
        :visible.sync="deleteDialogVisible"
        width="380px"
        :close-on-click-modal="false"
        custom-class="tech-dialog confirm-delete-dialog"
        append-to-body
      >
        <div class="confirm-delete-content">
          <i class="el-icon-warning" style="color: #F56C6C; font-size: 22px; margin-right: 8px; vertical-align: middle;"></i>
          <span>确定要删除患者 "{{ selectedPatient ? selectedPatient.name : '' }}" 的信息吗？<br/>此操作将永久删除，无法恢复。</span>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="deleteDialogVisible = false" size="small">取 消</el-button>
          <el-button type="danger" @click="confirmDelete" size="small" :loading="deleteLoading">确认删除</el-button>
        </span>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PatientManagement',
  data() {
    return {
      loading: false,
      detailLoading: false,
      dialogLoading: false,
      deleteLoading: false,
      detailDialogVisible: false,
      addEditDialogVisible: false,
      deleteDialogVisible: false,
      dialogTitle: '添加患者',
      filterQuery: '',
      filterStatus: '',
      selectedPatient: null,
      patientForm: {},
      patientFormRules: {
        name: [
          { required: true, message: '请输入患者姓名', trigger: 'blur' },
          { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        gender: [
          { required: true, message: '请选择性别', trigger: 'change' }
        ],
        age: [
          { required: true, message: '请输入年龄', trigger: 'blur' },
          { type: 'number', min: 0, max: 150, message: '请输入0-150之间的数字', trigger: 'blur' }
        ],
        contact: [
          { required: true, message: '请输入联系方式', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ]
      },
      currentId: null,
      isEditMode: false,
      dialogMode: 'add', // 兼容现有代码
    };
  },
  computed: {
    // 从Vuex获取患者数据
    patients() {
      return this.$store.state.patients;
    },
    total() {
      return this.$store.state.total;
    },
    currentPage: {
      get() {
        return this.$store.state.currentPage;
      },
      set(value) {
        this.$store.commit('SET_PAGINATION', { 
          currentPage: value, 
          pageSize: this.pageSize 
        });
      }
    },
    pageSize: {
      get() {
        return this.$store.state.pageSize;
      },
      set(value) {
        this.$store.commit('SET_PAGINATION', { 
          currentPage: this.currentPage, 
          pageSize: value 
        });
      }
     }
  },
  created() {
    // 组件创建时加载数据
    this.loadPatients();
  },
  methods: {
    // 获取患者列表数据
    async loadPatients() {
      this.loading = true;
      try {
        console.log('正在请求患者数据，参数:', {
          page: this.currentPage,
          pageSize: this.pageSize,
          query: this.filterQuery,
          status: this.filterStatus
        });
        
        // 使用store action加载数据
        const response = await this.$store.dispatch('fetchPatientsAction', {
          page: this.currentPage,
          pageSize: this.pageSize,
          query: this.filterQuery,
          status: this.filterStatus
        });
        
        console.log('获取到的响应:', response);
        
        // 如果后端返回的不是期望的格式，可以在这里处理特殊情况
        if (!response.success && !this.patients.length) {
          this.$message.warning('暂无患者数据或数据加载失败');
        }
      } catch (error) {
        console.error('获取患者列表失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        this.$message.error(`获取患者列表失败: ${error.message || '未知错误'}`);
      } finally {
        this.loading = false;
      }
    },

    // 查看患者详情
    async handleView(patient) {
       this.detailDialogVisible = true;
       this.detailLoading = true;
      this.selectedPatient = patient; // 先显示基本信息
      
      try {
        console.log('请求患者详情，ID:', patient.id);
        // 获取完整详情
        const response = await this.$store.dispatch('getPatientDetailAction', patient.id);
        console.log('获取到的患者详情:', response);
        
        // 处理多种可能的响应格式
        if (response.success && response.patient) {
          // 标准格式
          this.selectedPatient = response.patient;
        } else if (response.id) {
          // 直接返回患者对象
          this.selectedPatient = response;
        } else if (response.data && response.data.id) {
          // 嵌套格式
          this.selectedPatient = response.data;
           } else {
          console.error('未识别的患者详情格式:', response);
          this.$message.warning('患者详情数据格式异常');
           }
       } catch (error) {
        console.error('获取患者详情失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        this.$message.error(`获取患者详情失败: ${error.message || '未知错误'}`);
       } finally {
           this.detailLoading = false;
       }
    },

    // 处理添加患者
    handleAdd() {
      this.isEditMode = false;
      this.dialogTitle = '添加患者';
      this.patientForm = {}; // 重置表单
        this.addEditDialogVisible = true;
    },
    
    // 处理编辑患者
    handleEdit(patient) {
      this.isEditMode = true;
      this.dialogTitle = '编辑患者信息';
      this.currentId = patient.id;
      // 复制患者数据到表单
      this.patientForm = { ...patient };
      // 转换字段名称以匹配表单
      if (patient.date_of_birth) this.patientForm.birthDate = patient.date_of_birth;
      if (patient.id_number) this.patientForm.idNumber = patient.id_number;
      if (patient.medical_history) this.patientForm.medicalHistory = patient.medical_history;
      // 过敏史处理可能需要更复杂的逻辑，取决于存储格式
      
       this.addEditDialogVisible = true;
    },
    
    // 处理删除患者
    handleDelete(patient) {
      this.selectedPatient = patient;
      this.deleteDialogVisible = true;
    },
    
    // 提交表单（添加或更新患者）
    submitPatientForm() {
       this.$refs.patientFormRef.validate(async (valid) => {
        if (!valid) {
          this.$message.warning('请正确填写表单');
          return;
        }
        
        this.dialogLoading = true;
        try {
          // 转换数据格式以匹配后端要求 (后端期望驼峰命名)
          const patientDataToSend = {
            ...this.patientForm // 直接使用展开运算符发送所有驼峰字段
            // 后端 update_patient 会根据传入的驼峰字段更新
            // allergyHistory 会直接传递，需要后端能处理
          };

          // 移除之前添加的 id, 后端会从 URL 获取
          // delete patientDataToSend.id;

          console.log(`${this.isEditMode ? '更新' : '添加'}患者数据 (驼峰):`, patientDataToSend);

          let response;
          if (this.isEditMode) {
            // 更新患者
            response = await this.$store.dispatch('updatePatientAction', {
              id: this.currentId,
              patientData: patientDataToSend // 发送包含驼峰字段的对象
            });
             } else {
            // 添加患者 (理论上此分支不会执行，但保持一致)
            response = await this.$store.dispatch('addPatientAction', patientDataToSend);
          }
          
          console.log(`${this.isEditMode ? '更新' : '添加'}患者响应:`, response);
          
          // 处理多种可能的响应格式
          if (response && (response.success || response.id)) {
            this.$message.success(this.isEditMode ? '患者信息更新成功' : '患者添加成功');
             this.addEditDialogVisible = false;
            await this.loadPatients();
          } else {
            const errorMsg = response?.message || (this.isEditMode ? '更新患者信息失败' : '添加患者失败');
            console.error('操作失败:', errorMsg, response);
            this.$message.error(errorMsg);
          }
           } catch (error) {
          console.error(`${this.isEditMode ? '更新' : '添加'}患者失败:`, error);
          console.error('错误详情:', error.response?.data || error.message);
          this.$message.error(`操作失败: ${error.message || '未知错误'}`);
           } finally {
             this.dialogLoading = false;
         }
       });
    },

    // 处理表格行点击
    handleRowClick(row) {
      this.handleView(row);
    },
    
    // 处理筛选条件变化
    handleFilterChange() {
      this.currentPage = 1; // 重置到第一页
      this.loadPatients();
    },
    
    // 处理每页数量变化
    handleSizeChange(size) {
      this.pageSize = size;
      this.loadPatients();
    },
    
    // 处理页码变化
    handleCurrentChange(page) {
      this.currentPage = page;
      this.loadPatients();
    },
    
    // 刷新数据
    refreshData() {
      this.loadPatients();
    },
    
    // 获取状态标签类型
    getStatusTagType(status) {
      const statusMap = {
        '待检查': 'warning',
        '已诊断': 'success',
        '复诊': 'info',
        '其他': ''
      };
      return statusMap[status] || '';
    },
    
    // 处理保存患者信息
    handleSavePatient() {
      this.submitPatientForm();
    },
    
    // 确认删除患者
    async confirmDelete() {
      if (!this.selectedPatient || !this.selectedPatient.id) {
        this.$message.warning('未选择有效的患者');
        return;
      }
      
      const patientId = this.selectedPatient.id;
      this.deleteLoading = true;
      
      try {
        console.log('删除患者，ID:', patientId);
        const response = await this.$store.dispatch('deletePatientAction', patientId);
        console.log('删除患者响应:', response);
        
        // 无论响应如何，只要没有抛出异常，就认为删除成功
        this.$message.success('患者删除成功');
        this.deleteDialogVisible = false;
        
        // 检查是否需要重新加载或调整页码
        if (this.patients.length === 1 && this.currentPage > 1) {
          this.currentPage -= 1;
        }
        
        // 重新加载患者列表
        await this.loadPatients();
       } catch (error) {
        console.error('删除患者失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        
        // 显示具体错误信息
        const errorMessage = error.response?.status === 404 
          ? '患者不存在或已被删除' 
          : `删除患者失败: ${error.message || '未知错误'}`;
        
        this.$message.error(errorMessage);
       } finally {
        this.deleteLoading = false;
        // 清空选中的患者，防止重复操作
        this.selectedPatient = null;
      }
    },
  }
}
</script>

<style scoped>
/* --- Base and Header Styles --- */
.patient-management {
  width: 100%;
  min-height: calc(100vh - 60px); /* Adjust if header height changes */
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background-color: transparent;   /* <<< Main background is transparent */
  overflow-y: auto;
  /* IMPORTANT: Readability depends on the background of the parent container */
}

.tech-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 25px;
  position: relative;
  flex-shrink: 0; /* Prevent header shrinking */
}

.tech-header h1 {
  color: #8DD1FE;
  font-size: 26px;
  font-weight: 600;
  margin: 0 20px;
  text-shadow: 0 0 12px rgba(57, 175, 253, 0.6);
}

.highlight {
  color: #39AFFD;
}

.tech-line {
  height: 2px;
  width: 150px;
  position: relative;
}
.tech-line.left { background: linear-gradient(to right, rgba(57, 175, 253, 0), #39AFFD); }
.tech-line.right { background: linear-gradient(to left, rgba(57, 175, 253, 0), #39AFFD); }

/* --- Card Styles (Provides local background for content) --- */
.box-card {
  background: rgba(13, 28, 64, 0.75); /* Slightly more opaque */
  border: 1px solid rgba(57, 175, 253, 0.3);
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden; /* Contain content */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2), 0 0 15px rgba(57, 175, 253, 0.1) inset;
  display: flex; /* Allow card body to grow */
  flex-direction: column;
  flex-grow: 1; /* Allow card to take available space */
}

.patient-list-card {
   padding: 5px 20px 20px 20px; /* Consistent padding */
}
.patient-list-card /deep/ .el-card__body {
  padding: 15px 20px; /* Standard padding */
  flex-grow: 1; /* Allow body content (table etc.) to grow */
  display: flex;
  flex-direction: column;
}

/* --- Filters & Actions Styles --- */
.filters-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* Align items to top */
  flex-wrap: wrap;
  margin-bottom: 15px;
  flex-shrink: 0; /* Prevent shrinking */
}

.filters-actions .el-form--inline .el-form-item {
  margin-right: 10px;
  margin-bottom: 10px; /* Spacing between rows when wrapped */
}

.actions-right {
    margin-left: auto; /* Push to the right */
    padding-top: 0; /* Align with form items */
    margin-bottom: 10px;
    display: flex; /* Align buttons horizontally */
    align-items: center;
    flex-wrap: wrap; /* Allow buttons to wrap */
}
.actions-right .el-button, .actions-right .el-upload {
    margin-left: 10px; /* Space between buttons */
    margin-bottom: 5px; /* Space if wrapped */
}
/* Ensure upload button aligns nicely */
.actions-right /deep/ .el-upload {
    line-height: 1; /* Align button inside upload */
    vertical-align: middle;
}

/* --- Form Elements Style Overrides --- */
.patient-management /deep/ .el-form-item__label { color: #8DD1FE; padding-right: 5px; line-height: 32px; }
.patient-management /deep/ .el-input__inner,
.patient-management /deep/ .el-select .el-input__inner,
.patient-management /deep/ .el-textarea__inner,
.patient-management /deep/ .el-input-number .el-input__inner {
  background-color: rgba(13, 28, 64, 0.5) !important;
  border: 1px solid rgba(57, 175, 253, 0.4) !important;
  border-radius: 4px;
  color: #333333 !important;
  height: 32px;
  line-height: 32px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.patient-management /deep/ .el-input__inner:focus,
.patient-management /deep/ .el-select .el-input__inner:focus,
.patient-management /deep/ .el-textarea__inner:focus,
.patient-management /deep/ .el-input-number .el-input__inner:focus {
    border-color: #39AFFD !important;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.1), 0 0 5px rgba(57, 175, 253, 0.5);
}

.patient-management /deep/ .el-textarea__inner {
    height: auto; /* Let textarea height be determined by rows */
    line-height: 1.5;
    padding-top: 5px;
    padding-bottom: 5px;
    min-height: 64px; /* Minimum height for textareas */
}
.patient-management /deep/ .el-input__inner::placeholder,
.patient-management /deep/ .el-textarea__inner::placeholder {
  color: rgba(141, 209, 254, 0.6); /* Slightly less prominent placeholder */
}
.patient-management /deep/ .el-input__icon,
.patient-management /deep/ .el-select__caret,
.patient-management /deep/ .el-input-number__decrease,
.patient-management /deep/ .el-input-number__increase {
    line-height: 32px;
    color: #8DD1FE;
    cursor: pointer;
}
.patient-management /deep/ .el-input-number { width: 100%; } /* Make number input full width */
.patient-management /deep/ .el-input-number__decrease,
.patient-management /deep/ .el-input-number__increase {
    background: rgba(57, 175, 253, 0.1);
    border-left: 1px solid rgba(57, 175, 253, 0.4);
    border-bottom: none;
    width: 30px;
}
.patient-management /deep/ .el-input-number__increase {
    border-left: 1px solid rgba(57, 175, 253, 0.4);
    border-bottom: 1px solid rgba(57, 175, 253, 0.4); /* Add bottom border */
    border-radius: 0 4px 4px 0;
}
 .patient-management /deep/ .el-input-number__decrease {
     border-radius: 4px 0 0 4px;
 }
.patient-management /deep/ .el-input-number .el-input__inner {
    text-align: center;
    padding-left: 35px;
    padding-right: 35px; /* Space for controls */
}

/* --- Button Styles --- */
.patient-management /deep/ .el-button { border-radius: 4px; padding: 0 15px; font-size: 13px; height: 32px; line-height: 32px; box-sizing: border-box; transition: all 0.2s ease; cursor: pointer; border: 1px solid transparent; }
.patient-management /deep/ .el-button--primary { background: linear-gradient(135deg, #3077b1, #39affd); border-color: #3077b1; box-shadow: 0 2px 5px rgba(57, 175, 253, 0.3); color: #fff; }
.patient-management /deep/ .el-button--primary:hover { background: linear-gradient(135deg, #39affd, #3077b1); box-shadow: 0 4px 8px rgba(57, 175, 253, 0.4); border-color: #39affd; }
.patient-management /deep/ .el-button--success { background-color: #13a8a8; border-color: #13a8a8; color: #fff; box-shadow: 0 2px 5px rgba(19, 168, 168, 0.3); }
.patient-management /deep/ .el-button--success:hover { background-color: #15bdbd; border-color: #15bdbd; box-shadow: 0 4px 8px rgba(21, 189, 189, 0.4); }
.patient-management /deep/ .el-button--default { 
    background-color: rgba(57, 175, 253, 0.1);
    border-color: rgba(57, 175, 253, 0.4);
    color: #E0F2FF;
}
.patient-management /deep/ .el-button--default:hover {
    background-color: rgba(57, 175, 253, 0.2);
    border-color: rgba(57, 175, 253, 0.6);
    color: #bde4ff;
}
.patient-management /deep/ .el-button--text { color: #39AFFD; padding: 0 5px; margin: 0 3px; height: auto; font-size: 12px; background: none; border: none; line-height: 1; }
.patient-management /deep/ .el-button--text:hover { color: #8DD1FE; }
.patient-management /deep/ .el-button.is-disabled, .patient-management /deep/ .el-button.is-disabled:hover {
    cursor: not-allowed;
    background-image: none; /* Remove gradient */
    background-color: rgba(100, 100, 100, 0.2);
    border-color: rgba(100, 100, 100, 0.3);
    color: rgba(141, 209, 254, 0.5);
    box-shadow: none;
}
.patient-management /deep/ .el-button.is-loading { position: relative; pointer-events: none; }
.patient-management /deep/ .el-button.is-loading:before { /* Loading overlay */
    pointer-events: none;
    content: '';
    position: absolute;
    left: -1px; top: -1px; right: -1px; bottom: -1px;
    border-radius: inherit;
    background-color: rgba(255, 255, 255, 0.35);
    z-index: 1; /* Ensure overlay is above content but below spinner */
}
.patient-management /deep/ .el-button .el-icon-loading { /* Style spinner */
    color: inherit; /* Use button's text color */
    z-index: 2; /* Ensure spinner is above overlay */
}

/* --- Table Style Overrides --- */
.patient-management /deep/ .el-table {
    background-color: transparent;
    color: #333333;
    margin-top: 15px;
    border: 1px solid rgba(57, 175, 253, 0.2);
    border-bottom: none;
    border-radius: 4px;
    overflow: hidden;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}
.patient-management /deep/ .el-table::before { /* Remove element's default bottom border */
    height: 0;
}
.patient-management /deep/ .el-table__header-wrapper th {
    background-color: rgba(57, 175, 253, 0.1) !important;
    color: #333333 !important;
    font-weight: 600;
    border-bottom: 1px solid rgba(57, 175, 253, 0.3);
    padding: 10px 0;
}
.patient-management /deep/ .el-table__body-wrapper {
    flex-grow: 1; /* Allow body to scroll */
    overflow-y: auto; /* Enable vertical scroll if needed */
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: rgba(57, 175, 253, 0.3) rgba(0,0,0,0.1); /* Firefox */
}
/* Webkit scrollbar styling */
.patient-management /deep/ .el-table__body-wrapper::-webkit-scrollbar { width: 6px; height: 6px;}
.patient-management /deep/ .el-table__body-wrapper::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 3px; }
.patient-management /deep/ .el-table__body-wrapper::-webkit-scrollbar-thumb { background: rgba(57, 175, 253, 0.3); border-radius: 3px; }
.patient-management /deep/ .el-table__body-wrapper::-webkit-scrollbar-thumb:hover { background: rgba(57, 175, 253, 0.5); }

.patient-management /deep/ .el-table td {
    border-bottom: 1px solid rgba(57, 175, 253, 0.15); /* Subtler row border */
    padding: 10px 0; /* Vertical padding */
    transition: background-color 0.2s ease;
}
.patient-management /deep/ .el-table--striped .el-table__body tr.el-table__row--striped td {
    background: rgba(57, 175, 253, 0.05); /* More subtle stripe */
}
.patient-management /deep/ .el-table__body tr:hover > td {
    background-color: rgba(57, 175, 253, 0.12) !important;
}
.patient-management /deep/ .el-table .cell {
    padding-left: 12px;
    padding-right: 12px;
    line-height: 1.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #333333;
}
/* Allow wrapping on hover if needed, for specific columns perhaps */
/* .patient-management /deep/ .el-table .cell:hover { white-space: normal; overflow: visible; } */
.patient-management /deep/ .el-table__empty-block {
    background-color: transparent; /* Ensure empty state background is transparent */
}
.patient-management /deep/ .el-table__empty-text { color: #8DD1FE; font-size: 14px; }
.patient-management /deep/ .el-table th.is-sortable { cursor: pointer; }
.patient-management /deep/ .el-table .caret-wrapper { /* Adjust caret position slightly */ vertical-align: middle; margin-left: 4px; }
.patient-management /deep/ .el-table .sort-caret.ascending { border-bottom-color: #8DD1FE; }
.patient-management /deep/ .el-table .sort-caret.descending { border-top-color: #8DD1FE; }
.patient-management /deep/ .el-table th.ascending .sort-caret.ascending { border-bottom-color: #39AFFD; }
.patient-management /deep/ .el-table th.descending .sort-caret.descending { border-top-color: #39AFFD; }
.patient-management /deep/ .el-table--fixed-right::after { background-color: rgba(57, 175, 253, 0.2); /* Adjust fixed column shadow */ }

/* --- Pagination Style Overrides --- */
.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; padding: 0; flex-shrink: 0; }
.patient-management /deep/ .el-pagination { padding: 5px 10px; border-radius: 4px; }
.patient-management /deep/ .el-pagination button,
.patient-management /deep/ .el-pagination span:not([class*=suffix]) { 
    color: #8DD1FE;
    background-color: transparent; 
}
.patient-management /deep/ .el-pagination .el-select .el-input__inner { background-color: rgba(13, 28, 64, 0.5) !important; border: 1px solid rgba(57, 175, 253, 0.4) !important; height: 28px; line-height: 28px; color: #E0F2FF; }
.patient-management /deep/ .el-pager li { background-color: transparent; color: #8DD1FE; min-width: 28px; height: 28px; line-height: 28px; border-radius: 4px; margin: 0 3px; font-weight: 500; transition: background-color 0.2s ease, color 0.2s ease; }
.patient-management /deep/ .el-pager li:hover { color: #fff; background-color: rgba(57, 175, 253, 0.3); }
.patient-management /deep/ .el-pager li.active { color: #fff; background-color: #39AFFD !important; box-shadow: 0 0 5px rgba(57, 175, 253, 0.4); }
.patient-management /deep/ .el-pagination__total { 
    color: #8DD1FE;
    font-size: 13px; 
    margin-right: 10px; 
}
.patient-management /deep/ .el-pagination__jump { 
    color: #8DD1FE;
    font-size: 13px; 
    margin-left: 10px; 
}
.patient-management /deep/ .el-pagination .btn-prev,
.patient-management /deep/ .el-pagination .btn-next { background-color: rgba(57, 175, 253, 0.1); border: 1px solid rgba(57, 175, 253, 0.4); border-radius: 4px; min-width: 28px; height: 28px; line-height: 28px; padding: 0 8px; margin: 0 3px;}
.patient-management /deep/ .el-pagination button:hover:not(:disabled) { color: #39AFFD; border-color: rgba(57, 175, 253, 0.6); background-color: rgba(57, 175, 253, 0.2); }
.patient-management /deep/ .el-pagination button:disabled { color: rgba(141, 209, 254, 0.4); background-color: rgba(57, 175, 253, 0.05); border-color: rgba(57, 175, 253, 0.2); cursor: not-allowed; }

/* --- Dialog Base Style Overrides (Dialogs keep their own solid background) --- */
.el-dialog__wrapper /deep/ .tech-dialog {
  background: #0A1632 !important; /* Darker solid background for dialogs */
  border: 1px solid rgba(57, 175, 253, 0.4);
  border-radius: 8px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(57, 175, 253, 0.15) inset;
  display: flex;
  flex-direction: column;
  max-height: 85vh; /* Limit dialog height */
  z-index: 2000 !important; /* 确保弹窗在最上层 */
}
.el-dialog__wrapper /deep/ .tech-dialog .el-dialog__header {
   padding: 15px 25px 12px;
   border-bottom: 1px solid rgba(57, 175, 253, 0.2);
   margin-right: 0; /* Override default margin */
   flex-shrink: 0;
}
.el-dialog__wrapper /deep/ .tech-dialog .el-dialog__title { color: #8DD1FE; font-size: 18px; font-weight: 600; }
.el-dialog__wrapper /deep/ .tech-dialog .el-dialog__headerbtn { top: 15px; right: 20px; z-index: 10; } /* Ensure close button is on top */
.el-dialog__wrapper /deep/ .tech-dialog .el-dialog__headerbtn .el-dialog__close { color: #8DD1FE; font-size: 18px; font-weight: bold; }
.el-dialog__wrapper /deep/ .tech-dialog .el-dialog__headerbtn:hover .el-dialog__close { color: #39AFFD; }
.el-dialog__wrapper /deep/ .tech-dialog .el-dialog__body {
  padding: 20px 30px;
  color: #333333;
  flex-grow: 1; /* Allow body to take available space */
  overflow-y: auto; /* Add scroll if content exceeds height */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: rgba(57, 175, 253, 0.3) rgba(10, 22, 50, 0.8); /* Firefox */
  background: rgba(13, 28, 64, 0.8);
}
/* Webkit scrollbar styling for dialog body */
.el-dialog__wrapper /deep/ .tech-dialog .el-dialog__body::-webkit-scrollbar { width: 6px; }
.el-dialog__wrapper /deep/ .tech-dialog .el-dialog__body::-webkit-scrollbar-track { background: rgba(10, 22, 50, 0.8); border-radius: 3px; }
.el-dialog__wrapper /deep/ .tech-dialog .el-dialog__body::-webkit-scrollbar-thumb { background: rgba(57, 175, 253, 0.3); border-radius: 3px; }
.el-dialog__wrapper /deep/ .tech-dialog .el-dialog__body::-webkit-scrollbar-thumb:hover { background: rgba(57, 175, 253, 0.5); }

.el-dialog__wrapper /deep/ .tech-dialog .el-dialog__footer {
    padding: 12px 25px 15px;
    border-top: 1px solid rgba(57, 175, 253, 0.2);
    text-align: right;
    flex-shrink: 0; /* Prevent footer from shrinking */
    background-color: rgba(10, 22, 50, 0.5); /* Slight background for footer */
}
/* Dialog Buttons */
.el-dialog__wrapper /deep/ .tech-dialog .el-button--default {
    background-color: rgba(57, 175, 253, 0.1);
    border: 1px solid rgba(57, 175, 253, 0.5);
    color: #E0F2FF;
}
.el-dialog__wrapper /deep/ .tech-dialog .el-button--default:hover:not(:disabled) {
    background: rgba(57, 175, 253, 0.2);
    border-color: rgba(57, 175, 253, 0.8);
    color: #bde4ff;
}
/* Primary uses global style */
.el-dialog__wrapper /deep/ .tech-dialog .el-button--danger { background-color: #c74242; border-color: #c74242; color: #fff; box-shadow: 0 2px 5px rgba(199, 66, 66, 0.3); }
.el-dialog__wrapper /deep/ .tech-dialog .el-button--danger:hover:not(:disabled) { background-color: #e64e4e; border-color: #e64e4e; box-shadow: 0 4px 8px rgba(230, 78, 78, 0.4); }
.el-dialog__wrapper /deep/ .tech-dialog .el-button--danger.is-loading:before { background-color: rgba(255, 255, 255, 0.45); }

/* --- Detail Dialog Specific Styles --- */
.el-dialog__wrapper /deep/ .patient-detail-dialog {
  width: 720px !important;
  background: linear-gradient(135deg, rgba(10, 22, 50, 0.95), rgba(13, 28, 64, 0.95)) !important;
  border: 1px solid rgba(57, 175, 253, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(57, 175, 253, 0.15) inset;
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-dialog__header {
  padding: 20px 30px;
  border-bottom: 1px solid rgba(57, 175, 253, 0.3);
  background: rgba(57, 175, 253, 0.05);
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-dialog__title {
  color: #8DD1FE;
  font-size: 20px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(57, 175, 253, 0.3);
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-dialog__body { 
  padding: 25px 35px; 
  background: rgba(13, 28, 64, 0.8);
}

.detail-content { 
  padding: 15px 0;
}

.detail-loading-placeholder { 
  text-align: center; 
  padding: 50px; 
  color: #8DD1FE; 
  font-size: 16px;
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-descriptions {
    background-color: rgba(57, 175, 253, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(57, 175, 253, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-descriptions .detail-label {
    background-color: rgba(57, 175, 253, 0.1) !important;
    color: #8DD1FE !important;
    font-weight: 600;
    width: 140px;
    text-align: right;
    vertical-align: middle;
    padding: 15px 20px !important;
    border-right: 1px solid rgba(57, 175, 253, 0.2) !important;
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-descriptions .detail-value {
    background-color: transparent !important;
    color: #333333 !important;
    word-break: break-word;
    padding: 15px 20px !important;
    line-height: 1.6;
    font-size: 14px;
    font-weight: 500;
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-descriptions__body {
     border: none !important;
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-descriptions__table.is-bordered .el-descriptions-item__cell {
     border: 1px solid rgba(57, 175, 253, 0.2) !important;
}

.long-text-display {
    white-space: pre-wrap;
    max-height: 150px;
    overflow-y: auto;
    line-height: 1.8;
    padding: 12px 15px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    border: 1px solid rgba(57, 175, 253, 0.2);
    scrollbar-width: thin;
    scrollbar-color: rgba(57, 175, 253, 0.3) rgba(0,0,0,0.1);
    font-size: 14px;
    color: #333333;
}

.related-title { 
  color: #8DD1FE; 
  font-size: 18px; 
  margin-top: 30px; 
  margin-bottom: 20px; 
  padding-bottom: 10px; 
  border-bottom: 1px solid rgba(57, 175, 253, 0.3); 
  font-weight: 600;
  text-shadow: 0 0 10px rgba(57, 175, 253, 0.2);
}

.related-placeholder { 
  color: #E0F2FF;
  font-style: italic; 
  padding: 25px; 
  text-align: center; 
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px; 
  border: 1px dashed rgba(57, 175, 253, 0.3);
  font-size: 14px;
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-dialog__footer {
    padding: 15px 30px;
    border-top: 1px solid rgba(57, 175, 253, 0.3);
    background: rgba(57, 175, 253, 0.05);
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-button {
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-button--default {
    background: rgba(57, 175, 253, 0.1);
    border: 1px solid rgba(57, 175, 253, 0.4);
    color: #E0F2FF;
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-button--default:hover {
    background: rgba(57, 175, 253, 0.2);
    border-color: rgba(57, 175, 253, 0.6);
    color: #E0F2FF;
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-button--primary {
    background: linear-gradient(135deg, #3077b1, #39affd);
    border: none;
    color: #fff;
    box-shadow: 0 2px 8px rgba(57, 175, 253, 0.3);
}

.el-dialog__wrapper /deep/ .patient-detail-dialog .el-button--primary:hover {
    background: linear-gradient(135deg, #39affd, #3077b1);
    box-shadow: 0 4px 12px rgba(57, 175, 253, 0.4);
}

/* --- Add/Edit Dialog Specific Styles --- */
.el-dialog__wrapper /deep/ .patient-form-dialog {
  width: 750px !important; /* 增加宽度 */
}
.el-dialog__wrapper /deep/ .patient-form-dialog .el-dialog__body { 
  padding: 20px 30px; 
  background: rgba(13, 28, 64, 0.8);
}
.patient-edit-form /deep/ .el-form-item { 
  margin-bottom: 22px; /* 增加间距 */
}
.patient-edit-form /deep/ .el-form-item__label { 
  line-height: 32px;
  color: #8DD1FE; /* 标签文字改为浅色 */
  font-weight: 500;
}
.patient-edit-form /deep/ .el-form-item.is-required .el-form-item__label:before {
    content: '*';
    color: #F56C6C;
    margin-right: 4px;
}
.patient-edit-form /deep/ .el-form-item__error {
    padding-top: 2px;
    font-size: 12px;
    color: #F56C6C;
}
.patient-edit-form /deep/ .el-input__inner,
.patient-edit-form /deep/ .el-textarea__inner,
.patient-edit-form /deep/ .el-select .el-input__inner {
    background-color: rgba(13, 28, 64, 0.6) !important;
    border: 1px solid rgba(57, 175, 253, 0.3) !important;
    color: #E0F2FF !important;
    transition: all 0.3s ease;
}
.patient-edit-form /deep/ .el-input__inner:focus,
.patient-edit-form /deep/ .el-textarea__inner:focus,
.patient-edit-form /deep/ .el-select .el-input__inner:focus {
    border-color: #39AFFD !important;
    box-shadow: 0 0 0 2px rgba(57, 175, 253, 0.2);
}
.patient-edit-form /deep/ .el-input__inner::placeholder,
.patient-edit-form /deep/ .el-textarea__inner::placeholder {
    color: rgba(141, 209, 254, 0.5);
}

/* --- Delete Confirm Dialog Specific Styles --- */
.el-dialog__wrapper /deep/ .confirm-delete-dialog { max-width: 400px; } /* Keep it compact */
.confirm-delete-content {
    display: flex;
    align-items: center;
    line-height: 1.6;
    color: #8DD1FE; /* 修改为浅色 */
    font-size: 14px;
    padding: 10px 0;
}
.confirm-delete-content i { flex-shrink: 0; } /* Prevent icon shrinking */

/* --- Responsive Adjustments --- */
@media (max-width: 768px) {
  .patient-management { padding: 15px; }
  .tech-header h1 { font-size: 22px; }
  .tech-line { width: 100px; }
  .filters-actions { flex-direction: column; align-items: stretch; }
  .filters-actions .el-form--inline { width: 100%; }
  .filters-actions .el-form-item { margin-right: 0; width: 100%; display: flex; }
  .filters-actions .el-form-item /deep/ .el-form-item__content { flex-grow: 1; }
  .filters-actions .el-input, .filters-actions .el-select { width: 100% !important; }
  .actions-right { margin-left: 0; margin-top: 10px; width: 100%; text-align: left; display: block; } /* Block display for vertical stacking */
  .actions-right .el-button, .actions-right .el-upload { margin-bottom: 10px; margin-left: 0 !important; margin-right: 10px; display: inline-block; /* Keep inline-block for spacing */ }
  .patient-management /deep/ .el-table .cell { white-space: normal; /* Allow wrapping on mobile */ text-overflow: clip; overflow: visible;}
  .patient-management /deep/ .el-table-column--operation .cell { /* Ensure operation buttons wrap nicely */ white-space: normal; }
  .el-dialog__wrapper /deep/ .tech-dialog { width: 95% !important; max-width: none; max-height: 90vh; }
  .el-dialog__wrapper /deep/ .patient-form-dialog .el-col { width: 100%; /* Stack form columns */ }
  /* Descriptions adapt well in mobile view - no special style needed */
  .el-dialog__wrapper /deep/ .patient-detail-dialog .detail-label { width: 100px; } /* Smaller label on mobile */
  .el-dialog__wrapper /deep/ .el-dialog__footer { padding: 10px 15px; }
  .el-dialog__wrapper /deep/ .el-dialog__body { padding: 15px; }
  .el-dialog__wrapper /deep/ .el-dialog__header { padding: 12px 15px; }
}

</style>