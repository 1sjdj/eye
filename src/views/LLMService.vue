<template>
  <div class="llm-container">
    <!-- 标题区域 -->
    <div class="llm-header">
      <div class="tech-line left"></div>
      <h1><span class="highlight">DeepSeek+文心4.5 AI 助手</span></h1>
      <div class="tech-line right"></div>
    </div>
    
    <!-- 主体聊天区域 -->
    <div class="chat-container">
      <!-- 左侧会话列表 -->
      <div class="conversation-list">
        <div class="list-header">
          <h3>对话记录</h3>
          <el-button 
            type="primary" 
            size="mini" 
            class="new-chat-btn" 
            icon="el-icon-plus" 
            @click="createNewChat">
            新建会话
          </el-button>
        </div>
        
        <div class="conversation-items" v-if="chatHistory.length > 0">
          <div 
            v-for="(chat, index) in chatHistory" 
            :key="chat.id" 
            :class="['conversation-item', activeChatIndex === index ? 'active' : '']"
            @click="switchChat(index)">
            <i class="el-icon-chat-dot-round"></i>
            <div class="chat-info">
              <div class="chat-title">{{ chat.title || `会话 ${index + 1}` }}</div>
              <div class="chat-time">{{ formatTimestamp(chat.timestamp) }}</div>
            </div>
            <div class="chat-actions">
              <i class="el-icon-delete" @click.stop="deleteChat(index)"></i>
            </div>
          </div>
        </div>
        <div v-else class="no-conversations">
          <p>还没有对话记录</p>
        </div>
      </div>
      
      <!-- 右侧聊天内容区域 -->
      <div class="chat-content">
        <!-- 消息列表 -->
        <div class="message-list" ref="messageList">
          <template v-if="currentMessages.length > 0">
            <div 
              v-for="(message, index) in currentMessages" 
              :key="message.id" 
              :class="['message-item', message.role === 'user' ? 'user-message' : 'ai-message']">
              <div class="message-avatar">
                <i :class="message.role === 'user' ? 'el-icon-user' : 'el-icon-cpu'"></i>
              </div>
              <div class="message-content-wrapper">
                <!-- 图片预览（用户消息） -->
                <div v-if="message.role === 'user' && message.imagePreview" class="message-image-preview">
                    <img :src="message.imagePreview" alt="Uploaded Image" />
                </div>
                <!-- 新增: 思维链展示 -->
                <div v-if="message.role === 'assistant' && message.reasoning" class="message-reasoning">
                    <div class="reasoning-header">
                        <i class="el-icon-magic-stick"></i> 思维过程
                    </div>
                    <div class="reasoning-content" v-html="renderMarkdown(message.reasoning)"></div>
                </div>
                <!-- 文本内容 (仅在有内容或正在流式传输占位时显示) -->
                <div class="message-content" v-if="message.content || (message.role === 'assistant' && isStreaming && index === currentMessages.length - 1 && !message.content) " >
                  <div class="message-text" v-html="renderMarkdown(message.content)"></div>
                  <div class="message-time">{{ formatTimestamp(message.timestamp, true) }}</div>
                </div>
                <!-- AI 消息加载/停止图标 -->
                <el-tooltip content="停止生成" placement="top" v-if="message.role === 'assistant' && isStreaming && index === currentMessages.length - 1">
                  <i class="el-icon-loading streaming-indicator" @click="stopStreaming"></i>
                </el-tooltip>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="empty-chat">
              <div class="empty-icon">
                <i class="el-icon-chat-line-round"></i>
              </div>
              <h3>开始与 明眸八疾 AI 助手对话</h3>
              <p>询问有关眼疾诊断、图像分析或医学知识的问题</p>
              
              <div class="suggestion-chips">
                <div class="chip" @click="usePrompt('解释一下糖尿病视网膜病变的特征')">
                  解释糖尿病视网膜病变特征
                </div>
                <div class="chip" @click="usePrompt('如何区分青光眼和白内障？')">
                  区分青光眼和白内障
                </div>
                <div class="chip" @click="usePrompt('分析我上传的眼底图像中的异常区域')">
                  分析眼底图像异常
                </div>
              </div>
            </div>
          </template>
        </div>
        
        <!-- 输入区域 (将 Alert 移到这里) -->
        <div class="chat-input-container">
          <!-- 新增: AI提示信息 (移动到此处) -->
          <el-alert
              title="AI 生成内容仅供参考，不构成专业医疗建议，具体请遵医嘱。"
              type="info"
              :closable="false"
              show-icon
              class="ai-disclaimer">
          </el-alert>
          
          <!-- 上传图片预览 -->
          <div v-if="uploadedImagePreview" class="image-preview-area">
            <img :src="uploadedImagePreview" alt="Preview" class="preview-image"/>
            <el-button 
              type="danger" 
              icon="el-icon-close" 
              circle 
              size="mini"
              class="remove-image-btn"
              @click="removeImage"></el-button>
          </div>
          
          <div class="chat-input-wrapper">
            <textarea 
              ref="chatInput"
              class="chat-input" 
              v-model="inputMessage" 
              placeholder="请输入内容，Shift + Enter 换行，或上传图片进行提问"
              @input="adjustTextareaHeight"
              @keydown.shift.enter.exact.prevent="handleShiftEnter"
              @keydown.enter.exact.prevent="sendMessage"
            ></textarea>
            
            <div class="input-actions">
              <el-tooltip content="上传图片" placement="top">
                <div class="upload-btn" @click="triggerImageUpload">
                  <i class="el-icon-picture-outline"></i>
                </div>
              </el-tooltip>
              <input 
                type="file" 
                ref="imageInput" 
                style="display: none" 
                accept="image/jpeg, image/png, image/bmp" 
                @change="handleImageUpload"
              />
              <!-- 新增: 占位符，用于推开按钮 -->
              <div class="input-spacer"></div> 
              
              <el-button 
                type="primary" 
                class="send-btn" 
                :disabled="isStreaming || (!inputMessage.trim() && !uploadedImage)"
                :loading="isStreaming" 
                @click="sendMessage">
                {{ isStreaming ? '生成中' : '发送' }}
                <i v-if="!isStreaming" class="el-icon-s-promotion"></i>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid'; // 用于生成唯一 ID
