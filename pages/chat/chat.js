const API_KEY_STORAGE = 'deepseek_api_key';

const SYSTEM_PROMPT = '你是一位暖心、成熟、温柔的大姐姐，擅长心理安抚与积极引导。请共情、接纳用户情绪，语气温暖不说教，给出可执行的小建议，传递正能量；避免医疗诊断与极端承诺。';

Page({
  data: {
    apiKey: '',
    showApiKey: false,
    inputText: '',
    loading: false,
    messages: [
      {
        id: 'm0',
        role: 'assistant',
        content: '嗨，我是你的暖心姐姐🌷 今天想聊聊什么？我会认真听你说。'
      }
    ],
    scrollToId: 'm0'
  },

  onLoad() {
    const savedKey = wx.getStorageSync(API_KEY_STORAGE) || '';
    if (savedKey) this.setData({ apiKey: savedKey });
  },

  onApiKeyInput(e) { this.setData({ apiKey: e.detail.value }); },
  onInput(e) { this.setData({ inputText: e.detail.value }); },
  toggleShowApiKey() { this.setData({ showApiKey: !this.data.showApiKey }); },

  saveApiKey() {
    if (!this.data.apiKey) {
      wx.showToast({ title: '请先输入 API Key', icon: 'none' });
      return;
    }
    wx.setStorageSync(API_KEY_STORAGE, this.data.apiKey.trim());
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  clearChat() {
    this.setData({
      messages: [{ id: 'm0', role: 'assistant', content: '我们重新开始吧～你可以慢慢说。' }],
      scrollToId: 'm0'
    });
  },

  async sendMessage() {
    const text = (this.data.inputText || '').trim();
    if (!text) return;
    if (!this.data.apiKey.trim()) {
      wx.showToast({ title: '请先保存 API Key', icon: 'none' });
      return;
    }

    const userMsg = { id: `u_${Date.now()}`, role: 'user', content: text };
    const nextMessages = [...this.data.messages, userMsg];
    this.setData({ messages: nextMessages, inputText: '', loading: true, scrollToId: userMsg.id });

    try {
      const aiText = await this.requestDeepSeek(nextMessages);
      const aiMsg = { id: `a_${Date.now()}`, role: 'assistant', content: aiText || '姐姐刚刚有点走神啦，你再说一次好吗？' };
      this.setData({ messages: [...this.data.messages, aiMsg], scrollToId: aiMsg.id });
    } catch (err) {
      wx.showToast({ title: err.message || '请求失败，请检查网络', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  requestDeepSeek(history) {
    const key = this.data.apiKey.trim();
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(item => ({ role: item.role, content: item.content }))
    ];

    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.deepseek.com/chat/completions',
        method: 'POST',
        timeout: 30000,
        header: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`
        },
        data: {
          model: 'deepseek-chat',
          temperature: 0.8,
          messages
        },
        success: (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`接口异常(${res.statusCode})`));
            return;
          }
          const content = res.data?.choices?.[0]?.message?.content;
          resolve(content);
        },
        fail: () => reject(new Error('网络请求失败'))
      });
    });
  }
});
