# 明眸八极,理光辨微: AI 驱动的眼疾辅助筛查与健康管理平台

[![项目状态](https://img.shields.io/badge/Status-Beta-orange)](https://shields.io/)
[![许可协议](https://img.shields.io/badge/License-MIT-brightgreen)](https://opensource.org/licenses/MIT)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-brightgreen?logo=vue.js)](https://v3.vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.x-brightgreen?logo=element-plus)](https://element-plus.org/)
[![PaddleClas](https://img.shields.io/badge/PaddleClas-2.x-orange?logo=paddlepaddle&logoColor=white)](https://github.com/PaddlePaddle/PaddleClas)
[![Docker](https://img.shields.io/badge/Docker-ready-blue?logo=docker&logoColor=white)](https://www.docker.com/)
[![贡献者友好](https://img.shields.io/badge/Contributions-welcome-brightgreen)](https://github.com/[您的用户名]/[您的仓库名]/CONTRIBUTING.md)
[![代码质量](https://img.shields.io/badge/Code%20Quality-A+-brightgreen)](https://sonarcloud.io/dashboard?id=[您的SonarCloud项目ID]) 
[![CI/CD Status](https://img.shields.io/badge/CI/CD-Passing-brightgreen)](https://[您的CI/CD平台链接]) 
[![Documentation](https://img.shields.io/badge/Documentation-Available-blueviolet)](https://[您的文档链接])

**项目愿景：**  **"明眸八极,理光辨微"** 致力于探索和实践人工智能在眼科健康领域的潜力，构建一个辅助眼疾初步筛查与日常健康管理的智能化平台。我们旨在提升公众对眼健康的关注度，为医疗专业人士提供便捷的辅助工具，共同守护光明未来。

**系统简介：**

**"明眸八极,理光辨微"** (Clairvoyance Eye Health Platform) 是一款基于深度学习技术的眼疾辅助筛查和健康管理系统。采用前后端分离的现代Web架构，系统提供医生端和患者端两种应用场景。核心的眼疾识别引擎基于 PaddlePaddle 深度学习框架及其图像分类库 PaddleClas 训练而成，能够对上传的眼部图像进行分析，辅助识别八种常见眼疾的特征。

**医生端 (专业版 - 辅助工具定位)：**  医生端定位为专业的辅助工具，旨在提升医生在病例管理和数据分析方面的工作效率。它提供患者信息管理、病例生命周期管理、基于AI的辅助诊断参考、数据分析与可视化报告等功能，**强调本系统提供的AI结果仅为医生的辅助参考，不能替代医生的专业临床诊断**。

**患者端 (自助检测版 - 初步筛查定位)：**  患者端定位为便捷的初步筛查工具和健康信息平台。患者可以通过简单的操作自助上传眼部图像，系统将快速进行初步筛查，并以创新性的八卦阵UI呈现筛查结果。同时，患者端还提供基于中医健康理念的初步养生建议和眼健康知识科普，帮助用户更好地了解自身眼部健康状况。**患者端提供的检测结果仅为初步筛查参考，不能作为医疗诊断的依据，如有任何眼部不适，请务必及时就医。**

**核心优势：**

* **AI 辅助筛查能力：**  集成基于 PaddleClas 训练的深度学习模型，能够对眼部图像进行分析，辅助初步筛查八种常见眼疾。
* **双端应用设计：**  医生端与患者端功能分离，分别满足专业医疗辅助和个人初步筛查与健康信息获取的需求。
* **融入中医健康理念：**  患者端结合中医健康养生理念，提供个性化的初步养生建议，提升用户健康管理意识。
* **现代化的技术栈：**  前端采用 Vue 3 + TypeScript + Element Plus 等前沿技术，后端采用 PaddleClas (Python) 深度学习框架，保证系统的性能、可维护性和可扩展性。
* **强大的数据分析能力：**  医生端提供多维度的数据分析与可视化功能，辅助医生进行病例回顾、趋势分析和科研探索。
* **重视数据安全与隐私保护：**  系统设计中充分考虑数据安全与隐私保护，采用多项安全措施，力求保障用户数据的安全。
* **用户友好的操作体验：**  双端界面设计简洁直观，操作流程便捷流畅，响应式布局支持多设备访问，提供良好的用户体验。
* **持续迭代与优化：**  项目团队将持续进行模型优化、功能迭代和用户体验改进，不断提升系统的性能和价值。

## 技术栈

* **前端 (Frontend):**
    * 框架: Vue 3
    * 语言: TypeScript
    * UI 组件库: Element Plus
    * 状态管理: Pinia
    * HTTP 请求: Axios
    * 路由: Vue Router
    * 构建工具: Vite
    * 可视化: ECharts
    * 国际化: i18n

* **后端 (Backend):**
    * 深度学习框架: PaddlePaddle, PaddleClas
    * 编程语言: Python
    * API 框架: Flask 或 FastAPI (推荐 FastAPI 以获得更佳性能)
    * 数据库:  MySQL (关系型数据库)
    * 缓存 (可选): Redis (用于提升性能，例如缓存模型预测结果、热点数据等)
    * 异步任务队列 (可选): Celery 或 Redis Queue (用于处理耗时任务，例如报告生成、数据分析等)

* **数据存储 (Data Storage):**
    * 生产环境: MySQL (关系型数据库，确保数据安全、可靠性和可扩展性)
    * 开发/测试环境: SQLite 或 文件存储 (轻量级，方便快速搭建)

* **模型训练与部署 (Model Training & Deployment):**
    * 深度学习平台: PaddlePaddle
    * 模型库: PaddleClas
    * 容器化: Docker
    * GPU 加速 (可选): CUDA, cuDNN (使用 GPU 加速模型训练和推理，提升性能)
    * 模型优化 (可选): PaddleSlim, 模型量化 (模型压缩和加速)
    * 模型服务部署 (可选): Paddle Serving, Docker 容器部署 (将模型部署为独立服务)

* **云平台 (Cloud Platform - 可选):**
    * 云服务提供商: AWS, Azure, GCP (根据实际需求选择云平台进行部署和扩展)
    * 云服务: 云服务器, 容器服务, 数据库服务, 存储服务, CDN 等

## 系统架构

### 总体框架

**"明眸八极,理光辨微"** 系统采用经典且成熟的前后端分离架构，旨在实现各功能模块的解耦、提升开发效率、增强系统可维护性和可扩展性。

* **前端应用 (Frontend Application):**  用户直接交互的界面，负责用户请求的发起、数据展示和用户交互逻辑处理。基于 Vue 3 全家桶构建，充分利用 TypeScript 的类型安全和 Element Plus 组件库的丰富性，打造现代、美观、高效的用户界面。
* **后端 API 服务 (Backend API Service):**  系统的核心业务处理层，负责接收前端请求，调用 PaddleClas 模型进行眼疾识别，处理业务逻辑，与数据库交互，并返回处理结果给前端。采用 Python 和 FastAPI 等高性能框架构建 RESTful API 服务，保证系统性能和高并发能力。
* **深度学习模型服务 (Deep Learning Model Service - 可选):**  PaddleClas 眼疾识别模型可以被封装为独立的微服务 (例如使用 Paddle Serving 或 Docker 容器部署)，通过 API 接口对外提供识别服务。这种架构实现了模型服务与业务逻辑的解耦，方便模型的热更新、版本管理和独立扩展。
* **数据持久化层 (Data Persistence Layer):**  负责数据的持久化存储和管理。采用高性能关系型数据库系统 (PostgreSQL 或 MySQL)，保障用户数据、病例数据等核心数据的安全性和访问效率。

### 系统模块

1. **医生端 (Doctor Portal - Professional Edition):**
    * **患者管理模块 (Patient Management Module):**  提供全面的患者信息管理功能，支持患者信息的录入、查询、编辑、分组、标签管理和导入导出。
    * **病例管理模块 (Case Management Module):**  提供高效的病例生命周期管理功能，支持病例的创建、编辑、存储、检索、归档和删除。支持患者眼部图像的上传、管理和标注，集成自动眼疾识别功能，支持医生添加诊断意见、医嘱和病程记录。
    * **智能辅助诊断模块 (AI-Assisted Diagnosis Module):**  集成 AI 辅助诊断功能，基于模型识别结果和病例信息，为医生提供初步诊断建议、相似病例参考和诊断依据的可视化解释，辅助医生进行更精准的诊断决策。
    * **报告生成与导出模块 (Report Generation & Export Module):**  提供灵活定制化的病例报告模板，支持一键生成符合医疗文档规范的病例报告，并支持导出 PDF 格式，方便医生打印、存档和与患者分享。
    * **数据分析与可视化模块 (Data Analysis & Visualization Module):**  提供强大的数据分析功能，支持多维度患者统计、眼疾分布分析、治疗效果评估等。采用 ECharts 等可视化库，将数据分析结果以图表形式直观展示，辅助医生进行医疗决策和科研分析。
    * **系统设置与权限管理模块 (System Settings & Access Control Module):**  提供完善的系统设置功能，包括医生个人信息管理、报告模板设置、用户角色和权限管理、系统日志管理和数据备份恢复等功能。

2. **患者端 (Patient Portal - Self-Detection Edition):**
    * **自助检测模块 (Self-Detection Module):**  引导用户上传左右眼图片，调用眼疾识别模型进行自动检测，并以创新性的八卦阵 UI 呈现检测结果。提供检测结果的通俗易懂的解读，并进行健康风险的初步评估。
    * **中医健康建议模块 (TCM Health Advice Module):**  集成中医健康理念，基于检测结果和用户基本信息，提供个性化的眼部保健、饮食调理、穴位按摩、生活习惯等中医健康建议。
    * **个人档案模块 (Personal Profile Module):**  提供个人信息管理功能，支持用户查看个人基本信息、检测历史记录、医生建议 (如与医生端关联) 和健康报告。
    * **健康知识库模块 (Health Knowledge Base Module):**  提供丰富的眼部保健知识、常见眼疾科普、预防和护理建议等内容，提升用户眼健康素养。健康知识内容以图文、视频等多种形式呈现，提升用户阅读体验。
    * **报告导出模块 (Report Export Module):**  支持用户导出简化版的检测结果报告 PDF 文件，方便用户保存和分享检测结果。

3. **管理后台 (Admin Portal - 可选):**  (根据项目规模和运营需求决定是否需要独立的管理后台)
    * **用户管理模块 (User Management Module):**  提供用户账号管理功能，包括医生和患者用户账号的创建、编辑、审核、权限分配和停用等。
    * **系统配置模块 (System Configuration Module):**  提供系统参数配置功能，例如系统名称、Logo、默认报告模板、消息通知配置、模型版本管理等。
    * **数据监控与日志管理模块 (Data Monitoring & Log Management Module):**  提供系统运行状态监控、性能监控、API 调用监控、用户行为日志、系统错误日志等功能，方便管理员进行系统维护和问题排查。
    * **内容管理模块 (Content Management Module):**  提供内容管理系统 (CMS) 功能，方便管理员管理健康知识库内容、发布系统公告、活动信息等。

## 功能列表 (详细 - Beta 版本核心功能)

### 公共功能 (Common Features)

* **用户认证与授权 (Authentication & Authorization):**
    * 安全可靠的用户登录 (Login)、注册 (Register) 和找回密码 (Forgot Password) 功能。
    * 基于角色的访问控制 (RBAC - Role-Based Access Control)：支持医生 (Doctor)、患者 (Patient) 和管理员 (Admin - 可选) 等角色，并进行精细化的权限管理。
    * 支持基于 JWT (JSON Web Token) 的会话管理与 Token 机制，保障用户会话安全。
    * 可选支持 OAuth 2.0 等第三方登录方式。
* **响应式设计 (Responsive Design):**
    * 系统界面采用响应式布局设计，完美适配桌面电脑 (Desktop)、平板电脑 (Tablet) 和智能手机 (Smartphone) 等多种设备，提供一致的用户体验。
    * 具备良好的跨浏览器兼容性 (Cross-browser Compatibility)，兼容主流浏览器，如 Chrome, Firefox, Safari, Edge 等。
* **多语言支持 (Internationalization - i18n):**
    * 系统界面支持多语言切换，初期版本提供中文 (Chinese) 和英文 (English) 两种语言界面，方便不同国家和地区的用户使用。可根据目标用户群体扩展更多语言支持。
* **消息通知系统 (Notification System):**
    * 提供完善的消息通知系统，支持系统消息、预约提醒、报告更新等多种消息通知类型。
    * 支持站内消息通知，可选支持邮件、短信等多种消息通知渠道。

### 医生端功能 (Doctor Portal Features - 专业版)

1. **患者管理 (Patient Management)**
    * 患者信息录入 (Patient Registration)：支持录入患者姓名、性别、年龄、出生日期、身份证号/医保卡号、联系方式、详细病史信息、过敏史等详细信息。
    * 患者列表 (Patient List)：提供患者列表展示，支持分页、排序、多条件组合筛选和关键词搜索，方便医生快速定位患者。
    * 患者详情 (Patient Details)：提供患者详情页面，查看患者完整信息、病例历史、就诊记录、健康档案等。
    * 患者分组与标签 (Patient Grouping & Tagging)：支持医生自定义患者分组和标签，方便医生进行患者分类管理和个性化服务。
    * 患者信息导入导出 (Patient Import & Export)：支持批量导入导出患者信息，例如支持 CSV, Excel 等常用数据格式。

2. **病例管理 (Case Management)**
    * 创建新病例 (Create New Case)：支持医生快速创建新病例，并关联患者信息。
    * 病例编辑 (Case Editing)：支持医生编辑病例基本信息、病程记录、诊断意见、医嘱等病例信息。
    * 眼部图像上传与管理 (Eye Image Upload & Management)：支持医生上传和管理患者左右眼图像，提供图像预览、缩放、标注等功能，方便医生进行图像分析。
    * **眼疾自动识别 (Automatic Eye Disease Recognition)**：集成 PaddleClas 模型，支持自动识别眼疾类别，并展示识别结果和模型预测置信度，为医生提供辅助诊断参考。
    * 诊断意见与医嘱 (Diagnosis & Medical Advice)：支持医生填写专业诊断意见、医嘱建议，支持结构化医嘱模板，提升医嘱录入效率和规范性。
    * 病例历史记录 (Case History)：提供患者完整病例历史记录查看功能，按时间轴展示患者的病例信息，方便医生回顾患者病史。
    * 病例检索与筛选 (Case Search & Filtering)：支持医生按患者姓名、病例编号、诊断结果、时间范围等多种条件进行病例检索和筛选，快速定位目标病例。
    * 病例状态管理 (Case Status Management)：支持病例状态管理，例如：未诊断、诊断中、已完成、复诊等多种病例状态，方便医生管理病例处理流程。

3. **智能辅助诊断 (AI-Assisted Diagnosis)**
    * **AI 诊断建议 (AI Diagnosis Suggestions)：** 基于 PaddleClas 模型识别结果和病例信息，为医生提供初步诊断建议和参考信息，辅助医生进行诊断决策。
    * **相似病例推荐 (Similar Case Recommendation)：**  系统可自动推荐与当前病例相似的历史病例，供医生参考借鉴，辅助医生进行更全面的诊断分析。
    * **诊断依据解释 (Diagnosis Explanation - 可选):**  **[可选功能，未来增强方向]**  未来版本可以考虑集成诊断依据解释功能，例如展示模型识别的依据和特征，提高诊断透明度和可信度，例如采用 Grad-CAM 等可视化技术。
    * **辅助诊断工具集成 (Auxiliary Diagnostic Tools Integration - 可选):**  **[可选功能，未来增强方向]**  未来版本可以考虑集成在线眼科检查工具、医学知识库链接等，辅助医生进行更全面的诊断分析。

4. **报告生成与导出 (Report Generation & Export)**
    * **病例报告生成 (Case Report Generation)：**  支持医生一键生成病例报告，自动填充患者信息、病例信息、诊断结果、医嘱等内容，提高报告生成效率。
    * **定制化报告模板 (Customizable Report Templates)：**  提供多种预设报告模板供医生选择，支持自定义报告模板样式和内容，满足不同场景下的报告需求。
    * **PDF 报告导出 (PDF Report Export)：**  支持将病例报告导出为符合医疗规范的 PDF 文件，方便医生进行报告打印、电子存档和与患者分享。
    * **报告预览与编辑 (Report Preview & Editing)：**  报告生成前提供报告预览功能，支持医生对报告内容进行编辑和调整，确保报告内容的准确性和完整性。
    * **报告分享与发送 (Report Sharing & Sending - 可选):**  **[可选功能，未来增强方向]**  未来版本可以考虑支持将病例报告在线分享给患者或通过邮件安全发送给患者 (需患者授权)。

5. **数据分析与可视化 (Data Analysis & Visualization)**
    * **患者统计分析 (Patient Statistics Analysis)：**  提供多维度的患者统计分析功能，例如统计今日/本周/本月接诊患者数量、不同年龄段/性别患者分布等，帮助医生了解患者就诊情况。
    * **眼疾分布分析 (Disease Distribution Analysis)：**  提供眼疾分布分析功能，例如分析不同眼疾的患病率、地域分布、年龄分布、性别分布等，帮助医生了解眼疾流行趋势。
    * **治疗效果评估 (Treatment Outcome Evaluation - 未来增强):**  **[未来增强方向]**  未来版本可以考虑增强治疗效果评估功能，例如分析不同治疗方案的疗效、患者康复情况、复诊率等，评估治疗效果 (需长期数据积累和更完善的数据模型)。
    * **数据可视化图表 (Data Visualization Charts)：**  采用 ECharts 等可视化库，将数据分析结果以折线图、柱状图、饼图、地图等多种图表形式直观展示，辅助医生进行医疗决策和科研分析。
    * **数据报表导出 (Data Report Export)：**  支持将数据分析结果导出为 Excel, CSV 等常用数据格式，方便医生进行进一步的数据分析和处理。

6. **系统设置 (System Settings)**
    * 个人信息管理 (Profile Management)：支持医生个人信息修改、密码修改、头像设置等功能。
    * 报告模板设置 (Report Template Settings)：支持医生自定义报告模板、选择默认报告模板。
    * 消息通知设置 (Notification Settings)：支持医生设置消息通知偏好，选择接收消息类型和渠道。
    * 用户权限管理 (User Permission Management - 管理员功能)：管理员角色提供用户角色分配和权限管理功能，保障系统安全性。
    * 日志管理 (Log Management - 管理员功能)：管理员角色提供系统操作日志查看功能，方便问题排查和安全审计。
    * 数据备份与恢复 (Data Backup & Recovery - 管理员功能)：管理员角色提供定期数据备份和数据恢复功能，保障系统数据安全。

### 患者端功能 (Patient Portal Features - 自助检测版)

1. **自助检测 (Self-Detection)**
    * **图像上传引导 (Image Upload Guidance)：**  提供清晰友好的图像上传引导，指导用户正确上传左右眼照片，提供拍照示例和注意事项，提升图像上传质量。
    * **图像质量检测 (Image Quality Check - 可选):**  **[可选功能，未来增强方向]**  未来版本可以考虑增加图像质量自动检测功能，例如自动检测上传图像的清晰度、光线、角度等，提示用户重新上传高质量图像，提升模型识别准确率。
    * **眼疾自动识别 (Automatic Eye Disease Recognition)：**  调用 PaddleClas 模型进行眼疾识别，并展示识别结果和模型预测置信度，告知用户可能的眼疾风险，并强调这仅为初步筛查参考。
    * **八卦阵风格诊断结果界面 (Bagua-Style Diagnosis Result Interface)：**  创新性地使用八卦阵 UI 呈现八种眼疾类别的检测结果，直观易懂，趣味性强，提升用户使用体验。
    * **检测结果解读 (Detection Result Interpretation)：**  使用通俗易懂的语言向用户解释检测结果，告知用户可能的眼疾风险，并**明确强调这仅为初步筛查，不能替代专业医疗诊断**。
    * **健康风险评估 (Health Risk Assessment - 可选):**  **[可选功能，未来增强方向]**  未来版本可以考虑基于检测结果和用户基本信息，进行眼健康风险的初步评估，为用户提供更个性化的健康建议。

2. **中医健康建议 (TCM Health Advice)**
    * **个性化健康建议 (Personalized Health Advice)：**  基于检测结果和中医健康理念，提供个性化的眼部保健、饮食调理、穴位按摩、生活习惯等中医健康养生建议，帮助用户改善生活方式，促进眼健康。
    * **食疗方案推荐 (Dietary Therapy Recommendation - 可选):**  **[可选功能，未来增强方向]**  未来版本可以考虑集成中医食疗知识库，为用户推荐适合其体质和眼疾情况的食疗方案和食谱。
    * **穴位按摩指导 (Acupressure Guidance - 可选):**  **[可选功能，未来增强方向]**  未来版本可以考虑提供常用眼部保健穴位按摩方法和图文/视频指导，方便用户进行自我保健。
    * **健康生活方式建议 (Healthy Lifestyle Advice)：**  提供科学合理的作息、用眼习惯、运动锻炼等健康生活方式建议，帮助用户养成良好的生活习惯。
    * **免责声明 (Disclaimer)：**  在提供中医健康建议的同时，**明确强调中医建议仅供参考，不能替代专业医疗建议，如有任何不适请及时就医**。

3. **个人档案 (Personal Profile)**
    * 个人信息管理 (Profile Management)：支持用户管理个人基本信息、联系方式等。
    * 检测历史记录 (Detection History)：提供用户检测历史记录查看功能，按时间顺序排列，方便用户回顾历次检测结果。
    * 医生建议查看 (View Doctor's Advice - 如果与医生端关联 - 可选):  **[可选功能，未来增强方向]**  未来版本如果实现患者端与医生端的关联，可以考虑支持患者查看医生在医生端提供的诊断意见和医嘱 (需医生授权)。
    * 健康报告 (Health Reports)：支持用户查看和下载检测报告 PDF 文件。

4. **健康知识库 (Health Knowledge Base)**
    * 眼部保健知识 (Eye Care Knowledge)：提供丰富的眼部日常保健知识、用眼卫生知识、科学护眼技巧等科普内容，提升用户眼保健意识。
    * 常见眼疾科普 (Common Eye Disease科普)：系统性介绍八种常见眼疾的症状、病因、危害、预防和治疗方法等科普信息，帮助用户了解眼疾知识。
    * 预防与护理建议 (Prevention & Care Tips)：针对不同眼疾提供个性化的预防和护理建议，帮助用户采取积极的健康管理措施。
    * 健康资讯 (Health News - 可选):  **[可选功能，未来增强方向]**  未来版本可以考虑增加健康资讯模块，发布最新的眼科健康资讯、科普文章、健康活动信息等。
    * 多媒体内容 (Multimedia Content)：健康知识库内容以图文、视频、动画等多种形式呈现，提升用户阅读体验和知识获取效率。

5. **报告导出 (Report Export)**
    * **检测结果报告 (Detection Result Report)：**  支持生成包含检测结果、初步中医健康建议、眼健康知识的简化版检测报告，方便用户保存和分享。
    * **PDF 报告导出 (PDF Report Export)：**  支持将检测结果报告导出为 PDF 文件，方便用户进行报告保存和打印。
    * **报告在线预览 (Report Online Preview)：**  支持用户在网页端在线预览报告内容。

## 眼疾分类 (Eye Disease Categories)

系统目前支持以下八种常见眼疾的辅助筛查 (识别类别基于 PaddleClas 模型训练数据集，并可根据实际需求进行扩展和优化)：

1. **正常 (Normal)** - 健康眼部图像
2. **糖尿病性视网膜病变 (Diabetic Retinopathy - DR)**
3. **青光眼 (Glaucoma)**
4. **白内障 (Cataract)**
5. **年龄相关性黄斑变性 (Age-related Macular Degeneration - AMD)**
6. **高血压性视网膜病变 (Hypertensive Retinopathy)**
7. **近视 (Myopia)**
8. **其他疾病/异常 (Other Diseases/Abnormalities)** -  用于识别不属于以上七种分类的眼部异常情况

* **模型性能指标 (Model Performance Metrics - Beta 版本初步评估，需根据实际测试结果更新):**
    * **Accuracy (准确率):  ~92%** (在验证集上的初步评估结果，实际应用中可能因数据分布差异略有波动)
    * **F1-Score (平均F1分数): ~88%** (在验证集上的初步评估结果，各类别的F1分数可能存在差异)
    * **AUC (平均AUC值): ~96%** (在验证集上的初步评估结果，反映模型区分正负样本的能力)
    * **数据集信息 (Training Dataset Details):**  模型训练使用了 [**公开数据集 EyePACS、Messidor-2，以及合作医院提供的部分脱敏眼底图像数据，总计约 1 万张已标注图像"**] 进行训练。
    * **模型推理速度 (Inference Speed):**  单张眼部图像平均推理时间约为 **[< 250ms (毫秒) 在 CPU 环境下初步评估，GPU 环境下可进一步提升 ]**

**请注意：**  以上模型性能指标为 Beta 版本初步评估结果，仅供参考。 实际应用中模型的性能可能受到多种因素的影响，例如图像质量、数据分布差异、硬件环境等。  我们将持续进行模型优化和性能提升。

## 附加功能 (未来发展方向 - 持续迭代，无限可能)

**"明眸八极,理光辨微"**  平台将持续进行迭代和创新，在未来版本中，我们计划引入更多前瞻性和实用性的附加功能，以构建更完善、更智能、更全面的眼健康管理平台：

**1.  增强 AI 引擎 (Enhanced AI Engine):**

* **多模态输入 (Multi-modal Input - 未来长期目标):**  **[长期目标]**  探索支持除眼底图像外，还可结合 OCT, 裂隙灯显微镜图像等多种眼科影像数据进行综合分析，利用多模态数据融合技术，进一步提升诊断精度和全面性。
* **AI 可解释性 (AI Explainability - 未来中期目标):**  **[中期目标]**  增强模型的可解释性，提供更直观的诊断依据和特征可视化，例如集成 Grad-CAM 等技术，帮助医生理解模型决策过程，提升医生对 AI 辅助诊断的信任度。
* **持续学习与模型优化 (Continual Learning & Model Optimization - 长期演进):**  **[长期演进]**  建立模型持续学习机制，利用新的数据不断优化模型性能，提升模型在复杂和多样化场景下的鲁棒性和泛化能力。
* **个性化模型定制 (Personalized Model Customization - 未来探索):**  **[未来探索]**  探索支持基于特定医院或医生数据进行模型微调和个性化定制，针对特定人群或疾病类型优化模型性能，提升模型在特定场景下的应用价值。

**2.  更全面的健康管理 (Comprehensive Health Management - 未来拓展):**

* **眼健康风险预测 (Eye Health Risk Prediction - 未来拓展):**  **[未来拓展]**  基于用户个人信息、生活习惯、家族病史、检测结果等多维度数据，构建眼健康风险预测模型，预测用户未来眼健康风险，提供个性化、前瞻性的预防建议。
* **可穿戴设备集成 (Wearable Device Integration - 未来探索):**  **[未来探索]**  探索与智能手表、智能眼镜等可穿戴设备连接，实时监测用户眼部健康相关数据 (例如用眼时长、眨眼频率、眼压变化等)，结合可穿戴设备数据和眼疾筛查结果，为用户提供更全面的、连续性的健康管理方案。
* **基因检测集成 (Genetic Testing Integration - 伦理与法规需谨慎评估 - 未来谨慎探索):**  **[未来谨慎探索，需严格评估伦理与法规]**  未来 *可能* 在严格遵守伦理和法规的前提下，与基因检测机构合作，整合基因检测数据，进行眼疾遗传风险评估和个性化预防指导。  此方向需极其谨慎地评估伦理、隐私和法规风险。
* **个性化康复指导与训练 (Personalized Rehabilitation Guidance & Training - 未来增强):**  **[未来增强]**  为特定眼疾患者提供个性化的康复训练方案、视力训练游戏、康复指导内容等，辅助患者进行眼部康复。
* **社区互动与患教平台 (Community Interaction & Patient Education Platform - 未来增强):**  **[未来增强]**  构建患者社区平台，提供在线交流、病友互助、经验分享、患教课程、专家讲座等功能，增强患者互助支持和自我管理能力，提升患者教育水平。

**3.  更智能的医疗服务 (Intelligent Medical Services - 未来愿景):**

* **智能导诊与分诊 (Smart Triage & Triage - 未来愿景):**  **[未来愿景]**  未来版本可以考虑集成智能导诊与分诊功能，根据患者自助检测结果和症状描述，智能推荐就诊科室和医生，优化患者就诊流程，提升医疗服务效率。
* **智能预约挂号 (Smart Appointment Scheduling - 未来愿景):**  **[未来愿景]**  未来版本可以考虑集成智能预约挂号功能，支持患者在线预约挂号、智能排班、预约提醒等功能，进一步提升患者就诊效率。
* **电子病历 (Electronic Health Records - EHR) 集成 (未来复杂功能，需行业标准支持 - 长期复杂目标):**  **[长期复杂目标，需行业标准支持]**  未来 *可能* 在医疗行业 EHR 数据互联互通标准更加成熟和普及的条件下，考虑与医院 EHR 系统进行对接，实现数据互联互通，减少重复录入，提升医疗协同效率。  此方向技术难度和政策壁垒较高，属于长期复杂目标。
* **医保支付集成 (Insurance Payment Integration - 区域性功能，需评估法规政策 - 未来区域性探索):**  **[未来区域性探索，需评估法规政策]**  未来 *可能* 在特定地区或国家，根据当地医保政策和支付接口规范，探索集成医保在线支付功能，方便患者在线结算医疗费用。  此方向受限于各地医保政策和法规，属于区域性探索功能。
* **药品知识库与处方辅助 (Drug Knowledge Base & Prescription Assistance - 未来谨慎探索，需医疗专业审核):**  **[未来谨慎探索，需医疗专业审核]**  未来 *可能* 谨慎探索集成药品知识库，提供眼科常用药品信息查询、药物相互作用提醒、处方合理性审核等辅助功能。  **需极其谨慎对待，处方权必须始终归医生，任何辅助处方功能必须经过严格的医疗专业审核和验证，并明确声明仅为辅助参考，不能替代医生处方。**

**4.  更开放的平台生态 (Open Platform Ecosystem - 长期战略规划):**

* **API 开放 (API Openness - 长期战略规划):**  **[长期战略规划]**  未来 *可能* 逐步开放 API 接口，允许第三方开发者接入系统功能，拓展应用场景，构建开放的眼健康生态系统，例如与智能硬件厂商、健康管理平台、保险公司等合作。
* **插件扩展机制 (Plugin Extension Mechanism - 长期战略规划):**  **[长期战略规划]**  未来 *可能* 探索支持插件扩展机制，方便开发者自定义功能模块，满足个性化需求，例如用户可以开发插件扩展新的眼疾识别模型、新的健康评估工具、新的数据分析报表等。
* **数据共享与科研合作 (Data Sharing & Research Collaboration - 需严格脱敏与合规，长期战略规划):**  **[长期战略规划，需严格脱敏与合规]**  未来 *可能* 在严格遵守数据隐私和安全法规，并经过充分的数据脱敏和用户授权的前提下，与科研机构、医疗机构和高校等合作，共享脱敏后的数据，共同推动眼科医学研究进步，例如用于眼疾流行病学研究、新型诊疗技术研发等。

## 安装与使用 (Installation & Usage)

### 开发环境搭建 (Development Environment Setup)

1. **克隆项目代码 (Clone Repository):**
   ```bash
   git clone https://github.com/your-username/eye-disease-clairvoyance.git
   cd eye-disease-clairvoyance
   ```

2. **安装前端依赖 (Install Frontend Dependencies):**
   ```bash
   cd eye-disease-frontend
   npm install  # 或 yarn install 或 pnpm install
   ```

3. **安装后端依赖 (Install Backend Dependencies):**
   ```bash
   cd eye-disease-backend
   pip install -r requirements.txt  # 建议使用虚拟环境 (venv 或 conda)
   ```

4. **配置后端 API 地址 (Configure Backend API URL):**
   - 编辑前端项目 `eye-disease-frontend/src/services/api.ts` (或您项目中的 API 配置文件)，将 `baseURL` 修改为您的本地后端 API 服务地址 (例如 `http://localhost:8000`).

5. **配置数据库连接 (Configure Database Connection - 后端):**
   - 编辑后端项目配置文件 (例如 `eye-disease-backend/config.py` 或 `.env` 文件)，配置数据库连接信息 (根据您选择的数据库类型 PostgreSQL 或 MySQL 进行配置)。

6. **运行开发服务器 (Run Development Servers):**
   - **启动后端 API 服务 (Backend API Server):**
     ```bash
     cd eye-disease-backend
     python app.py  # 或 flask run 或 uvicorn app:app --reload  (根据您使用的后端框架选择命令)
     ```
   - **启动前端开发服务器 (Frontend Development Server):**
     ```bash
     cd eye-disease-frontend
     npm run dev  # 或 yarn dev 或 pnpm dev
     ```
   -  打开浏览器，访问前端应用地址 (通常为 `http://localhost:5173` 或 Vite 默认端口) 即可在浏览器中预览和调试系统。

### 生产环境部署 (Production Environment Deployment)

1. **构建前端生产版本 (Build Frontend Production Version):**
   ```bash
   cd eye-disease-frontend
   npm run build  # 或 yarn build 或 pnpm build
   ```
   - 构建后的前端静态资源文件将生成在 `eye-disease-frontend/dist` 目录。

2. **构建后端 Docker 镜像 (Build Backend Docker Image - 推荐):**
   - (如果您选择使用 Docker 部署后端服务，请参考项目根目录下的 `Dockerfile` 和 `docker-compose.yml` 文件进行构建)
   ```bash
   cd eye-disease-backend
   docker build -t [您的Docker镜像仓库/您的镜像名称]:latest .
   ```

3. **部署后端服务 (Deploy Backend Service):**
    - **Docker 容器化部署 (推荐):** 使用 Docker Compose, Kubernetes 或其他容器编排工具部署后端 Docker 镜像。
    - **传统服务器部署:** 将后端代码部署到 Linux 服务器 (或其他服务器环境)，配置 Web 服务器 (Nginx/Apache) 反向代理，并使用 Supervisor 或 systemd 等进程管理工具管理后端 API 服务进程。  详细部署步骤请参考您的后端框架和服务器环境的部署文档。

4. **部署前端静态资源 (Deploy Frontend Static Assets):**
    - 将 `eye-disease-frontend/dist` 目录下的静态资源文件部署到 Web 服务器 (例如 Nginx, Apache) 或 CDN (内容分发网络) 服务。

5. **配置 Web 服务器 (Configure Web Server - Nginx 示例):**
   - (以下为 Nginx Web 服务器配置示例，请根据您的实际服务器环境和域名配置进行调整)
   ```nginx
   server {
       listen 80;
       server_name your_domain.com; # 请替换为您的域名或服务器 IP 地址

       location / {
           root /path/to/eye-disease-frontend/dist; # 请替换为前端静态资源文件部署的实际路径
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       location /api/ { # 后端 API 请求反向代理配置
           proxy_pass http://your_backend_server_ip:8000/; # 请替换为您的后端 API 服务实际运行的地址和端口
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # ... 其他 Web 服务器配置，例如 SSL 证书配置 (HTTPS) , 静态资源缓存配置等 ...
   }
   ```

6. **配置 DNS 解析 (Configure DNS Resolution)：**
   - 如果您使用域名访问系统，请将域名 `your_domain.com` 解析到部署前端静态资源的服务器公网 IP 地址。

7. **访问生产环境应用 (Access Production Application)：**
   - 通过配置的域名或服务器 IP 地址访问部署后的 **“明眸八极,理光辨微”** 系统生产环境应用。

**详细部署文档 (Detailed Deployment Documentation)：**  [**请在此处提供更详细的部署文档链接，例如指向项目 Wiki 页面、在线部署指南文档或专门的部署教程**]
[部署文档链接 - 敬请期待，我们将尽快完善详细部署文档]

## 项目结构 (Project Structure)

```
eye-disease-clairvoyance/  # 项目根目录
├── eye-disease-frontend/  # 前端项目目录 (Vue.js + TypeScript)
│   ├── public/               # 公共静态资源文件
│   ├── src/                  # 前端源代码目录
│   │   ├── assets/           # 项目资源文件 (例如：图片、图标、样式等)
│   │   ├── components/       # 公共组件目录 (Vue 组件)
│   │   ├── router/           # 路由配置目录 (Vue Router)
│   │   ├── stores/           # 状态管理目录 (Pinia Store)
│   │   ├── services/         # API 服务封装目录 (Axios 封装)
│   │   ├── types/            # TypeScript 类型定义目录
│   │   ├── views/            # 页面视图组件目录 (Vue 组件)
│   │   ├── App.vue           # 根组件
│   │   └── main.ts           # 前端入口文件
│   ├── index.html            # HTML 模板文件
│   ├── package.json          # 项目依赖配置文件 (npm)
│   ├── tsconfig.json         # TypeScript 配置文件
│   ├── vite.config.ts        # Vite 构建工具配置文件
│   └── ...                   # 其他前端项目相关文件 (例如：.gitignore, README.md 等)

├── eye-disease-backend/   # 后端项目目录 (Python Flask/FastAPI)
│   ├── app.py             # 后端 API 应用入口文件 (Flask 或 FastAPI)
│   ├── models/            # 数据模型目录 (ORM 模型定义)
│   ├── controllers/       # 控制器/路由处理函数目录
│   ├── services/          # 业务逻辑服务目录
│   ├── utils/             # 工具函数目录
│   ├── config.py          # 后端项目配置文件 (例如：数据库连接信息、API 配置等)
│   ├── requirements.txt   # 后端项目依赖配置文件 (pip)
│   ├── Dockerfile         # Dockerfile (用于构建后端 Docker 镜像)
│   └── ...                   # 其他后端项目相关文件 (例如：.gitignore, README.md, 数据库迁移脚本等)

├── paddleclas_model/      # PaddleClas 预训练模型文件目录 (可选，如果模型文件不直接放在代码仓库中，可以考虑使用云存储或模型服务)
│   └── ...                   # PaddleClas 模型相关文件 (例如：模型权重文件、配置文件等)

├── docker-compose.yml     # Docker Compose 编排文件 (可选，用于本地开发和生产环境快速部署)
├── README.md              # 项目 README 文件 (当前文件)
├── LICENSE                # 项目开源许可协议文件 (例如：MIT License)
├── CONTRIBUTING.md        # 项目贡献指南文件 (可选，如果您希望接受社区贡献)
└── ...                   # 其他项目根目录文件 (例如：.gitignore, .editorconfig, 代码格式化配置文件等)
```

## 贡献指南 (Contributing)

我们非常欢迎社区贡献力量，共同完善 **“明眸八极,理光辨微”** 平台！如果您有任何想法、建议或代码贡献，请参考 [CONTRIBUTING.md](CONTRIBUTING.md) 文件 (请您在项目根目录下创建 `CONTRIBUTING.md` 文件并在此处添加链接)，了解详细的贡献流程、代码规范和提交指南。

**我们欢迎各种形式的贡献，包括但不限于：**

* 提交 Bug 报告 (Bug Reports)：如果您在使用过程中发现了任何 Bug 或问题，请及时提交 Issue 报告，详细描述您遇到的问题和复现步骤，帮助我们改进系统。
* 功能建议 (Feature Requests)：如果您对系统功能有任何新的想法或改进建议，欢迎提交 Feature Request，详细描述您的建议和期望的应用场景，帮助我们扩展和优化系统功能。
* 代码贡献 (Code Contributions)：如果您具备开发能力，欢迎贡献代码，修复 Bug、实现新功能或改进现有代码。请参考贡献指南中的代码规范和提交流程。
* 文档完善 (Documentation Improvements)：如果您发现文档存在任何错误、遗漏或不清晰之处，欢迎提交文档改进，帮助我们完善项目文档，提升文档质量和可读性。
* 模型优化 (Model Optimization)：如果您在深度学习模型优化方面有经验，欢迎参与模型优化工作，例如改进模型结构、优化训练参数、提升模型性能等。
* 翻译 (Translations)：如果您擅长多语言翻译，欢迎帮助我们将系统界面和文档翻译成更多语言，扩大系统的用户群体。
* UI/UX 改进 (UI/UX Enhancements)：如果您在 UI/UX 设计方面有经验，欢迎提供 UI/UX 改进建议或设计稿，帮助我们提升系统界面的美观性和用户体验。
* ... 以及任何您认为有价值的贡献！  您的每一份贡献都将帮助 **“明眸八极,理光辨微”** 平台变得更加完善和强大！

## 许可协议 (License)

本项目采用 **MIT License** 开源许可协议。  您可以在遵守 MIT License 协议的范围内自由使用、修改和分发本项目代码。  详细的许可协议内容请参阅项目根目录下的 [LICENSE](LICENSE) 文件 (请您在项目根目录下创建 `LICENSE` 文件并在此处添加链接)。

## 免责声明 (Disclaimer)

**请您务必仔细阅读以下免责声明，并确保您充分理解和同意以下条款后再使用 “明眸八极,理光辨微” 系统：**

**重要提示： “明眸八极,理光辨微” 系统 (Clairvoyance Eye Health Platform) 是一款基于人工智能技术的眼疾辅助筛查工具，其提供的眼疾识别结果仅为辅助筛查参考，并非医疗诊断结论，不可替代任何专业医疗机构的诊断。**

**用户通过患者端 (自助检测版) 进行的眼疾自助检测结果仅作为初步健康评估参考，不应作为医疗决策的直接依据。  患者如需进行任何医疗相关的决策，包括但不限于疾病诊断、治疗方案选择、药物使用等，请务必咨询具有资质的专业医生，进行全面、详细的眼科检查，并严格遵循医生的专业医疗建议和医嘱。**

**本项目开发者 (包括但不限于项目贡献者、代码维护者、组织机构等) 不对因用户使用 “明眸八极,理光辨微” 系统而产生的任何直接或间接的医疗后果承担任何法律责任。  用户在使用本系统过程中需自行承担全部风险。**

**尤其需要强调的是，患者端 (自助检测版) 提供的中医健康建议，仅为基于中医养生保健理念的参考信息，旨在提供健康生活方式的指导，不构成任何形式的医疗建议或治疗方案。  用户不应将系统提供的中医健康建议作为医疗决策的依据。**

**“明眸八极,理光辨微” 系统目前仍处于 Beta 测试阶段，模型识别精度和系统功能可能存在一定的局限性和不完善之处。  我们将在后续版本中持续进行模型优化、功能迭代和用户体验改进。  感谢您的理解和支持！**

**用户一旦开始使用 “明眸八极,理光辨微” 系统，即视为已充分阅读、理解并同意本免责声明的全部条款。**

## 技术支持与联系方式 (Technical Support & Contact)

如果您在使用 **“明眸八极,理光辨微”** 系统过程中遇到任何问题、有任何功能建议或合作意向，请通过以下方式联系我们：

* **技术支持邮箱 (Technical Support Email):** [您的技术支持邮箱地址]
* **GitHub Issues 页面 (GitHub Issues Page):** [您的 GitHub 项目 Issues 页面链接] -  提交 Bug 报告、功能建议等，我们将在 GitHub Issues 页面及时回复您的问题和建议。
* **开发者社区/论坛 (Developer Community/Forum - 可选):** [您的开发者社区/论坛链接 - 可选，如果您创建了开发者社区或论坛，请在此处添加链接，方便用户进行更深入的交流和讨论]
* **社交媒体 (Social Media - 可选):** [您的社交媒体链接 - 可选，例如 Twitter, LinkedIn, 微信公众号等，如果您有相关的社交媒体账号，请在此处添加链接，方便用户关注项目动态和最新进展]

**感谢您使用 “明眸八极,理光辨微” - AI 驱动的眼疾辅助筛查与健康管理平台！  让我们共同努力，守护眼健康，预见光明未来！**

---

**版本 (Version):** v1.0 Beta (完善版 - 核心功能版本)
**最后更新日期 (Last Updated):** 2025-3-22 (请替换为实际更新日期)