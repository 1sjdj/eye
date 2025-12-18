<template>
  <div class="lear-wrapper">
  <div class="doctor-settings-container">
    <div class="header">
      <h1><span class="highlight">个人中心</span></h1>
    </div>

    <div class="settings-content">
      <!-- 个人信息管理 -->
      <div class="settings-section">
        <div class="section-header">
          <h2><i class="el-icon-user-solid"></i> 个人信息管理</h2>
          <!-- 可以加一个刷新按钮 -->
          <el-tooltip content="刷新个人信息" placement="top">
             <el-button
               icon="el-icon-refresh"
               circle
               size="small"
               @click="fetchPersonalInfo"
               :loading="loading.personalInfo"
             ></el-button>
          </el-tooltip>
        </div>
        <el-skeleton :rows="6" animated :loading="loading.personalInfo">
          <template #default>
            <div class="section-content">
              <div class="profile-top-section">
                <div class="avatar-upload">
                  <el-tooltip content="点击更换头像" placement="top">
                    <div class="avatar-wrapper" @click="triggerAvatarUpload">
                      <el-image :src="displayAvatarUrl" class="avatar" fit="cover" alt="医生头像">
                        <div slot="error" class="image-slot">
                          <i class="el-icon-picture-outline"></i>
                        </div>
                      </el-image>
                      <div class="avatar-mask">
                        <i class="el-icon-camera-solid"></i>
                        <span>更换头像</span>
                      </div>
                    </div>
                  </el-tooltip>
                  <input
                      type="file"
                      ref="avatarInput"
                      accept="image/png, image/jpeg, image/gif"
                      @change="handleAvatarChange"
                      style="display: none;"
                      aria-hidden="true"
                  />
                  <!-- 使用计算属性判断是否显示移除按钮 -->
                  <el-button
                    v-if="!isDefaultAvatar || avatarPreviewUrl"  
                    @click.stop="removeAvatar"
                    type="text"
                    size="small"
                    icon="el-icon-delete"
                    class="remove-avatar-btn"
                    :loading="loading.avatarAction"
                    :disabled="isDefaultAvatar && !avatarPreviewUrl" 
                    >移除头像
                  </el-button> 
                </div>

                <el-form
                  ref="personalInfoForm"
                  :model="personalInfo"
                  :rules="personalInfoRules"
                  @submit.native.prevent="savePersonalInfo"
                  class="info-form"
                  label-position="top"
                  hide-required-asterisk
                >
                  <el-row :gutter="24">
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="姓名" prop="name">
                        <el-input v-model.trim="personalInfo.name" prefix-icon="el-icon-user" clearable></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="职称" prop="title">
                        <el-input v-model.trim="personalInfo.title" prefix-icon="el-icon-medal" clearable></el-input>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-row :gutter="24">
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="科室" prop="department">
                        <el-input v-model.trim="personalInfo.department" prefix-icon="el-icon-office-building" clearable></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="医院" prop="hospital">
                        <el-input v-model.trim="personalInfo.hospital" prefix-icon="el-icon-school" clearable></el-input>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-form-item label="个人简介" prop="bio">
                    <el-input
                        v-model="personalInfo.bio"
                        type="textarea"
                        :rows="4"
                        resize="vertical"
                        placeholder="请简要介绍您的专业领域、经验和擅长方向..."
                        maxlength="500"
                        show-word-limit
                    ></el-input>
                  </el-form-item>

                  <el-button
                      type="primary"
                      native-type="submit"
                      icon="el-icon-check"
                      class="submit-btn"
                      :loading="loading.savingPersonalInfo"
                  >保存个人信息</el-button>
                </el-form>
              </div>

              <el-divider content-position="center">安全设置</el-divider>

              <div class="password-change">
                <h3><i class="el-icon-lock"></i> 修改密码</h3>
                <el-form
                  ref="passwordForm"
                  :model="password"
                  :rules="passwordRules"
                  @submit.native.prevent="changePassword"
                  class="password-form"
                  label-position="top"
                  hide-required-asterisk
                >
                 <el-row :gutter="24">
                    <el-col :xs="24" :sm="8">
                      <el-form-item label="当前密码" prop="current">
                        <el-input
                            v-model="password.current"
                            type="password"
                            show-password
                            prefix-icon="el-icon-key"
                            placeholder="请输入当前使用的密码"
                        ></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8">
                      <el-form-item label="新密码" prop="new">
                        <el-input
                            v-model="password.new"
                            type="password"
                            show-password
                            prefix-icon="el-icon-unlock"
                            placeholder="请输入至少6位新密码"
                        >
                           <!-- 可选: 添加密码强度指示器 -->
                        </el-input>
                        <password
                          v-model="password.new"
                          :strength-meter-only="true"
                          @feedback="handlePasswordFeedback"
                          style="margin-top: 5px;"
                          ref="passwordStrengthMeter"
                        />

                    <!-- 7. 添加密码反馈显示区域 -->
                    <div class="password-feedback" v-if="password.new && (passwordFeedback.warning || passwordFeedback.suggestions.length > 0)">
                      <div v-if="passwordFeedback.warning" class="feedback-warning">
                        <i class="el-icon-warning-outline"></i> {{ passwordFeedback.warning }}
                      </div>
                      <ul v-if="passwordFeedback.suggestions.length > 0" class="feedback-suggestions">
                        <li v-for="(suggestion, index) in passwordFeedback.suggestions" :key="index">
                          <i class="el-icon-info"></i> {{ suggestion }}
                        </li>
                      </ul>
                    </div>
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8">
                      <el-form-item label="确认新密码" prop="confirm">
                        <el-input
                            v-model="password.confirm"
                            type="password"
                            show-password
                            prefix-icon="el-icon-circle-check"
                            placeholder="请再次输入新密码"
                        ></el-input>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-button
                      type="primary"
                      native-type="submit"
                      icon="el-icon-refresh-right"
                      class="submit-btn"
                      style="max-width: 200px;"
                      :loading="loading.changingPassword"
                  >确认修改密码</el-button>
                </el-form>
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>

      <!-- 报告模板设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h2><i class="el-icon-document-copy"></i> 报告模板管理</h2>
          <div>
             <el-tooltip content="刷新模板列表" placement="top">
               <el-button
                 icon="el-icon-refresh"
                 circle
                 size="small"
                 @click="fetchReportTemplates"
                 :loading="loading.templates"
                 style="margin-right: 10px;"
               ></el-button>
            </el-tooltip>
            <el-button
                @click="openTemplateModal()"
                type="primary"
                size="small"
                icon="el-icon-plus"
                :disabled="loading.templates"
            >新建模板</el-button>
          </div>
        </div>
         <el-skeleton :rows="3" animated :loading="loading.templates">
           <template #default>
             <div class="section-content">
               <el-alert
                 v-if="reportTemplates.length === 0"
                 title="暂无报告模板"
                 type="info"
                 description="您可以点击右上角的“新建模板”按钮来创建您的第一个报告模板。"
                 show-icon
                 :closable="false"
                 class="info-alert"
               ></el-alert>
               <el-table
                   v-else
                   :data="reportTemplates"
                   style="width: 100%"
                   highlight-current-row
                   :row-class-name="templateRowClassName"
                   empty-text="暂无模板数据"
                   class="template-table"
               >
                 <el-table-column prop="name" label="模板名称" min-width="150">
                   <template slot-scope="scope">
                     <span class="template-name">{{ scope.row.name }}</span>
                   </template>
                 </el-table-column>
                 <el-table-column prop="isDefault" label="是否默认" width="100" align="center">
                     <template slot-scope="scope">
                         <el-tag v-if="scope.row.isDefault" type="success" size="small" effect="dark">默认</el-tag>
                         <span v-else>-</span>
                     </template>
                 </el-table-column>
                 <el-table-column label="操作" width="200" align="center">
                   <template slot-scope="scope">
                      <el-tooltip content="编辑" placement="top">
                        <el-button
                            @click.stop="openTemplateModal(scope.row)"
                            type="text"
                            size="small"
                            icon="el-icon-edit"
                            aria-label="编辑模板"
                        ></el-button>
                      </el-tooltip>
                      <el-tooltip content="设为默认" placement="top">
                        <el-button
                            @click.stop="setAsDefaultTemplate(scope.row.id)"
                            type="text"
                            size="small"
                            :icon="scope.row.isDefault ? 'el-icon-star-on' : 'el-icon-star-off'"
                            :disabled="scope.row.isDefault || loading.settingDefaultTemplate === scope.row.id"
                            :loading="loading.settingDefaultTemplate === scope.row.id"
                            aria-label="设为默认模板"
                        ></el-button>
                      </el-tooltip>
                      <el-tooltip content="删除" placement="top">
                        <el-button
                            @click.stop="deleteTemplate(scope.row.id)"
                            type="text"
                            size="small"
                            icon="el-icon-delete"
                            class="delete-btn"
                            :disabled="loading.deletingTemplate === scope.row.id"
                            :loading="loading.deletingTemplate === scope.row.id"
                            aria-label="删除模板"
                        ></el-button>
                      </el-tooltip>
                   </template>
                 </el-table-column>
               </el-table>
             </div>
           </template>
         </el-skeleton>
      </div>

      <!-- 消息通知设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h2><i class="el-icon-message-solid"></i> 消息通知设置</h2>
           <el-tooltip content="刷新通知设置" placement="top">
             <el-button
               icon="el-icon-refresh"
               circle
               size="small"
               @click="fetchNotificationSettings"
               :loading="loading.notificationSettings"
             ></el-button>
          </el-tooltip>
        </div>
         <el-skeleton :rows="5" animated :loading="loading.notificationSettings">
           <template #default>
             <!-- 保持外层 v-if -->
             <div class="section-content" v-if="!loading.notificationSettings">
               <div class="notification-item">
                 <h3><i class="el-icon-bell"></i> 接收通知类型</h3>
                 <!-- 在 CheckboxGroup 上添加 v-if，确保 types 是数组 -->
                 <el-checkbox-group
                    v-if="notificationSettings && Array.isArray(notificationSettings.types)"
                    v-model="notificationSettings.types">
                   <el-row :gutter="15">
                     <el-col :xs="12" :sm="8" :md="6" v-for="type in notificationTypes" :key="type.value">
                       <el-checkbox :label="type.value" class="notification-checkbox">{{ type.label }}</el-checkbox>
                     </el-col>
                   </el-row>
                 </el-checkbox-group>
                 <!-- 可选: 添加调试或空状态提示 -->
                 <div v-else-if="!notificationSettings">Notification Settings not loaded yet.</div>
                 <div v-else-if="!Array.isArray(notificationSettings.types)">Notification types is not an array.</div>
                 <div v-if="!notificationTypes || notificationTypes.length === 0" style="color: var(--theme-text-secondary-color); font-size: 13px; margin-top: 10px;">暂无通知类型选项。</div>
               </div>

               <el-divider></el-divider>

               <div class="notification-item">
                  <h3><i class="el-icon-connection"></i> 通知渠道</h3>
                   <!-- 在 CheckboxGroup 上添加 v-if，确保 channels 是数组 -->
                  <el-checkbox-group
                    v-if="notificationSettings && Array.isArray(notificationSettings.channels)"
                    v-model="notificationSettings.channels">
                    <el-row :gutter="15">
                      <el-col :span="8" v-for="channel in notificationChannels" :key="channel.value">
                        <el-checkbox :label="channel.value" class="notification-checkbox">{{ channel.label }}</el-checkbox>
                      </el-col>
                    </el-row>
                  </el-checkbox-group>
                  <!-- 可选: 添加调试或空状态提示 -->
                  <div v-else-if="!notificationSettings">Notification Settings not loaded yet.</div>
                  <div v-else-if="!Array.isArray(notificationSettings.channels)">Notification channels is not an array.</div>
                  <div v-if="!notificationChannels || notificationChannels.length === 0" style="color: var(--theme-text-secondary-color); font-size: 13px; margin-top: 10px;">暂无通知渠道选项。</div>
              </div>

               <el-divider></el-divider>

               <!-- 通知频率部分 -->
               <div class="notification-item">
                 <h3><i class="el-icon-time"></i> 通知频率</h3>
                 <!-- 确保 notificationSettings 存在才渲染 RadioGroup -->
                 <el-radio-group v-if="notificationSettings" v-model="notificationSettings.frequency">
                   <el-radio label="immediately" class="notification-radio">即时通知</el-radio>
                   <el-radio label="daily" class="notification-radio">每日汇总</el-radio>
                   <el-radio label="weekly" class="notification-radio">每周汇总</el-radio>
                 </el-radio-group>
                 <div v-else>Frequency settings unavailable.</div>
               </div>

               <el-button
                   type="primary"
                   @click="saveNotificationSettings"
                   icon="el-icon-check"
                   class="submit-btn"
                   :loading="loading.savingNotificationSettings"
                   :disabled="!notificationSettings" <!-- 如果设置不存在，禁用保存按钮 -->
               >保存通知设置</el-button>
             </div>
             <div v-else style="text-align: center; padding: 20px; color: var(--theme-text-secondary-color);">
                正在加载通知设置...
             </div>
           </template>
        </el-skeleton>
      </div>
            
