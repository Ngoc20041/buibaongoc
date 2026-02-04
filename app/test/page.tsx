"use client"

import { useEffect, useRef } from "react"

/* ================= CONFIG ================= */

const ROWS = 100
const COLS = 100
const CELL_SIZE = 8
const WIDTH = COLS * CELL_SIZE
const HEIGHT = ROWS * CELL_SIZE

const SAFETY_FUEL = 0.5

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
    return distance / 20
}

function buildPath(from: Point, to: Point): Point[] {
    const path: Point[] = []
    let { x, y } = from

    while (x !== to.x) {
        x += x < to.x ? 1 : -1
        path.push({ x, y })
    }
    while (y !== to.y) {
        y += y < to.y ? 1 : -1
        path.push({ x, y })
    }
    return path
}

/* ================= RANDOM MAP ================= */

function randomPoint(): Point {
    return {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
    }
}

function randomUniquePoint(used: Set<string>): Point {
    let p: Point
    do {
        p = randomPoint()
    } while (used.has(keyOf(p)))
    used.add(keyOf(p))
    return p
}

function generateRandomOrders(n: number): Order[] {
    const used = new Set<string>()
    const orders: Order[] = []

    for (let i = 0; i < n; i++) {
        const pickup = randomUniquePoint(used)
        const delivery = randomUniquePoint(used)

        orders.push({
            id: i + 1,
            pickup,
            delivery,
            weight: Math.floor(Math.random() * 20) + 5,
            status: "pending",
        })
    }

    return orders
}

function generateGasStations(n: number, used: Set<string>): GasStation[] {
    const stations: GasStation[] = []
    for (let i = 0; i < n; i++) {
        stations.push(randomUniquePoint(used))
    }
    return stations
}
function generateSafeGasStations(step = 40): GasStation[] {
    const stations: GasStation[] = []

    for (let x = step / 2; x < COLS; x += step) {
        for (let y = step / 2; y < ROWS; y += step) {
            stations.push({ x, y })
        }
    }

    return stations
}

/* ================= DRAW ================= */

function drawStaticGrid(ctx: CanvasRenderingContext2D) {
    for (let y = 0; y <= ROWS; y++) {
        ctx.strokeStyle =
            y % 10 === 0
                ? "rgba(0,0,0,0.25)"
                : "rgba(0,0,0,0.08)"
        ctx.lineWidth = y % 10 === 0 ? 1.2 : 0.5
        ctx.beginPath()
        ctx.moveTo(0, y * CELL_SIZE)
        ctx.lineTo(WIDTH, y * CELL_SIZE)
        ctx.stroke()
    }

    for (let x = 0; x <= COLS; x++) {
        ctx.strokeStyle =
            x % 10 === 0
                ? "rgba(0,0,0,0.25)"
                : "rgba(0,0,0,0.08)"
        ctx.lineWidth = x % 10 === 0 ? 1.2 : 0.5
        ctx.beginPath()
        ctx.moveTo(x * CELL_SIZE, 0)
        ctx.lineTo(x * CELL_SIZE, HEIGHT)
        ctx.stroke()
    }
}

