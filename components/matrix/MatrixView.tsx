'use client'
import {useRef} from "react"
import TestPage from "@/app/test/page";

export default function MatrixView({n, m}: { n: number; m: number }) {
    const viewRef = useRef<HTMLDivElement>(null)

    const state = useRef({
        x: 0,
        y: 0,
        scale: 1,
        dragging: false,
        startX: 0,
        startY: 0,
    })

    const updateTransform = () => {
        const s = state.current
        if (!viewRef.current) return

        viewRef.current.style.transform =
            `translate(${s.x}px, ${s.y}px) scale(${s.scale})`
    }

    const onWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        const s = state.current
        s.scale = Math.min(3, Math.max(0.2, s.scale - e.deltaY * 0.001))
        updateTransform()
    }

    const onMouseDown = (e: React.MouseEvent) => {
        const s = state.current
        s.dragging = true
        s.startX = e.clientX - s.x
        s.startY = e.clientY - s.y
    }

    const onMouseMove = (e: React.MouseEvent) => {
        const s = state.current
        if (!s.dragging) return

        s.x = e.clientX - s.startX
        s.y = e.clientY - s.startY
        updateTransform()
    }

    const onMouseUp = () => {
        state.current.dragging = false
    }

    return (
        <div
            className=" border bg-muted"
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
        >
            <div
                ref={viewRef}
                className="origin-top-left will-change-transform"
            >
                {/*<MatrixGrid n={n} m={m}/>*/}
                <TestPage/>
            </div>
        </div>
    )
}
