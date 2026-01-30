const db = require('../../utils/db.js');

Page({
  data: {
    total: 0,
    chartData: [],
    moodMap: {
      happy: { label: '开心', icon: '😊', color: '#FFD166' },
      normal: { label: '平淡', icon: '😐', color: '#06D6A0' },
      sad: { label: '难过', icon: '😢', color: '#118AB2' },
      angry: { label: '生气', icon: '😡', color: '#EF476F' },
      excited: { label: '兴奋', icon: '😆', color: '#FF9F1C' }
    }
  },

  onShow() {
    this.updateStats();
  },

  updateStats() {
    const stats = db.getStats();
    const totalDays = stats.totalDays;
    const totalCount = stats.totalCount;
    
    if (totalCount === 0) {
      this.setData({ total: 0, chartData: [] });
      return;
    }

    const chartData = Object.keys(this.data.moodMap).map(key => {
      const count = stats.distribution[key] || 0;
      return {
        type: key,
        ...this.data.moodMap[key],
        count: count,
        percent: totalCount > 0 ? (count / totalCount * 100) : 0
      };
    }).sort((a, b) => b.count - a.count); // 按数量排序

    this.setData({
      total: totalDays, // 显示去重后的天数
      chartData
    });
  }
});
