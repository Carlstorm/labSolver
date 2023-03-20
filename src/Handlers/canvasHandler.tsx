// SCSS
import styleVariables from '../colors.module.scss';

// CLASSES
import { labGeneratorHandler } from './labGeneratorHandler';

// TYPES
import { point } from './mouseHandler'

export type drawModes = "wall" | "start" | "goal" | "grey" | "eraser" | "init" | "search" | "test" | "path" 
export interface adjecentBoxes {
    r?: canvasBox;
    l?: canvasBox;
    t?: canvasBox;
    b?: canvasBox;
    tr?: canvasBox;
    tl?: canvasBox;
    br?: canvasBox;
    bl?: canvasBox;
}

export class canvasHandler {
    canvasElm: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    boxSize: number;
    boxes: canvasBox[];
    relativeBoxSize: {width: number, height: number}
    goalFound: number | null
    searchDepleted: boolean
    rows: number
    columns: number
    needsReset: boolean
    generate: labGeneratorHandler
    IsSearchingState: {
        value: boolean,
        set: React.Dispatch<React.SetStateAction<boolean>>
    }
    IsGeneratingState: {
        value: boolean,
        set: React.Dispatch<React.SetStateAction<boolean>>
    }
    constructor(
            canvasElm: HTMLCanvasElement, 
            setIsSearchingState: { value: boolean, set: React.Dispatch<React.SetStateAction<boolean>>},
            setIsGeneratingState: {value: boolean, set: React.Dispatch<React.SetStateAction<boolean>>}
        ) {
        this.IsSearchingState = setIsSearchingState
        this.IsGeneratingState = setIsGeneratingState
        this.needsReset = false
        this.canvasElm = canvasElm
        this.ctx = canvasElm.getContext("2d") as CanvasRenderingContext2D
        this.boxSize = 25
        this.relativeBoxSize = {width:0, height:0}
        this.rows = 0
        this.columns = 0
        this.boxes = []
        this.goalFound = null;
        this.searchDepleted = false;
        this.generate = new labGeneratorHandler(this)
        this.init()
    }

    getRelativeBoxSize(scale: number) {
        let closestQuotient = null;
        let closestDistance = Infinity;
        const accuracy = 1000
        for (let i = 1; i <= accuracy; i++) {
            const quotient = Math.round(scale / i);
            const distance = Math.abs(quotient - this.boxSize);
          
            if (distance < closestDistance) {
              closestQuotient = quotient;
              closestDistance = distance;
            }
        }
        if (closestQuotient === null) return {count: 10, size: this.boxSize}

        const closestDivisor = scale / closestQuotient;
        
        return {count: Math.floor(closestDivisor), size: Math.floor(scale/Math.floor(closestDivisor))}

    }

    init() {
        if (this.generate.frame > 0)
            this.generate.killAnimation = true

        this.IsSearchingState.set(false)

        this.boxes = []
        const container = this.canvasElm.parentElement?.getBoundingClientRect()
        if (!container) return

        const relativeDimentions = {
            x: this.getRelativeBoxSize(container.width),
            y: this.getRelativeBoxSize(container.height)
        }

        this.canvasElm.width = Math.round(relativeDimentions.x.size*relativeDimentions.x.count)
        this.canvasElm.height = relativeDimentions.y.size*relativeDimentions.y.count

        this.relativeBoxSize = {
            width: relativeDimentions.x.size,
            height: relativeDimentions.y.size
        }

        this.rows = relativeDimentions.x.count
        this.columns = relativeDimentions.y.count

        for (let y = 0; y < relativeDimentions.y.count; y++) {
            for (let x = 0; x < relativeDimentions.x.count; x++) {
                this.boxes.push(new canvasBox(this.boxes.length, x, y))
            }
        }
        this.drawBox(this.boxes, "eraser")
    }

    getAdjecentBoxesObj(box: canvasBox, allBoxes?: boolean) {
        const boxIndex = box.index
        const topIndex = boxIndex-this.rows
        const bottomIndex = boxIndex+this.rows

        const adjecentBoxes = {
            l: boxIndex-1 as number,
            r: boxIndex+1 as number,
            t: topIndex as number,
            b: bottomIndex as number,
            tl: (allBoxes ? topIndex-1: null) as number | null,
            tr: (allBoxes ? topIndex+1: null) as number | null,
            bl: (allBoxes ? bottomIndex-1: null) as number | null,
            br: (allBoxes ? bottomIndex+1: null) as number | null,
        }
    
        const validBoxesObj: adjecentBoxes = {}
        Object.keys(adjecentBoxes).forEach(key => {
            const index = adjecentBoxes[key as keyof object]
            if (index === null || index < 0 || index >= this.boxes.length)
                return
            
            const adjecentBox = this.boxes[index as number]

            if (key.includes("l") && adjecentBox.x > box.x)
                return
            if (key.includes("r") && adjecentBox.x < box.x)
                return

            validBoxesObj[key as keyof adjecentBoxes] = adjecentBox
        })
        return validBoxesObj
    }

