// components/matrix-view.tsx

import {Card, CardContent} from "@/components/ui/card";

interface MatrixViewProps {
    n: number
    m: number
}

export default function MatrixView({n, m}: MatrixViewProps) {
    // utils/matrix.ts
    function createMatrix(n: number, m: number): number[][] {
        return Array.from({length: n}, (_, i) =>
            Array.from({length: m}, (_, j) => i * m + j)
        )
    }
    const matrix = createMatrix(n, m)
    return (
        <Card className="w-fit">
            <CardContent className="p-4">
                <div
                    className="grid gap-1"
                    style={{
                        gridTemplateColumns: `repeat(${m}, minmax(32px, 1fr))`,
                    }}
                >
                    {matrix.flat().map((value, index) => (
                        <div
                            key={index}
                            className="flex h-8 w-8 items-center justify-center rounded border text-sm"
                        >
                            <p className='text-muted-foreground/50'>
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
