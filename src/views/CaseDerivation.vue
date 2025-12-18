<template>
  <div class="case-export-container">
    <!-- 标题区域 -->
    <div class="case-header">
      <div class="tech-line left"></div>
      <h1><span class="highlight">病例导出</span></h1>
      <div class="tech-line right"></div>
    </div>

    <form @submit.prevent="downloadCase" class="case-form">
      <div class="form-group">
        <label>患者姓名：</label>
        <input v-model="patientName" type="text" required class="form-input" />
      </div>

      <div class="form-group">
        <label>年龄：</label>
        <input
            v-model.number="patientAge"
            type="number"
            required
            class="form-input"
            @input="validateAge"
        />
      </div>

      <div class="form-group">
        <label>性别：</label>
        <select v-model="patientGender" required class="form-input">
          <option value="男">男</option>
          <option value="女">女</option>
        </select>
      </div>

      <div class="form-group">
        <label>症状：</label>
        <div class="symptoms-list">
          <label v-for="symptom in symptomsList" :key="symptom" class="symptom-item">
            <input type="checkbox" :value="symptom" v-model="selectedSymptoms" class="symptom-checkbox" />
            <span class="symptom-text">{{ symptom }}</span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label>医师建议：</label>
        <textarea v-model="doctorAdvice" rows="4" required class="form-textarea"></textarea>
        <button type="button" @click="generateAdvice" class="download-btn">
          生成建议
        </button>
      </div>

      <button type="submit" class="download-btn">下载病例</button>
    </form>
  </div>
</template>

<script>
import axios from "axios";
import jsPDF from "jspdf";

export default {
  data() {
    return {
      patientName: "",
      patientAge: "",
      patientGender: "男",
      symptomsList: ["糖尿病", "青光眼", "白内障", "AMD", "高血压", "近视"],
      selectedSymptoms: [],
      doctorAdvice: ""
    };
  },
  methods: {

    // 验证年龄
    validateAge() {
      const age = this.patientAge;
      if (age < 1 || age > 120 || !Number.isInteger(age)) {
        alert("请输入正确的年龄（1-120 之间的整数）");
        this.patientAge = ""; // 清空输入框
      }
    },

    // 生成医师建议
    async generateAdvice() {
      if (this.selectedSymptoms.length === 0) {
        alert("请选择至少一个症状！");
        return;
      }

      try {
        // 调用后端 AI 建议接口
        const response = await axios.post(
            "/api/ai-suggestion",
            {
              query: `患者症状：${this.selectedSymptoms.join(", ")}。请生成医师建议。`,
              patient_age: this.patientAge || 40,
              patient_sex: this.patientGender,
              // 添加症状作为上下文
              context: {
                symptoms: this.selectedSymptoms,
                details: {
                  patientName: this.patientName,
                  patientAge: this.patientAge,
                  patientGender: this.patientGender
                }
              }
            }
        );

        // 将生成的建议赋值给 doctorAdvice
        if (response.data && response.data.response) {
          this.doctorAdvice = response.data.response;
        } else {
          throw new Error("API 返回格式不正确");
        }
      } catch (error) {
        console.error("生成建议失败：", error);
        alert("生成建议失败，请稍后重试！");
      }
    },

    downloadCase() {
      // 在下载前再次验证年龄
      if (this.patientAge < 1 || this.patientAge > 120 || !Number.isInteger(this.patientAge)) {
        alert("请输入正确的年龄（1-120 之间的整数）");
        return;
      }

      const doc = new jsPDF();
      doc.text(`患者姓名: ${this.patientName}`, 10, 20);
      doc.text(`年龄: ${this.patientAge}`, 10, 30);
      doc.text(`性别: ${this.patientGender}`, 10, 40);
      doc.text(`症状: ${this.selectedSymptoms.join(", ")}`, 10, 50);
      doc.text(`医师建议: ${this.doctorAdvice}`, 10, 60, { maxWidth: 180 });
      doc.save("病例报告.pdf");
    }
  }
};
</script>

<style scoped>
.case-export-container {
  max-width: 600px;
  margin: 50px auto;
  padding: 30px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.case-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
}

.tech-line {
  height: 2px;
  width: 100px;
  background: linear-gradient(to right, rgba(57, 175, 253, 0), #39AFFD);
  position: relative;
}

.tech-line.left {
  margin-right: 15px;
}

.tech-line.right {
  margin-left: 15px;
  background: linear-gradient(to left, rgba(57, 175, 253, 0), #39AFFD);
}

.case-header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
  font-weight: bold;
}

.highlight {
  color: #39AFFD;
}

.case-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #555;
  font-weight: 600;
}

.form-input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  border-color: #39AFFD;
  outline: none;
  box-shadow: 0 0 5px rgba(57, 175, 253, 0.3);
}

.symptoms-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.symptom-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.symptom-item:hover {
  background: #e0e0e0;
}

.symptom-checkbox {
  cursor: pointer;
}

.symptom-text {
  font-size: 14px;
  color: #333;
}

.form-textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.form-textarea:focus {
  border-color: #39AFFD;
  outline: none;
  box-shadow: 0 0 5px rgba(57, 175, 253, 0.3);
}

.download-btn {
  margin-top: 20px;
  background: linear-gradient(135deg, #39AFFD, #3077b1);
  color: #fff;
  border: none;
  padding: 12px;
  font-size: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
}

.download-btn:hover {
  background: linear-gradient(135deg, #3077b1, #39AFFD);
  transform: translateY(-2px);
}

.download-btn:active {
  transform: translateY(0);
}
</style>