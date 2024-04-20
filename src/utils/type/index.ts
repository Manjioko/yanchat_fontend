export default function typeIs(anyOne: any) {
    return Object.prototype.toString.call(anyOne).slice(8, -1)
}