function drawSymbols(
    ctx: CanvasRenderingContext2D,
    orders: Order[],
    gasStations: GasStation[]
) {
    ctx.fillStyle = "green"
    orders.forEach(o => {
        ctx.fillRect(
            o.pickup.x * CELL_SIZE + 1,
            o.pickup.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        )
    })

    ctx.fillStyle = "red"
    orders.forEach(o => {
        ctx.fillRect(
            o.delivery.x * CELL_SIZE + 1,
            o.delivery.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        )
    })

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

function drawVehicle(
    ctx: CanvasRenderingContext2D,
    prev: Point | null,
    curr: Point
) {
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

/* ================= SOLVER (SAFE) ================= */

function solveDelivery(
    vehicle: Vehicle,
    orders: Order[],
    stations: GasStation[],
    start: Point
) {
    const logs: Log[] = []
    const trail: TrailMap = new Map()

    function moveSafe(to: Point) {
        const path = buildPath(vehicle.position, to)
        for (const p of path) {
            if (vehicle.fuel < 1 / 20) {
                throw new Error("Solver error: hết xăng không hợp lệ")
            }

            vehicle.fuel -= 1 / 20
            vehicle.position = { ...p }

            trail.set(keyOf(p), (trail.get(keyOf(p)) ?? 0) + 1)
            logs.push({
                position: { ...p },
                action: "move",
                fuel: vehicle.fuel,
                load: vehicle.currentLoad,
            })
        }
    }

    function nearestReachableStation(): GasStation | null {
        const reachable = stations.filter(
            s =>
                fuelNeeded(manhattan(vehicle.position, s)) +
                SAFETY_FUEL <=
                vehicle.fuel
        )

        if (reachable.length === 0) return null

        return reachable.reduce((a, b) =>
            manhattan(vehicle.position, a) <
            manhattan(vehicle.position, b)
                ? a
                : b
        )
    }

    function ensureFuelTo(target: Point) {
        const distToTarget = fuelNeeded(
            manhattan(vehicle.position, target)
        )

        const canReachGasAfterTarget = stations.some(s =>
            distToTarget +
            fuelNeeded(manhattan(target, s)) +
            SAFETY_FUEL <= vehicle.fuel
        )

        if (canReachGasAfterTarget) return

        const station = nearestReachableStation()
        if (!station) {
            throw new Error("Map không khả thi: không có gas trong tầm với")
        }

        moveSafe(station)
        vehicle.fuel = vehicle.maxFuel
    }



    while (orders.some(o => o.status !== "delivered")) {
        const next = orders.find(
            o =>
                o.status === "pending" &&
                o.weight + vehicle.currentLoad <= vehicle.capacity
        )

        if (!next) {
            ensureFuelTo(start)
            moveSafe(start)
            vehicle.currentLoad = 0
            continue
        }

        ensureFuelTo(next.pickup)
        moveSafe(next.pickup)
        vehicle.currentLoad += next.weight
        next.status = "picked"

        ensureFuelTo(next.delivery)
        moveSafe(next.delivery)
        vehicle.currentLoad -= next.weight
        next.status = "delivered"
    }

    ensureFuelTo(start)
    moveSafe(start)

    return { logs, trail }
}

/* ================= PAGE ================= */

export default function TestPage() {
    const gridRef = useRef<HTMLCanvasElement>(null)
    const trailRef = useRef<HTMLCanvasElement>(null)
    const vehicleRef = useRef<HTMLCanvasElement>(null)

    const start: Point = {
        x: Math.floor(COLS / 2),
        y: Math.floor(ROWS / 2),
    }


    const baseVehicle: Vehicle = {
        position: { ...start },
        fuel: 30,
        maxFuel: 30,
        capacity: 50,
        currentLoad: 0,
    }

    const used = new Set<string>()
    used.add(keyOf(start))

    const orders = generateRandomOrders(10)
    orders.forEach(o => {
        used.add(keyOf(o.pickup))
        used.add(keyOf(o.delivery))
    })

    // const gasStations = generateGasStations(8, used)

    const gasStations = generateSafeGasStations(40)

    useEffect(() => {
        const gridCtx = gridRef.current!.getContext("2d")!
        drawStaticGrid(gridCtx)
        drawSymbols(gridCtx, orders, gasStations)

        const { logs, trail } = solveDelivery(
            structuredClone(baseVehicle),
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
            drawTrailCell(
                trailCtx,
                curr,
                trail.get(keyOf(curr)) ?? 1
            )
            drawVehicle(vehicleCtx, prev, curr)

            prev = curr
            i++
        }, 20)

        return () => clearInterval(interval)
    }, [])

    return (
        <div
            className="relative border border-gray-700"
            style={{ width: WIDTH, height: HEIGHT }}
        >
            <canvas
                ref={gridRef}
                width={WIDTH}
                height={HEIGHT}
                className="absolute"
            />
            <canvas
                ref={trailRef}
                width={WIDTH}
                height={HEIGHT}
                className="absolute"
            />
            <canvas
                ref={vehicleRef}
                width={WIDTH}
                height={HEIGHT}
                className="absolute"
            />
        </div>
    )
}
