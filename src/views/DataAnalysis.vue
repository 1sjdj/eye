<template>
  <div class="data-analysis-container">
    <!-- 标题区域 -->
    <div class="tech-header">
      <div class="tech-line left"></div>
      <h1><span class="highlight">眼科数据分析与可视化</span></h1>
      <div class="tech-line right"></div>
    </div>

    <!-- 时间筛选 -->
    <div class="filter-area">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker
              v-model="timeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
              :picker-options="pickerOptions"
              @change="handleTimeChange"
              :disabled="isLoading"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="快速选择">
          <el-select v-model="quickTime" placeholder="快速选择" @change="handleQuickTimeChange" :disabled="isLoading">
            <el-option label="今日" value="today"></el-option>
            <el-option label="本周" value="week"></el-option>
            <el-option label="本月" value="month"></el-option>
            <el-option label="本季度" value="quarter"></el-option>
            <el-option label="本年" value="year"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData" :loading="isLoading">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 加载状态包裹区域 -->
    <div v-loading="isLoading" element-loading-text="正在加载分析数据..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(13, 28, 64, 0.8)">
      <!-- 患者统计分析 -->
      <div class="analysis-section">
        <div class="section-header">
          <h2>患者统计分析</h2>
          <div class="section-actions">
            <el-button size="small" @click="exportData('patient')" :disabled="isLoading || !patientData">导出Excel</el-button>
          </div>
        </div>
        <div class="chart-container">
          <div class="chart-card">
            <div class="chart-card-header">
              <h3>患者就诊趋势</h3>
              <el-button type="text" icon="el-icon-camera" class="export-chart-btn" @click="exportChartAsImage('patientTrend')" title="导出图表为图片" :disabled="!charts.patientTrend?.instance"></el-button>
            </div>
            <div class="chart-wrapper" ref="patientTrendChart"></div>
          </div>
          <div class="chart-card">
            <div class="chart-card-header">
              <h3>患者性别分布</h3>
              <el-button type="text" icon="el-icon-camera" class="export-chart-btn" @click="exportChartAsImage('patientGender')" title="导出图表为图片" :disabled="!charts.patientGender?.instance"></el-button>
            </div>
            <div class="chart-wrapper" ref="patientGenderChart"></div>
          </div>
          <div class="chart-card">
             <div class="chart-card-header">
               <h3>患者年龄段分布</h3>
               <el-button type="text" icon="el-icon-camera" class="export-chart-btn" @click="exportChartAsImage('patientAge')" title="导出图表为图片" :disabled="!charts.patientAge?.instance"></el-button>
             </div>
            <div class="chart-wrapper" ref="patientAgeChart"></div>
          </div>
        </div>
      </div>

      <!-- 眼疾分布分析 -->
      <div class="analysis-section">
        <div class="section-header">
          <h2>眼疾分布分析</h2>
          <div class="section-actions">
            <el-button size="small" @click="exportData('disease')" :disabled="isLoading || !diseaseData">导出Excel</el-button>
          </div>
        </div>
        <div class="chart-container">
          <div class="chart-card">
             <div class="chart-card-header">
              <h3>眼疾类型分布</h3>
              <el-button type="text" icon="el-icon-camera" class="export-chart-btn" @click="exportChartAsImage('diseaseType')" title="导出图表为图片" :disabled="!charts.diseaseType?.instance"></el-button>
             </div>
            <div class="chart-wrapper" ref="diseaseTypeChart"></div>
          </div>
          <div class="chart-card">
             <div class="chart-card-header">
              <h3>眼疾年龄分布</h3>
              <el-button type="text" icon="el-icon-camera" class="export-chart-btn" @click="exportChartAsImage('diseaseAge')" title="导出图表为图片" :disabled="!charts.diseaseAge?.instance"></el-button>
             </div>
            <div class="chart-wrapper" ref="diseaseAgeChart"></div>
          </div>
          <div class="chart-card">
             <div class="chart-card-header">
              <h3>眼疾性别分布</h3>
              <el-button type="text" icon="el-icon-camera" class="export-chart-btn" @click="exportChartAsImage('diseaseGender')" title="导出图表为图片" :disabled="!charts.diseaseGender?.instance"></el-button>
             </div>
            <div class="chart-wrapper" ref="diseaseGenderChart"></div>
          </div>
           <div class="chart-card">
             <div class="chart-card-header">
              <h3>眼疾季节分布</h3>
              <el-button type="text" icon="el-icon-camera" class="export-chart-btn" @click="exportChartAsImage('diseaseSeason')" title="导出图表为图片" :disabled="!charts.diseaseSeason?.instance"></el-button>
             </div>
            <div class="chart-wrapper" ref="diseaseSeasonChart"></div>
          </div>
        </div>
      </div>

      <!-- 治疗与关键词分析 -->
      <div class="analysis-section">
        <div class="section-header">
          <!-- 合并标题 -->
          <h2>治疗评估与关键词分析</h2>
          <div class="section-actions">
            <el-button size="small" @click="exportData('treatment')" :disabled="isLoading || !treatmentData">导出治疗评估Excel</el-button>
            <!-- 词云通常不导出为 Excel -->
          </div>
        </div>
        <div class="chart-container">
           <!-- 新增：诊断关键词词云 -->
          <div class="chart-card">
            <div class="chart-card-header">
              <h3>诊断关键词词云</h3>
              <el-button type="text" icon="el-icon-camera" class="export-chart-btn" @click="exportChartAsImage('diagnosticKeywordsCloud')" title="导出图表为图片" :disabled="!charts.diagnosticKeywordsCloud?.instance || !diseaseData?.keywordsCloud?.length"></el-button>
            </div>
            <div class="chart-wrapper" ref="diagnosticKeywordsCloudChart"></div>
          </div>
          <!-- 保留治疗相关的其他图表 -->
          <div class="chart-card">
             <div class="chart-card-header">
              <h3>康复情况分析</h3>
              <el-button type="text" icon="el-icon-camera" class="export-chart-btn" @click="exportChartAsImage('recovery')" title="导出图表为图片" :disabled="!charts.recovery?.instance"></el-button>
             </div>
            <div class="chart-wrapper" ref="recoveryChart"></div>
          </div>
          <div class="chart-card">
            <div class="chart-card-header">
              <h3>复诊率分析</h3>
              <el-button type="text" icon="el-icon-camera" class="export-chart-btn" @click="exportChartAsImage('revisit')" title="导出图表为图片" :disabled="!charts.revisit?.instance"></el-button>
            </div>
            <div class="chart-wrapper" ref="revisitChart"></div>
          </div>
           <div class="chart-card">
             <div class="chart-card-header">
              <h3>治疗效果满意度</h3>
              <el-button type="text" icon="el-icon-camera" class="export-chart-btn" @click="exportChartAsImage('satisfaction')" title="导出图表为图片" :disabled="!charts.satisfaction?.instance"></el-button>
             </div>
            <div class="chart-wrapper" ref="satisfactionChart"></div>
          </div>
          <!-- 原治疗方案效果对比图位置现在是词云 -->
          <!-- <div class="chart-card"> ... </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import 'echarts-wordcloud'; // 1. 引入词云图
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import axios from 'axios';
const API_BASE_URL = 'http://localhost:5000';

