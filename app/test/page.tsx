"use client"

import {useEffect, useRef} from "react"

/* ================= CONFIG ================= */

const ROWS = 250
const COLS = 250
const CELL_SIZE = 8
const WIDTH = COLS * CELL_SIZE
const HEIGHT = ROWS * CELL_SIZE

/* ================= TYPES ================= */

type Point = { x: number; y: number }
type OrderStatus = "pending" | "picked" | "delivered"

type Order = {
    id: number
    pickup: Point
    delivery: Point
    weight: number
    status: OrderStatus
}

type GasStation = Point

type Vehicle = {
    position: Point
    fuel: number
    maxFuel: number
    capacity: number
    currentLoad: number
}

type Log = {
    position: Point
    action: string
    fuel: number
    load: number
}

type TrailMap = Map<string, number>

/* ================= HELPERS ================= */

function keyOf(p: Point) {
    return `${p.x},${p.y}`
}

function manhattan(a: Point, b: Point) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function fuelNeeded(distance: number) {
    return Math.ceil(distance / 20)
}

function buildPath(from: Point, to: Point): Point[] {
    const path: Point[] = []
    let {x, y} = from

    while (x !== to.x) {
        x += x < to.x ? 1 : -1
        path.push({x, y})
    }
    while (y !== to.y) {
        y += y < to.y ? 1 : -1
        path.push({x, y})
    }
    return path
}

/* ================= DRAW ================= */
function drawStaticGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "#eee"
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            ctx.strokeRect(
                x * CELL_SIZE,
                y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
            )
        }
    }
}

function drawVehicle(ctx: CanvasRenderingContext2D, prev: Point | null, curr: Point) {
    if (prev) {
        ctx.clearRect(
            prev.x * CELL_SIZE,
            prev.y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        )
    }
    ctx.fillStyle = "red"
    ctx.fillRect(
        curr.x * CELL_SIZE + 1,
        curr.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
    )
}

/* ================= PAGE ================= */
function drawSymbols(ctx: CanvasRenderingContext2D, orders: Order[], gasStations: GasStation[]) {
    // pickup – xanh lá
    ctx.fillStyle = "green"
    orders.forEach(o => {
        ctx.fillRect(
            o.pickup.x * CELL_SIZE + 1,
            o.pickup.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        )
    })

    // delivery – đỏ
    ctx.fillStyle = "red"
    orders.forEach(o => {
        ctx.fillRect(
            o.delivery.x * CELL_SIZE + 1,
            o.delivery.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        )
    })

    // gas station – cam
    ctx.fillStyle = "orange"
    gasStations.forEach(s => {
        ctx.beginPath()
        ctx.arc(
            s.x * CELL_SIZE + CELL_SIZE / 2,
            s.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 3,
            0,
            Math.PI * 2
        )
        ctx.fill()
    })
}

function drawTrailCell(ctx: CanvasRenderingContext2D, p: Point, count: number) {
    ctx.fillStyle = `rgba(0,0,255,${Math.min(0.15 * count, 0.6)})`
    ctx.fillRect(
        p.x * CELL_SIZE,
        p.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
    )
}

/* ================= SOLVER (FULL BÀI TOÁN) ================= */

function solveDelivery(vehicle: Vehicle, orders: Order[], stations: GasStation[], start: Point): {
    logs: Log[];
    trail: TrailMap
} {
    const logs: Log[] = []
    const trail: TrailMap = new Map()

    function nearestStation(from: Point) {
        return stations.reduce((a, b) =>
            manhattan(from, a) < manhattan(from, b) ? a : b
        )
    }

    function move(to: Point) {
        const path = buildPath(vehicle.position, to)

        for (const p of path) {
            // ❗ mỗi ô = 1 bước
            if (vehicle.fuel <= 0) {
                throw new Error("Hết xăng giữa đường")
            }

            vehicle.fuel -= 1 / 20   // 1 lít / 20 ô
            vehicle.position = {...p}

            trail.set(keyOf(p), (trail.get(keyOf(p)) ?? 0) + 1)

            logs.push({
                position: {...p},
                action: "move",
                fuel: vehicle.fuel,
                load: vehicle.currentLoad
            })
        }
    }


    while (orders.some(o => o.status !== "delivered")) {
        const next = orders.find(
            o =>
                o.status === "pending" &&
                o.weight + vehicle.currentLoad <= vehicle.capacity
        )
        if (!next) {
            move(start)
            vehicle.currentLoad = 0
            continue
        }
        if (fuelNeeded(manhattan(vehicle.position, next.pickup)) > vehicle.fuel) {
            const s = nearestStation(vehicle.position)
            move(s)
            vehicle.fuel = vehicle.maxFuel
        }
        move(next.pickup)
        vehicle.currentLoad += next.weight
        next.status = "picked"
        if (fuelNeeded(manhattan(vehicle.position, next.delivery)) > vehicle.fuel) {
            const s = nearestStation(vehicle.position)
            move(s)
            vehicle.fuel = vehicle.maxFuel
        }
        move(next.delivery)
        vehicle.currentLoad -= next.weight
        next.status = "delivered"
    }
    move(start)
    return {logs, trail}
}

const start: Point = {x: 125, y: 125}
const vehicle: Vehicle = {
    position: {...start},
    fuel: 30,
    maxFuel: 30,
    capacity: 50,
    currentLoad: 0
}
const orders: Order[] = [
    {id: 1, pickup: {x: 40, y: 60}, delivery: {x: 180, y: 200}, weight: 20, status: "pending"},
    {id: 2, pickup: {x: 90, y: 30}, delivery: {x: 210, y: 80}, weight: 15, status: "pending"},
    {id: 3, pickup: {x: 160, y: 140}, delivery: {x: 60, y: 220}, weight: 10, status: "pending"},
    {id: 4, pickup: {x: 200, y: 40}, delivery: {x: 30, y: 180}, weight: 18, status: "pending"},
]
const gasStations: GasStation[] = [
    // {x: 125, y: 125},
    {x: 20, y: 20},
    {x: 230, y: 20},
    {x: 20, y: 230},
    {x: 230, y: 230},
    {x: 80, y: 120},
    {x: 170, y: 100},
    {x: 100, y: 200},
    {x: 200, y: 160},
]

export default function TestPage() {
    const gridRef = useRef<HTMLCanvasElement>(null)
    const trailRef = useRef<HTMLCanvasElement>(null)
    const vehicleRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const gridCtx = gridRef.current!.getContext("2d")!
        drawStaticGrid(gridCtx)
        drawSymbols(gridCtx, orders, gasStations)


        const {logs, trail} = solveDelivery(
            structuredClone(vehicle),
            structuredClone(orders),
            gasStations,
            start
        )

        const trailCtx = trailRef.current!.getContext("2d")!
        const vehicleCtx = vehicleRef.current!.getContext("2d")!

        let i = 0
        let prev: Point | null = null

        const interval = setInterval(() => {
            if (i >= logs.length) {
                clearInterval(interval)
                return
            }

            const curr = logs[i].position
            const count = trail.get(keyOf(curr)) ?? 1

            drawTrailCell(trailCtx, curr, count)
            drawVehicle(vehicleCtx, prev, curr)

            prev = curr
            i++
        }, 20)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="relative" style={{width: WIDTH, height: HEIGHT}}>
            <canvas ref={gridRef} width={WIDTH} height={HEIGHT} className="absolute"/>
            <canvas ref={trailRef} width={WIDTH} height={HEIGHT} className="absolute"/>
            <canvas ref={vehicleRef} width={WIDTH} height={HEIGHT} className="absolute"/>
        </div>
    )
}

