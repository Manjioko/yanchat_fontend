<script setup>

import { ref } from 'vue'
// import PerfectScrollbar from 'perfect-scrollbar'

// new PerfectScrollbar('#container',{
//     wheelSpeed: 2,
//     wheelPropagation: true,
//     minScrollbarLength: 20
// })

const textList = ref([
    {
        user: 0,
        text: '我们今天中午去吃火锅吧?🤣🤣🤣',
    },
    {
        user: 0,
        text: `易经，是阐述天地世间万象变化的古老经典。包括《连山》《归藏》《周易》三部易书，其中《连山》《归藏》已经失传，现存于世的只有《周易》。
《易经》是中华民族智慧的结晶。 [1] 其从整体的角度去认识和把握世界，把人与自然看做是一个互相感应的有机整体，即“天人合一”。
《易经》长期被用作“卜筮”。“卜筮”就是对未来事态的发展进行预测，而《易经》便是总结这些预测的规律理论的书。
《易经》被誉为诸经之首。含盖万有，纲纪群伦，广大精微，包罗万象，是中华文明的源头。其内容涉及政治、经济、生活、文学、医学 [16] 、艺术、科学等诸多领域，是各家共同的经典`,
    },
    {
        user: 1,
        text: '好啊好啊你请客?',
        time: '2023-08-06 12:30'
    },
    {
        user: 1,
        text: '🉑🉑❤️',
    }
])

</script>
<template>
    <main class="main">
        <section class="chat-window">
            <section class="text-top">
                <div class="avatar">
                    <img src="../assets/avatar1.png" alt="avatar">
                    <span>Manjioko🐶</span>
                </div>
                <img src="../assets/setting.png" alt="setting">
            </section>
            <section class="text-show" id="container">
                <div v-for="(textObject, idx) in textList" :key="idx">
                    <div class="showTime" v-if="textObject.time">{{ textObject.time }}</div>
                    <div class="chat-box-remote" v-if="!textObject.user">
                        <img src="../assets/avatar1.png" alt="其他">
                        <div class="chat-box-remote-message">
                            <span class="chat-box-remote-message-text">
                                {{ textObject.text }}
                            </span>
                        </div>
                    </div>
                    <div class="chat-box-local" v-else>
                        <span class="chat-box-local-message">
                            {{ textObject.text }}
                        </span>
                        <img src="../assets/avatar2.png" alt="其他">
                    </div>
                </div>
            </section>
            <section class="text-send">
                <input type="text" placeholder="在这里输入你的消息...">
                <button>
                    <span>发送</span>
                    <img src="../assets/send.png" alt="send">
                </button>
            </section>
        </section>
    </main>
</template>
<style lang="scss" scoped>
.main {
    background-color: #F5F6FA;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
.chat-window {
    width: 70vw;
    height: 85vh;
    min-width: 600px;
    max-width: 1000px;
    max-height: 875px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    box-shadow: 0px 1px 6px 6px rgba(221, 223, 230, 0.31);
}
.text-show {
    flex: 1;
    overflow: auto;
    position: relative;
}
.text-send {
    height: 100px;
    display: flex;
    box-sizing: border-box;
    padding: 25px 20px 25px 20px;
    border-top: 2px solid #F5F6FA;
    input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 18px;
        font-family: Source Han Sans CN;
    }
    button {
        width: 140px;
        background: #2F88FF;
        outline: none;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: Source Han Sans CN;
        user-select: none;
        span {
            font-size: 18px;
            color: #FFFFFF;
        }
        img {
            width: 18px;
            height: 18px;
            margin-left: 12px;
        }
    }
}
.text-top {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 19px;
    box-shadow: 0px 3px 6px 0px rgba(221,223,230,0.31);
    font-family: Source Han Sans CN;
    user-select: none;
    img {
        width: 22px;
        height: 22px;
        -webkit-user-drag: none;
        cursor: pointer;
    }
    .avatar {
        flex: 1;
        display: flex;
        align-items: center;
        img {
            width: 54px;
            height: 54px;
            -webkit-user-drag: none;
        }
        span {
            margin-left: 19px;
            font-size: 30px;
            color: #333333;
            user-select: text;
        }
    }
}
.chat-box-remote {
    display: flex;
    align-items: center;
    margin: 15px 0;
    img {
        width: 54px;
        height: 54px;
        padding: 10px 20px;
    }
    .chat-box-remote-message {
        display: block;
        box-sizing: border-box;
        padding: 20px;
        font-size: 18px;
        background: #F8F8F8;
        // opacity: 0.5;
        border-radius: 10px 10px 10px 0px;
        max-width: 500px;
    }
}
.chat-box-local {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 15px 0;
    img {
        width: 54px;
        height: 54px;
        padding: 10px 20px;
    }
    .chat-box-local-message {
        display: block;
        box-sizing: border-box;
        padding: 20px;
        font-size: 18px;
        background: #EBF3FE;
        // opacity: 0.5;
        border-radius: 10px 10px 0px 10px;
    }
}
.showTime {
    text-align: center;
    font-size: 18px;
    color: #666666;
    box-sizing: border-box;
    font-family: Source Han Sans CN;
    padding: 10px;
}
</style>