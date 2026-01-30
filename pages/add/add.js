const db = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    date: '',
    selectedType: 'normal',
    note: ''
  },

  onLoad() {
    this.setData({
      date: util.formatDate(new Date())
    });
  },

  selectMood(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ selectedType: type });
  },

  bindDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  bindInput(e) {
    this.setData({ note: e.detail.value });
  },

  saveRecord() {
    if (!this.data.selectedType) {
      wx.showToast({ title: '请选择心情', icon: 'none' });
      return;
    }

    // 获取当前时间 HH:mm:ss
    const timeStr = util.formatTimePart(new Date());
    const fullDate = `${this.data.date} ${timeStr}`;

    const record = {
      date: fullDate,
      type: this.data.selectedType,
      note: this.data.note
    };

    db.add(record);

    // 保存后重置页面状态
    this.setData({
      note: '',
      selectedType: 'normal',
      date: util.formatDate(new Date())
    });

    wx.showToast({
      title: '记录成功',
      icon: 'success',
      duration: 1500,
      success: () => {
        setTimeout(() => {
          // 返回上一页或首页
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      }
    });
  }
});
