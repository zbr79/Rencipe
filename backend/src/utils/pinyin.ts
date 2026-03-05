/**
 * Pinyin conversion utility
 * Converts Chinese characters to pinyin and generates first-letter abbreviations
 * 
 * Example: 白切鸡 => pinyin: "baiqieji", firstLetters: "bqj"
 */

// Comprehensive Chinese character to pinyin map for common dishes
const pinyinMap: { [key: string]: string } = {
  '白': 'bai', '切': 'qie', '鸡': 'ji',
  '糖': 'tang', '醋': 'cu', '排': 'pai', '骨': 'gu',
  '宫': 'gong', '保': 'bao', '蛋': 'dan',
  '番': 'fan', '鱼': 'yu', '香': 'xiang',
  '煎': 'jian', '馄': 'hun', '饨': 'tun',
  '炒': 'chao', '青': 'qing', '菜': 'cai', '豆': 'dou',
  '芽': 'ya', '黑': 'hei', '木': 'mu', '耳': 'er',
  '冬': 'dong', '瓜': 'gua', '汤': 'tang', '红': 'hong',
  '烧': 'shao', '肉': 'rou', '酸': 'suan', '牛': 'niu',
  '腩': 'nan', '萝': 'luo', '卜': 'bu', '高': 'gao',
  '丽': 'li', '鸭': 'ya', '北': 'bei', '京': 'jing',
  '烤': 'kao', '凤': 'feng', '爪': 'zhao',
  '麻': 'ma', '辣': 'la', '辣': 'la', '鸡': 'ji',
  '东': 'dong', '北': 'bei', '南': 'nan', '西': 'xi',
  '中': 'zhong', '国': 'guo', '菜': 'cai',
  '甜': 'tian', '酸': 'suan', '苦': 'ku', '辣': 'la',
  '咸': 'xian', '鲜': 'xian', '香': 'xiang',
  '米': 'mi', '饭': 'fan', '面': 'mian', '条': 'tiao',
  '汤': 'tang', '粉': 'fen', '羹': 'geng',
  '炖': 'dun', '煲': 'bao', '炸': 'zha', '蒸': 'zheng',
  '水': 'shui', '火': 'huo', '油': 'you', '盐': 'yan',
  '糖': 'tang', '酱': 'jiang', '醋': 'cu', '酒': 'jiu',
  '葱': 'cong', '姜': 'jiang', '蒜': 'suan', '辣': 'la',
  '椒': 'jiao', '豆': 'dou', '花': 'hua', '生': 'sheng',
  '芝': 'zhi', '麻': 'ma', '芹': 'qin', '菜': 'cai',
  '西': 'xi', '红': 'hong', '番': 'fan', '茄': 'qie',
  '土': 'tu', '豆': 'dou', '玉': 'yu', '米': 'mi',
  '胡': 'hu', '萝': 'luo', '卜': 'bu', '栗': 'li',
  '南': 'nan', '瓜': 'gua', '冬': 'dong', '瓜': 'gua',
  '苦': 'ku', '瓜': 'gua', '丝': 'si', '瓜': 'gua',
  '豆': 'dou', '芽': 'ya', '豆': 'dou', '浆': 'jiang',
  '豆': 'dou', '腐': 'fu', '豆': 'dou', '干': 'gan',
  '黄': 'huang', '豆': 'dou', '绿': 'lv', '豆': 'dou',
  '赤': 'chi', '豆': 'dou', '黑': 'hei', '豆': 'dou',
  '蚕': 'can', '豆': 'dou', '紫': 'zi', '薯': 'shu',
  '山': 'shan', '药': 'yao', '红': 'hong', '薯': 'shu',
  '白': 'bai', '薯': 'shu', '芋': 'yu', '头': 'tou',
  '马': 'ma', '铃': 'ling', '薯': 'shu', '香': 'xiang',
  '蕉': 'jiao', '菠': 'bo', '萝': 'luo', '蜜': 'mi',
  '瓜': 'gua', '甜': 'tian', '瓜': 'gua', '石': 'shi',
  '榴': 'liu', '芒': 'mang', '果': 'guo', '草': 'cao',
  '莓': 'mei', '蓝': 'lan', '莓': 'mei', '猕': 'mi',
  '猴': 'hou', '桃': 'tao', '杨': 'yang', '梅': 'mei',
  '李': 'li', '子': 'zi', '樱': 'ying', '桃': 'tao',
};

/**
 * Convert a single Chinese character to pinyin
 * Falls back to lowercase if not in map
 */
function charToPinyin(char: string): string {
  if (pinyinMap[char]) {
    return pinyinMap[char];
  }
  // Fallback: return the character itself
  return char.toLowerCase();
}

/**
 * Convert Chinese text to full pinyin
 * Example: "白切鸡" => "baiqieji"
 */
export function textToPinyin(text: string): string {
  if (!text) return "";
  
  return text
    .split("")
    .map(char => {
      // Check if character is Chinese (CJK Unified Ideographs)
      const code = char.charCodeAt(0);
      if (code >= 0x4e00 && code <= 0x9fcc) {
        return charToPinyin(char);
      }
      // Return non-Chinese characters as-is (lowercase)
      return char.toLowerCase();
    })
    .join("");
}

/**
 * Convert Chinese text to first-letter abbreviation
 * Example: "白切鸡" => "bqj"
 */
export function textToFirstLetters(text: string): string {
  if (!text) return "";
  
  return text
    .split("")
    .map(char => {
      const code = char.charCodeAt(0);
      if (code >= 0x4e00 && code <= 0x9fcc) {
        const pinyin = charToPinyin(char);
        return pinyin[0].toLowerCase();
      }
      return char.toLowerCase();
    })
    .join("");
}

/**
 * Check if search term matches a text using pinyin
 * Matches by:
 * 1. Exact text match (case-insensitive)
 * 2. Full pinyin match
 * 3. First-letter abbreviation match
 */
export function matchesPinyin(searchTerm: string, text: string): boolean {
  if (!searchTerm || !text) return false;
  
  const lowerSearch = searchTerm.toLowerCase().trim();
  const lowerText = text.toLowerCase();
  
  // 1. Direct text match
  if (lowerText.includes(lowerSearch)) {
    return true;
  }
  
  // 2. Full pinyin match
  const fullPinyin = textToPinyin(text);
  if (fullPinyin.includes(lowerSearch)) {
    return true;
  }
  
  // 3. First-letter abbreviation match
  const firstLetters = textToFirstLetters(text);
  if (firstLetters.includes(lowerSearch)) {
    return true;
  }
  
  return false;
}
