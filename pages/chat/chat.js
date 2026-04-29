const API_KEY_STORAGE = 'deepseek_api_key';
const API_BASE_STORAGE = 'deepseek_api_base';
const DEFAULT_API_BASE = 'https://api.deepseek.com';

const SYSTEM_PROMPT = '你是一位暖心、成熟、温柔的大姐姐，擅长心理安抚与积极引导。请共情、接纳用户情绪，语气温暖不说教，给出可执行的小建议，传递正能量；避免医疗诊断与极端承诺。';

Page({
  data: {
    apiKey: '',
    apiBase: DEFAULT_API_BASE,
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
    const savedBase = wx.getStorageSync(API_BASE_STORAGE) || DEFAULT_API_BASE;
    this.setData({ apiKey: savedKey, apiBase: savedBase });
  },

  onApiKeyInput(e) { this.setData({ apiKey: e.detail.value }); },
  onApiBaseInput(e) { this.setData({ apiBase: e.detail.value }); },
  onInput(e) { this.setData({ inputText: e.detail.value }); },
  toggleShowApiKey() { this.setData({ showApiKey: !this.data.showApiKey }); },

  saveApiKey() {
    const key = this.data.apiKey.trim();
    const base = this.normalizeApiBase(this.data.apiBase);

    if (!key) {
      wx.showToast({ title: '请先输入 API Key', icon: 'none' });
      return;
    }
    if (!base) {
      wx.showToast({ title: '请填写正确的接口地址', icon: 'none' });
      return;
    }

    wx.setStorageSync(API_KEY_STORAGE, key);
    wx.setStorageSync(API_BASE_STORAGE, base);
    this.setData({ apiKey: key, apiBase: base });
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  normalizeApiBase(rawBase) {
    const base = (rawBase || '').trim().replace(/\/+$/, '');
    if (!base || !/^https:\/\//.test(base)) return '';
    return base;
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
    const base = this.normalizeApiBase(this.data.apiBase) || DEFAULT_API_BASE;
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(item => ({ role: item.role, content: item.content }))
    ];

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${base}/chat/completions`,
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
            const msg = res.data?.error?.message || `接口异常(${res.statusCode})`;
            reject(new Error(msg));
            return;
          }
          const content = res.data?.choices?.[0]?.message?.content;
          resolve(content);
        },
        fail: (error) => {
          const detail = error?.errMsg ? `：${error.errMsg}` : '';
          reject(new Error(`网络请求失败${detail}（请确认已在小程序后台配置 request 合法域名）`));
        }
      });
    });
  }
});
