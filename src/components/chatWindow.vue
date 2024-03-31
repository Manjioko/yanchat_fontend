<template>
    <div class="text-show">
        <el-scrollbar ref="scrollBar" :size="10" @scroll="handleScroll">
            <div @contextmenu.prevent="handleMenu" data-menu-stop data-chat-list>
                <div v-for="(textObject, idx) in chatBox" :key="textObject.chat_id">
                    <div class="show-time">{{ handleTime(Number(idx)) }}</div>
                    <div class="chat-box-remote" v-if="textObject.user !== 1">
                        <img :src="handleAvatar(textObject)" alt="其他" @error="handleError">
                        <div class="quote-and-box-style-remote">
                            <div class="chat-box-remote-message"
                                :class="{ 'not-padding': textObject.type.includes('video') || textObject.type.includes('image') }">
                                <span class="chat-box-remote-message-text">
                                    <div v-if="textObject.type === 'text'" v-html="textToMarkdown(textObject.text)"
                                        class="chat-text" data-menu-text data-target-other :data-index="idx">
                                    </div>
                                    <sendMedia
                                        v-else-if="textObject.type.includes('video') || textObject.type.includes('image')"
                                        :progress="textObject.progress" :type="textObject.type"
                                        :src="handleSendMediaSrc(textObject)" :response="textObject.response"
                                        :fileName="textObject.fileName" :thumbnail="textObject.thumbnail"
                                        :data-index="Number(idx)" :destroy="textObject.destroy" :user="textObject.user"
                                        :chat-id="textObject.chat_id" @withdraw="emitWithdraw" @deleted="emitDeleted"
                                        @quote="handleQuote" @loaded="handleLoaded" />
                                    <sendFile v-else :progress="textObject.progress" :type="textObject.type"
                                        :fileName="textObject.fileName" :size="textObject.size?.toString()"
                                        :response="textObject.response" :destroy="textObject.destroy"
                                        :user="textObject.user" :data-index="Number(idx)" @withdraw="emitWithdraw"
                                        @deleted="emitDeleted" @quote="handleQuote" />
                                </span>
                            </div>
                            <comentQuote v-if="textObject.quote" :comment="textObject.quote" />
                        </div>
                    </div>
                    <div class="chat-box-local" v-else>
                        <!-- <div v-if="textObject.quote">{{ textObject.quote }}</div> -->
                        <img v-if="textObject.loading" src="../assets/spinner1.svg" class="spinner-style"
                            v-spinner="textObject">
                        <el-icon v-if="textObject.inaccessible" color="#f00" class="message-warning">
                            <WarningFilled />
                        </el-icon>

                        <div class="quote-and-box-style-local">
                            <span class="chat-box-local-message"
                                :class="{ 'not-padding': textObject.type.includes('video') || textObject.type.includes('image') }">
                                <div v-if="textObject.type === 'text'" v-html="textToMarkdown(textObject.text)"
                                    class="chat-text" data-menu-text data-target-self :data-index="idx">
                                </div>
                                <sendMedia
                                    v-else-if="textObject.type.includes('video') || textObject.type.includes('image')"
                                    :progress="textObject.progress" :type="textObject.type"
                                    :src="handleSendMediaSrc(textObject)" :response="textObject.response"
                                    :fileName="textObject.fileName" :thumbnail="textObject.thumbnail"
                                    :data-index="Number(idx)" :destroy="textObject.destroy" :user="textObject.user"
                                    :chat-id="textObject.chat_id" @withdraw="emitWithdraw" @deleted="emitDeleted"
                                    @quote="handleQuote" @loaded="handleLoaded" />
                                <sendFile v-else :progress="textObject.progress" :type="textObject.type"
                                    :fileName="textObject.fileName" :size="textObject.size?.toString()"
                                    :response="textObject.response" :data-index="Number(idx)"
                                    :destroy="textObject.destroy" :user="textObject.user" @withdraw="emitWithdraw"
                                    @deleted="emitDeleted" @quote="handleQuote" />
                            </span>
                            <comentQuote v-if="textObject.quote" :comment="textObject.quote" />
                        </div>
                        <img :src="avatarSrc" alt="其他" @error="handleSelfError">
                    </div>
                </div>
            </div>
        </el-scrollbar>
    </div>
</template>
<script setup lang="ts">
import { defineProps, defineExpose, ref, defineEmits, watch, provide, onMounted } from 'vue'
import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import sendFile from '@/components/sendFile.vue'
import sendMedia from '@/components/sendMedia.vue'
import menu from '@/utils/contextMenu'
import comentQuote from './comentQuote.vue'
// import { useStore } from 'vuex'
import { useStore } from '@/store'
import { WarningFilled } from '@element-plus/icons-vue'
import { Box } from '@/interface/global'
import { ScrollData } from '@/interface/chatWindow'

