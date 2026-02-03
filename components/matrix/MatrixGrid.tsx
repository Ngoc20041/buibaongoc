import { memo } from "react"

function MatrixGrid({ n, m }: { n: number; m: number }) {
    const cellSize = 30

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${m}, ${cellSize}px)`,
            }}
        >
            {Array.from({ length: n * m }).map((_, i) => (
                <div
                    key={i}
                    className="border text-xs flex items-center justify-center select-none"
                    style={{ width: cellSize, height: cellSize }}
                >
                    {i}
                </div>
            ))}
        </div>
    )
}

export default memo(MatrixGrid)
