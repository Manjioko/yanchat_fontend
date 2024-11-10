<template>
    <!-- @keydown.delete="handleDelete" -->
    <div contenteditable="true" enterkeyhint="send" id="rich-editor" class="w-e-text"></div>
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
    // richTextEl.value?.addEventListener('keydown', (e: any) => {
    //     if (e.key === 'Enter' && e.shiftKey) {
    //         e.preventDefault()
    //         console.log('xxxxxxxxxx')
    //         // sendMessage()
    //     }
    // })
    richTextEl.value?.addEventListener('paste', (data: any) => {
        data.preventDefault()
        if (data.clipboardData?.items[0].type.includes('image/')) {
            const f = data.clipboardData?.items[0].getAsFile()
            if (f) {
                const dotName = data.clipboardData?.items[0].type.split('/')[1].toLowerCase()
                const flie = new File([f], `yanchat_image_${new Date().getTime()}.${dotName}`, { type: f.type })
                const src = window.URL.createObjectURL(flie)
                listMap.set(src, flie)
                const img = document.createElement('img')
                img.src = src
                img.style.width = '200px'

                // 操作光标
                const selection = getSelection()
                const range = selection?.getRangeAt(0)

                if (!range?.collapsed) return console.log('不支持粘贴到选区中')

                range?.insertNode(img)
                // 插入一个空的 <div> 标签来实现换行
                const emptyDiv = document.createElement('div');
                emptyDiv.innerHTML = "<br>"; // 空白行效果
                img.after(emptyDiv);

                // 将光标移动到空的 <div> 内
                range.setStart(emptyDiv, 0);
                range.collapse(true);

                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
        if (data.clipboardData?.items[0].type.includes('text/plain')) {
            // // 获取选定对象
            const selection = getSelection()
            // console.log('selection -> ', selection?.toString())
            // range 表示光标的范围，比如说没有选择任何文字时，光标就是一个杠
            const range = selection?.getRangeAt(0) 
            if (!range?.collapsed) return console.log('不支持粘贴到选区中')
            // console.log('range is box -> ', range)
            
            // 创建新的 div
            const div = document.createElement('div')
            div.innerHTML = data.clipboardData?.getData('text/plain')
            div.style.display = 'inline'
            // 插入到光标所在的位置
            range?.insertNode(div)
            // 插入文本后，清除选定对象的所有光标对象
            selection?.removeAllRanges()
            // 插入新的光标对象
            selection?.addRange(range)
            // 光标移动到最后（下一个元素开始的地方）
            range?.setStart(div, 1)
            // 让光标折叠成一条杠（不要有选区）
            range.collapse(true)
            // console.log('插入文本后，清除选定对象的所有光标对象')
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
    // min-height: 80px;
    // max-height: 250px;
    overflow: auto;
    outline: none;
    border: none;
    overflow: auto;
    font-size: 14px;
    line-height: 1.5;
    margin: 8px;
}
</style>