export default {
  name: 'DataAnalysis',
  data() {
    return {
      isLoading: false,
      timeRange: [],
      quickTime: '',
      charts: {},
      patientData: null,
      diseaseData: null, // 会包含 keywordsCloud
      treatmentData: null,
      pickerOptions: {
         disabledDate(time) { return time.getTime() > Date.now(); }
      },
      // 2. 添加词云图的标题
      chartTitles: {
          patientTrend: '患者就诊趋势',
          patientGender: '患者性别分布',
          patientAge: '患者年龄段分布',
          diseaseType: '眼疾类型分布',
          diseaseAge: '眼疾年龄分布',
          diseaseGender: '眼疾性别分布',
          diseaseSeason: '眼疾季节分布',
          diagnosticKeywordsCloud: '诊断关键词词云', // 新增
          recovery: '康复情况分析',
          revisit: '复诊率分析',
          satisfaction: '治疗效果满意度',
      },
       // 3. 添加词云图的 Option 生成器
      chartOptionGenerators: {
          patientTrend: this.getPatientTrendOption,
          patientGender: this.getPatientGenderOption,
          patientAge: this.getPatientAgeOption,
          diseaseType: this.getDiseaseTypeOption,
          diseaseAge: this.getDiseaseAgeOption,
          diseaseGender: this.getDiseaseGenderOption,
          diseaseSeason: this.getDiseaseSeasonOption,
          diagnosticKeywordsCloud: this.getDiagnosticKeywordsCloudOption, 
          recovery: this.getRecoveryOption,
          revisit: this.getRevisitOption,
          satisfaction: this.getSatisfactionOption,
      },
      // 4. 添加词云图的 ref 名称
      chartRefs: [
          'patientTrendChart', 'patientGenderChart', 'patientAgeChart',
          'diseaseTypeChart', 'diseaseAgeChart', 'diseaseGenderChart', 'diseaseSeasonChart',
          'diagnosticKeywordsCloudChart', // 新增
          'recoveryChart', 'revisitChart', 'satisfactionChart'
      ]
    };
  },
  // mounted, beforeDestroy, methods.fetchData 等保持之前的优化
   mounted() {
    this.setDefaultTimeRange();
    this.initializeAllCharts();
    this.fetchData();
  },
  beforeDestroy() {
    this.chartRefs.forEach(refName => {
        const chartKey = refName.replace('Chart', '');
        const chartInfo = this.charts[chartKey];
        if (chartInfo && chartInfo.instance) {
            window.removeEventListener('resize', chartInfo.resizeHandler);
            chartInfo.instance.dispose();
        }
    });
    this.charts = {};
  },
  methods: {
     async fetchData() {
       if (this.isLoading) return;
       this.isLoading = true;
       console.log(`[${new Date().toLocaleTimeString()}] Fetching data for range: ${this.timeRange[0]} to ${this.timeRange[1]}`);
       try {
         const params = { startDate: this.timeRange[0], endDate: this.timeRange[1] };
         const response = await axios.get(`${API_BASE_URL}/api/analysis-data`, { params });

         // !! 增加对 diseaseData.keywordsCloud 的检查
         if (response.data && response.data.patientData && response.data.diseaseData && response.data.treatmentData && response.data.diseaseData.keywordsCloud) {
             this.patientData = response.data.patientData;
             this.diseaseData = response.data.diseaseData;
             this.treatmentData = response.data.treatmentData;
             console.log(`[${new Date().toLocaleTimeString()}] Data received successfully.`);
             this.$nextTick(() => { this.updateAllCharts(); });
             this.$message.success('数据加载完成');
         } else {
              console.error('Received invalid data structure from API (keywordsCloud might be missing):', response.data);
              this.$message.error('从服务器获取的数据格式无效或缺少关键词数据');
              this.clearChartData();
              this.updateAllCharts();
         }
       } catch (error) {
         console.error('Failed to fetch analysis data:', error);
         let errorMsg = '数据加载失败，请稍后重试';
         if (error.response) {
           errorMsg = `加载失败: ${error.response.data?.error || error.response.statusText || '服务器错误'}`;
         } else if (error.request) {
           errorMsg = '无法连接到服务器，请检查网络或联系管理员';
         } else {
           errorMsg = `请求设置错误: ${error.message}`;
         }
         this.$message.error(errorMsg);
         this.clearChartData();
         this.updateAllCharts();
       } finally {
         this.isLoading = false;
       }
     },
     initializeAllCharts() {
       this.chartRefs.forEach(refName => {
         this.initializeChart(refName);
       });
     },
     initializeChart(refName) {
        const chartDom = this.$refs[refName];
        if (!chartDom) { console.warn(`Chart DOM element not found for ref: ${refName}`); return; }
        const chartKey = refName.replace('Chart', '');
        if (this.charts[chartKey]?.instance) {
          window.removeEventListener('resize', this.charts[chartKey].resizeHandler);
          this.charts[chartKey].instance.dispose();
        }
        const chartInstance = echarts.init(chartDom);
        const resizeHandler = () => { if (chartInstance && !chartInstance.isDisposed()) { chartInstance.resize(); } };
        this.charts[chartKey] = { instance: chartInstance, resizeHandler: resizeHandler };
        window.addEventListener('resize', resizeHandler);
        chartInstance.setOption({ graphic: { type: 'text', left: 'center', top: 'center', style: { text: '加载中...', fill: '#8DD1FE', fontSize: 16 } } });
      },
      updateAllCharts() {
        console.log(`[${new Date().toLocaleTimeString()}] Updating all charts...`);
        Object.keys(this.chartOptionGenerators).forEach(chartKey => {
          const chartInfo = this.charts[chartKey];
          const optionGenerator = this.chartOptionGenerators[chartKey];
          if (chartInfo && chartInfo.instance && !chartInfo.instance.isDisposed() && optionGenerator) {
            const newOption = optionGenerator();
            if (newOption) {
              chartInfo.instance.setOption(newOption, true);
            } else {
              chartInfo.instance.setOption({ graphic: { type: 'text', left: 'center', top: 'center', style: { text: '暂无数据', fill: '#8DD1FE', fontSize: 16 } } }, true);
            }
          }
        });
         console.log(`[${new Date().toLocaleTimeString()}] Charts update complete.`);
      },
      clearChartData() {
         this.patientData = null;
         this.diseaseData = null;
         this.treatmentData = null;
     },

    // --- ECharts Option 生成函数 (逻辑与之前优化版本类似) ---
    // 这些函数现在从 this.patientData, this.diseaseData, this.treatmentData 读取数据
    // 并在数据为 null 时返回 null，由 updateAllCharts 处理“暂无数据”状态
    // --- ECharts Option 生成函数 ---
    getPatientTrendOption() { /* ... (保持不变，但可优化样式) ... */
       if (!this.patientData?.trend || this.patientData.trend.length === 0) return null;
        return {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(13, 28, 64, 0.8)', borderColor: '#39AFFD', textStyle: { color: '#fff' } },
            grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
            xAxis: { type: 'category', data: this.patientData.trend.map(item => item.date), axisLabel: { rotate: 45, color: '#8DD1FE', interval: 'auto' }, axisLine: { lineStyle: { color: '#8DD1FE' } }, axisTick: { alignWithLabel: true } }, // interval auto
            yAxis: { type: 'value', axisLabel: { color: '#8DD1FE' }, splitLine: { lineStyle: { color: 'rgba(141, 209, 254, 0.2)'} } },
            dataZoom: [{ type: 'inside', start: 0, end: 100 }, { type: 'slider', height: 20, bottom: 5, backgroundColor: 'rgba(13, 28, 64, 0.3)', borderColor: '#39AFFD', handleIcon: 'M10.7,11.9v-1.3h0.9v1.3H10.7z M10.7,11.9v-1.3h0.9v1.3H10.7z', handleSize: '80%', handleStyle: { color: '#fff', shadowBlur: 3, shadowColor: 'rgba(0, 0, 0, 0.6)', shadowOffsetX: 2, shadowOffsetY: 2 }, textStyle: { color: '#8DD1FE' } }],
            series: [{
                name: '就诊人数', data: this.patientData.trend.map(item => item.count), type: 'line', smooth: true,
                areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(58, 77, 233, 0.8)' }, { offset: 1, color: 'rgba(58, 77, 233, 0.1)' }]) },
                itemStyle: { color: '#3a4de9' }, emphasis: { focus: 'series' }, showSymbol: false
            }],
            textStyle: { color: '#8DD1FE' }
        };
    },
    getPatientGenderOption() { // !! 修改点：调整 emphasis
        if (!this.patientData?.gender || this.patientData.gender.length === 0) return null;
        return {
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)', backgroundColor: 'rgba(13, 28, 64, 0.8)', borderColor: '#39AFFD', textStyle: { color: '#fff' } },
            legend: { top: '5%', left: 'center', textStyle: { color: '#8DD1FE' } },
            series: [{
                name: '性别分布', type: 'pie', radius: ['45%', '70%'], center: ['50%', '55%'], avoidLabelOverlap: false,
                itemStyle: { borderRadius: 8, borderWidth: 0 },
                label: { show: true, color: '#8DD1FE', formatter: '{b}: {d}%' },
                labelLine: { show: true, length: 8, length2: 8 }, // 缩短引导线
                emphasis: { // **修改这里**
                  scale: false, // 禁用默认的放大效果
                  itemStyle: {
                    shadowBlur: 8, // 使用阴影作为强调效果
                    shadowColor: 'rgba(255, 255, 255, 0.3)' // 白色阴影
                  },
                   label: { // 标签样式不变或微调
                     show: true,
                     fontSize: '16', // 保持或略微减小
                     fontWeight: 'bold',
                     color: '#fff'
                   }
                },
                data: this.patientData.gender
            }],
             textStyle: { color: '#8DD1FE' }
        };
    },
     getPatientAgeOption() {
        if (!this.patientData?.age || this.patientData.age.length === 0) return null;
        return {
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)', backgroundColor: 'rgba(13, 28, 64, 0.8)', borderColor: '#39AFFD', textStyle: { color: '#fff' } },
            legend: { orient: 'vertical', right: 10, top: 'center', data: this.patientData.age.map(item => item.name), textStyle: { color: '#8DD1FE' } }, // 图例放右侧
            series: [{
                name: '年龄段分布', type: 'pie', radius: ['50%', '70%'], center: ['45%', '50%'], // 中心左移给图例留空间
                data: this.patientData.age,
                emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 0 }, label: { show: true, color: '#fff'} },
                itemStyle: { borderRadius: 5, borderWidth: 0 },
                label: { show: true, color: '#8DD1FE', formatter: '{b}\n{d}%' }, // 标签显示名称和百分比
                labelLine: { show: true, length: 10, length2: 10 }
            }],
             textStyle: { color: '#8DD1FE' }
        };
    },

    getDiseaseTypeOption() {
        if (!this.diseaseData?.type || this.diseaseData.type.length === 0) return null;
         return {
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)', backgroundColor: 'rgba(13, 28, 64, 0.8)', borderColor: '#39AFFD', textStyle: { color: '#fff' } },
            legend: { top: '5%', left: 'center', type: 'scroll', textStyle: { color: '#8DD1FE' } }, // 添加滚动图例
            series: [{
                name: '眼疾类型分布', type: 'pie', radius: ['45%', '70%'], center: ['50%', '55%'], avoidLabelOverlap: false,
                itemStyle: { borderRadius: 8, borderWidth: 0 }, label: { show: true, color: '#8DD1FE', formatter: '{b}: {d}%' },
                emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold', color: '#fff' }, itemStyle: { borderWidth: 0, shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
                labelLine: { show: true, length: 10, length2: 10 },
                data: this.diseaseData.type.filter(d => d.value > 0) // 只显示有数据的类型
            }],
             textStyle: { color: '#8DD1FE' }
        };
    },

    getDiseaseAgeOption() {
        if (!this.diseaseData?.age || this.diseaseData.age.length === 0) return null;
        const ageGroups = ['0-18岁', '19-35岁', '36-50岁', '51-65岁', '65岁以上'];
        return {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(13, 28, 64, 0.8)', borderColor: '#39AFFD', textStyle: { color: '#fff' } },
            legend: { data: this.diseaseData.age.map(item => item.name), top: '5%', type: 'scroll', textStyle: { color: '#8DD1FE' } }, // 图例可滚动
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value', axisLabel: { color: '#8DD1FE' }, axisLine: { lineStyle: { color: '#8DD1FE' } }, splitLine: { lineStyle: { color: 'rgba(141, 209, 254, 0.2)'} } },
            yAxis: { type: 'category', data: ageGroups, axisLabel: { color: '#8DD1FE' }, axisLine: { lineStyle: { color: '#8DD1FE' } } },
            series: this.diseaseData.age.map(item => ({
                name: item.name, type: 'bar', stack: 'total', label: { show: false }, // 堆叠图标签通常隐藏避免重叠
                emphasis: { focus: 'series' }, data: item.data
            })),
            textStyle: { color: '#8DD1FE' }
        };
    },

    getDiseaseGenderOption() {
        if (!this.diseaseData?.gender || this.diseaseData.gender.length === 0) return null;
        return {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(13, 28, 64, 0.8)', borderColor: '#39AFFD', textStyle: { color: '#fff' } },
            legend: { data: ['男性', '女性'], top: '5%', textStyle: { color: '#8DD1FE' } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value', axisLabel: { color: '#8DD1FE' }, axisLine: { lineStyle: { color: '#8DD1FE' } }, splitLine: { lineStyle: { color: 'rgba(141, 209, 254, 0.2)'} } },
            yAxis: { type: 'category', data: this.diseaseData.gender.map(item => item.name), axisLabel: { color: '#8DD1FE' }, axisLine: { lineStyle: { color: '#8DD1FE' } } },
            series: [
                { name: '男性', type: 'bar', stack: 'total', label: { show: false }, emphasis: { focus: 'series' }, data: this.diseaseData.gender.map(item => item.male) },
                { name: '女性', type: 'bar', stack: 'total', label: { show: false }, emphasis: { focus: 'series' }, data: this.diseaseData.gender.map(item => item.female) }
            ],
            textStyle: { color: '#8DD1FE' }
        };
    },

    getDiseaseSeasonOption() {
        if (!this.diseaseData?.season || this.diseaseData.season.length === 0) return null;
         return {
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)', backgroundColor: 'rgba(13, 28, 64, 0.8)', borderColor: '#39AFFD', textStyle: { color: '#fff' } },
            legend: { top: '5%', left: 'center', textStyle: { color: '#8DD1FE' } },
            series: [{
                name: '季节分布', type: 'pie', radius: ['45%', '70%'], center: ['50%', '55%'], avoidLabelOverlap: false,
                itemStyle: { borderRadius: 8, borderWidth: 0 }, label: { show: true, color: '#8DD1FE', formatter: '{b}: {d}%' },
                emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold', color: '#fff' }, itemStyle: { borderWidth: 0, shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
                labelLine: { show: true, length: 10, length2: 10 },
                data: this.diseaseData.season
            }],
             textStyle: { color: '#8DD1FE' }
        };
    },

    getRecoveryOption() {
        if (!this.treatmentData?.recovery || this.treatmentData.recovery.length === 0) return null;
         return {
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)', backgroundColor: 'rgba(13, 28, 64, 0.8)', borderColor: '#39AFFD', textStyle: { color: '#fff' } },
            legend: { top: '5%', left: 'center', type: 'scroll', textStyle: { color: '#8DD1FE' } },
            series: [{
                name: '康复情况', type: 'pie', radius: ['45%', '70%'], center: ['50%', '55%'], avoidLabelOverlap: false,
                itemStyle: { borderRadius: 8, borderWidth: 0 }, label: { show: true, color: '#8DD1FE', formatter: '{b}: {d}%' },
                emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold', color: '#fff' }, itemStyle: { borderWidth: 0, shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
                labelLine: { show: true, length: 10, length2: 10 },
                data: this.treatmentData.recovery
            }],
             textStyle: { color: '#8DD1FE' }
        };
    },

    getRevisitOption() {
        if (!this.treatmentData?.revisit || this.treatmentData.revisit.length === 0) return null;
         return {
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)', backgroundColor: 'rgba(13, 28, 64, 0.8)', borderColor: '#39AFFD', textStyle: { color: '#fff' } },
            legend: { top: '5%', left: 'center', type: 'scroll', textStyle: { color: '#8DD1FE' } },
            series: [{
                name: '复诊率', type: 'pie', radius: ['45%', '70%'], center: ['50%', '55%'], avoidLabelOverlap: false,
                itemStyle: { borderRadius: 8, borderWidth: 0 }, label: { show: true, color: '#8DD1FE', formatter: '{b}: {d}%' },
                emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold', color: '#fff' }, itemStyle: { borderWidth: 0, shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
                labelLine: { show: true, length: 10, length2: 10 },
                data: this.treatmentData.revisit
            }],
             textStyle: { color: '#8DD1FE' }
        };
    },

     getSatisfactionOption() {
        if (!this.treatmentData?.satisfaction || this.treatmentData.satisfaction.length === 0) return null;
         return {
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)', backgroundColor: 'rgba(13, 28, 64, 0.8)', borderColor: '#39AFFD', textStyle: { color: '#fff' } },
            legend: { top: '5%', left: 'center', type: 'scroll', textStyle: { color: '#8DD1FE' } },
            series: [{
                name: '满意度', type: 'pie', radius: ['45%', '70%'], center: ['50%', '55%'], avoidLabelOverlap: false,
                itemStyle: { borderRadius: 8, borderWidth: 0 }, label: { show: true, color: '#8DD1FE', formatter: '{b}: {d}%' },
                emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold', color: '#fff' }, itemStyle: { borderWidth: 0, shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
                labelLine: { show: true, length: 10, length2: 10 },
                data: this.treatmentData.satisfaction
            }],
             textStyle: { color: '#8DD1FE' }
        };
    },
    getDiagnosticKeywordsCloudOption() {
        if (!this.diseaseData?.keywordsCloud || this.diseaseData.keywordsCloud.length === 0) return null;

        return {
            tooltip: {
                show: true,
                formatter: function (params) {
                    return params.name + ' : ' + params.value; // 悬停显示词和频率
                },
                backgroundColor: 'rgba(13, 28, 64, 0.8)',
                borderColor: '#39AFFD',
                textStyle: { color: '#fff' }
            },
            series: [{
                type: 'wordCloud',
                // 形状: 'circle', 'cardioid', 'diamond', 'triangle-forward', 'triangle', 'pentagon', 'star'
                shape: 'circle',
                // 保持 maskImage 为空则使用上述形状
                // maskImage: maskImage, // 可以使用自定义蒙版图片

                // 词云覆盖图表的范围 [left, top, width, height]
                left: 'center',
                top: 'center',
                width: '90%',
                height: '90%',
                right: null,
                bottom: null,

                // 词语大小范围
                sizeRange: [12, 45], // 最小字体，最大字体

                // 词语旋转角度范围和步进
                rotationRange: [-45, 45], // [-90, 90]
                rotationStep: 15, // 每次旋转可选角度步长

                // 词语间距
                gridSize: 10,

                // 设置为 true 可以使词云图填充尽可能多的区域。弊端是如果词语太多，可能会有部分词语超出区域。
                drawOutOfBound: false,

                // 布局时不重叠
                layoutAnimation: true,

                // 全局设置词语样式
                textStyle: {
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    // 颜色可以用函数随机获取，也可以用固定颜色列表
                    color: function () {
                        // Random color
                        const colors = ['#39AFFD', '#8DD1FE', '#63FFDA', '#FFDB5C', '#FF9F7F', '#E062AE'];
                        return colors[Math.floor(Math.random() * colors.length)];
                    }
                },
                // 鼠标悬停时词语的样式
                emphasis: {
                    focus: 'self', // 聚焦当前词语
                    textStyle: {
                        textShadowBlur: 6,
                        textShadowColor: '#fff' // 白色阴影强调
                    }
                },

                // 数据就是后端返回的 keywordsCloud 数组
                data: this.diseaseData.keywordsCloud
            }]
        };
    },

    // --- 其他辅助方法 ---
    setDefaultTimeRange() {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 6); // 默认最近6个月
      this.timeRange = [this.formatDate(start), this.formatDate(end)];
    },

    formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    handleTimeChange() {
      this.quickTime = ''; // 清除快速选择状态
      this.fetchData();    // 日期范围改变后立即获取数据
    },

    handleQuickTimeChange(val) {
      const end = new Date(); const start = new Date();
      switch(val) {
        case 'today': start.setHours(0, 0, 0, 0); break;
        case 'week': start.setDate(end.getDate() - 6); break;
        case 'month': start.setMonth(end.getMonth() - 1); start.setDate(end.getDate()); break;
        case 'quarter': start.setMonth(end.getMonth() - 3); start.setDate(end.getDate()); break;
        case 'year': start.setFullYear(end.getFullYear() - 1); start.setDate(end.getDate()); break;
      }
      this.timeRange = [this.formatDate(start), this.formatDate(end)];
      this.fetchData();
    },

    // [DEPRECATED] refreshData 方法不再需要，按钮直接调用 fetchData
    // refreshData() {
    //   this.fetchData();
    // },

    // 导出数据
    exportData(type) {
       // 检查是否有数据可导出
      if (this.isLoading) {
          this.$message.warning('正在加载数据，请稍后再试');
          return;
      }
      const dataAvailable = (type === 'patient' && this.patientData) ||
                           (type === 'disease' && this.diseaseData) ||
                           (type === 'treatment' && this.treatmentData);
      if (!dataAvailable) {
           this.$message.warning('暂无数据可导出');
           return;
      }

      let data = [];
      let fileName = '';

      try {
          // 使用 this.patientData 等当前组件状态中的数据
          switch(type) {
            case 'patient':
              data = [
                ['患者统计分析'],
                ['时间范围', `${this.timeRange[0]} 至 ${this.timeRange[1]}`],
                [],
                ['就诊趋势'],
                ['日期', '患者数量'],
                ...(this.patientData.trend?.map(item => [item.date, item.count]) || []),
                [],
                ['性别分布'],
                ['性别', '人数'],
                ...(this.patientData.gender?.map(item => [item.name, item.value]) || []),
                 [],
                ['年龄段分布'],
                ['年龄段', '人数'],
                ...(this.patientData.age?.map(item => [item.name, item.value]) || [])
              ];
              fileName = '患者统计分析数据';
              break;

            case 'disease':
               const ageGroups = ['0-18岁', '19-35岁', '36-50岁', '51-65岁', '65岁以上'];
               const diseaseAgeHeader = ['年龄段', ...(this.diseaseData.age?.map(item => item.name) || [])];
               const diseaseAgeRows = ageGroups.map((group, index) => [
                   group,
                   ...(this.diseaseData.age?.map(item => item.data[index] ?? '') || [])
               ]);
              data = [
                 ['眼疾分布分析'],
                 ['时间范围', `${this.timeRange[0]} 至 ${this.timeRange[1]}`],
                 [],
                 ['眼疾类型分布'],
                 ['类型', '人数'],
                ...(this.diseaseData.type?.map(item => [item.name, item.value]) || []),
                 [],
                 ['眼疾年龄分布'],
                 diseaseAgeHeader,
                 ...diseaseAgeRows,
                 [],
                 ['眼疾性别分布'],
                 ['类型', '男性人数', '女性人数'],
                 ...(this.diseaseData.gender?.map(item => [item.name, item.male, item.female]) || []),
                 [],
                 ['眼疾季节分布'],
                 ['季节', '人数'],
                 ...(this.diseaseData.season?.map(item => [item.name, item.value]) || [])
              ];
              fileName = '眼疾分布分析数据';
              break;

            case 'treatment':
              data = [
                  ['治疗效果评估'],
                  ['时间范围', `${this.timeRange[0]} 至 ${this.timeRange[1]}`],
                  [],
                  // 治疗方案效果对比的数据目前是空的，可以不导出或留空
                  // ['治疗方案效果对比'],
                  // ['方案', '效果(%)', '复发率(%)'],
                  // ...(this.treatmentData.effect?.map(item => [item.name, item.effect, item.recurrence]) || []),
                  // [],
                  ['康复情况分析'],
                  ['状态', '人数'],
                  ...(this.treatmentData.recovery?.map(item => [item.name, item.value]) || []),
                  [],
                  ['复诊率分析'],
                  ['状态', '人数'],
                  ...(this.treatmentData.revisit?.map(item => [item.name, item.value]) || []),
                  [],
                  ['治疗满意度'],
                  ['满意度', '人数'],
                  ...(this.treatmentData.satisfaction?.map(item => [item.name, item.value]) || [])
              ];
              fileName = '治疗效果评估数据';
              break;
          }

          // --- Excel 导出逻辑 (与之前版本类似) ---
          const worksheet = XLSX.utils.aoa_to_sheet(data);
          // 简单的自动列宽 (可选)
          const cols = Object.keys(worksheet).reduce((acc, key) => {
            if (key.startsWith('!')) return acc;
            const col = key.replace(/[0-9]/g, '');
            const len = worksheet[key]?.v?.toString()?.length ?? 10;
            acc[col] = Math.max(acc[col] || 10, len + 2);
            return acc;
          }, {});
          worksheet['!cols'] = Object.keys(cols).map(key => ({ wch: cols[key] }));

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, '分析数据'); // Sheet 名称

          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          saveAs(blob, `${fileName}_${this.timeRange[0]}_to_${this.timeRange[1]}.xlsx`);
          this.$message.success('数据导出成功');

      } catch (error) {
           console.error('Export data error:', error);
           this.$message.error(`导出 ${fileName} 失败: ${error.message || '未知错误'}`);
      }
    },
    exportChartAsImage(chartKey) {
      const chartInfo = this.charts[chartKey];
      const title = this.chartTitles[chartKey] || chartKey; // 获取图表标题

      if (chartInfo && chartInfo.instance && !chartInfo.instance.isDisposed()) {
        try {
          // 使用 getDataURL 生成图片数据
          const imgBase64 = chartInfo.instance.getDataURL({
            type: 'png', // 导出的图片类型 (png, jpeg)
            pixelRatio: 2, // 像素比率，提高图片清晰度 (例如 2 表示 2 倍图)
            backgroundColor: 'transparent' // 背景色，重要！确保与页面背景或卡片背景一致，否则可能透明
          });

          // 创建文件名，替换标题中的空格等不安全字符
          const filename = `${title.trim().replace(/\s+/g, '_')}_${this.formatDate(new Date())}.png`;

          // 创建临时链接并触发下载
          const link = document.createElement('a');
          link.href = imgBase64;
          link.download = filename;
          document.body.appendChild(link); // 需要添加到 DOM 中才能工作 (在某些浏览器中)
          link.click();
          document.body.removeChild(link); // 下载后移除链接

          this.$message.success(`图表 "${title}" 导出成功！`);

        } catch (error) {
          console.error(`Failed to export chart ${chartKey}:`, error);
          this.$message.error(`导出图表 "${title}" 失败`);
        }
      } else {
        this.$message.warning('图表实例不存在或已被销毁，无法导出');
      }

    }
    
  }
};
</script>

