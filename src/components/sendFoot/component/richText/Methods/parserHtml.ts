import * as htmlparser2 from "htmlparser2"

export interface HtmlParser_inter {
    onopentag?: (name: string, attributes: any) => void
    ontext?: (text: string) => void
    onclosetag?: (tagname: string) => void
    onend?: () => void
}


// const parser = new htmlparser2.Parser(
// {
//     onopentag(name, attributes) {
//         /*
//          * This fires when a new tag is opened.
//          *
//          * If you don't need an aggregated `attributes` object,
//          * have a look at the `onopentagname` and `onattribute` events.
//          */
//         if (name === "img") {
//             console.log("src -> ", attributes.src);
//         }
//         if (name === 'div') {
//             console.log('div -> ', attributes.offsetHeight, attributes.htmlMode)
//         }
//     },
//     ontext(text) {
//         /*
//          * Fires whenever a section of text was processed.
//          *
//          * Note that this can fire at any point within text and you might
//          * have to stitch together multiple pieces.
//          */
//         console.log("-->", text);
//     },
//     onclosetag(tagname) {
//         /*
//          * Fires when a tag is closed.
//          *
//          * You can rely on this event only firing when you have received an
//          * equivalent opening tag before. Closing tags without corresponding
//          * opening tags will be ignored.
//          */
//         if (tagname === "script") {
//             console.log("That's it?!");
//         }
//     },
//     oncomment(data: any) {
//         console.log('oncomment ->', data)
//     }
// }
// )

function htmlTextParser(params: HtmlParser_inter) {
    return new htmlparser2.Parser(params)
}

export default htmlTextParser