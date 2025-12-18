import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    isAuthenticated: false, // 用户认证状态
    username: '', // 当前登录用户名
    patients: [], // 存储患者数据
    total: 0,
    currentPage: 1,
    pageSize: 10,
    filterQuery: '',
    filterStatus: '',
    leftEyeForClassification: null, // { dataUrl: '...', fileInfo: {...} }
    rightEyeForClassification: null,
  },
  mutations: {
    SET_LEFT_EYE_FOR_CLASSIFICATION(state, payload) {
      state.leftEyeForClassification = payload;
    },
    SET_RIGHT_EYE_FOR_CLASSIFICATION(state, payload) {
      state.rightEyeForClassification = payload;
    },
    CLEAR_EYE_FOR_CLASSIFICATION(state, side) {
      if (side === 'left') state.leftEyeForClassification = null;
      if (side === 'right') state.rightEyeForClassification = null;
    }, // <--- 在这里添加逗号
    // 用户认证相关 mutations
    login(state, username) {
      state.isAuthenticated = true;
      state.username = username;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.username = '';
    },

    // 患者数据相关 mutations
    ADD_PATIENT(state, patient) {
      state.patients.push(patient); // 添加患者
    },
    SET_PATIENTS(state, patients) {
      state.patients = patients;
    },
    SET_TOTAL(state, total) {
      state.total = total;
    },
    UPDATE_PATIENT(state, updatedPatient) {
      const index = state.patients.findIndex(p => p.id === updatedPatient.id);
      if (index !== -1) {
        state.patients.splice(index, 1, updatedPatient);
      }
    },
    DELETE_PATIENT(state, patientId) {
      state.patients = state.patients.filter(p => p.id !== patientId);
    },
    SET_PAGINATION(state, { currentPage, pageSize }) {
      state.currentPage = currentPage || 1;
      state.pageSize = pageSize || 10;
    },
    SET_FILTER(state, { query, status }) {
      state.filterQuery = query || '';
      state.filterStatus = status || '';
    }
  },
  actions: {
    setClassificationImageFromBrightness({ commit }, { side, dataUrl, fileInfo }) {
      // 可以添加一些验证逻辑
      if (side === 'left') {
        commit('SET_LEFT_EYE_FOR_CLASSIFICATION', { dataUrl, fileInfo });
      } else if (side === 'right') {
        commit('SET_RIGHT_EYE_FOR_CLASSIFICATION', { dataUrl, fileInfo });
      } else {
        console.error("Invalid side provided to setClassificationImageFromBrightness action:", side);
        throw new Error("无效的操作目标（眼侧）");
      }
      // 可以返回一个 Promise 或其他信息
      return Promise.resolve();
    },
    // 可能需要一个 action 来清除这些数据
    clearClassificationImage({ commit }, side) {
        commit('CLEAR_EYE_FOR_CLASSIFICATION', side);
    }, // <--- 在这里添加逗号 (Action之间也需要逗号)
    // 用户认证相关 actions
    async login({ commit }, { username, password }) {
      // 这里调用真实登录接口
      commit('login', username);
      localStorage.setItem('username', username);
    },
    logout({ commit }) {
      commit('logout');
      localStorage.removeItem('username');
    },

    // 患者数据相关 actions
    async addPatientAction({ commit }, patientData) {
      try {
        const response = await axios.post('/api/patients', patientData);
        const data = response.data || response;

        if (data.success) {
          commit('ADD_PATIENT', data.patient);
        }
        return data;
      } catch (error) {
        console.error('添加患者失败:', error);
        throw error;
      }
    },

    async fetchPatientsAction({ commit, state }, { page, pageSize, query, status } = {}) {
      try {
        // 更新分页和筛选状态
        commit('SET_PAGINATION', {
          currentPage: page || state.currentPage,
          pageSize: pageSize || state.pageSize
        });

        commit('SET_FILTER', {
          query: query !== undefined ? query : state.filterQuery,
          status: status !== undefined ? status : state.filterStatus
        });

        // 构建请求参数
        const params = {
          page: state.currentPage,
          per_page: state.pageSize
        };

        if (state.filterQuery) params.query = state.filterQuery;
        if (state.filterStatus) params.status = state.filterStatus;

        console.log('Store fetchPatientsAction 请求参数:', params);
        const response = await axios.get('/api/patients', { params });
        console.log('Store fetchPatientsAction 原始响应:', response);

        // 提取和处理响应数据
        const responseData = response.data || response;
        console.log('Store fetchPatientsAction 处理后响应:', responseData);

        // 处理多种可能的返回格式
        if (responseData.success && Array.isArray(responseData.patients)) {
          // 标准格式 {success: true, patients: [...], total: 100}
          commit('SET_PATIENTS', responseData.patients);
          commit('SET_TOTAL', responseData.total || responseData.patients.length);
          return responseData;
        }
        else if (Array.isArray(responseData)) {
          // 简单数组格式 [{}, {}, ...]
          commit('SET_PATIENTS', responseData);
          commit('SET_TOTAL', responseData.length);
          return {
            success: true,
            patients: responseData,
            total: responseData.length
          };
        }
        else if (responseData.data && Array.isArray(responseData.data)) {
          // 嵌套格式 {data: [...], total: 100}
          commit('SET_PATIENTS', responseData.data);
          commit('SET_TOTAL', responseData.total || responseData.data.length);
          return {
            success: true,
            patients: responseData.data,
            total: responseData.total || responseData.data.length
          };
        }
        else {
          console.error('未识别的患者数据格式:', responseData);
          commit('SET_PATIENTS', []);
          commit('SET_TOTAL', 0);
          return {
            success: false,
            message: '数据格式错误',
            patients: [],
            total: 0
          };
        }
      } catch (error) {
        console.error('获取患者列表失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        commit('SET_PATIENTS', []);
        commit('SET_TOTAL', 0);
        throw error;
      }
    },

    async getPatientDetailAction({ commit }, patientId) {
      try {
        console.log('请求患者详情，ID:', patientId);
        const response = await axios.get(`/api/patients/${patientId}`);
        console.log('获取患者详情原始响应:', response);

        // 提取响应数据
        const responseData = response.data || response;
        console.log('处理后的患者详情:', responseData);

        // 标准化返回格式，支持多种后端响应
        if (responseData.success && responseData.patient) {
          // 标准格式 {success: true, patient: {...}}
          return responseData;
        }
        else if (responseData.id) {
          // 直接返回患者对象 {...}
          return {
            success: true,
            patient: responseData
          };
        }
        else if (responseData.data && responseData.data.id) {
          // 嵌套格式 {data: {...}}
          return {
            success: true,
            patient: responseData.data
          };
        }
        else {
          console.error('未识别的患者详情格式:', responseData);
          return {
            success: false,
            message: '无法解析患者详情数据',
            patient: null
          };
        }
      } catch (error) {
        console.error('获取患者详情失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        throw error;
      }
    },

    async updatePatientAction({ commit }, { id, patientData }) {
      try {
        console.log('更新患者数据，ID:', id, '数据:', patientData);
        const response = await axios.put(`/api/patients/${id}`, patientData);
        console.log('更新患者原始响应:', response);

        // 提取响应数据
        const responseData = response.data || response;
        console.log('处理后的更新响应:', responseData);

        // 处理各种可能的成功响应格式
        if (responseData.success && responseData.patient) {
          // 标准格式 {success: true, patient: {...}}
          commit('UPDATE_PATIENT', responseData.patient);
          return responseData;
        }
        else if (responseData.id) {
          // 直接返回更新后的患者对象
          commit('UPDATE_PATIENT', responseData);
          return {
            success: true,
            patient: responseData
          };
        }
        else if (responseData.data && responseData.data.id) {
          // 嵌套格式 {data: {...}}
          commit('UPDATE_PATIENT', responseData.data);
          return {
            success: true,
            patient: responseData.data
          };
        }
        else if (responseData === true || responseData.status === 'success') {
          // 某些API只返回成功状态而非数据
          // 在这种情况下，我们不能直接更新状态，需要重新获取数据
          return {
            success: true,
            message: '更新成功，但需要刷新数据'
          };
        }
        else {
          console.error('未识别的更新响应格式:', responseData);
          return {
            success: false,
            message: responseData.message || '更新失败，响应格式无效',
            patient: null
          };
        }
      } catch (error) {
        console.error('更新患者信息失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        throw error;
      }
    },

    async deletePatientAction({ commit }, patientId) {
      try {
        console.log('删除患者，ID:', patientId);
        const response = await axios.delete(`/api/patients/${patientId}`);
        console.log('删除患者原始响应:', response);

        // 处理204 No Content响应
        if (response.status === 204) {
          console.log('服务器返回204，删除成功无内容返回');
          commit('DELETE_PATIENT', patientId);
          return {
            success: true,
            message: '删除成功'
          };
        }

        // 提取响应数据 (如果有)
        const responseData = response.data || response;
        console.log('处理后的删除响应:', responseData);

        // 处理各种可能的成功响应格式
        if (responseData.success) {
          // 标准格式 {success: true}
          commit('DELETE_PATIENT', patientId);
          return responseData;
        }
        else if (responseData === true ||
                (typeof responseData === 'object' && Object.keys(responseData).length === 0) ||
                responseData.status === 'success') {
          // 有些后端可能返回空对象、true或其他表示成功的格式
          commit('DELETE_PATIENT', patientId);
          return {
            success: true,
            message: '删除成功'
          };
        }
        else {
          console.error('未识别的删除响应格式:', responseData);
          return {
            success: false,
            message: responseData.message || '删除失败，响应格式无效'
          };
        }
      } catch (error) {
        console.error('删除患者失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        throw error;
      }
    },

    // 新增：创建患者和病例的组合 Action
    async createPatientAndCase({ commit, dispatch }, payload) {
      try {
        console.log('开始执行 createPatientAndCase action, 接收的数据:', payload);

        // 第1步：构造患者数据 (处理字段名映射和数据格式)
        const patientData = {
          name: payload.patientName,
          // 改进性别处理，确保正确转换为中文性别
          gender: payload.patientSex === 'Male' ? '男' :
                  payload.patientSex === 'Female' ? '女' :
                  payload.patientSex || '男', // 设置默认值
          age: Number(payload.patientAge),
          // 其他字段处理 - 不设置默认值，让后端处理必填项验证
          contact: payload.contact || '',
          birthDate: payload.birthDate || null,
          idNumber: payload.idNumber || '',
          allergyHistory: payload.allergyHistory || '',
          medicalHistory: payload.medicalHistory || '',
          status: '待检查' // 默认状态
        };

        console.log('第1步: 准备创建/查找患者，处理后的患者数据:', patientData);

        let patientResponse;
        let responseData;

        try {
          // 调用后端 API 创建/查找患者
          patientResponse = await axios.post('/api/patients', patientData);
          responseData = patientResponse.data || patientResponse;
          console.log('患者创建/查找响应:', responseData);
        } catch (error) {
          // 如果创建失败，检查是否是身份证/医保号重复的错误
          if (error.response && error.response.status === 400) {
            const errorData = error.response.data;
            console.error('创建患者失败:', errorData);

            // 检查错误消息是否是身份证号/医保号重复
            const errorMsg = errorData.message || errorData.error || '';

            // 检查后端是否直接返回了已存在的患者信息
            if (errorData.existingPatient) {
              console.log('后端返回的已存在患者信息:', errorData.existingPatient);

              // 使用已有的患者信息构造响应
              responseData = {
                success: true,
                patient: errorData.existingPatient,
                message: `已找到使用该身份证号的患者 "${errorData.existingPatient.name}"`
              };

              // 直接继续后续流程
            } else {
              // 尝试从错误消息中解析身份证号
              // 修改正则表达式以匹配更多可能的错误信息格式
              const idNumberPattern = /身份证\/医保号\s*['"]?(.+?)['"]?\s*已存在|['"]?(.+?)['"]?\s*已存在|id_number\s*['"]?(.+?)['"]?/i;
              const match = errorMsg.match(idNumberPattern);

              let idNumber = null;
              if (match) {
                // 检查哪个捕获组有值
                idNumber = match[1] || match[2] || match[3];
                console.log(`检测到身份证号 ${idNumber} 已存在，尝试查找对应患者`);
              } else if (patientData.idNumber) {
                // 如果无法从错误消息中提取，但提交的数据中有身份证号，则使用它
                idNumber = patientData.idNumber;
                console.log(`使用提交的身份证号 ${idNumber} 查找患者`);
              }

              if (idNumber) {
                // 通过身份证号查找患者
                try {
                  // 方法1: 使用查询接口查找患者
                  const searchResponse = await axios.get('/api/patients', {
                    params: {
                      query: idNumber,
                      page: 1,
                      pageSize: 5
                    }
                  });

                  const searchResult = searchResponse.data;
                  console.log('通过身份证号查找患者结果:', searchResult);

                  if (searchResult.patients && searchResult.patients.length > 0) {
                    // 找到了匹配的患者，使用第一个结果
                    const existingPatient = searchResult.patients.find(p =>
                      p.id_number === idNumber || p.idNumber === idNumber
                    ) || searchResult.patients[0];

                    console.log('找到已存在的患者:', existingPatient);

                    // 构造成功响应格式，继续执行后续步骤
                    responseData = {
                      success: true,
                      patient: existingPatient,
                      message: `已找到使用该身份证号的患者 "${existingPatient.name}"`
                    };
                  } else {
                    // 未找到患者，尝试直接获取信息
                    try {
                      // 如果有错误信息中提到的ID，尝试直接获取该患者
                      const idPattern = /ID\s*[:=]\s*(\d+)/i;
                      const idMatch = errorMsg.match(idPattern);
                      if (idMatch && idMatch[1]) {
                        const patientId = parseInt(idMatch[1]);
                        console.log(`尝试直接通过ID ${patientId} 获取患者信息`);

                        const directResponse = await axios.get(`/api/patients/${patientId}`);
                        if (directResponse.data && (directResponse.data.patient || directResponse.data.id)) {
                          const existingPatient = directResponse.data.patient || directResponse.data;
                          responseData = {
                            success: true,
                            patient: existingPatient,
                            message: `已找到使用该身份证号的患者 "${existingPatient.name}"`
                          };
                        } else {
                          throw new Error('无法获取直接病人信息');
                        }
                      } else {
                        throw new Error('无法从错误消息解析患者ID');
                      }
                    } catch (directError) {
                      console.error('直接获取患者信息失败:', directError);
                      throw error; // 抛出原始错误
                    }
                  }
                } catch (searchError) {
                  console.error('查找已存在患者失败:', searchError);

                  // 如果搜索失败但错误信息确实包含身份证号已存在字样，构造一个简化的响应
                  if (errorMsg.includes('已存在')) {
                    responseData = {
                      success: false,
                      error: errorMsg,
                      message: `身份证/医保号 "${idNumber}" 已存在，但无法找到对应患者信息。请使用搜索功能查找该患者。`
                    };
                  } else {
                    throw error; // 抛出原始错误
                  }
                }
              } else {
                // 不是身份证号重复错误，或无法解析身份证号，直接抛出
                throw error;
              }
            }
          } else {
            // 其他错误，直接抛出
            throw error;
          }
        }

        // 从响应中提取 patientId (处理不同的响应格式)
        let patientId;

        if (responseData.success && responseData.patient && responseData.patient.id) {
          // 标准格式：{success: true, patient: {id: 123, ...}}
          patientId = responseData.patient.id;
          console.log('从 success.patient.id 获取 patientId:', patientId);
        }
        else if (responseData.id) {
          // 直接返回患者对象：{id: 123, name: "...", ...}
          patientId = responseData.id;
          console.log('从直接返回的对象 id 字段获取 patientId:', patientId);
        }
        else if (responseData.data && responseData.data.id) {
          // 嵌套格式：{data: {id: 123, ...}}
          patientId = responseData.data.id;
          console.log('从 data.id 获取 patientId:', patientId);
        }
        else {
          console.error('无法从响应中提取 patientId:', responseData);
          throw new Error('创建/查找患者成功，但无法获取患者ID');
        }

        // 确保 patientId 是数字类型
        if (typeof patientId === 'string') {
          const parsedId = parseInt(patientId, 10);
          if (isNaN(parsedId)) {
            throw new Error('患者ID不是有效数字');
          }
          patientId = parsedId;
          console.log('已将 patientId 从字符串转换为数字:', patientId);
        }

        // 第2步：构造病例数据
        const consultationDate = payload.consultationDate || new Date().toISOString().split('T')[0];
        const caseData = {
          patientId: patientId,
          consultationDate: consultationDate,
          case_display_id: payload.caseId || `C${Date.now()}`, // 生成唯一ID如果没有
          doctorName: payload.doctorName || '系统'
        };

        console.log('第2步: 准备创建病例，病例数据:', caseData);
        console.log('- patientId:', caseData.patientId, '类型:', typeof caseData.patientId);
        console.log('- consultationDate:', caseData.consultationDate, '类型:', typeof caseData.consultationDate);

        // 调用后端 API 创建病例
        const caseResponse = await axios.post('/api/cases', caseData);
        console.log('病例创建响应:', caseResponse.data);

        // 从响应中提取病例信息
        const caseResult = caseResponse.data || caseResponse;

        // 返回标准化的结果
        return {
          success: true,
          message: `患者 "${patientData.name}" 的病例创建成功`,
          patientId: patientId,
          // 提供病例数据以便组件使用
          caseData: {
            id: caseResult.id || null,
            case_display_id: caseResult.case_display_id || caseData.case_display_id,
            // 其他可能有用的字段...
            consultationDate: caseData.consultationDate,
            doctorName: caseData.doctorName
          },
          // 保留完整响应以便特殊情况处理
          rawResponse: {
            patient: responseData,
            case: caseResult
          }
        };
      } catch (error) {
        console.error('创建患者和病例失败:', error);
        // 详细记录错误信息，便于诊断
        if (error.response) {
          console.error('错误状态码:', error.response.status);
          console.error('错误详情:', error.response.data);

          // 尝试提取更详细的错误信息
          let errorMessage = error.response.data?.message || error.response.data?.error;

          // 特别处理验证错误 (通常包含字段级别的详细错误信息)
          if (error.response.data?.validation_errors) {
            console.error('验证错误:', error.response.data.validation_errors);
            const validationErrors = error.response.data.validation_errors;
            // 将字段级验证错误转换为字符串
            const errorDetails = Object.entries(validationErrors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            errorMessage = `验证失败: ${errorDetails}`;
          }

          return {
            success: false,
            error: errorMessage || '服务器返回错误，但未提供详细信息',
            message: '操作失败，请检查填写信息是否正确',
            statusCode: error.response.status,
            rawError: error.response.data // 保留原始错误信息
          };
        }

        // 返回标准化的错误对象
        return {
          success: false,
          error: error.message || '创建患者和病例过程中发生错误',
          message: '操作失败，请检查填写信息或稍后再试'
        };
      }
    }
  }
});