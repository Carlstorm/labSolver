// TYPES
import { adjecentBoxes, canvasBox, canvasHandler } from "./canvasHandler";

interface animationBox {
    type: string,
    box: canvasBox
}

interface animationPattern {
    boxes: animationBox[], 
    mode: string
}

export class labGeneratorHandler {
    animationPattern: animationPattern[];
    frame: number
    currentWalkAnimationBoxes: animationBox[];
    canvas: canvasHandler
    skipAnimation: boolean
    killAnimation: boolean
    constructor(canvas: canvasHandler) {
        this.canvas = canvas
        this.animationPattern = []
        this.frame = 0
        this.currentWalkAnimationBoxes = []
        this.skipAnimation = false
        this.killAnimation = false
    }

    getAdjecentBoxesObj(box: canvasBox, allBoxes?: boolean) {
        const boxIndex = box.index
        const topIndex = boxIndex-this.canvas.rows
        const bottomIndex = boxIndex+this.canvas.rows

        const adjecentBoxes = {
            l: boxIndex-1 as number,
            r: boxIndex+1 as number,
            t: topIndex as number,
            b: bottomIndex as number,
            tl: null as number | null,
            tr: null as number | null,
            bl: null as number | null,
            br: null as number | null,
        }
        
        if (allBoxes) {
            adjecentBoxes.tl = topIndex-1
            adjecentBoxes.tr = topIndex+1
            adjecentBoxes.bl = bottomIndex-1
            adjecentBoxes.br = bottomIndex+1
        }

        const validBoxesObj: adjecentBoxes = {}
        Object.keys(adjecentBoxes).forEach(key => {
            const index = adjecentBoxes[key as keyof object]
            if (index === null || index < 0 || index >= this.canvas.boxes.length)
                return
            
            const adjecentBox = this.canvas.boxes[index as number]

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

    setWallsAround(box: canvasBox, dir?: string) {
        const adjecentBoxes = this.getAdjecentBoxesObj(box, true)
        const adjecentWalls: {type: string, box: canvasBox}[] = []
        Object.keys(adjecentBoxes).forEach(key => {
            if (dir && key.includes(dir))
                return

            const adjecentBox = adjecentBoxes[key as keyof adjecentBoxes]
            if (adjecentBox === undefined)
                return

            const {isWall, isGeneratedPath, isStart, isGoal} = adjecentBox
            if (isWall || isGeneratedPath || isStart || isGoal)
                return

            adjecentWalls.push({type: "wall", box: adjecentBox})
            adjecentBox.isWall = true
        })

        const pathBox = {type: "plain", box: box}
        this.animationPattern.push({
            boxes: [...adjecentWalls, pathBox], 
            mode: "walk"
        })
    }

    start() {
        if (this.canvas.IsGeneratingState.value)
            return

        this.canvas.IsGeneratingState.set(true)
        this.canvas.init()
        this.skipAnimation = false
        let startBox = this.canvas.boxes[Math.floor(Math.random() * this.canvas.boxes.length)]
        this.walk(startBox)
    }

    stop() {
        if (this.skipAnimation) return
        this.skipAnimation = true
        this.canvas.IsGeneratingState.set(false)
    }

    hunt() {  
        let validBox = this.canvas.boxes.find(box => {
            if (box.isGeneratedPath)
                return false

            const adjecentBoxes = this.getAdjecentBoxes(box)

            return (
                adjecentBoxes.some(box => !box.isWall && !box.isGeneratedPath) &&
                adjecentBoxes.some(box => box.isGeneratedPath)
            )
        })

        if (!validBox) {
            this.canvas.boxes.forEach(box => !box.isWall && !box.isGeneratedPath && !box.isStartingPoint ? box.isWall = true : null)
            this.animate()
            return
        }

        validBox.isStartingPoint = true
        this.animationPattern.push({boxes: [{type: "break", box: validBox}], mode: "hunt"})
        this.walk(validBox)
    }

    walk(box: canvasBox) {
        box.isGeneratedPath = true
        box.isWall = false

        const adjecentBoxes = this.getAdjecentBoxesObj(box)
        const possibleDirections = Object.keys(adjecentBoxes).map(key => ({direction: key, box: adjecentBoxes[key as keyof adjecentBoxes]}))
        .filter(obj => !obj.box?.isWall && !obj.box?.isGeneratedPath)

        if (possibleDirections.length === 0) {
            this.setWallsAround(box)
            this.hunt()
            return
        }

        const randomPossibleDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)]
        const {direction, box: nextBox} = randomPossibleDirection
        
        if (nextBox === undefined) {
            alert("error in generation (next box cant be defined)")
            return
        }

        this.setWallsAround(box, direction)
        this.walk(nextBox)
    }

    walkAnimation(frameChanges: animationPattern) {
        const walls = frameChanges.boxes.filter(ch => ch.type === "wall").map(ch => ch.box)
        const plains = frameChanges.boxes.filter(ch => ch.type === "plain" && !ch.box.isStartingPoint).map(ch => ch.box)
        this.currentWalkAnimationBoxes.push(...frameChanges.boxes)
        this.canvas.drawBox(walls, "search", false)
        this.canvas.drawBox(plains, "search", false)
    }

    huntAnimation(frameChanges: animationPattern) {
        const walls = this.currentWalkAnimationBoxes.filter(ch => ch.type === "wall").map(ch => ch.box)
        const plains = this.currentWalkAnimationBoxes.filter(ch => ch.type === "plain").map(ch => ch.box)
        const startBox = frameChanges.boxes.map(animationBox => animationBox.box)

        this.canvas.drawBox(walls, "wall", false)
        this.canvas.drawBox(plains, "eraser",)
        this.canvas.drawBox(startBox, "start", false)
        this.currentWalkAnimationBoxes = []
    }

    animate() {
        if (this.killAnimation) {
            this.killAnimation = false
            this.frame = 0
            this.animationPattern = []
            this.currentWalkAnimationBoxes = []
            this.canvas.IsGeneratingState.set(false)
            return
        }

        const frameChanges = this.animationPattern[this.frame]

        if (frameChanges.mode === "walk") {
            this.walkAnimation(frameChanges)
        }

        if (frameChanges.mode === "hunt") {
            this.huntAnimation(frameChanges)
        }

        const animationLoop = () => {
            this.frame++
            if (this.frame >= this.animationPattern.length || this.skipAnimation) {
                let walls: canvasBox[], plains: canvasBox[]

                if (this.skipAnimation) {
                    walls = this.canvas.boxes.filter(box => box.isWall)
                    plains = this.canvas.boxes.filter(box => !box.isWall)
                } else {
                    walls = this.currentWalkAnimationBoxes.filter(ch => ch.type === "wall").map(ch => ch.box)
                    plains = this.currentWalkAnimationBoxes.filter(ch => ch.type === "plain").map(ch => ch.box)
                }

                this.canvas.drawBox(walls, "wall")
                this.canvas.drawBox(plains, "eraser")

                this.canvas.boxes.forEach(box => {
                    box.isStartingPoint = false
                    box.isGeneratedPath = false
                })

                this.skipAnimation = false
                this.canvas.IsGeneratingState.set(false)
                this.frame = 0
                this.animationPattern = []
                this.currentWalkAnimationBoxes = []
                return
            }
            this.animate()
        }

        requestAnimationFrame(animationLoop)
    }
}