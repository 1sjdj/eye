<template>
  <div class="weather-container">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="weather-info">
      <span class="location">{{ city }}</span>
      <span class="temp">{{ temperature }}°C</span>
      <div class="details">
        <span>{{ weather }}</span>
        <span>{{ windDirection }}风 {{ windPower }}级</span>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Weather',
  data() {
    return {
      API_KEY: '318d6e64adc9c16f6dab3879b6cee04c',
      city: '',
      weather: '',
      temperature: '',
      windDirection: '',
      windPower: '',
      loading: true,
      error: ''
    }
  },
  mounted() {
    this.getWeatherData()
  },
  methods: {
    async getWeatherData() {
      try {
        // 1. 获取城市编码
        const ipRes = await axios.get(`https://restapi.amap.com/v3/ip?key=${this.API_KEY}`)
        if (!ipRes.data.adcode) throw new Error('定位失败')

        // 2. 获取天气数据
        const weatherRes = await axios.get(
            `https://restapi.amap.com/v3/weather/weatherInfo?key=${this.API_KEY}&city=${ipRes.data.adcode}`
        )

        // 3. 处理数据
        const data = weatherRes.data.lives[0]
        this.city = ipRes.data.city || '未知地区'
        this.weather = data.weather || '未知天气'
        this.temperature = data.temperature || '--'
        this.windDirection = data.winddirection || '未知'
        this.windPower = data.windpower || '--'

      } catch (err) {
        this.error = `天气获取失败: ${err.response?.data?.info || err.message}`
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.weather-container {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 220px;
}

.loading, .error {
  font-size: 14px;
  color: #666;
}

.error {
  color: #ff4d4f;
}

.weather-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.location {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.temp {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #666;
}
</style>