    getAdjecentBoxes(box: canvasBox, allBoxes?: boolean) {
        const adjecentBoxesObj = this.getAdjecentBoxesObj(box, allBoxes)
        return Object.keys(adjecentBoxesObj).map(key => (adjecentBoxesObj[key as keyof adjecentBoxes])) as canvasBox[]
    }

    getBoxesFromPoint(point: point, padding: number = 0) {
        return this.boxes.filter(box => {
            const y1 = (box.y*this.relativeBoxSize.height)+this.relativeBoxSize.height > point.y-(padding)
            const y2 = (box.y*this.relativeBoxSize.height) < point.y+(padding)
            const x1 = (box.x*this.relativeBoxSize.width)+this.relativeBoxSize.width > point.x-(padding)
            const x2 = (box.x*this.relativeBoxSize.width) < point.x+(padding)
            return (x1 && x2 && y1 && y2)
        })
    }

    setBoxSize(value: number) {
        value = Math.round(value)
        if (value === this.boxSize) return
        this.boxSize = value
        this.needsReset = true
    }

    drawBox(
        boxes: canvasBox[], 
        mode: drawModes, 
        setBoxValues: boolean = true,
        boxRenderType?: "circle"
    ) {
        if (this.ctx === null) return
        
        let setbox: (box: canvasBox) => void = () => null
        let drawMethod: (ctx: CanvasRenderingContext2D) => void = () => null

        switch (mode) {
            case "wall": {
                this.ctx.fillStyle = styleVariables.color_dark
                setbox = (box: canvasBox) => {
                    box.isWall = true
                    box.isGoal = false
                    box.isStart = false
                    box.isGeneratedPath = false
                }
                drawMethod = (ctx: CanvasRenderingContext2D) => ctx.fill();
            }; break;
            case "start": {
                this.ctx.fillStyle = styleVariables.color_blue
                setbox = (box: canvasBox) => {
                    box.isWall = false
                    box.isGoal = false
                    box.isStart = true
                }
                drawMethod = (ctx: CanvasRenderingContext2D) => ctx.fill();
            }; break;
            case "goal": {
                this.ctx.fillStyle = styleVariables.color_green
                setbox = (box: canvasBox) => {
                    box.isWall = false
                    box.isGoal = true
                    box.isStart = false
                }
                drawMethod = (ctx: CanvasRenderingContext2D) => ctx.fill();
            }; break;
            case "eraser": {
                this.ctx.fillStyle = styleVariables.color_white
                this.ctx.strokeStyle = styleVariables.color_border_transparent
                setbox = (box: canvasBox) => {
                    box.isWall = false
                    box.isGoal = false
                    box.isStart = false
                }
                drawMethod = (ctx: CanvasRenderingContext2D) => {
                    ctx.save();
                    ctx.clip();
                    ctx.lineWidth *= 2;
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
            }; break;
            case "search": {
                this.ctx.fillStyle = styleVariables.color_light_blue
                this.ctx.strokeStyle = styleVariables.border_color
                drawMethod = (ctx: CanvasRenderingContext2D) => {
                    ctx.save();
                    ctx.clip();
                    ctx.lineWidth *= 2;
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
            }; break;
            case "path": {
                this.ctx.strokeStyle = styleVariables.color_border
                this.ctx.lineWidth = 1
                this.ctx.fillStyle = styleVariables.color_white
                drawMethod = (ctx: CanvasRenderingContext2D) => {
                    ctx.fill()
                    ctx.stroke()
                }
            }; break;
            default: return
        }

        this.ctx.beginPath()
        boxes.forEach(box => {
            if (!this.ctx) return
            if (setBoxValues !== false)
                setbox(box)

            if (boxRenderType != "circle")
                this.ctx.rect(
                    box.x*this.relativeBoxSize.width,
                    box.y*this.relativeBoxSize.height, 
                    this.relativeBoxSize.width, 
                    this.relativeBoxSize.height
                )
            else 
                this.ctx.arc(
                    (box.x*this.relativeBoxSize.width)+(this.relativeBoxSize.width/2), 
                    (box.y*this.relativeBoxSize.height)+(this.relativeBoxSize.height/2), 
                    this.relativeBoxSize.width/4, 
                    0, 
                    2 * Math.PI
                );
        })
        drawMethod(this.ctx)
    }

    makeAnimationsLayer(layer: number) {
        console.log("searching...")
        const nextlayer = layer+1
        if (this.goalFound != null) {
            this.searchDepleted = true
            this.animateSearch(layer)
            return
        }

        let searchLayerBoxes
        if (layer === 0) {
            this.IsSearchingState.set(true)  
            searchLayerBoxes = this.boxes.filter(box => box.isStart)
        } else {
            searchLayerBoxes = this.boxes.filter(box => box.searchLayer === layer) 
        }


        if (searchLayerBoxes.length === 0) {
            this.searchDepleted = true
            this.animateSearch(layer)
            return
        }

        const boxesWithSearchPrio = searchLayerBoxes.sort((a, b) => (
            a.searchPrio > b.searchPrio ? -1 : a.searchPrio < b.searchPrio ? 1 : 0
        ))

        const possibleGoals: {index: number, dir: string}[] = []
        boxesWithSearchPrio.forEach(box => {
            if (!box) return

            const adjecentBoxes = this.getAdjecentBoxesObj(box, true)

            Object.keys(adjecentBoxes).forEach(key => {
                const adjecentBox = adjecentBoxes[key as keyof adjecentBoxes]
                if (adjecentBox === undefined) return

                const {isStart, isWall, isGoal, searchLayerFrom} = adjecentBox

                if (isStart || isWall)
                    return

                if (isGoal) {
                    possibleGoals.push({index: adjecentBox.index, dir: key})
                    adjecentBox.searchLayerFrom = box.index
                    return
                }

                if (searchLayerFrom === null) {
                    if (key.length === 1)
                        adjecentBox.searchPrio = 1
                    adjecentBox.searchLayer = nextlayer
                    adjecentBox.searchLayerFrom = box.index
                }
            })
        });
        if (possibleGoals.length > 0) {
            const sorted = possibleGoals.sort((a, b) => a.dir.length > b.dir.length ? -1 : a.dir.length < b.dir.length ? 1 : 0)
            this.goalFound = sorted[0].index
        }
        this.makeAnimationsLayer(nextlayer)
    }

    animateSearch(maxLayer: number, currentLayer: number = 0) {
        console.log("drawing search...")

        const searchBoxes = this.boxes.filter(box => box.searchLayer === currentLayer)
        this.drawBox(searchBoxes, "search")

        const animationLoop = () => {
            this.animateSearch(maxLayer, currentLayer+1)
        }

        if (currentLayer <= maxLayer)
            requestAnimationFrame(animationLoop)
        else 
            this.animatePath()
    }

    animatePath(pathIndex?: number) {
        console.log("drawing path...")
        if (this.goalFound === null) return

        if (!pathIndex) {
            const nextPathIndex = this.boxes[this.goalFound].searchLayerFrom
            if (nextPathIndex === null) return
            this.animatePath(nextPathIndex)
            return
        }

        const pathBox = this.boxes[pathIndex]

        this.drawBox([pathBox], "path", false, "circle")

        const searchLayerFrom = pathBox.searchLayerFrom
        if (!searchLayerFrom || this.boxes[searchLayerFrom].isStart) 
            return

        const animationLoop = () => {
            this.animatePath(searchLayerFrom)
        }
    
        requestAnimationFrame(animationLoop)
    }

    resetSearch() {
        this.IsSearchingState.set(false)
        this.searchDepleted = false;
        this.goalFound = null;

        this.boxes.forEach(box => {
            box.searchLayer = null
            box.searchLayerFrom = null
            box.searchPrio = 0
        })

        const boxesToRedraw = this.boxes.filter(box => !box.isGoal && !box.isWall && !box.isStart)
        this.drawBox(boxesToRedraw, "eraser")
    }
}


export class canvasBox {
    isWall: boolean;
    isGoal: boolean;
    isStart: boolean;
    searchLayer: number | null
    searchLayerFrom: number | null
    searchPrio: number
    index: number
    isGeneratedPath: boolean
    isStartingPoint: boolean
    x: number
    y: number
    constructor(index: number, x: number, y: number) {
        this.isGeneratedPath = false
        this.x = x
        this.y = y
        this.index = index
        this.isWall = false
        this.isGoal = false
        this.isStart = false
        this.searchLayer = null
        this.searchLayerFrom = null
        this.searchPrio = 0
        this.isStartingPoint = false
    }

    clean() {
        this.isWall = false
        this.isGoal = false
        this.isStart = false
    }
}