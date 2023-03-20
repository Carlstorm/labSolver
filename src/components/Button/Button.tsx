// STYLE
import style from './Button.module.scss'

export default function Button(props: {
    content?: JSX.Element,
    className?: string
    onClick: (e: MouseEvent) => void
    title?: string
}) {

    const classNames = [
        style.component
    ]
    if (props.className)
        classNames.push(props.className)

    return (
        <div title={props.title} className={classNames.join(" ")} onClick={(e) => props.onClick(e as unknown as MouseEvent)}>
            {props.content}
        </div>
    )
}