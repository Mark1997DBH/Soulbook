/**
 * 本地数据存储层 - 模拟数据库操作
 * 使用 wx.setStorageSync / wx.getStorageSync
 */

const DB_KEY = 'mood_diary_db';

class MoodDB {
  constructor() {
    this.key = DB_KEY;
  }

  // 获取所有记录
  getAll() {
    return wx.getStorageSync(this.key) || [];
  }

  // 保存所有记录
  saveAll(data) {
    wx.setStorageSync(this.key, data);
  }

  // 新增记录
  add(record) {
    const list = this.getAll();
    // 补全字段
    const newRecord = {
      id: Date.now().toString(), // 简单ID
      createTime: Date.now(),
      date: record.date,       // YYYY-MM-DD
      type: record.type,       // happy, normal, sad, angry, excited
      note: record.note || '',
      ...record
    };
    list.unshift(newRecord); // 最新在最前
    this.saveAll(list);
    return newRecord;
  }

  // 根据月份获取记录 (YYYY-MM)
  getByMonth(year, month) {
    const list = this.getAll();
    const target = `${year}-${month.toString().padStart(2, '0')}`;
    return list.filter(item => {
      return item.date.startsWith(target);
    });
  }

  // 获取统计数据
  getStats() {
    const list = this.getAll();
    
    // 统计去重后的天数
    // 使用 split(' ')[0] 确保只获取日期部分 (YYYY-MM-DD)，忽略时间
    const uniqueDays = new Set(list.map(item => item.date.split(' ')[0]));
    
    const stats = {
      totalCount: list.length, // 总记录数
      totalDays: uniqueDays.size, // 总天数
      distribution: {
        happy: 0,
        normal: 0,
        sad: 0,
        angry: 0,
        excited: 0
      }
    };

    list.forEach(item => {
      if (stats.distribution[item.type] !== undefined) {
        stats.distribution[item.type]++;
      }
    });

    return stats;
  }
  
  // 清空数据（调试用）
  clear() {
    wx.removeStorageSync(this.key);
  }
}

module.exports = new MoodDB();
