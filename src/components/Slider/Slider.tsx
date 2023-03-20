import { useRef } from 'react';

// TYPES
import { mouseHandler } from '../../Handlers/mouseHandler';

// STYLE
import style from './Slider.module.scss'

export default function Slider(props: {
        mouse: mouseHandler | null
        min: number
        max: number
        onInput: (value: number) => void
        value: number
        label: string
    }) {
    const {mouse, min, max, onInput, value} = props

    const sliderRef = useRef(null)

    const startDrag = (e: MouseEvent) => {
        if (!sliderRef.current)
            return

        const setValueFunction = (relativeMousePos: number) => {
            const diff = max-min
            const newValue = (diff*relativeMousePos)+min
            onInput(newValue)
        }

        if (!mouse) return

        mouse.startSlider(sliderRef.current, setValueFunction)

        mouse.sliderMove(e)
    }

    const getPercentage = (value: number) => {
        const diff = value-min
        const diffMax = max-min
        const percentage = (diff/diffMax)*100
        return `${percentage}%`
    }
    
    return (
        <div className={style.component}>
            <p>{props.label}</p>
            <div onMouseDown={(e) => startDrag(e as unknown as MouseEvent)}>
                <div className={style.point} style={{left: getPercentage(value)}}></div>
                <div className={style.bar_filled} style={{width: getPercentage(value)}}></div>
                <div className={style.bar_empty} ref={sliderRef}></div>
            </div>
        </div>
    )
}