import { useState } from 'react'

// TYPES
import { canvasHandler, drawModes } from '../Handlers/canvasHandler'
import { mouseHandler } from '../Handlers/mouseHandler'

// COMPONENTS
import Button from './Button/Button'
import Slider from './Slider/Slider'

// ICONS
import EraserIcon from '../assets/icons/EraserIcon'
import GoalIcon from '../assets/icons/GoalIcon'
import LocationIcon from '../assets/icons/LocationIcon'
import PlayIcon from '../assets/icons/PlayIcon'
import StopIcon from '../assets/icons/StopIcon'
import WallIcon from '../assets/icons/WallIcon'

// STYLE
import style from './Menu.module.scss'

export default function Menu(props: {
        canvas: canvasHandler | null
        mouse: mouseHandler | null
        isSearching: boolean
        isGenerating: boolean
    }) {

    const {canvas, mouse, isGenerating, isSearching} = props

    const [mode, setMode] = useState("wall")
    const [sliderValues, setSliderValues] = useState({
        cursorSize: mouse ? mouse.cursorSize : 25,
        boxSize: canvas ? canvas.boxSize : 25
    })
    
    const getClassName = (key: string) => {
        switch (key) {
            case "wall": return (mode != key) ? style.button_wall : style.button_wall_active;
            case "start": return (mode != key) ? style.button_start : style.button_start_active;
            case "goal": return (mode != key) ? style.button_goal : style.button_goal_active;
            case "eraser": return (mode != key) ? style.button_eraser : style.button_eraser_active;
        }
    }

    const event = {
        startSearch: () => {
            if (!canvas) return
            if (!canvas.boxes.some(box => box.isStart)) {
                alert("you need to draw a starting point :)")
                return
            }
            canvas.makeAnimationsLayer(0)
        },
        resetSearch: () => {
            if (!canvas) return
            canvas.resetSearch()
        },
        cursorSize: (value: number) => {
            setSliderValues({
                ...sliderValues,
                cursorSize: value
            })
            if (!mouse) return
            mouse.setCursorSize(value)
        },
        boxSize: (value: number) => {
            setSliderValues({
                ...sliderValues,
                boxSize: value
            })
            if (!canvas) return

            canvas.setBoxSize(value)
        },
        setMode(value: string) {
            setMode(value)
            if (!mouse) return
            mouse.setMode(value as drawModes)
        },
        clear() {
            if (!canvas) return
            canvas.init()
        },
        generate() {
            if (!canvas) return
            canvas.generate.start()
        },
        skipGenerate() {
            if (!canvas) return
            
            canvas.generate.stop()
        }
    }
    
    return (
        <div className={style.component}>
            <div className={style.section}>
                <Button 
                    title='Wall'
                    onClick={() => event.setMode("wall")}
                    className={getClassName("wall")}
                    content={<WallIcon />}
                />
                <Button 
                    title='Starting point'
                    onClick={() => event.setMode("start")}
                    className={getClassName("start")}
                    content={<LocationIcon />}
                />
                <Button 
                    title='Goal'
                    onClick={() => event.setMode("goal")}
                    className={getClassName("goal")}
                    content={<GoalIcon />}
                />
                <Button 
                    title='Eraser'
                    onClick={() => event.setMode("eraser")}
                    className={getClassName("eraser")}
                    content={<EraserIcon />}
                />
            </div>
            <Slider 
                label="Brush size"
                mouse={mouse} 
                min={2} 
                max={100} 
                onInput={(value) => event.cursorSize(value)}
                value={sliderValues.cursorSize}
            />
            <Slider 
                label="Grid size"
                mouse={mouse} 
                min={15} 
                max={30} 
                onInput={(value) => event.boxSize(value)}
                value={sliderValues.boxSize}
            />

            <div className={style.section} title="clear canvas">
                {!isGenerating ? 
                    <Button 
                        title={"Generate random labyrinth"}
                        className={style.button_text}
                        onClick={() => event.generate()}
                        content={<p>Auto draw</p>}
                    />
                : 
                    <Button 
                        title={'skip the current animation'}
                        className={style.button_text}
                        onClick={() => event.skipGenerate()}
                        content={<p>Skip animation</p>}
                    />
                }
            </div>

            <div className={style.section} title="clear canvas">
                <Button 
                    title='clear the current labyrint'
                    className={style.button_text}
                    onClick={() => event.clear()}
                    content={<p>Clear canvas</p>}
                />
            </div>

            <div className={style.section_end}>
                <div onClick={() => isSearching ? event.resetSearch() : event.startSearch()}>
                    {isSearching ? <StopIcon /> : <PlayIcon />}
                </div>
            </div>

        </div>
    )
}