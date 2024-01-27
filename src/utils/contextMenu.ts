import ContextMenu from '@imengyu/vue3-context-menu'
export default function onContextMenu(e: MouseEvent, items:any, theme = 'flat') {
    //prevent the browser's default menu
    e.preventDefault()
    ContextMenu.showContextMenu({
      x: e.x,
      y: e.y,
      theme,
      items,
    })
    document.getElementsByClassName('mx-context-menu')[0].removeEventListener('contextmenu', ptDefault)
    document.getElementsByClassName('mx-context-menu')[0].addEventListener('contextmenu', ptDefault)
  }

function ptDefault(e: any) {
    e.preventDefault()
}