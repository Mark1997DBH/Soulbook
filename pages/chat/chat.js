const SYSTEM_PROMPT = '你是一位温柔、成熟、充满同理心的暖心大姐姐。请用中文回应，语气温暖真诚，重点是抚慰心灵、鼓励用户、传递积极正能量。不要说教，不要否定用户情绪，先共情再给建议，回答尽量简洁。';

Page({
  data: {
    apiKey: '',
    showApiKey: false,
    inputText: '',
    loading: false,
    scrollToView: '',
    messages: [
      { id: 1, role: 'assistant', content: '嗨，我在这里陪你。今天过得怎么样？如果你愿意，我们可以慢慢聊。' }
    ]
  },

  onLoad() {
    const savedApiKey = wx.getStorageSync('deepseek_api_key') || '';
    const savedMsgs = wx.getStorageSync('chat_history') || [];
    this.setData({
      apiKey: savedApiKey,
      messages: savedMsgs.length ? savedMsgs : this.data.messages
    }, () => this.scrollToBottom());
  },

  onApiKeyInput(e) { this.setData({ apiKey: e.detail.value.trim() }); },
  onInput(e) { this.setData({ inputText: e.detail.value }); },

  toggleApiVisible() { this.setData({ showApiKey: !this.data.showApiKey }); },

  saveApiKey() {
    if (!this.data.apiKey) {
      wx.showToast({ title: '请先输入 API Key', icon: 'none' });
      return;
    }
    wx.setStorageSync('deepseek_api_key', this.data.apiKey);
    wx.showToast({ title: 'API Key 已保存', icon: 'success' });
  },

  scrollToBottom() {
    const list = this.data.messages;
    if (!list.length) return;
    this.setData({ scrollToView: `msg-${list[list.length - 1].id}` });
  },

  persistMessages(messages) {
    wx.setStorageSync('chat_history', messages.slice(-30));
  },

  sendMessage() {
    const userText = this.data.inputText.trim();
    if (!userText) return;
    if (!this.data.apiKey) {
      wx.showToast({ title: '请先保存 API Key', icon: 'none' });
      return;
    }

    const userMsg = { id: Date.now(), role: 'user', content: userText };
    const nextMessages = [...this.data.messages, userMsg];
    this.setData({ messages: nextMessages, inputText: '', loading: true }, () => this.scrollToBottom());

    const payloadMessages = [{ role: 'system', content: SYSTEM_PROMPT }]
      .concat(nextMessages.slice(-10).map(item => ({ role: item.role, content: item.content })));

    wx.request({
      url: 'https://api.deepseek.com/chat/completions',
      method: 'POST',
      timeout: 30000,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.data.apiKey}`
      },
      data: {
        model: 'deepseek-chat',
        messages: payloadMessages,
        temperature: 0.8
      },
      success: (res) => {
        const content = res?.data?.choices?.[0]?.message?.content;
        if (!content) {
          wx.showToast({ title: '返回内容为空，请稍后再试', icon: 'none' });
          return;
        }
        const assistantMsg = { id: Date.now() + 1, role: 'assistant', content };
        const updated = [...this.data.messages, assistantMsg];
        this.setData({ messages: updated }, () => this.scrollToBottom());
        this.persistMessages(updated);
      },
      fail: (err) => {
        console.error('deepseek request failed', err);
        wx.showToast({ title: '请求失败，请检查网络或域名白名单', icon: 'none' });
      },
      complete: () => this.setData({ loading: false })
    });
  }
});