import { marked } from 'marked'; // 引入 marked
import DOMPurify from 'dompurify'; // 引入 DOMPurify

export default {
  name: 'LLMService',
  data() {
    return {
      chatHistory: [], // { id: string, title: string, timestamp: number, messages: Message[] }
      activeChatIndex: 0,
      inputMessage: '',
      uploadedImage: null, // base64 string
      uploadedImagePreview: null, // object URL for preview
      isStreaming: false, // 是否正在接收流式响应
      controller: null, // AbortController 用于停止流式请求
    }
  },
  computed: {
    currentChat() {
      return this.chatHistory[this.activeChatIndex] || null;
    },
    currentMessages() {
      return this.currentChat?.messages ?? [];
    }
  },
  created() {
    this.loadChatHistory();
    if (this.chatHistory.length === 0) {
      this.createNewChat(false);
    } else if (!this.currentChat || this.activeChatIndex < 0 || this.activeChatIndex >= this.chatHistory.length) {
      this.activeChatIndex = 0;
    }
    this.$nextTick(() => {
      this.scrollToBottom();
      this.adjustTextareaHeight();
    });
  },
  beforeDestroy() {
    if (this.uploadedImagePreview) {
      URL.revokeObjectURL(this.uploadedImagePreview);
    }
  },
  watch: {
    activeChatIndex() {
      this.inputMessage = '';
      this.removeImage();
      this.$nextTick(this.scrollToBottom);
    },
    currentMessages: {
      handler() {
        this.$nextTick(this.scrollToBottom);
      },
      deep: true
    }
  },
  methods: {
    loadChatHistory() {
      const savedHistory = localStorage.getItem('llmChatHistory');
      if (savedHistory) {
        try {
          let parsedHistory = JSON.parse(savedHistory);
          if (!Array.isArray(parsedHistory)) {
              parsedHistory = [];
          }
          this.chatHistory = parsedHistory.map(chat => {
            const newChat = { ...chat }; // Create a copy
            if (!newChat.id) newChat.id = uuidv4();
            if (!Array.isArray(newChat.messages)) newChat.messages = [];
            newChat.messages = newChat.messages.map(msg => {
                const newMsg = { ...msg }; // Create a copy
                if (!newMsg.id) newMsg.id = uuidv4();
                if (newMsg.role === 'user' && newMsg.imagePreview && typeof newMsg.imagePreview !== 'string') {
                    newMsg.imagePreview = null;
                }
                if (newMsg.role === 'assistant' && typeof newMsg.reasoning === 'undefined') {
                    newMsg.reasoning = ''; // Initialize reasoning
                }
                return newMsg;
            });
            return newChat;
          });

          if (this.chatHistory.length > 0 && (this.activeChatIndex >= this.chatHistory.length || this.activeChatIndex < 0) ) {
            this.activeChatIndex = 0;
          }
        } catch (e) {
          console.error("Error loading chat history from localStorage:", e);
          localStorage.removeItem('llmChatHistory');
          this.chatHistory = [];
        }
      }
      if (this.chatHistory.length === 0) {
          this.createNewChat(false);
      }
    },
    saveChatHistory() {
      const historyToSave = this.chatHistory.filter(chat => chat && chat.id);
      if (historyToSave.length > 0) {
        localStorage.setItem('llmChatHistory', JSON.stringify(historyToSave));
      } else {
        localStorage.removeItem('llmChatHistory');
      }
    },
    createNewChat(save = true) {
      if (this.chatHistory.length > 0 && this.currentMessages.length === 0 && !this.inputMessage && !this.uploadedImage && !save) {
          this.$refs.chatInput?.focus();
          return;
      }

      const newChatId = uuidv4();
      const now = Date.now();
      const newChat = {
        id: newChatId,
        title: null, // Title set on first message
        timestamp: now,
        messages: []
      };

      this.chatHistory.push(newChat);
      this.activeChatIndex = this.chatHistory.length - 1;

      if (save) {
        this.saveChatHistory();
      }
      this.$nextTick(() => {
        this.inputMessage = '';
        this.removeImage();
        this.$refs.chatInput?.focus();
        this.scrollToBottom();
      });
    },
    switchChat(index) {
      if (this.isStreaming) {
        this.$message.warning('请等待当前回复完成后再切换会话。');
        return;
      }
      if (index >= 0 && index < this.chatHistory.length) {
        this.activeChatIndex = index;
      }
    },
    deleteChat(index) {
      if (this.isStreaming && this.activeChatIndex === index) {
        this.$message.warning('请先停止当前回复再删除会话。');
        return;
      }
      this.$confirm('确定要删除此会话吗？此操作无法撤销。', '确认删除', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const targetIndex = index;
        this.chatHistory.splice(targetIndex, 1);

        if (this.chatHistory.length === 0) {
          this.createNewChat(false); // Create a new empty session
        } else {
            // Adjust active index after deletion
            if (this.activeChatIndex === targetIndex) {
                // If deleting the active chat, move to previous or first
                this.activeChatIndex = Math.max(0, targetIndex - 1);
            } else if (this.activeChatIndex > targetIndex) {
                // If deleting a chat before the active one, decrement index
                this.activeChatIndex--;
            }
            // Ensure index is still valid (shouldn't be necessary, but safe)
            if(this.activeChatIndex >= this.chatHistory.length) {
                 this.activeChatIndex = this.chatHistory.length - 1;
            }
        }
        this.saveChatHistory();
      }).catch(() => {});
    },
    setChatTitleFromFirstMessage(chat, firstMessageContent) {
      if (chat && !chat.title && firstMessageContent) {
        const titleLength = 25; // Slightly longer title
        chat.title = firstMessageContent.length > titleLength
          ? firstMessageContent.substring(0, titleLength) + '... '
          : firstMessageContent;
      }
    },
    async sendMessage() {
    // 1. Guard Clause: 检查是否可以发送 (不在流式传输中，且有文本或图片)
    if (this.isStreaming || (!this.inputMessage.trim() && !this.uploadedImage)) {
        return;
    }

    // 2. 获取用户输入和图片数据
    const userMessageContent = this.inputMessage.trim();
    const userImageBase64 = this.uploadedImage; // Base64 数据，用于发送和本地历史记录

    // 3. 如果是新会话的第一条消息，设置会话标题
    if (this.currentChat && this.currentMessages.length === 0) {
        this.setChatTitleFromFirstMessage(this.currentChat, userMessageContent || "图片消息");
    }

    // 4. 创建用户消息对象 - 使用 Base64 作为 imagePreview
    const userMessage = {
        id: uuidv4(),
        role: 'user',
        content: userMessageContent,
        timestamp: Date.now(),
        // --- 使用 Base64 数据 URL，确保消息列表中图片能持久显示 ---
        imagePreview: userImageBase64,
        // ---------------------------------------------------------
    };

    // 5. 将用户消息添加到当前会话 (添加前检查 currentChat)
    if (this.currentChat) {
         this.currentChat.messages.push(userMessage);
    } else {
         console.error("Cannot send message: currentChat is null when trying to push user message.");
         this.$message.error("无法发送消息：无活动会话");
         return; // 阻止后续执行
    }

    // 6. 清理输入框和输入区预览
    this.inputMessage = '';
    // removeImage 会撤销临时的 blob URL (this.uploadedImagePreview)，不影响已存入消息的 Base64
    this.removeImage();
    this.$nextTick(() => this.adjustTextareaHeight());

    // 7. 创建 AI 消息占位对象
    const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        reasoning: '', // Initialize reasoning field
        timestamp: Date.now()
    };

    // 8. 将 AI 消息占位添加到当前会话 (添加前检查 currentChat)
    if (this.currentChat) {
        this.currentChat.messages.push(aiMessage);
    } else {
        console.error("Cannot send message: currentChat is null when trying to push AI message placeholder.");
        return;
    }

    // 9. 保存聊天记录 (包括用户消息和 AI 消息占位)
    this.saveChatHistory();

    // 10. 准备发送给 API 的消息历史 (简化为纯文本)
    let requestMessages = [];
    const historyLimit = 10;
    const relevantHistory = this.currentChat ? this.currentChat.messages.slice(-(historyLimit + 2), -2) : [];
    relevantHistory.forEach(msg => {
        if (msg.role === 'user') {
            // 如果用户消息有 imagePreview (Base64)，说明是多模态消息
            if (msg.imagePreview && typeof msg.imagePreview === 'string' && msg.imagePreview.startsWith('data:image')) {
                 // 重新构建符合 API 要求的 content 列表
                 const userContentList = [{ type: "text", text: msg.content || "" }]; // 包含文本部分
                 userContentList.push({
                     type: "image_url",
                     image_url: { url: msg.imagePreview } // 使用存储的 Base64
                 });
                 requestMessages.push({ role: 'user', content: userContentList });
            } else if (msg.content) { // 如果只是纯文本用户消息
                requestMessages.push({ role: 'user', content: msg.content }); // content 是字符串
            }
            // 注意：如果用户消息既没文本也没图片，这里会忽略，通常没问题
        } else if (msg.role === 'assistant' && msg.content) { // 助手消息 content 总是字符串
            requestMessages.push({ role: 'assistant', content: msg.content });
        }
    });

    // 11. 准备最终要发送的用户消息体 (多模态格式)
    let finalUserMessageForRequest;
    const apiUrl = userImageBase64 // 使用 Base64 判断是否有图
        ? '/api/llm/multimodal/stream'
        : '/api/llm/chat/stream';

    if (userImageBase64) { // 如果有图片 (Base64)
        finalUserMessageForRequest = {
            role: 'user',
            content: [
                { type: "text", text: userMessageContent || "请分析这张图片" }
            ]
        };
        // 确保 Base64 字符串有正确的前缀
        const formattedBase64 = userImageBase64.startsWith('data:image')
            ? userImageBase64
            : `data:image/jpeg;base64,${userImageBase64}`; // 默认 jpeg，可按需调整
        finalUserMessageForRequest.content.push({
            type: "image_url",
            image_url: { url: formattedBase64 } // 使用格式化后的 Base64 data URL
        });
    } else { // 如果只有文本
        finalUserMessageForRequest = { role: 'user', content: userMessageContent };
    }
    requestMessages.push(finalUserMessageForRequest);

    // 12. 设置流式传输状态和 AbortController
    this.isStreaming = true;
    this.controller = new AbortController();
    const signal = this.controller.signal;

    // 13. 发起 API 请求
    try {
        const backendUrl = 'http://localhost:5000'; // TODO: Move to config
        console.log("Sending request to backend:", JSON.stringify({ messages: requestMessages })); // 增加日志，确认发送内容
        const response = await fetch(`${backendUrl}${apiUrl}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: requestMessages }),
            signal: signal
        });

        // 14. 检查响应状态
        if (!response.ok || !response.body) {
            let errorMsg = `请求失败: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) { /* 忽略解析错误 */ }
            throw new Error(errorMsg);
        }

        // 15. 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let currentAiContent = '';
        let currentAiReasoning = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonStr = line.substring(5).trim();
                    if (!jsonStr) continue;

                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.error) {
                            console.error("Streaming error from backend:", data.error);
                            currentAiContent += `\n**错误**: ${data.error}`;
                            aiMessage.content = currentAiContent;
                            this.$message.error(`AI回复时出错: ${data.error}`);
                            this.isStreaming = false;
                            this.saveChatHistory();
                            return;
                        } else if (data.content) {
                            currentAiContent += data.content;
                            aiMessage.content = currentAiContent;
                        } else if (data.reasoning) {
                            currentAiReasoning += data.reasoning;
                            aiMessage.reasoning = currentAiReasoning;
                        } else if (data.end_of_stream) {
                            // Stream finished successfully from backend perspective
                        }
                    } catch (e) {
                        console.error("Error parsing stream data:", e, "Raw line:", line);
                    }
                }
            }
             // 实时滚动到底部
             this.$nextTick(this.scrollToBottom);
        }

        // 处理可能残留在 buffer 中的最后一条消息
        if (buffer.startsWith('data:')) {
           const jsonStr = buffer.substring(5).trim();
           if (jsonStr) {
               try {
                   const data = JSON.parse(jsonStr);
                   if (data.content) aiMessage.content = currentAiContent + data.content;
                   if (data.reasoning) aiMessage.reasoning = currentAiReasoning + data.reasoning;
               } catch (e) { console.error("Error parsing final buffer data:", e); }
           }
        }

    } catch (error) {
        // 16. 统一处理请求和流处理中的错误
        if (error.name === 'AbortError') {
            if (aiMessage) aiMessage.content = (aiMessage.content || '') + '\n*(用户中断)*';
            this.$message.warning('已停止生成');
        } else {
            console.error('Error sending message:', error);
            const errorText = `\n**请求错误**: ${error.message || '未知错误'}`;
            if (aiMessage) aiMessage.content = (aiMessage.content || '') + errorText;
            this.$message.error(`发送消息失败: ${error.message || '未知错误'}`);
        }
    } finally {
        // 17. 无论成功失败，最后都执行清理工作
        this.isStreaming = false;
        this.controller = null;
        this.saveChatHistory();
        this.$nextTick(this.scrollToBottom);
    }
},
    stopStreaming() {
      if (this.controller) {
        this.controller.abort();
      }
    },
    formatTimestamp(timestamp, showSeconds = false) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      if (showSeconds) {
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
      }
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    },
    scrollToBottom() {
      const container = this.$refs.messageList;
      if (container) {
        // Use requestAnimationFrame for smoother scrolling, especially during streaming
        requestAnimationFrame(() => {
             container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        });
      }
    },
    adjustTextareaHeight() {
      const textarea = this.$refs.chatInput;
      if (textarea) {
        textarea.style.height = 'auto';
        const maxHeight = parseInt(window.getComputedStyle(textarea).maxHeight, 10);
        // Add a pixel to scrollHeight to prevent potential scrollbar flicker in some browsers
        const scrollHeight = textarea.scrollHeight + 1; 
        const newHeight = Math.min(scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
        textarea.style.overflowY = (scrollHeight > maxHeight) ? 'auto' : 'hidden';
      }
    },
    usePrompt(prompt) {
      this.inputMessage = prompt;
      this.$nextTick(() => {
        this.adjustTextareaHeight();
        this.$refs.chatInput?.focus();
      });
    },
    renderMarkdown(text) {
       if (!text) return '';
       try {
           const rawHtml = marked(text, {
               gfm: true,
               breaks: true,
               smartLists: true,
               smartypants: false,
               xhtml: false
           });
           // Configure DOMPurify: Allow target="_blank" and rel="noopener noreferrer" for links
           const cleanHtml = DOMPurify.sanitize(rawHtml, { 
               ADD_ATTR: ['target'], 
               FORBID_TAGS: ['style'], // Example: forbid style tags
               FORBID_ATTR: ['onerror', 'onload'] // Example: forbid dangerous event handlers
           });
           return cleanHtml;
       } catch (e) {
           console.error("Markdown rendering/sanitization error:", e);
           // Fallback: Basic text escaping
           return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
       }
    },
    triggerImageUpload() {
      this.$refs.imageInput.click();
    },
    handleImageUpload(e) {
      const file = e.target.files[0];
      console.log('1. File selected:', file); // 调试点 1: 确认文件对象获取

      if (!file) {
          console.log('No file selected, exiting.');
          return; // No file selected
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.$message.error('图片大小不能超过 10MB');
        this.clearFileInput();
        console.log('File size exceeds limit.'); // 调试点 2a: 检查大小验证
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/bmp'];
      if (!allowedTypes.includes(file.type)) {
        this.$message.error('只支持 JPG, PNG, BMP 格式的图片');
        this.clearFileInput();
        console.log('File type not allowed:', file.type); // 调试点 2b: 检查类型验证
        return;
      }

      console.log('2. File validation passed.'); // 调试点 3: 确认验证通过

      const reader = new FileReader();

      reader.onload = (event) => {
        console.log('4. FileReader onload triggered.'); // 调试点 4: 确认 onload 被调用
        this.uploadedImage = event.target.result; // Base64 data URL for sending
        console.log('   - Base64 data assigned (first 50 chars):', this.uploadedImage.substring(0, 50)); // 调试点 4a: 确认 Base64

        // Revoke previous object URL before creating a new one
        if (this.uploadedImagePreview) {
          console.log('   - Revoking previous Object URL:', this.uploadedImagePreview); // 调试点 4b: 检查旧 URL 撤销
          URL.revokeObjectURL(this.uploadedImagePreview);
        }

        // Create Object URL for preview
        try {
            this.uploadedImagePreview = URL.createObjectURL(file);
            console.log('5. New Object URL created and assigned:', this.uploadedImagePreview); // 调试点 5: 确认新 URL 创建和赋值
        } catch (createUrlError) {
            console.error('Error creating Object URL:', createUrlError); // 调试点 5a: 捕获 createObjectURL 的错误
            this.$message.error('创建图片预览失败');
            this.removeImage(); // Clean up on error
        }
      };

      reader.onerror = (error) => {
        console.error("6. FileReader onerror triggered:", error); // 调试点 6: 确认 onerror 是否触发
        this.$message.error('读取图片文件失败');
        this.removeImage(); // Clean up on error
      };

      console.log('3. Calling reader.readAsDataURL...'); // 调试点 7: 确认开始读取
      reader.readAsDataURL(file);

      // Clear file input AFTER reader setup, not before
      // Moved clearing to removeImage and after successful load if needed
    },
    removeImage() {
      this.uploadedImage = null;
      if (this.uploadedImagePreview) {
        URL.revokeObjectURL(this.uploadedImagePreview);
        this.uploadedImagePreview = null;
      }
      this.clearFileInput(); // Clear input when image is removed
    },
    clearFileInput() {
      // Ensures the same file can be selected again
      if (this.$refs.imageInput) {
        this.$refs.imageInput.value = '';
      }
    },
    handleShiftEnter(e) {
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      textarea.value = value.substring(0, start) + '\n' + value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 1;
      this.$nextTick(this.adjustTextareaHeight);
    },
  }
}
</script>

