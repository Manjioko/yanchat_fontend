<template>
    <!-- @keydown.delete="handleDelete" -->
    <!-- <div contenteditable="true" id="rich-editor" class="w-e-text"></div> -->
    <Editor
        style="height: 100%; height: 100%; overflow-y: hidden;"
        v-model="valueHtml"
        :defaultConfig="editorConfig"
        :mode="mode"
        @onCreated="handleCreated"
      />
</template>

<script setup lang="ts">
import { defineEmits, ref, onMounted, defineExpose } from 'vue'
import parser from './Methods/parserHtml'


defineExpose({
    clearRichText,
    handleSend
})

const listMap = new Map()
const emit = defineEmits(['richTextData'])
const richTextEl = ref()

const textAry = ref<any[]>([])

const mode =  'default' // 或 'simple'
const valueHtml = ref('')
const editorConfig = ref({
    placeholder: '在这里输入你的消息...',
})
// 编辑器实例，必须用 shallowRef
// const editorRef = shallowRef()

function handleCreated(editor: any) {
    console.log(editor)
    // editorRef.value = editor // 记录 editor 实例，重要！
}


function onopentag(tag: string, attr: any) {
    // console.log('标签开始解析', tag)
    if (tag === 'img') {
        const src = attr.src
        // console.log('src -> ', src)
        textAry.value.push({
            type: 'img',
            data: src
        })
    }
}

// 文本解析时触发
function ontext(text: string) {
    // console.log('标签解析时触发', text)
    textAry.value.push({
        type: 'text',
        data: text
    })
}

function onend() {
    // console.log('标签结束解析')
    // textAry.value.forEach((item: any, index: number) => {
    //     textAry.value[index].data = `${item.data}\n`
    // })
    emit('richTextData', {
        textAry: [...textAry.value],
        listMap: new Map([...listMap])
    } as RichTextData)
    textAry.value = []
    listMap.clear()
    // 清空多余的 div
    handleDelete()
}

const p = parser({
    onopentag,
    ontext,
    onend
})

function clearRichText() {
    if (!richTextEl.value) return
    richTextEl.value.innerHTML = ''
}

onMounted(() => {
    richTextEl.value = document.getElementById('rich-editor')
    richTextEl.value?.addEventListener('paste', (data: any) => {
        data.preventDefault()
        if (data.clipboardData?.items[0].type.includes('image/')) {
            const f = data.clipboardData?.items[0].getAsFile()
            if (f) {
                const dotName = data.clipboardData?.items[0].type.split('/')[1].toLowerCase()
                const flie = new File([f], `yanchat_image_${new Date().getTime()}.${dotName}`, { type: f.type })
                // 获取选定对象
                const selection = getSelection()
                // 设置最后光标对象
                const lastEditRange = selection?.getRangeAt(0)
                if (lastEditRange) {
                    const rangeStartOffset = lastEditRange.startOffset
                    // console.log('rangeStartOffset ->', rangeStartOffset)
                    const lastEl = lastEditRange.endContainer
                    // console.log('存在文件')
                    const src = window.URL.createObjectURL(flie)
                    listMap.set(src, flie)
                    // console.log('listMap -> ', listMap)
                    const img = document.createElement('img')
                    img.src = src
                    img.style.width = '200px'
                    lastEl?.insertBefore(img, lastEl?.lastChild)
                    lastEditRange.setStart(lastEl, rangeStartOffset + 1)
                    lastEditRange.collapse(true)
                    // 清除选定对象的所有光标对象
                    selection?.removeAllRanges()
                    // 插入新的光标对象
                    selection?.addRange(lastEditRange)
                }
            }
        }
        if (data.clipboardData?.items[0].type.includes('text/plain')) {
            // 获取选定对象
            const selection = getSelection()
            // 设置最后光标对象
            const lastEditRange = selection?.getRangeAt(0)
            if (!lastEditRange) return
            const rangeStartOffset = lastEditRange.startOffset
            const lastEl = lastEditRange.endContainer
            const text = data.clipboardData?.getData('text/plain')
            const div = document.createElement('div')
            div.innerHTML = text
            div.style.display = 'inline'
            lastEl?.insertBefore(div, lastEl?.lastChild)
            lastEditRange.setStart(lastEl, rangeStartOffset + 1)
            lastEditRange.collapse(true)
            // 清除选定对象的所有光标对象
            selection?.removeAllRanges()
            // 插入新的光标对象
            selection?.addRange(lastEditRange)
        }
    })

    richTextEl.value?.addEventListener('click', () => {
        // 获取选定对象
        const selection = getSelection()
        // 设置最后光标对象
        selection?.getRangeAt(0)
    })


})


function handleSend() {
    // parser.write(richTextEl.value?.innerHTML ?? '')
    // p(richTextEl.value?.innerHTML ?? '')
    p.parseComplete(richTextEl.value?.innerHTML ?? '')
    // emit('richTextData', richTextEl.value?.innerHTML ?? '')
}

function handleDelete() {
    const children = richTextEl.value?.children
    if (!children || !richTextEl.value) return
    const childrenList = Array.from(children) as HTMLElement[]
    for (const child of childrenList) {
        if (child.children.length === 0 && child.innerHTML === '' && !child.nodeName.includes('IMG')) {
            child.remove()
        }
    }
}
</script>

<style scoped lang="scss">
.w-e-text {
    width: 100%;
    height: 100%;
    min-height: 80px;
    max-height: 250px;
    overflow: auto;
    outline: none;
    border: none;
    overflow: auto;
    font-size: 14px;
    line-height: 1.5;
    margin: 8px;
}
</style>