<style scoped>
/* 样式保持不变 */
.data-analysis-container {
  background: transparent;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: auto;
  color: #fff;
}

.tech-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
}

.tech-header h1 {
  color: #8DD1FE;
  font-size: 24px;
  margin: 0 15px;
  text-shadow: 0 0 10px rgba(57, 175, 253, 0.5);
}

.highlight {
  color: #39AFFD;
  font-weight: bold;
}

.tech-line {
  height: 2px;
  width: 100px;
  background: linear-gradient(to right, rgba(57, 175, 253, 0), #39AFFD);
  position: relative;
}

.tech-line.left {
  background: linear-gradient(to right, rgba(57, 175, 253, 0), #39AFFD);
}

.tech-line.right {
  background: linear-gradient(to right, #39AFFD, rgba(57, 175, 253, 0));
}

.filter-area {
  margin-bottom: 20px;
  background: rgba(13, 28, 64, 0.2);
  padding: 15px;
  border-radius: 8px;
  border: 1px solid rgba(57, 175, 253, 0.2);
}

.filter-form {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
}

.analysis-section {
  margin-bottom: 30px;
  background: rgba(13, 28, 64, 0.3);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid rgba(57, 175, 253, 0.3);
  position: relative; /* 添加相对定位，为 v-loading 提供上下文 */
}

/* 调整 v-loading 样式 */
.analysis-section .el-loading-spinner .el-icon-loading,
.analysis-section .el-loading-spinner .el-loading-text {
    color: #39AFFD;
}
/* 使 loading 遮罩只覆盖图表区域 */
::v-deep .el-loading-mask {
    border-radius: 8px; /* 如果希望遮罩也有圆角 */
}


.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  color: #8DD1FE;
  margin: 0;
  font-size: 20px;
}

.chart-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  background: rgba(16, 32, 67, 0.3);
  border-radius: 6px;
  padding: 15px;
  height: 400px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(57, 175, 253, 0.2); /* 添加细边框 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 添加轻微阴影 */
  transition: box-shadow 0.3s ease; /* 添加过渡效果 */
}
.chart-card:hover {
   box-shadow: 0 4px 12px rgba(57, 175, 253, 0.2); /* 悬停时阴影更明显 */
}


.chart-card h3 {
  color: #8DD1FE;
  margin: 0 0 15px 0;
  text-align: center;
  font-size: 16px;
  font-weight: 600; /* 加粗标题 */
}

.chart-wrapper {
  flex: 1; /* 自动填充剩余空间 */
  width: 100%;
  /* 不需要设置固定高度或 calc 高度 */
  min-height: 250px; /* 保证图表有一个最小高度 */
}

@media (max-width: 768px) {
  .chart-container {
    grid-template-columns: 1fr; /* 小屏幕下单列显示 */
  }
  .chart-card {
    height: 350px; /* 稍微增加小屏幕下图表高度 */
  }
   .filter-form {
     justify-content: flex-start; /* 小屏幕上筛选条件靠左 */
   }
   .tech-header h1 {
      font-size: 20px; /* 减小标题字号 */
   }
   .section-header h2 {
      font-size: 18px; /* 减小段落标题字号 */
   }
}

/* 输入框透明样式 (保持不变) */
.filter-form >>> .el-input__inner {
  background: rgba(16, 32, 67, 0.3);
  border: 1px solid rgba(57, 175, 253, 0.3);
  color: #8DD1FE;
  transition: all 0.3s ease;
}

.filter-form >>> .el-input__inner:hover {
  border-color: #39AFFD;
}

.filter-form >>> .el-input__inner:focus {
  border-color: #39AFFD;
  box-shadow: 0 0 8px rgba(57, 175, 253, 0.4);
}

.filter-form >>> .el-input__inner::placeholder {
  color: rgba(141, 209, 254, 0.5);
}

.filter-form >>> .el-range-input {
  background: transparent;
  color: #8DD1FE;
}

.filter-form >>> .el-range-separator {
  color: #8DD1FE;
}

.filter-form >>> .el-date-editor .el-range__close-icon {
  color: #8DD1FE;
}

/* 确保 Label 颜色也被应用 */
.el-form-item__label {
  color: #8DD1FE !important; /* 使用 !important 确保覆盖 Element UI 默认样式 */
  font-size: 14px;
}

/* 调整下拉框选项的样式 */
.el-select-dropdown {
  background-color: rgba(13, 28, 64, 0.9) !important;
  border: 1px solid rgba(57, 175, 253, 0.4) !important;
}
.el-select-dropdown__item {
  color: #8DD1FE !important;
}
.el-select-dropdown__item.hover, .el-select-dropdown__item:hover {
  background-color: rgba(57, 175, 253, 0.2) !important;
}
.el-select-dropdown__item.selected {
  color: #409EFF !important; /* Element UI 默认选中颜色 */
  font-weight: bold;
}

/* 调整日期选择器弹出框样式 */
.el-picker-panel {
  background-color: rgba(13, 28, 64, 0.95) !important;
  border: 1px solid rgba(57, 175, 253, 0.4) !important;
  color: #8DD1FE !important;
}
.el-date-range-picker__header div,
.el-date-picker__header-label,
.el-picker-panel__icon-btn,
.el-date-table th,
.el-date-table td div,
.el-date-range-picker__content.is-left .el-date-range-picker__header div,
.el-date-range-picker__content.is-right .el-date-range-picker__header div {
  color: #8DD1FE !important;
}
.el-date-table td.today div {
   color: #409EFF !important;
   font-weight: bold;
}
.el-date-table td.available:hover {
  background-color: rgba(57, 175, 253, 0.2) !important;
}
.el-date-table td.in-range div, .el-date-table td.start-date div, .el-date-table td.end-date div {
  background-color: rgba(57, 175, 253, 0.3) !important;
  color: #fff !important;
}
.el-picker-panel__shortcut {
  color: #39AFFD !important;
}
.el-picker-panel__link-btn {
    color: #39AFFD !important;
}
.el-picker-panel [arrow] {
   border-color: #8DD1FE !important; /* 箭头颜色 */
}
.el-picker-panel .el-picker-panel__icon-btn:hover {
  color: #fff !important; /* 箭头悬停颜色 */
}
.el-date-editor .el-range__icon { /* 日期图标颜色 */
   color: #8DD1FE;
}
</style>