</div>
  </div>
    <!-- 新建/编辑模板模态框 -->
    <el-dialog
        :title="dialogTemplate.isEditing ? '编辑模板' : '新建模板'"
        :visible.sync="dialogTemplate.visible"
        width="60%"
        :close-on-click-modal="false"
        append-to-body
        custom-class="template-dialog"
        @closed="resetTemplateForm"
    >
      <el-form
        ref="templateForm"
        :model="dialogTemplate.form"
        :rules="templateRules"
        label-position="top"
        v-loading="loading.savingTemplate"
        hide-required-asterisk
      >
        <el-form-item label="模板名称" prop="name">
          <el-input v-model.trim="dialogTemplate.form.name" placeholder="为模板起一个清晰的名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="模板内容" prop="content">
          <el-input
              v-model="dialogTemplate.form.content"
              type="textarea"
              :rows="12"
              resize="vertical"
              placeholder="请输入模板内容..."
          ></el-input>
           <div class="template-hint">
             提示：您可以在模板内容中使用占位符（例如 `{patientName}`, `{diagnosis}`, `{consultationDate}` 等）。
             具体可用的变量取决于报告生成时的上下文数据，请参考相关文档或示例。
           </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogTemplate.visible = false" :disabled="loading.savingTemplate">取 消</el-button>
        <el-button type="primary" @click="saveTemplate" :loading="loading.savingTemplate">
          {{ loading.savingTemplate ? '保存中...' : '确 定' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import Password from 'vue-password-strength-meter';
// 导入 API 服务模块 (假设你创建了这样一个文件)
import apiService from '@/api/settingsService'; // 路径需要根据你的项目结构调整
import defaultHeadshot from '@/assets/head.jpg';
const DEFAULT_AVATAR_URL = defaultHeadshot;
// --- 常量定义 ---
// const DEFAULT_AVATAR_URL = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';


export default {
  name: 'DoctorSettings',
  components: { Password },
  data() {
    // 密码确认验证器
    const validatePassConfirm = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入新密码'));
      } else if (value !== this.password.new) {
        callback(new Error('两次输入的新密码不一致!'));
      } else {
        callback();
      }
    };
    const notificationTypesData = [
      { value: 'appointment', label: '预约提醒' },
      { value: 'patient_message', label: '患者消息' },
      { value: 'system_alert', label: '系统警报' },
      { value: 'medical_update', label: '医疗更新' },
      { value: 'report_ready', label: '报告完成' },
      { value: 'announcement', label: '公告通知' }
    ];
    const notificationChannelsData = [
        { value: 'email', label: '电子邮件' },
        { value: 'sms', label: '短信 (SMS)' },
        { value: 'app', label: '应用内消息' }
    ];
    return {
      personalInfo: {
        name: '吕医生', // 默认值
        title: '主治医师',     // 默认值
        department: '心血管内科', // 默认值
        hospital: '山西省中医院',// 默认值
        bio: '擅长高血压、冠心病、心力衰竭的诊断与治疗，尤其在介入治疗方面有丰富经验。' // 默认值
      },
      // 头像：初始使用默认头像 URL
      avatarUrl: DEFAULT_AVATAR_URL,
      avatarPreviewUrl: null, // 用于存储本地选择的头像预览 URL
      defaultAvatar: DEFAULT_AVATAR_URL,

      // 报告模板：提供一个或多个默认/示例模板，API加载后会被覆盖
      reportTemplates: [
                // 默认模板1：标准随访报告
                {
                  id: 'frontend-default-followup', // 唯一的临时前端ID
                  name: '标准随访报告模板', // 更明确的名称
                  content: `【患者基本信息】
        姓名：{patientName}
        病历号：{medicalRecordNumber}
        随访日期：{followUpDate}

        【主要诊断】
        {diagnosis}

        【本次随访详情】
        主观感受与症状变化：
        生命体征：BP: ___/__ mmHg, HR: __ bpm, RR: __ bpm, T: __ °C
        体格检查要点：
        相关辅助检查结果（如近期化验、影像学）：

        【病情评估】
        当前病情稳定/改善/进展情况：
        治疗效果评价：
        存在问题：

        【治疗计划与建议】
        药物调整：
        非药物治疗建议（饮食、运动等）：
        下一步检查或治疗计划：
        复诊时间与注意事项：{nextAppointmentInfo}

        医师签名：{doctorName}
        日期：{currentDate}`, // 更结构化、包含更多常用占位符的内容
                  isDefault: true, // 第一个设为默认
                  _isFrontendDefault: true // 标记是前端默认值
                },
                // 默认模板2：首次诊疗记录
                {
                  id: 'frontend-default-initial', // 唯一的临时前端ID
                  name: '首次诊疗记录模板', // 明确的名称
                  content: `【患者基本信息】
        姓名：{patientName}
        性别：{patientGender}
        年龄：{patientAge}
        就诊日期：{consultationDate}
        联系方式：{patientContact}

        【主诉】
        {chiefComplaint} （持续时间：___）

        【现病史】
        起病情况、症状演变、伴随症状、诊疗经过等。

        【既往史】
        疾病史：(高血压/糖尿病/心脏病/手术史/过敏史等)
        个人史/家族史：（若相关）

        【体格检查】
        一般情况：
        系统检查要点：（心、肺、腹等）

        【辅助检查】
        （若有初诊时已完成的检查结果）

        【初步诊断】
        1. {preliminaryDiagnosis1}
        2. {preliminaryDiagnosis2}

        【处理意见】
        进一步检查建议：
        治疗方案：
        健康教育与生活指导：
        随访建议：

        医师签名：{doctorName}
        日期：{currentDate}`, // 适合初诊的结构和占位符
                  isDefault: false,
                  _isFrontendDefault: true // 标记是前端默认值
                }
        // 您可以根据需要添加更多前端默认模板
      ],
      password: { current: '', new: '', confirm: '' },
      passwordFeedback: {
        suggestions: [],
        warning: ''
      },
      // defaultTemplate: null, // 不再需要，isDefault 直接在 reportTemplates 对象中

      dialogTemplate: {
          visible: false,
          isEditing: false,
          form: { id: null, name: '', content: '' } // 使用 content 字段
      },

      notificationTypes: notificationTypesData,
      notificationChannels: notificationChannelsData, // 新增渠道数据
      notificationSettings: { types: [], channels: [], frequency: 'immediately' },

      // Loading states - 更细粒度
      loading: {
        personalInfo: false,
        savingPersonalInfo: false,
        avatarAction: false, // 合并头像上传和移除的加载状态
        changingPassword: false,
        templates: false,
        savingTemplate: false,
        // loading.settingDefaultTemplate 和 loading.deletingTemplate 改用 settingTemplateId 和 deletingTemplateId
        settingDefaultTemplate: null, // ID of template being set as default
        deletingTemplate: null,    // ID of template being deleted
        notificationSettings: false,
        savingNotificationSettings: false,
      },

      // Validation Rules
      personalInfoRules: {
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        title: [{ required: true, message: '请输入职称', trigger: 'blur' }],
        department: [{ required: true, message: '请输入科室', trigger: 'blur' }],
        hospital: [{ required: true, message: '请输入医院', trigger: 'blur' }],
      },
      passwordRules: {
        current: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
        new: [
            { required: true, message: '请输入新密码', trigger: 'blur' },
            { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
            // 可选：添加更复杂的密码强度校验规则
        ],
        confirm: [
            { required: true, message: '请确认新密码', trigger: 'blur' },
            { validator: validatePassConfirm, trigger: 'blur' }
        ]
      },
      templateRules: {
          name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
          content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }], // 验证 content
      }
    }
  },
  computed: {
    /**
     * 判断当前头像是否为默认头像
     */
    isDefaultAvatar() {
      return this.avatarUrl === this.defaultAvatar;
    },
    displayAvatarUrl() {
        return this.avatarPreviewUrl || this.avatarUrl;
    }
  },
  async mounted() {
    // 使用 created 或者 mounted 都可以，mounted 确保 DOM 已挂载
    await this.loadInitialData();
  },
  methods: {
    handlePasswordFeedback({ suggestions, warning }) {
      this.passwordFeedback.suggestions = suggestions || [];
      this.passwordFeedback.warning = warning || '';
    },
    // --- 数据加载方法 ---
    async loadInitialData() {
      console.log("Loading initial settings data from backend...");
      // 设置加载状态
      this.loading.personalInfo = true;
      this.loading.templates = true;
      this.loading.notificationSettings = true;
      try {
         // 并行获取所有数据
         await Promise.all([
           this.fetchPersonalInfo(),
           this.fetchReportTemplates(),
           this.fetchNotificationSettings(),
         ]);
         console.log("Backend data loaded successfully.");
      } catch (error) {
         console.error("Error loading initial data:", error);
         this.$message.error('加载页面初始数据时出错，部分信息可能未能更新，请尝试刷新');
      } finally {
         // 确保所有加载状态都已解除
         this.loading.personalInfo = false;
         this.loading.templates = false;
         this.loading.notificationSettings = false;
      }
    },

    async fetchPersonalInfo() {
      // 不再设置 loading.personalInfo = true; 因为 loadInitialData 已经设置
      try {
        const response = await apiService.getUserInfo();
        if (response && response.data) {
            // 使用从后端获取的数据覆盖前端默认值
            this.personalInfo = {
                name: response.data.name || this.personalInfo.name, // 保留默认值以防后端没给
                title: response.data.title || this.personalInfo.title,
                department: response.data.department || this.personalInfo.department,
                hospital: response.data.hospital || this.personalInfo.hospital,
                bio: response.data.bio || this.personalInfo.bio
            };
            // 更新头像 URL，如果后端提供了的话
            this.avatarUrl = response.data.avatar || this.defaultAvatar;
            // 清除可能存在的旧预览
            this.avatarPreviewUrl = null;
            console.log("User info updated from backend:", this.personalInfo);
        } else {
             // 不抛出错误，允许保留前端默认值，但给个警告
             console.warn('获取用户信息失败或格式错误，将保留现有信息');
             // this.$message.warning('未能从服务器更新个人信息'); // 可选提示
        }
      } catch (error) {
        console.error("Error fetching personal info:", error);
        this.showError('加载个人信息失败', error);
        // 出错时不改变现有（可能是默认的）个人信息
      }
      // 不再设置 loading.personalInfo = false; 由 loadInitialData 控制
    },
    async fetchReportTemplates() {
      // 不再设置 loading.templates = true;
      try {
        const response = await apiService.getReportTemplates();
        // 只有当后端成功返回数据时才覆盖前端默认模板
        if (response && Array.isArray(response)) {
            this.reportTemplates = response; // 直接用后端数据替换
            console.log("Report templates updated from backend:", this.reportTemplates);
        } else {
            console.warn('获取报告模板失败或格式错误，将保留前端示例模板');
            // this.$message.warning('未能从服务器更新报告模板列表'); // 可选提示
        }
      } catch (error) {
        console.error("Error fetching report templates:", error);
        this.showError('加载报告模板失败', error);
        // 出错时不改变现有（可能是默认的）模板列表
      }
      // 不再设置 loading.templates = false;
    },
    async fetchNotificationSettings() {
  this.loading.notificationSettings = true;
  try {
    const responseData = await apiService.getNotificationSettings(); // 假设 apiService 直接返回 data

    // --- 添加详细日志 ---
    console.log("从 API 收到的原始通知设置数据:", responseData);
    if (responseData && typeof responseData === 'object') {
        console.log("收到的 settings.types 的类型:", Array.isArray(responseData.types) ? 'Array' : typeof responseData.types);
        console.log("收到的 settings.channels 的类型:", Array.isArray(responseData.channels) ? 'Array' : typeof responseData.channels);

        // --- 在赋值前增加健壮性检查 ---
        // 确保 types 和 channels 是数组，如果不是，则使用默认空数组
        const sanitizedSettings = {
            types: Array.isArray(responseData.types) ? responseData.types : [],
            channels: Array.isArray(responseData.channels) ? responseData.channels : [],
            frequency: responseData.frequency || 'immediately' // 保留 frequency 或使用默认值
        };
        console.log("清理后准备赋值的通知设置:", JSON.stringify(sanitizedSettings));
        this.notificationSettings = sanitizedSettings; // 使用清理后的数据赋值

    } else {
         console.warn('获取通知设置失败或返回的数据不是对象，将使用默认设置');
         // 保持或重置为初始默认值
         this.notificationSettings = { types: [], channels: [], frequency: 'immediately' };
    }
    // --- 日志和检查结束 ---

    // console.log("Notification settings updated from backend:", this.notificationSettings); // 这行日志可以移到赋值之后或保留

  } catch (error) {
    console.error("Error fetching notification settings:", error);
    this.showError('加载通知设置失败', error);
    // 出错时也确保是默认值
    this.notificationSettings = { types: [], channels: [], frequency: 'immediately' };
  } finally {
    this.loading.notificationSettings = false;
  }
},
    // --- 头像处理 ---
    triggerAvatarUpload() {
      if (this.loading.avatarAction) return;
      this.$refs.avatarInput.click();
    },
    handleAvatarChange(event) { // 修改：增加预览
      const file = event.target.files[0];
      if (!file) {
        // 如果用户取消了选择，清除预览
        this.avatarPreviewUrl = null;
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isLt10M = file.size / 1024 / 1024 < 10;

      if (!isImage) return this.$message.error('请上传图片格式文件 (png, jpg, jpeg, gif)');
      if (!isLt10M) return this.$message.error(`上传头像图片大小不能超过 ${10}MB!`);

      // 1. 显示预览图
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreviewUrl = e.target.result; // 设置预览 URL
      };
      reader.readAsDataURL(file);

      // 2. 准备上传 (用户可能只想预览，不立即上传，这里我们还是选择后就上传)
      this.uploadSelectedAvatar(file);

      // 重置 input，以便可以再次选择同一个文件 (移到上传逻辑后)
      // if (this.$refs.avatarInput) this.$refs.avatarInput.value = null;
    },
    async uploadSelectedAvatar(file) { // 新增：分离上传逻辑
        this.loading.avatarAction = true;
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiService.uploadUserAvatar(formData);
            if (response && response.success) {
                this.avatarUrl = response.url; // 更新真实的头像 URL
                this.avatarPreviewUrl = null; // 上传成功后清除预览 URL
                this.$message.success('头像更换成功');
            } else {
                throw new Error(response?.message || '头像上传失败');
            }
        } catch (error) {
            console.error("Avatar upload error:", error);
            this.showError('头像上传失败', error);
            // 上传失败，可以选择保留预览或清除
            // this.avatarPreviewUrl = null; // 如果希望失败后清除预览
        } finally {
            this.loading.avatarAction = false;
            // 重置 input 放在 finally 里确保执行
            if (this.$refs.avatarInput) this.$refs.avatarInput.value = null;
        }
    },
    async removeAvatar() {
      if (this.isDefaultAvatar && !this.avatarPreviewUrl) return; // 如果已经是默认且无预览，则不操作

      this.$confirm('确定要移除当前头像吗？将恢复为默认头像。', '确认操作', {
        confirmButtonText: '确定移除',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'confirm-dialog-themed'
      }).then(async () => {
          this.loading.avatarAction = true;
          try {
            const response = await apiService.removeUserAvatar();
            if (response && response.success) {
              this.avatarUrl = this.defaultAvatar; // 恢复到默认 URL
              this.avatarPreviewUrl = null; // 清除预览
              this.$message.success('头像已移除');
            } else {
              throw new Error(response?.message || '移除头像失败');
            }
          } catch (error) {
            console.error("Avatar removal error:", error);
            this.showError('移除头像失败', error);
          } finally {
            this.loading.avatarAction = false;
          }
      }).catch(() => {
         // 如果用户取消移除，但之前有预览图，需要清除预览
         if (this.avatarPreviewUrl) {
             this.avatarPreviewUrl = null;
         }
         this.$message.info('已取消操作');
      });
    },

    // --- 个人信息 ---
    // --- 个人信息 ---
