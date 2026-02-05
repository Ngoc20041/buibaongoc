'use client'

import {useEffect, useRef} from "react"
import MatrixPageComponent from "@/components/matrix/MatrixPageComponent";

export default function MatrixView() {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<HTMLDivElement>(null)

    const state = useRef({
        x: 0,
        y: 0,
        scale: 1,
        dragging: false,
        startX: 0,
        startY: 0,
    })

    /* =======================
       Transform helper
    ======================== */
    const updateTransform = () => {
        const s = state.current
        const el = viewRef.current
        if (!el) return

        el.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale})`
    }

    /* =======================
       Zoom (wheel)
    ======================== */
    const onWheel = (e: React.WheelEvent) => {
        const view = viewRef.current
        if (!view) return

        const rect = view.getBoundingClientRect()
        const ox = e.clientX - rect.left
        const oy = e.clientY - rect.top

        const s = state.current
        const prevScale = s.scale

        const ZOOM_SPEED = 0.0015
        s.scale *= Math.exp(-e.deltaY * ZOOM_SPEED)
        s.scale = Math.min(3, Math.max(0.2, s.scale))

        const k = s.scale / prevScale
        s.x = ox - k * (ox - s.x)
        s.y = oy - k * (oy - s.y)

        updateTransform()
    }

    /* =======================
       Drag (pan)
    ======================== */
    const onMouseDown = (e: React.MouseEvent) => {
        const s = state.current
        s.dragging = true
        s.startX = e.clientX - s.x
        s.startY = e.clientY - s.y

        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
    }

    const onMouseMove = (e: MouseEvent) => {
        const s = state.current
        if (!s.dragging) return

        s.x = e.clientX - s.startX
        s.y = e.clientY - s.startY
        updateTransform()
    }

    const onMouseUp = () => {
        const s = state.current
        s.dragging = false

        window.removeEventListener("mousemove", onMouseMove)
        window.removeEventListener("mouseup", onMouseUp)
    }

    /* =======================
       Cleanup safety
    ======================== */
    useEffect(() => {
        return () => {
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
        }
    }, [])

    return (
        <div className="relative w-full h-full">

            {/* 🔹 CANVAS LAYER */}
            <div
                ref={containerRef}
                className="border bg-muted overflow-hidden select-none"
                onWheel={onWheel}
                onMouseDown={onMouseDown}
            >
                <div
                    ref={viewRef}
                    className="origin-top-left will-change-transform"
                >
                    <MatrixPageComponent/>
                </div>
            </div>

            {/* 🔹 LEGEND LAYER (KHÔNG transform) */}
            <div className="absolute top-4 left-4 z-50
                flex flex-col gap-2
                bg-fuchsia-200/40 backdrop-blur-md
                p-3 rounded-lg shadow"
            >
                <div className="flex flex-col gap-2 text-sm">
                    {/* Xe giao hàng */}
                    <div className="flex items-center gap-2">
                        <div className="relative w-5 h-5">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-1 bg-red-500"/>
                            <div
                                className="absolute right-0 top-1/2 -translate-y-1/2
                           w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px]
                           border-t-transparent border-b-transparent border-l-red-500"
                            />
                        </div>
                        <p><b>Xe giao hàng</b> (hướng di chuyển)</p>
                    </div>

                    {/* Pickup */}
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-green-500"/>
                        <p><b>Điểm lấy hàng</b> (Pickup)</p>
                    </div>

                    {/* Delivery */}
                    <div className="flex items-center gap-2">
                        <div
                            className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px]
                       border-l-transparent border-r-transparent border-b-red-500"
                        />
                        <p><b>Điểm giao hàng</b> (Delivery)</p>
                    </div>

                    {/* Gas station */}
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-yellow-500"/>
                        <p><b>Trạm xăng</b> (có thể đổ xăng)</p>
                    </div>

                    {/* Trail */}
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-500/40"/>
                        <p><b>Dấu vết di chuyển</b> của xe</p>
                    </div>

                    {/* Stop markers */}
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-500 rounded-full"/>
                        <p><b>Điểm xe dừng</b> (lấy hàng / giao hàng / đổ xăng)</p>
                    </div>
                </div>
            </div>
        </div>

    )
}
