import words from './words.json'
import { attitudes } from './content.js'
export const options = {
  status: words,
  partner: [
    { id: 'headphones', label: '耳机', theme: 'blue', icon: 'headphones' },
    { id: 'bike', label: '单车', theme: 'green', icon: 'bike' },
    { id: 'guitar', label: '吉他', theme: 'purple', icon: 'guitar' },
    { id: 'drink', label: '奶茶', theme: 'pink', icon: 'drink' },
    { id: 'controller', label: '游戏手柄', theme: 'purple', icon: 'controller' },
    { id: 'camera', label: '相机', theme: 'yellow', icon: 'camera' },
  ],
  attitude: attitudes,
}