savePersonalInfo() {
  this.$refs.personalInfoForm.validate(async (valid) => {
    if (!valid) {
      return this.$message.warning('请检查表单信息是否填写完整且有效');
    }
    this.loading.savingPersonalInfo = true;
    try {
      const dataToSave = {
        name: this.personalInfo.name,
        title: this.personalInfo.title,
        department: this.personalInfo.department,
        hospital: this.personalInfo.hospital,
        bio: this.personalInfo.bio,
      };
      const response = await apiService.saveUserInfo(dataToSave);

      // --- 修正这里的判断条件 ---
      if (response && response.data && response.data.code === 100) { // 检查 response.data.code
        this.$message.success('个人信息保存成功');
        // 可选：如果后端在 response.data.data 中返回了更新后的数据，可以在这里更新本地数据
        // if (response.data.data) { ... }
      } else {
         // --- 改进错误消息处理 ---
         // 优先使用后端返回的 msg 或 error 字段
         const errorMessage = response?.data?.msg || response?.data?.error || response?.msg || response?.error || '个人信息保存失败';
         throw new Error(errorMessage);
      }
      // --- 修正结束 ---

    } catch (error) {
      console.error("保存个人信息错误:", error);
      this.showError('保存个人信息失败', error);
    } finally {
      this.loading.savingPersonalInfo = false;
    }
  });
},
        // --- 修改密码 ---