<style scoped>
.llm-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  padding: 15px;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #0a1936;
  color: #e0e0e0;
}

.llm-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  position: relative;
}

.llm-header h1 {
  color: #58a6ff;
  font-size: 24px;
  margin: 0 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

.llm-header .highlight {
  color: #8cb1ff;
}

.tech-line {
  height: 1px;
  width: 100px;
  background: linear-gradient(90deg, rgba(88, 166, 255, 0), rgba(88, 166, 255, 0.6), rgba(88, 166, 255, 0));
  position: relative;
}

.chat-container {
  display: flex;
  flex: 1;
  background: #102141;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(88, 166, 255, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.conversation-list {
  width: 260px;
  background: rgba(11, 24, 50, 0.8);
  border-right: 1px solid rgba(88, 166, 255, 0.2);
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 12px 15px;
  border-bottom: 1px solid rgba(88, 166, 255, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h3 {
  margin: 0;
  color: #a2c3ff;
  font-size: 15px;
  font-weight: 500;
}

.new-chat-btn {
  background: rgba(88, 166, 255, 0.15);
  border: 1px solid rgba(88, 166, 255, 0.3);
  color: #a2c3ff;
}

.new-chat-btn:hover {
  background: rgba(88, 166, 255, 0.25);
  border-color: rgba(88, 166, 255, 0.5);
}

.conversation-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
   scrollbar-width: thin;
   scrollbar-color: rgba(88, 166, 255, 0.3) transparent;
}
.conversation-items::-webkit-scrollbar {
    width: 5px;
}
.conversation-items::-webkit-scrollbar-track {
    background: transparent;
}
.conversation-items::-webkit-scrollbar-thumb {
    background-color: rgba(88, 166, 255, 0.3);
    border-radius: 3px;
}
.conversation-items::-webkit-scrollbar-thumb:hover {
    background-color: rgba(88, 166, 255, 0.5);
}

.no-conversations {
    text-align: center;
    color: rgba(162, 195, 255, 0.6);
    padding: 20px;
    font-size: 14px;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  position: relative;
  border: 1px solid transparent;
}

.conversation-item:hover {
  background-color: rgba(88, 166, 255, 0.1);
}

.conversation-item.active {
  background-color: rgba(88, 166, 255, 0.18);
  border-color: rgba(88, 166, 255, 0.3);
}

.conversation-item i.el-icon-chat-dot-round {
  color: #58a6ff;
  font-size: 16px;
  margin-right: 8px;
  flex-shrink: 0;
}

.chat-info {
  flex: 1;
  overflow: hidden;
  margin-right: 8px;
}

.chat-title {
  color: #c0d8ff;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
   font-weight: 500;
}

.chat-time {
  color: rgba(162, 195, 255, 0.6);
  font-size: 11px;
  margin-top: 3px;
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(162, 195, 255, 0.6);
  visibility: hidden;
  transition: visibility 0.2s ease, opacity 0.2s ease;
  opacity: 0;
}

.conversation-item:hover .chat-actions {
  visibility: visible;
  opacity: 1;
}

.chat-actions i {
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.chat-actions i:hover {
  color: #a2c3ff;
}
.chat-actions i.el-icon-delete:hover {
    color: #ff7875;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(88, 166, 255, 0.3) transparent;
}

.message-list::-webkit-scrollbar {
    width: 6px;
}
.message-list::-webkit-scrollbar-track {
    background: transparent;
}
.message-list::-webkit-scrollbar-thumb {
    background-color: rgba(88, 166, 255, 0.3);
    border-radius: 3px;
}
.message-list::-webkit-scrollbar-thumb:hover {
    background-color: rgba(88, 166, 255, 0.5);
}

.message-item {
  display: flex;
  margin-bottom: 25px;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background: rgba(88, 166, 255, 0.2);
  border: 1px solid rgba(88, 166, 255, 0.3);
}

.ai-message .message-avatar {
  background: rgba(141, 209, 254, 0.2);
  border: 1px solid rgba(141, 209, 254, 0.3);
}

.message-avatar i {
  font-size: 16px;
}

.user-message .message-avatar i {
  color: #58a6ff;
}

.ai-message .message-avatar i {
  color: #8DD1FE;
}

.message-content-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: calc(100% - 44px);
    position: relative;
}

.user-message {
    justify-content: flex-end;
}
.user-message .message-content-wrapper {
    align-items: flex-end;
}
.user-message .message-avatar {
    order: -1;
    margin-left: 0;
    margin-right: 12px;
}

.message-image-preview {
    max-width: 250px;
    max-height: 250px;
    margin-bottom: 8px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(88, 166, 255, 0.2);
    cursor: pointer;
}
.message-image-preview img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Updated Reasoning styles */
.message-reasoning {
    background: rgba(60, 70, 90, 0.6); /* Slightly different bg */
    border: 1px solid rgba(88, 166, 255, 0.15);
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 8px;
    max-width: 95%;
    align-self: flex-start;
    opacity: 0.9;
    font-size: 13px;
    line-height: 1.5;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
.reasoning-header {
    font-size: 12px;
    color: rgba(162, 195, 255, 0.8);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
    font-weight: 500;
}
.reasoning-content {
    color: rgba(200, 210, 230, 0.9); /* Brighter reasoning text */
    word-break: break-word;
}
/* Reasoning Markdown styles inherit from .message-text where applicable */

.message-content {
  max-width: 100%;
  display: flex;
  flex-direction: column;
}

.message-text {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  color: #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-message .message-text {
  background: rgba(88, 166, 255, 0.15);
  border: 1px solid rgba(88, 166, 255, 0.25);
  border-bottom-right-radius: 2px;
}

.ai-message .message-text {
  background: rgba(40, 56, 88, 0.7);
  border: 1px solid rgba(141, 209, 254, 0.2);
  border-bottom-left-radius: 2px;
}

/* Universal Markdown Styles within message bubbles */
.message-text >>> strong,
.message-text >>> b,
.reasoning-content >>> strong,
.reasoning-content >>> b {
    font-weight: 600;
    color: #c0d8ff;
}
.message-text >>> em,
.message-text >>> i,
.reasoning-content >>> em,
.reasoning-content >>> i {
    font-style: italic;
    color: #a2c3ff;
}
.message-text >>> pre,
.reasoning-content >>> pre {
    background-color: rgba(0, 0, 0, 0.4); /* Darker code block */
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    font-size: 13px;
    line-height: 1.5;
    margin: 10px 0; /* More vertical space */
    border: 1px solid rgba(88, 166, 255, 0.2);
    scrollbar-width: thin;
    scrollbar-color: rgba(88, 166, 255, 0.4) transparent;
}
.message-text >>> pre::-webkit-scrollbar,
.reasoning-content >>> pre::-webkit-scrollbar { height: 8px; } /* Slightly thicker scrollbar */
.message-text >>> pre::-webkit-scrollbar-thumb,
.reasoning-content >>> pre::-webkit-scrollbar-thumb { background-color: rgba(88, 166, 255, 0.4); border-radius: 4px; }

.message-text >>> code:not(pre code),
.reasoning-content >>> code:not(pre code) {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    background-color: rgba(88, 166, 255, 0.15); /* Slightly more visible inline code */
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 0.9em;
    color: #b3d1ff; /* Brighter inline code */
    border: 1px solid rgba(88, 166, 255, 0.25);
}
.message-text >>> a,
.reasoning-content >>> a {
    color: #82aaff;
    text-decoration: none;
    border-bottom: 1px solid rgba(130, 170, 255, 0.5);
    transition: color 0.2s ease, border-color 0.2s ease;
}
.message-text >>> a:hover,
.reasoning-content >>> a:hover {
    color: #a2c3ff;
    border-bottom-color: rgba(162, 195, 255, 0.8);
}
.message-text >>> ul,
.message-text >>> ol,
.reasoning-content >>> ul,
.reasoning-content >>> ol {
    padding-left: 25px;
    margin: 10px 0;
}
.message-text >>> li,
.reasoning-content >>> li {
    margin-bottom: 6px;
}
.message-text >>> hr,
.reasoning-content >>> hr { /* Style for horizontal rules */
    border: none;
    height: 1px;
    background-color: rgba(88, 166, 255, 0.2);
    margin: 15px 0;
}

.message-time {
  font-size: 11px;
  margin-top: 5px;
  color: rgba(162, 195, 255, 0.5);
}

.user-message .message-time {
    align-self: flex-end;
}
.ai-message .message-time {
    align-self: flex-start;
}

.streaming-indicator {
    position: absolute;
    bottom: 5px; /* 稍微调整位置以适应可能的尺寸变化 */
    right: 5px;
    width: 24px; /* 设定固定宽度 */
    height: 24px; /* 设定固定高度，使其为正圆 */
    display: flex; /* 使用 flex 居中图标 */
    align-items: center; /* 垂直居中 */
    justify-content: center; /* 水平居中 */
    font-size: 14px; /* 图标大小 */
    color: #8DD1FE;
    background-color: rgba(40, 56, 88, 0.8); /* 背景稍深一点点 */
    border-radius: 50%;
    cursor: pointer;
    animation: spin 1.5s linear infinite;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); /* 添加细微阴影 */
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; /* 加入 transform 和 box-shadow 过渡 */
    z-index: 10; /* 确保在内容之上 */
}

.streaming-indicator:hover {
  background-color: rgba(88, 166, 255, 0.4); /* 悬停背景更明显一点 */
  color: #e0f2ff; /* 悬停图标颜色更亮 */
  box-shadow: 0 2px 6px rgba(88, 166, 255, 0.4); /* 悬停时阴影更明显，带点蓝色光晕感 */
  transform: scale(1.1); /* 悬停时轻微放大 */
}

/* 旋转动画保持不变 */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
/* 如果悬停时也需要旋转，则移除悬停的 transform 或调整 */
/* .streaming-indicator:hover { ... transform: scale(1.1) rotate(calc(var(--spin-angle, 0deg) + 360deg)); } */
/* 如果想让悬停放大效果和旋转动画共存，可以只在 :hover 中设置 scale */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.streaming-indicator:hover {
  background-color: rgba(88, 166, 255, 0.4);
  color: #e0f2ff;
  box-shadow: 0 2px 6px rgba(88, 166, 255, 0.4);
  /* 仅应用 scale，旋转由 animation 控制 */
  transform: scale(1.1);
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.ai-disclaimer {
    margin-bottom: 10px;
    background-color: rgba(88, 166, 255, 0.1);
    border: 1px solid rgba(88, 166, 255, 0.2);
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
}
.ai-disclaimer >>> .el-alert__title {
    font-size: 13px;
    color: #a2c3ff;
}
.ai-disclaimer >>> .el-alert__icon {
    color: #58a6ff;
}

.chat-input-container {
  padding: 10px 15px;
  background: #0c1c33;
  border-top: 1px solid rgba(88, 166, 255, 0.1);
  position: relative;
}

.image-preview-area {
    position: relative;
    display: inline-block;
    margin-bottom: 10px;
    border: 1px solid rgba(88, 166, 255, 0.3);
    border-radius: 6px;
    padding: 5px;
    background: rgba(88, 166, 255, 0.05);
}
.preview-image {
    max-height: 80px;
    max-width: 150px;
    display: block;
    border-radius: 4px;
}
.remove-image-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: rgba(255, 77, 79, 0.8);
    border-color: transparent;
    color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    width: 20px;
    height: 20px;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.remove-image-btn:hover {
    background-color: rgba(217, 54, 62, 0.9);
}
.remove-image-btn i {
    font-weight: bold;
}

.chat-input-wrapper {
  background: #182c4a;
  border: 1px solid rgba(88, 166, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color 0.3s ease;
}

.chat-input-wrapper:focus-within {
  border-color: rgba(88, 166, 255, 0.6);
}

.chat-input {
  width: 100%;
  min-height: 40px;
  max-height: 150px;
  padding: 10px 15px;
  background: transparent;
  border: none;
  outline: none;
  color: #e0e0e0;
  font-size: 14px;
  resize: none;
  line-height: 1.6;
  font-family: inherit;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(88, 166, 255, 0.3) transparent;
}
.chat-input::-webkit-scrollbar { width: 5px; }
.chat-input::-webkit-scrollbar-thumb { background-color: rgba(88, 166, 255, 0.3); border-radius: 3px; }

.chat-input::placeholder {
  color: rgba(162, 195, 255, 0.5);
}

.input-actions {
  display: flex;
  align-items: center;
  padding: 8px 12px; 
  background: rgba(11, 24, 50, 0.6);
  border-top: 1px solid rgba(88, 166, 255, 0.15);
}

.upload-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(88, 166, 255, 0.1);
  color: #a2c3ff;
  cursor: pointer;
  margin-right: 10px;
  transition: all 0.2s ease;
}

.upload-btn:hover {
  background: rgba(88, 166, 255, 0.2);
  color: #c0d8ff;
}

.upload-btn i {
  font-size: 18px;
}


.send-btn {
  background: linear-gradient(to right, #4e89e0, #58a6ff);
  border: none;
  padding: 6px 18px;
  border-radius: 20px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  margin-left: auto;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(to right, #58a6ff, #4e89e0);
  box-shadow: 0 3px 10px rgba(88, 166, 255, 0.3);
}

.send-btn:disabled {
  background: rgba(88, 166, 255, 0.1);
  border: 1px solid rgba(88, 166, 255, 0.2);
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
  box-shadow: none;
  background-image: none;
}

.send-btn i {
  font-size: 16px;
}

.send-btn.is-loading {
    pointer-events: none;
}
.send-btn.is-loading::before {
    content: '';
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 16px;
}

/* ... (空聊天状态样式不变) ... */
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(162, 195, 255, 0.6);
  text-align: center;
  padding: 0 30px;
}

.empty-icon {
  font-size: 42px;
  margin-bottom: 15px;
  color: #58a6ff;
  opacity: 0.7;
}

.empty-chat h3 {
  font-size: 20px;
  margin-bottom: 10px;
  color: #c0d8ff;
}

.empty-chat p {
  font-size: 14px;
  margin-bottom: 25px;
  max-width: 350px;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  max-width: 500px;
}

.chip {
  background: rgba(88, 166, 255, 0.1);
  border: 1px solid rgba(88, 166, 255, 0.25);
  border-radius: 16px;
  padding: 6px 14px;
  font-size: 13px;
  color: #a2c3ff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip:hover {
  background: rgba(88, 166, 255, 0.2);
  border-color: rgba(88, 166, 255, 0.5);
  transform: translateY(-1px);
}
</style>