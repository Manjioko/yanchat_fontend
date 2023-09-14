<template>
    <div class="text-show">
        <el-scrollbar ref="scrollBar" :size="10" @scroll="handleScroll">
            <div>
                <div v-for="(textObject, idx) in chatBox" :key="idx">
                    <div class="chat-box-remote" v-if="textObject.user !== 1">
                        <img src="../assets/avatar1.png" alt="其他">
                        <div class="chat-box-remote-message">
                            <span class="chat-box-remote-message-text">
                                <div
                                    v-if="textObject.type === 'text'"
                                    v-html="textToMarkdown(textObject.text)"
                                    class="chat-text"
                                >
                                </div>
                                <sendFile v-else :progress="textObject.progress" :type="textObject.type"
                                    :fileName="textObject.fileName" :size="textObject.size"
                                    :response="textObject.response" />
                            </span>
                        </div>
                    </div>
                    <div class="chat-box-local" v-else>
                        <span class="chat-box-local-message">
                            <div
                                v-if="textObject.type === 'text'"
                                v-html="textToMarkdown(textObject.text)"
                                class="chat-text"
                            >
                            </div>
                            <sendFile v-else :progress="textObject.progress" :type="textObject.type"
                                :fileName="textObject.fileName" :size="textObject.size"
                                :response="textObject.response" />
                        </span>
                        <img src="../assets/avatar2.png" alt="其他">
                    </div>
                </div>
            </div>      
        </el-scrollbar>
    </div>
</template>
<script setup>
import { defineProps, defineExpose,ref, defineEmits } from 'vue'
import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import sendFile from '@/components/sendFile.vue'

defineProps({
    chatBox: Object,
})
const scrollBar = ref()
defineExpose({ scrollBar })
const emit = defineEmits(['scroll'])

const md = MarkdownIt({
    langPrefix:   'hljs code-set language-', 
    html: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(str, { language: lang }).value;
            } catch (__) {
                // 
            }
        }

        return '';
    }
})
function textToMarkdown(text) {
    return md.render(text)
}
function handleScroll(val) {
    emit('scroll', val)
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
        & > code {
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
    :deep ul, :deep ol {
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
    :deep h1, :deep h2, :deep h3, :deep h4, :deep h5,:deep h6 {
        margin-block-start: 8px;
        margin-block-end: 8px;
    }
}
.chat-box-local {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 8px 0;

    img {
        width: 40px;
        height: 40px;
        padding: 8px 16px;
    }

    .chat-box-local-message {
        display: block;
        box-sizing: border-box;
        padding: 10px;
        font-size: 14px;
        background: #EBF3FE;
        border-radius: 10px 10px 0px 10px;
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
</style>