changePassword() {
  this.$refs.passwordForm.validate(async (valid) => {
    if (!valid) {
       return this.$message.warning('请检查密码信息是否填写正确');
    }
    this.loading.changingPassword = true;
    try {
      const response = await apiService.changeUserPassword({
          current: this.password.current,
          new: this.password.new
      });

      // --- 修改这里的判断条件 ---
      if (response && response.data && response.data.success) { // 检查 response.data.success
          this.$message.success('密码修改成功，请妥善保管新密码');
          this.$refs.passwordForm.resetFields();
          this.passwordFeedback = { suggestions: [], warning: '' }; // 清空密码反馈
      } else {
           // 如果后端返回了错误信息，优先使用
           const errorMessage = response?.data?.message || response?.data?.error || response?.message || response?.error || '密码修改失败';
           throw new Error(errorMessage);
      }
      // --- 修改结束 ---

    } catch (error) {
      console.error("Change password error:", error);
      // 保持现有的错误处理逻辑，它现在能接收到更准确的错误消息
       if (error.message && (error.message.includes('当前密码错误') || error.message.toLowerCase().includes('current password incorrect'))) {
            this.showError('当前密码错误，请重新输入', null, 'warning');
       } else {
           this.showError('修改密码失败', error);
       }
    } finally {
      this.loading.changingPassword = false;
    }
  });
},

    templateRowClassName({ row }) {
      return row.isDefault ? 'default-template-row' : '';
    },
    openTemplateModal(template = null) {
      if (template) {
        // 编辑：确保从最新的 reportTemplates 数组中获取数据
        const currentTemplateData = this.reportTemplates.find(t => t.id === template.id);
        if (currentTemplateData) {
            this.dialogTemplate.isEditing = true;
            // 深拷贝一份数据到表单，避免直接修改原始数组中的对象
            this.dialogTemplate.form = JSON.parse(JSON.stringify(currentTemplateData));
        } else {
            // 如果在数组中找不到（理论上不应发生），则提示错误并阻止打开
            this.$message.error('无法找到要编辑的模板数据');
            return;
        }
      } else {
        // 新建：重置表单（将在 @closed 中完成，这里确保状态正确）
        this.dialogTemplate.isEditing = false;
        // this.resetTemplateForm(); // reset 在 @closed 中做
      }
      this.dialogTemplate.visible = true;
      // 清除上次可能遗留的验证错误信息
      this.$nextTick(() => {
        if (this.$refs.templateForm) {
          this.$refs.templateForm.clearValidate();
        }
      });
    },
    resetTemplateForm() {
      // 重置对话框表单为其初始状态
      this.dialogTemplate.form = { id: null, name: '', content: '' };
      this.dialogTemplate.isEditing = false; // 确保编辑状态也重置
      // 如果表单仍在DOM中（理论上在关闭后还在），尝试重置字段状态
      if (this.$refs.templateForm) {
        this.$refs.templateForm.resetFields();
      }
    },
    async setAsDefaultTemplate(id) {
      const template = this.reportTemplates.find(t => t.id === id);
      if (!template || template.isDefault || this.loading.settingDefaultTemplate) return;

      // 检查是否是前端默认模板，如果是，可能需要提示用户先保存或与后端交互
      if (template._isFrontendDefault) {
          this.$message.info('此为示例模板，请先创建或编辑为您的实际模板后再设为默认。');
          return;
      }

      this.loading.settingDefaultTemplate = id;
      try {
        const response = await apiService.setDefaultReportTemplate({ templateId: id });
        if (response && response.success) {
          // 更新本地数据
          this.reportTemplates = this.reportTemplates.map(t => ({
              ...t,
              isDefault: t.id === id
          }));
          this.$message.success(`模板 "${template.name}" 已设为默认`);
        } else {
            throw new Error(response?.message || '设置默认模板失败');
        }
      } catch (error) {
        console.error("Set default template error:", error);
        this.showError('设置默认模板失败', error);
      } finally {
        this.loading.settingDefaultTemplate = null;
      }
    },
    deleteTemplate(id) {
      const template = this.reportTemplates.find(t => t.id === id);
      if (!template) return;

      // 检查是否是前端默认模板
      if (template._isFrontendDefault) {
          // 对于前端默认模板，直接从数组移除，不调用 API
          const index = this.reportTemplates.findIndex(t => t.id === id);
          if (index !== -1) {
              this.reportTemplates.splice(index, 1);
              this.$message.success(`示例模板 "${template.name}" 已移除`);
          }
          return;
      }

      // 对于后端模板，走确认流程和 API 调用
      this.$confirm(`确定要删除模板 "${template.name}" 吗? 此操作无法撤销。`, '确认删除', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'confirm-dialog-themed'
      }).then(async () => {
        this.loading.deletingTemplate = id;
        try {
          const response = await apiService.deleteReportTemplate(id);
          // DELETE 成功通常返回 204 No Content, 检查状态码或后端自定义的成功标志
          if (response && (response.status === 204 || response.success)) {
              const index = this.reportTemplates.findIndex(t => t.id === id);
              if (index !== -1) {
                  this.reportTemplates.splice(index, 1);
              }
              this.$message.success(`模板 "${template.name}" 删除成功`);
          } else {
               throw new Error(response?.message || '模板删除失败');
          }
        } catch(error) {
            console.error("Delete template error:", error);
            this.showError('删除模板失败', error);
        } finally {
           this.loading.deletingTemplate = null;
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    saveTemplate() {
      this.$refs.templateForm.validate(async (valid) => {
        if (!valid) {
          return this.$message.warning('请检查模板信息是否填写完整');
        }
        this.loading.savingTemplate = true;
        try {
          const dataToSend = {
             id: this.dialogTemplate.form.id, // null for new, id for update
             name: this.dialogTemplate.form.name,
             // 假设后端期望的字段是 content_raw 或 content
             content: this.dialogTemplate.form.content,
             // content_raw: this.dialogTemplate.form.content,
             // category: this.dialogTemplate.form.category // 如果有分类
          };

          let response;
          if (this.dialogTemplate.isEditing) {
              // 检查是否在编辑前端默认模板
              if (dataToSend.id && String(dataToSend.id).startsWith('frontend-default-')) {
                  // 如果编辑的是前端模板，视为新建一个真实模板
                  dataToSend.id = null; // 清除临时ID，让后端创建新的
                  response = await apiService.createReportTemplate(dataToSend);
                  this.dialogTemplate.isEditing = false; // 操作性质变为创建
              } else {
                  response = await apiService.updateReportTemplate(dataToSend.id, dataToSend);
              }
          } else {
              response = await apiService.createReportTemplate(dataToSend);
          }

          // 处理响应，假设成功时返回 { data: { id: ..., name: ..., content: ..., isDefault: ... } }
          if (response && response.data && (response.status === 200 || response.status === 201)) {
              const savedTemplate = response.data; // 后端返回的数据结构可能需要适配

              // 如果是编辑操作，替换原有的；如果是创建操作（或编辑前端模板转创建），添加新的
              const originalId = this.dialogTemplate.form.id; // 获取操作前的 ID

              if (this.dialogTemplate.isEditing && originalId && !String(originalId).startsWith('frontend-default-')) {
                  // 真实编辑
                  const index = this.reportTemplates.findIndex(t => t.id === savedTemplate.id);
                  if (index !== -1) {
                      this.reportTemplates.splice(index, 1, savedTemplate);
                  } else {
                      // 如果没找到旧的（理论上不应该），就当作新的添加
                      this.reportTemplates.push(savedTemplate);
                  }
              } else {
                   // 新建 或 编辑前端模板转新建
                   // 如果是从编辑前端模板转过来的，需要移除原来的前端模板
                   if(originalId && String(originalId).startsWith('frontend-default-')){
                       const frontendIndex = this.reportTemplates.findIndex(t => t.id === originalId);
                       if(frontendIndex !== -1) {
                           this.reportTemplates.splice(frontendIndex, 1);
                       }
                   }
                  this.reportTemplates.push(savedTemplate);
              }

              this.$message.success(`模板 "${savedTemplate.name}" ${this.dialogTemplate.isEditing ? '更新' : '创建'}成功`);
              this.dialogTemplate.visible = false;
          } else {
              throw new Error(response?.data?.error || response?.message || `模板${this.dialogTemplate.isEditing ? '更新' : '创建'}失败`);
          }
        } catch(error) {
            console.error("Save template error:", error);
            this.showError(`保存模板失败`, error);
        } finally {
            this.loading.savingTemplate = false;
        }
      });
    },

    // --- 通知设置 ---
    async saveNotificationSettings() {
  this.loading.savingNotificationSettings = true;
  try {
    // 添加日志，检查发送的数据
    console.log("准备发送的通知设置:", JSON.stringify(this.notificationSettings));
    const response = await apiService.saveNotificationSettings(this.notificationSettings);

    // --- 修正这里的判断条件 ---
    if(response && response.data && response.data.success) { // 应该检查 response.data.success
        this.$message.success('通知设置保存成功');
    } else {
        // --- 改进错误消息处理 ---
        const errorMessage = response?.data?.message || response?.data?.error || response?.message || response?.error || '通知设置保存失败';
        throw new Error(errorMessage);
    }
    // --- 修正结束 ---

  } catch (error) {
    console.error("Save notification settings error:", error);
    // 这里的 showError 现在能获取更准确的错误信息（包括后端返回的400错误信息）
    this.showError('保存通知设置失败', error);
  } finally {
    this.loading.savingNotificationSettings = false;
  }
},

    // --- 通用错误处理 ---
    showError(defaultMessage, error = null, type = 'error') {
        let message = defaultMessage;
        if (error?.response?.data?.error) {
            message = error.response.data.error;
        } else if (error?.response?.data?.msg) {
            message = error.response.data.msg;
        } else if (error?.message) {
            if (!error.message.toLowerCase().includes('status code') && !error.message.toLowerCase().includes('network error')) {
               message = error.message;
            } else if (error.message.toLowerCase().includes('network error')) {
                message = "网络连接错误，请检查您的网络";
            }
            // 对于状态码错误，保留 defaultMessage 可能更好
        }
        this.$message({ message, type, duration: type === 'error' ? 5000 : 3000 }); // 错误消息显示长一点
    }
  },

  // 清理：组件销毁前清除 FileReader 可能产生的对象 URL (如果使用 createObjectURL)
  // 对于 readAsDataURL 生成的 data URI，通常不需要手动清理
  // beforeDestroy() {
  //   if (this.avatarPreviewUrl && this.avatarPreviewUrl.startsWith('blob:')) {
  //     URL.revokeObjectURL(this.avatarPreviewUrl);
  //   }
  // }
}
</script>

<style> /* Use non-scoped styles for overriding Element UI globally if needed, or scoped with deep selectors */
.el-button [class*="el-icon-"]+span {
    margin-left: 5px; /* 给按钮图标和文字之间加点间距 */
}
.el-table .template-name {
  font-weight: 500; /* 让模板名称更突出一点 */
}
.el-skeleton {
  padding: 10px; /* 给骨架屏一点内边距 */
}
/* Global Theme Variables (optional, or define in a separate CSS/SCSS file) */
:root {
  --theme-color-primary: #8DD1FE;
  --theme-color-primary-light: #a7ddff;
  --theme-color-primary-dark: #6ab0db;
  --theme-bg-medium: rgba(16, 32, 67, 0.6); /* Section background */
  --theme-bg-light: rgba(25, 45, 80, 0.4); /* Input/hover background */
  --theme-border-color: rgba(141, 209, 254, 0.3);
  --theme-border-color-heavy: rgba(141, 209, 254, 0.5);
  --theme-text-color: #c0dfff; /* Slightly lighter text for better contrast */
  --theme-text-secondary-color: #a0c4e0;
  --theme-glow-color: rgba(141, 209, 254, 0.4);
}

/* Apply theme to common Element UI components */
.doctor-settings-container .el-input__inner,
.doctor-settings-container .el-textarea__inner {
  background-color: var(--theme-bg-light);
  border: 1px solid var(--theme-border-color);
  color: var(--theme-text-color);
  transition: border-color 0.3s, box-shadow 0.3s;
}
.doctor-settings-container .el-input__inner::placeholder,
.doctor-settings-container .el-textarea__inner::placeholder {
  color: var(--theme-text-secondary-color);
  opacity: 0.7;
}
.doctor-settings-container .el-input__inner:focus,
.doctor-settings-container .el-textarea__inner:focus {
  border-color: var(--theme-color-primary);
  box-shadow: 0 0 8px var(--theme-glow-color);
}
.doctor-settings-container .el-input__icon,
.doctor-settings-container .el-input__prefix i,
.doctor-settings-container .el-input__suffix i {
    color: var(--theme-text-secondary-color);
}
.doctor-settings-container .el-textarea .el-input__count {
    background-color: transparent;
    color: var(--theme-text-secondary-color);
}


.doctor-settings-container .el-form-item__label {
  color: var(--theme-color-primary) !important;
  padding-bottom: 4px; /* Better spacing */
  line-height: 1.4;
}

.doctor-settings-container .el-button {
    transition: background-color 0.3s, border-color 0.3s, color 0.3s, box-shadow 0.3s;
}

.doctor-settings-container .el-button--primary {
  background-color: transparent;
  border: 1px solid var(--theme-color-primary);
  color: var(--theme-color-primary);
}
.doctor-settings-container .el-button--primary:hover,
.doctor-settings-container .el-button--primary:focus {
  background-color: rgba(141, 209, 254, 0.1);
  border-color: var(--theme-color-primary-light);
  color: var(--theme-color-primary-light);
  box-shadow: 0 0 10px var(--theme-glow-color);
}
.doctor-settings-container .el-button--primary:active {
   background-color: rgba(141, 209, 254, 0.2);
   border-color: var(--theme-color-primary-dark);
   color: var(--theme-color-primary-dark);
}
.doctor-settings-container .el-button--primary.is-disabled {
    background-color: transparent;
    border-color: var(--theme-border-color);
    color: var(--theme-text-secondary-color);
    opacity: 0.6;
}

.doctor-settings-container .el-button--text {
    color: var(--theme-color-primary-light);
}
.doctor-settings-container .el-button--text:hover,
.doctor-settings-container .el-button--text:focus {
    color: #fff;
}
.doctor-settings-container .el-button--text.delete-btn,
.doctor-settings-container .el-button--text.remove-avatar-btn {
    color: #ff7676;
}
.doctor-settings-container .el-button--text.delete-btn:hover,
.doctor-settings-container .el-button--text.remove-avatar-btn:hover {
    color: #ff9a9a;
}
.doctor-settings-container .el-button--text.is-disabled {
    color: var(--theme-text-secondary-color);
    opacity: 0.5;
}

/* Table Styles */
.doctor-settings-container .template-table,
.doctor-settings-container .el-table {
  background: transparent;
  color: var(--theme-text-color);
  border: 1px solid var(--theme-border-color); /* Add border */
  border-radius: 4px;
  overflow: hidden; /* Ensure border radius applies */
}

.doctor-settings-container .el-table::before { /* Hide default bottom border */
  height: 0px;
}
.doctor-settings-container .el-table th {
  background-color: rgba(16, 32, 67, 0.5);
  color: var(--theme-color-primary);
  border-bottom: 1px solid var(--theme-border-color-heavy); /* Stronger header border */
  font-weight: 600;
}
.doctor-settings-container .el-table td {
    border-bottom: 1px solid var(--theme-border-color);
    color: var(--theme-text-color);
    padding: 10px 0; /* Adjust padding */
}
.doctor-settings-container .el-table tr {
  background-color: transparent;
  transition: background-color 0.3s;
}
.doctor-settings-container .el-table tr:hover > td {
  background-color: rgba(141, 209, 254, 0.05); /* Subtle hover */
}
.doctor-settings-container .el-table .default-template-row > td {
  background-color: rgba(141, 209, 254, 0.1) !important; /* More prominent selection */
  font-weight: 500;
}
.doctor-settings-container .el-table .el-table__empty-block {
    background-color: transparent;
    color: var(--theme-text-secondary-color);
}

/* Dialog Styles */
.template-dialog {
  background: linear-gradient(145deg, var(--theme-bg-dark), #10284e);
  border: 1px solid var(--theme-border-color-heavy);
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}
.template-dialog .el-dialog__header {
  border-bottom: 1px solid var(--theme-border-color);
  padding: 15px 20px;
}
.template-dialog .el-dialog__title {
  color: var(--theme-color-primary);
  font-weight: 600;
}
.template-dialog .el-dialog__body {
  padding: 25px 20px;
  color: var(--theme-text-color);
}
.template-dialog .el-dialog__footer {
    border-top: 1px solid var(--theme-border-color);
    padding: 15px 20px;
    background-color: rgba(16, 32, 67, 0.3); /* Footer background */
}
.template-dialog .el-form-item__label {
    color: var(--theme-color-primary-light) !important;
}
.template-dialog .template-hint {
    font-size: 12px;
    color: var(--theme-text-secondary-color);
    margin-top: 8px;
    line-height: 1.5;
}

/* Checkbox & Radio Styles */
.doctor-settings-container .notification-checkbox .el-checkbox__input.is-checked .el-checkbox__inner,
.doctor-settings-container .notification-radio .el-radio__input.is-checked .el-radio__inner {
    background-color: var(--theme-color-primary);
    border-color: var(--theme-color-primary);
}
.doctor-settings-container .notification-checkbox .el-checkbox__inner,
.doctor-settings-container .notification-radio .el-radio__inner {
    background-color: var(--theme-bg-light);
    border-color: var(--theme-border-color);
    transition: all 0.3s;
}
.doctor-settings-container .notification-checkbox .el-checkbox__input.is-checked+.el-checkbox__label,
.doctor-settings-container .notification-radio .el-radio__input.is-checked+.el-radio__label {
    color: var(--theme-color-primary);
}
.doctor-settings-container .notification-checkbox .el-checkbox__label,
.doctor-settings-container .notification-radio .el-radio__label {
    color: var(--theme-text-color);
    transition: color 0.3s;
}

/* Divider */
.doctor-settings-container .el-divider {
  background-color: var(--theme-border-color);
  margin: 30px 0; /* More spacing */
}
.doctor-settings-container .el-divider__text {
    background-color: var(--theme-bg-dark); /* Match container BG */
    color: var(--theme-text-secondary-color);
    font-size: 14px;
    font-weight: 500;
    padding: 0 20px;
}

/* Alert */
.doctor-settings-container .info-alert {
    background-color: rgba(141, 209, 254, 0.1);
    border: 1px solid rgba(141, 209, 254, 0.2);
    margin-bottom: 20px;
}
.doctor-settings-container .info-alert .el-alert__title {
    color: var(--theme-color-primary);
}
.doctor-settings-container .info-alert .el-alert__description {
    color: var(--theme-text-color);
}
.doctor-settings-container .info-alert .el-alert__icon {
    color: var(--theme-color-primary);
}

/* Confirmation Dialog Theme */
.confirm-dialog-themed {
    background: linear-gradient(145deg, var(--theme-bg-dark), #10284e);
    border: 1px solid var(--theme-border-color-heavy);
}
.confirm-dialog-themed .el-message-box__title {
    color: var(--theme-color-primary);
}
.confirm-dialog-themed .el-message-box__content {
    color: var(--theme-text-color);
}
.confirm-dialog-themed .el-message-box__btns .el-button--primary {
     background-color: #c74242; /* Danger color for confirmation */
     border-color: #c74242;
     color: #fff;
}
.confirm-dialog-themed .el-message-box__btns .el-button--primary:hover {
     background-color: #d65f5f;
     border-color: #d65f5f;
}

</style>

<style scoped> 
.password-feedback {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.4;
}
.feedback-warning {
  color: #E6A23C; /* Element UI Warning color */
  margin-bottom: 5px;
  display: flex; /* 让图标和文字对齐 */
  align-items: center;
}
.feedback-warning i {
  margin-right: 4px;
  font-size: 14px; /* 调整图标大小 */
}
.feedback-suggestions {
  list-style: none;
  padding-left: 0;
  margin: 0;
  color: var(--theme-text-secondary-color); /* Use theme color */
}
.feedback-suggestions li {
  margin-bottom: 3px;
  display: flex; /* 让图标和文字对齐 */
  align-items: center;
}
.feedback-suggestions li i {
   margin-right: 4px;
   color: var(--theme-color-primary); /* Use theme color */
   font-size: 14px; /* 调整图标大小 */
}

/* 调整 el-form-item 的间距，为强度计和反馈留出空间 */
.password-change .el-form-item {
  /* 稍微减少默认的底部间距，如果需要的话 */
  margin-bottom: 18px;
}
/* 确保新密码输入框下方有足够空间 */
.password-change .el-form-item[prop="new"] {
   /* 可能需要比其他项更大的底部间距，取决于你的整体布局 */
   margin-bottom: 15px; /* 示例值，根据实际效果调整 */
}
/* 防止 Element UI 的错误提示和反馈信息重叠 */
.password-feedback + .el-form-item__error {
   padding-top: 4px;
}

/* --- 针对 vue-password-strength-meter 的样式微调 --- */
/* 你可能需要使用 /deep/ 或 ::v-deep 选择器来覆盖组件内部样式 */
/* 检查组件渲染后的实际类名 */
.password-change >>> .Password__strength-meter {
  /* 示例：调整默认外边距 */
  margin: 8px 0 5px 0;
}
.password-change >>> .Password__strength-meter--fill[data-score='0'] {
    background-color: #f56c6c; /* 弱 - Element UI Danger */
    width: 20%;
}
.password-change >>> .Password__strength-meter--fill[data-score='1'] {
    background-color: #e6a23c; /* 中 - Element UI Warning */
    width: 40%;
}
.password-change >>> .Password__strength-meter--fill[data-score='2'] {
    background-color: #e6a23c; /* 中强 - Element UI Warning (稍深或用主色) */
     /* background-color: #5a9fe4; */
    width: 60%;
}
.password-change >>> .Password__strength-meter--fill[data-score='3'] {
    background-color: #67c23a; /* 强 - Element UI Success */
     /* background-color: var(--theme-color-primary); */
    width: 80%;
}
.password-change >>> .Password__strength-meter--fill[data-score='4'] {
    background-color: #67c23a; /* 非常强 - Element UI Success */
     /* background-color: var(--theme-color-primary-dark); */
    width: 100%;
}
.submit-btn {
  min-width: 150px; /* 给保存按钮一个最小宽度 */
}

.template-hint {
  font-size: 12px;
  color: var(--theme-text-secondary-color);
  margin-top: 8px;
  line-height: 1.5;
  background-color: rgba(255, 255, 255, 0.05); /* 轻微背景 */
  padding: 5px 10px;
  border-radius: 4px;
}

.settings-section .section-header .el-button--small.is-circle {
    padding: 7px; /* 调整圆形按钮大小 */
}

.el-table .el-button--text {
   margin: 0 4px; /* 操作按钮之间加点间距 */
}/* Scoped styles for layout and specific element adjustments */
.doctor-settings-container {
  background: var(--theme-bg-dark); /* Use variable */
  width: 100%;
  min-height: 100vh; /* Ensure background covers viewport */
  padding: 30px 40px; /* Increased padding */
  box-sizing: border-box;
  color: var(--theme-text-color);
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

.header h1 {
  font-size: 32px; /* Larger title */
  margin: 0;
  padding: 10px 0;
  position: relative;
  display: inline-block;
  font-weight: 300; /* Lighter font weight */
  letter-spacing: 1px;
}

.highlight {
  color: var(--theme-color-primary);
  text-shadow: 0 0 15px var(--theme-glow-color);
  font-weight: 500; /* Slightly bolder highlight */
}

.settings-content {
  max-width: 1200px;
  margin: 0 auto;
}

.settings-section {
  background: var(--theme-bg-medium); /* Use variable */
  border-radius: 8px;
  padding: 25px 30px; /* Increased padding */
  margin-bottom: 35px;
  border: 1px solid var(--theme-border-color);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.3s ease;
}
.settings-section:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3), 0 0 15px rgba(141, 209, 254, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--theme-border-color);
}

.section-header h2 {
  margin: 0;
  font-size: 22px; /* Larger section title */
  display: flex;
  align-items: center;
  color: var(--theme-color-primary-light);
  font-weight: 500;
}

.section-header h2 i {
  margin-right: 12px;
  font-size: 24px; /* Larger icon */
}

.section-content {
  padding: 10px 5px; /* Fine-tune padding */
}

/* Profile Section Specific Layout */
.profile-top-section {
    display: flex;
    gap: 40px; /* Space between avatar and form */
    align-items: flex-start;
    margin-bottom: 30px;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-wrapper {
  position: relative;
  width: 140px; /* Larger Avatar */
  height: 140px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden; /* Ensure mask stays within bounds */
  border: 3px solid var(--theme-border-color); /* Thicker border */
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
.avatar-wrapper:hover {
    border-color: var(--theme-color-primary);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 0 0 15px var(--theme-glow-color);
}
.avatar-wrapper:hover .avatar-mask {
  opacity: 1;
}

.avatar {
  width: 100%;
  height: 100%;
  display: block; /* Remove potential inline spacing */
  object-fit: cover;
}
.avatar-wrapper .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--theme-bg-light);
    color: var(--theme-text-secondary-color);
    font-size: 40px;
}


.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  text-align: center;
}

.avatar-mask i {
  font-size: 30px;
  margin-bottom: 5px;
}
.avatar-mask span {
    font-size: 13px;
}

.info-form {
  flex-grow: 1; /* Form takes remaining space */
  margin-bottom: 0; /* Removed margin as it's within flex container now */
}

.submit-btn {
  width: 100%;
  margin-top: 15px;
  padding: 12px 20px; /* Larger button */
  font-size: 15px;
  font-weight: 500;
}


.password-change, .notification-item {
    margin-bottom: 25px;
}

.password-change h3,
.notification-item h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  color: var(--theme-color-primary-light);
  font-weight: 500;
}
.password-change h3 i,
.notification-item h3 i {
  margin-right: 10px;
  font-size: 20px;
}

.notification-checkbox, .notification-radio {
    margin-bottom: 10px; /* Space out checkboxes/radios */
    display: inline-block; /* Ensure proper layout */
    margin-right: 20px;
}


@media (max-width: 992px) {
    .profile-top-section {
        flex-direction: column;
        align-items: center;
        gap: 25px;
    }
    .info-form {
        width: 100%; /* Full width on smaller screens */
    }
     .avatar-wrapper {
        width: 120px;
        height: 120px;
    }
}

@media (max-width: 768px) {
  .doctor-settings-container {
      padding: 20px;
  }
  .settings-section {
      padding: 20px;
  }
  .header h1 {
      font-size: 26px;
  }
  .section-header h2 {
      font-size: 20px;
  }
   .password-form .el-col { /* Stack password fields */
       flex: 0 0 100% !important;
       max-width: 100% !important;
   }
   .notification-item .el-col { /* Adjust notification layout */
        flex: 0 0 50% !important;
        max-width: 50% !important;
   }
}

@media (max-width: 480px) {
   .notification-item .el-col { /* Stack notification checkboxes */
        flex: 0 0 100% !important;
        max-width: 100% !important;
   }
}

</style>