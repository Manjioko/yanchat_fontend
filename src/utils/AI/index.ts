// import { ref, nextTick } from 'vue'
// import { v4 as uuidv4 } from 'uuid'
// import { dbReadAll, dbAdd } from '@/view/Main/Methods/indexDB'
// import { Ollama } from "ollama/dist/browser.cjs"
// import { FriendsListStore } from '@/components/friendsList/store'
// import { storeToRefs } from 'pinia'
// import { ChatWindowStore } from '@/components/chatWindow/store'
// import { scrollToBottom } from '@/view/Main/Methods/mainMethods'
// import { MainStore } from '@/view/Main/store'

// const { chatBox } = storeToRefs(ChatWindowStore())
// const { ollama } = storeToRefs(MainStore())
// const { activeFriend, userInfo } = storeToRefs(FriendsListStore())

// // 初始化AI, 该方法一定要在 数据库 初始化后执行
// export default async function initAI() {
//     const aiUserId = userInfo.value?.friends.find((i: any) => i.ai)?.user_id
//     console.log('aiUserId -> ', aiUserId)
//     if (!aiUserId) return
//     dbReadAll(aiUserId)
//     .then((res: Box[]) => {
//         if (!res.length) {
//             dbAdd(aiUserId, {
//                 user_id: aiUserId,
//                 text: '',
//                 type: 'text',
//                 time: '',
//                 chat_id: uuidv4(),
//                 to_table: '',
//                 to_id: '',  
//                 ai_context: [],
//                 user: 1,
//             })
//         } else {
//             chatBox.value = res.slice(1)
//             nextTick(() => {
//                 scrollToBottom()
//             })
//         }
//     })
//     const AI_URL = ref(localStorage.getItem('AI_URL') || 'http://127.0.0.1:11434')
//     const ol = new Ollama({ host: AI_URL.value, fetch(input, init) {
//         return fetch(input, {
//             ...init,
//             headers: {
//                 ...init?.headers,
//                 'Authorization': 'Bearer ' + sessionStorage.getItem('Token')
//             }
//         })
//     }, })
//     if (ol) {
//         console.log('ol -> ', ol)
//         ollama.value = ol
//     }
// }