const props = defineProps({
    chatBox: Object,
    avatarRefresh: String,
    markdown: Boolean
})
const scrollBar = ref()
let chatListDiv: HTMLElement | null = null
provide('scrollBar', scrollBar)
defineExpose({ scrollBar })
const emit = defineEmits(['scroll', 'deleted', 'withdraw', 'loaded', 'quote'])
const user_id = sessionStorage.getItem('user_id')
const baseUrl = sessionStorage.getItem('baseUrl')

const avatarSrc = ref(`${baseUrl}/avatar/avatar_${user_id}.jpg`)
watch(() => props.avatarRefresh, (val) => {
    if (val) {
        avatarSrc.value = val
    }
})

const store = useStore()
// let chatListDiv:HTMLElement | null = null
// 数据变动时,更新 scrollData
watch(() => props.chatBox?.length, () => {
    // console.log('这里没变吗', scrollBar.value.wrapRef.clientHeight, scrollBar.value.wrapRef.scrollHeight)
    updatedScrollData()
})
// 将 scrollBar 保存到 vuex
onMounted(() => {
    store.commit('chatWindow/setScrollBar', scrollBar.value)
    chatListDiv = document.querySelector('[data-chat-list]')
    store.commit('chatWindow/setChatListEle', chatListDiv)
    // console.log('scrollBar -> ', scrollBar.value)
    updatedScrollData()
})

// function watchScroll(el) {
//     const observer = new IntersectionObserver((en) => {},{threshold: 0.1, root: el})
// }

const md = MarkdownIt({
    langPrefix: 'hljs code-set language-',
    html: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(str, { language: lang }).value
            } catch (__) {
                // 
            }
        }

        return ''
    }
})
function textToMarkdown(text: string) {
    return props.markdown ? md.render(text) : text
}

// 更新滚动数据
function updatedScrollData() {
    if (scrollBar.value) {
        const s: ScrollData = {
            scrollBar: scrollBar.value,
            el: scrollBar.value.wrapRef,
            chatListDiv: chatListDiv
        }
        store.commit('chatWindow/setScrollData', s)
    }

}

function handleScroll(e: any) {
    updatedScrollData()
    emit('scroll', e)
}

// 自定义加载事件
const vSpinner = {
    mounted(el: HTMLElement, binding: any) {
        binding.value.spinnerTime && clearTimeout(binding.value.spinnerTime)
        binding.value.spinnerTime = setTimeout(() => {
            if (binding.value.loading) {
                binding.value.inaccessible = true
                el.remove()
            }
        }, 3000)
    },
}
// let metaData
// 头像处理
function handleAvatar(ob: Box) {
    const baseUrl: string = sessionStorage.getItem('baseUrl') || ''
    if (baseUrl) {
        const imgUrl = `${baseUrl}/avatar/avatar_${ob.user_id}.jpg`
        return imgUrl
    } else {
        console.log('baseUrl 不存在')
    }
    // console.log(ob)

}

function handleTime(idx: number) {
    const beforItem = props.chatBox?.[idx - 1 || 0]
    const nowItem = props.chatBox?.[idx]
    if (!beforItem) return ''
    const beforTime = new Date(beforItem?.time ?? '').getTime()
    const nowTime = new Date(nowItem?.time ?? '').getTime()
    const result = (nowTime - beforTime) / (1000 * 60)
    if (result > 10) {
        return nowItem?.time
    }
    return ''
}

// 媒体 src 处理
function handleSendMediaSrc(ob: Box) {
    const baseUrl = sessionStorage.getItem('baseUrl')
    const mediaUrl = ob.response ? `${baseUrl}/source/${ob.response}` : ob.src
    // console.log('mediaUrl -> ', mediaUrl)
    return mediaUrl
}

