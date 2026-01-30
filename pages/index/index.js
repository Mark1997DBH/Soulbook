const db = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    records: [],
    currentDate: '',
    moodMap: {
      happy: { text: '开心', icon: '😊' },
      normal: { text: '平淡', icon: '😐' },
      sad: { text: '难过', icon: '😢' },
      angry: { text: '生气', icon: '😡' },
      excited: { text: '兴奋', icon: '😆' }
    }
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentDate: `${now.getFullYear()}年${now.getMonth() + 1}月`
    });
  },

  onShow() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData(() => {
      wx.stopPullDownRefresh();
    });
  },

  loadData(cb) {
    // 简单起见，这里加载所有数据，实际可以按月加载
    const list = db.getAll();
    this.setData({
      records: list
    }, cb);
  }
});
