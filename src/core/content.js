const assetRoot = import.meta.env.BASE_URL + 'assets/'
export const art = name => assetRoot + 'art/' + name + '.png'
export const animation = name => assetRoot + 'animations/' + name + '.json'

export const steps = [
  { key: 'status', route: 'status', next: 'partner', index: 1,
    title: '今天的你，什么状态？', caption: '先选一个词，代表此刻的自己。' },
  { key: 'partner', route: 'partner', next: 'attitude', index: 2,
    title: '谁是你的生活搭子？', caption: '一件物品，一种习惯。' },
  { key: 'attitude', route: 'attitude', next: 'photo', index: 3,
    title: '用什么态度，过今天？', caption: '选一句你愿意贴在画像上的话。' },
]

// Theme order is the five result frames in the Figma section, from left to right.
export const themes = {
  pink: { label: '浪漫派', slogan: '把喜欢的小事，过成闪光的日常。', color: '#e286c9', ink: '#49326a', line: '#f5ff68' },
  yellow: { label: '好奇派', slogan: '把日常翻个面，总有新鲜事。', color: '#ede447', ink: '#174d3a', line: '#ffffff' },
  purple: { label: '灵感派', slogan: '灵感不必排队，想到就出发。', color: '#8866df', ink: '#34205c', line: '#fff294' },
  blue: { label: '自在派', slogan: '把步调放慢，跟自己的节奏走。', color: '#5ba0f5', ink: '#173e6d', line: '#fff386' },
  green: { label: '行动派', slogan: '向前迈一小步，也算今天的冒险。', color: '#bfbfbf', ink: '#264a37', line: '#efff75' },
}

export const attitudes = [
  { id: 'romance', label: '把浪漫装进口袋', theme: 'pink', icon: 'glasses' },
  { id: 'curious', label: '对世界保持好奇', theme: 'yellow', icon: 'controller' },
  { id: 'spark', label: '让灵感先出发', theme: 'purple', icon: 'guitar' },
  { id: 'unhurried', label: '按自己的节奏', theme: 'blue', icon: 'headphones' },
  { id: 'go', label: '想做就出发', theme: 'green', icon: 'bike' },
]