function handleDataSet(node: any, targetNode?: any) {
    for (let key in node.dataset) {
        if (key.includes('menu')) {
            if (key === 'menuText') {
                targetNode = node
            } else {
                targetNode = null
            }
            return targetNode
        }
    }
    return handleDataSet(node.parentNode, targetNode)
}
function handleMenu(e: any) {
    const node = handleDataSet(e.target)
    const menuText = [
        {
            label: "复制",
            onClick: () => {
                // console.log(window.getSelection().toString())
                console.log(navigator)
                const copyStr = window.getSelection()?.toString() || ''
                // 使用Clipboard API复制文本到剪贴板(浏览器限制,必须是 https 或者 localhost 才可以使用)
                navigator?.clipboard?.writeText(copyStr)
                    .catch((error) => {
                        console.log('复制失败 -> ', error);
                    })
            }
        },
        {
            label: '删除',
            onClick: () => {
                // 本地删除
                const index = node.dataset.index
                emit('deleted', index)
                console.log('删除 -> ', index)
            }
        },
        {
            label: '撤回',
            onClick: () => {
                // 本地撤回
                const index = node.dataset.index
                emit('withdraw', index)
            }
        },
        {
            label: '引用',
            onClick: () => {
                console.log(' -> 引用')
                const index = node.dataset.index
                emit('quote', index)
            }
        },
    ]
    if (Object.prototype.hasOwnProperty.call(node?.dataset ?? {}, 'targetOther')) {
        const shouldRemoveMenus = ['撤回']
        // const shouldAddMenus = []
        for (const m of shouldRemoveMenus) {
            const idx = menuText.findIndex((item) => item.label === m)
            if (idx > -1) {
                menuText.splice(idx, 1)
            }
        }
    }

    if (node) {
        menu(e, menuText)
    }
}
function emitWithdraw(index: number) {
    console.log('没撤回？？？？？？')
    emit('withdraw', index)
}

function emitDeleted(index: number) {
    console.log('删除 -> ', index)
    emit('deleted', index)
}

function handleError(e: any) {
    e.target.src = require('../assets/default_avatar.png')
    // avatarSrc.value = require('../assets/default_avatar.png')
}
function handleSelfError() {
    avatarSrc.value = require('../assets/default_avatar.png')
}

function handleQuote(idx: number) {
    console.log('handleQuote')
    emit('quote', idx)
}

// 图片加载完成后处理
function handleLoaded(chat_id: string) {
    emit('loaded', chat_id)
}
</script>
<style lang="scss" scoped>
.chat-box-remote {
    display: flex;
    align-items: center;
    margin: 8px 0;

    img {
        width: 40px;
        height: 40px;
        padding: 8px 16px;
        border-radius: 50%;
    }

    .chat-box-remote-message {
        display: block;
        box-sizing: border-box;
        padding: 10px;
        font-size: 14px;
        background: #F8F8F8;
        // opacity: 0.5;
        border-radius: 10px 10px 10px 0px;
        max-width: 500px;
        user-select: text;
    }
}

.chat-text {
    margin: 0;
    // white-space: pre-wrap;
    word-wrap: break-word;
    display: flex;
    flex-direction: column;
    max-width: 450px;

    :deep p {
        margin: 0;
        white-space: pre-line;

        &>code {
            background: #fff;
            box-sizing: border-box;
            padding: 4px 10px;
            display: inline-block;
            margin: 5px 0;
            // font-weight: 500;
            border-radius: 5px;
            font-style: italic;
        }
    }

    :deep blockquote {
        position: relative;
        margin: 0;
        word-wrap: break-word;
        white-space: normal;
        background-color: #cacccc4d;
        box-sizing: border-box;
        padding: 10px;
        border-radius: 3px;

        &::after {
            content: "";
            width: 3px;
            top: 20%;
            height: 60%;
            position: absolute;
            left: 4px;
            background-color: #7fc5d1;
        }
    }

    :deep ul,
    :deep ol {
        margin: 0;
        margin: 0;
        padding-inline-start: 15px;
        margin-block: 0px;
        margin-inline: 0px;
    }

    :deep pre {
        margin: 8px 0;
        // margin-bottom: 0px;
    }

    :deep h1,
    :deep h2,
    :deep h3,
    :deep h4,
    :deep h5,
    :deep h6 {
        margin-block-start: 8px;
        margin-block-end: 8px;
    }
}

.chat-box-local {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 12px 0;

    img {
        width: 40px;
        height: 40px;
        padding: 0 16px;
        border-radius: 50%;
    }

    .spinner-style {
        width: 20px;
        padding: 0;
        border-radius: 0;
        height: 20px;
        align-self: center;
    }

    .chat-box-local-message {
        display: block;
        box-sizing: border-box;
        padding: 10px;
        font-size: 14px;
        background: #EBF3FE;
        border-radius: 10px 10px 0px 10px;
        user-select: text;
    }
}

// hljs 代码块设置背景色
:deep .hljs {
    border-radius: 5px;
}

.text-show {
    flex: 1;
    overflow: hidden;
    position: relative;
}

.show-time {
    text-align: center;
    font-size: 12px;
    color: #7a7a7a;
    margin: 20px 0;
}

.quote-and-box-style-local {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.quote-and-box-style-remote {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.message-warning {
    align-self: center;
    margin-right: 7px;
    width: 12px;
}

.not-padding {
    padding: 0 !important;
}
</style>