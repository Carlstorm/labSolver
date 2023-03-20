//TYPES
import { canvasBox, canvasHandler, drawModes } from "./canvasHandler";

export interface point {
    x: number
    y: number
}

interface vector {
    p1: point
    p2: point
}

export class mouseHandler {
    isDrawing: boolean;
    canvas: canvasHandler;
    mode: drawModes;
    cursorSize: number;
    throttlePerSecond: number;
    throttleTime: number;
    throttleDensity: number
    point: point | null;
    vector: vector | null
    slider: {elm: HTMLDivElement, func: (relativeMousePos: number) => void} | null;
    constructor(canvas: canvasHandler) {
        this.canvas = canvas;
        this.isDrawing = false;
        this.slider = null;
        this.mode = "wall";
        this.cursorSize = 20;
        this.throttleDensity = 8;
        this.throttlePerSecond = 80;
        this.throttleTime = 0;
        this.point = null;
        this.vector = null;
        this.initCursor()
    }

    initCursor() {
        const cursorElm = document.createElement("div");
        cursorElm.style.pointerEvents = "none";
        cursorElm.style.borderRadius = "50%";
        cursorElm.style.width = "20px";
        cursorElm.style.aspectRatio = "1";
        cursorElm.style.outline = "solid 2px grey"
        cursorElm.style.position = "absolute"
        cursorElm.style.top = "0"
        cursorElm.style.display = "none"
        cursorElm.id = "cursor"
        document.body.append(cursorElm)
    }

    setCursorSize(size: number) {
        const cursorElm = document.getElementById("cursor")
        if (!cursorElm) return

        this.cursorSize = size
        cursorElm.style.width = `${this.cursorSize}px`
    }

    setMode(mode: drawModes) {
        this.mode = mode
    }

    getCanvasPointer(e: MouseEvent) {
        if (!this.canvas || !this.canvas.canvasElm) return {x: 0, y: 0}
        const canvasBounding = this.canvas.canvasElm.getBoundingClientRect()
        return {
            x: e.clientX-canvasBounding.x,
            y: e.clientY-canvasBounding.y
        }
    }

    up(e: MouseEvent) {
        if (this.canvas.needsReset) {
            this.canvas.init()
            this.canvas.needsReset = false
        }
        this.point = null
        this.slider = null
        this.isDrawing = false
    }

    startDrawing(e: MouseEvent) {
        if (this.canvas.searchDepleted)
            this.canvas.resetSearch()
        this.isDrawing = true
        this.point = this.getCanvasPointer(e)
        this.drawThrottle(e)
    }

    startSlider(elm: HTMLDivElement, setValue: (relativeMousePos: number) => void) {
        this.slider = {elm: elm, func: setValue}
    }

    sliderMove(e: MouseEvent) {
        if (this.slider === null) return

        const sliderBounding = this.slider.elm.getBoundingClientRect()
        const mouseX = e.clientX-sliderBounding.x

        let relativeMousePos = mouseX

        relativeMousePos = relativeMousePos < 0 ? 0 : relativeMousePos
        relativeMousePos = relativeMousePos > sliderBounding.width ? sliderBounding.width : relativeMousePos

        this.slider.func(relativeMousePos/sliderBounding.width)
    }

    move(e: MouseEvent) {
        if (this.slider != null) {
            this.sliderMove(e)
        }
        if (this.isDrawing) {
            this.drawThrottle(e)
        }
        const cursorElm = document.getElementById("cursor")
        if (cursorElm) {
            if (e.target && (e.target as HTMLElement).tagName === "CANVAS") {
                cursorElm.style.display = "initial"
                cursorElm.style.transform = `translate(-50%, -50%) translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            } else {
                cursorElm.style.display = "none"
            }
        }
    }

    drawThrottle(e: MouseEvent) {
        if (!this.isDrawing) return
        if (Date.now() < this.throttleTime)
            return

        if (this.point != null)
            this.drawFromVector({p1: this.point, p2: this.getCanvasPointer(e)})

        this.point = this.getCanvasPointer(e)
        this.throttleTime = Date.now() + 1000 / this.throttlePerSecond;
    }

    drawFromVector(vector: vector) {
        const drawPointArray: point[] = []
        for (let i = 0; i<=this.throttleDensity; i++) {
            const progress = i === 0 ? 0 : (i/this.throttleDensity)
            const drawPoint = {
                x: vector.p1.x + (vector.p2.x - vector.p1.x) * progress,
                y: vector.p1.y + (vector.p2.y - vector.p1.y) * progress,
            }
            drawPointArray.push(drawPoint)
        }

        const boxesToDraw = ([] as canvasBox[]).concat(
            ...drawPointArray.map(point => this.canvas.getBoxesFromPoint(point, (this.cursorSize/2)))
        )
  
        if (boxesToDraw.length < 1) return

        this.canvas.drawBox(boxesToDraw, this.mode)
    }
}