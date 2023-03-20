import { forwardRef, LegacyRef } from 'react'

// TYPES
import { mouseHandler } from '../Handlers/mouseHandler'

// STYLE
import style from './Canvas.module.scss'

const Canvas = forwardRef((props: {
    mouse: mouseHandler | null
}, ref: LegacyRef<HTMLCanvasElement> | undefined) =>  {
    const {mouse} = props

    const event = {
        draw: (e: MouseEvent) => {
            if (!mouse) return
            mouse.startDrawing(e)
        }
    }

    return (
        <div className={style.component} onMouseDown={(e) => event.draw(e as unknown as MouseEvent)}>
            <canvas ref={ref}></canvas>
        </div>
    )
})

export default Canvas