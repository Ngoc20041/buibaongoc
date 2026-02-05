'use client'
import {useEffect, useRef, useState} from "react";

const FUEL_PER_CELL = 1 / 20
const SAFETY = 0.5

export type Point = { x: number; y: number }

export type OrderStatus = "pending" | "picked" | "delivered"

export type Order = {
    id: number
    pickup: Point
    delivery: Point
    weight: number
    status: OrderStatus
}

export type Vehicle = {
    position: Point
    fuel: number
    maxFuel: number
    capacity: number
    load: number
}
export type Stats = {
    totalDistance: number
    refuelCount: number
}

const key = (p: Point) => `${p.x},${p.y}` // get key of a point
const manhattan = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) //get manhattan distance between two points

export function aStar(start: Point, goal: Point, rows: number, cols: number): Point[] { // A* algorithm
    const open = new Map<string, number>()
    const cameFrom = new Map<string, Point>()
    const g = new Map<string, number>()

    open.set(key(start), manhattan(start, goal))
    g.set(key(start), 0)

    while (open.size > 0) {
        const [currentKey] = [...open.entries()].sort((a, b) => a[1] - b[1])[0]

        open.delete(currentKey)

        const [x, y] = currentKey.split(",").map(Number)
        const current = {x, y}

        if (x === goal.x && y === goal.y) {
            const path: Point[] = [{x, y}]
            let k = currentKey
            while (cameFrom.has(k)) {
                const p = cameFrom.get(k)!
                path.push({...p})
                k = key(p)
            }
            return path.reverse()
        }

        const neighbors = [
            {x: x + 1, y},
            {x: x - 1, y},
            {x, y: y + 1},
            {x, y: y - 1},
        ].filter(p => p.x >= 0 && p.y >= 0 && p.x < cols && p.y < rows)

        for (const n of neighbors) {
            const nk = key(n)
            const tentativeG = g.get(currentKey)! + 1

            if (!g.has(nk) || tentativeG < g.get(nk)!) {
                cameFrom.set(nk, current)
                g.set(nk, tentativeG)
                open.set(nk, tentativeG + manhattan(n, goal))
            }
        }
    }

    throw new Error("Không tìm được đường")
}

export function chooseNextOrder(vehicle: Vehicle, orders: Order[]): Order | null { // choose the next order to pick up
    return orders
        .filter(o =>
            o.status === "pending" &&
            o.weight + vehicle.load <= vehicle.capacity
        )
        .sort(
            (a, b) =>
                manhattan(vehicle.position, a.pickup) -
                manhattan(vehicle.position, b.pickup)
        )[0] ?? null
}

export function shouldReturnToDepot(vehicle: Vehicle, orders: Order[]): boolean { // check if the vehicle should return to depot
    return !orders.some(
        o =>
            o.status === "pending" &&
            o.weight + vehicle.load <= vehicle.capacity
    )
}

function refuel(vehicle: Vehicle) { // refuel the vehicle if it runs out of fuel
    vehicle.fuel = vehicle.maxFuel
}

export function fuelNeeded(a: Point, b: Point) { // calculate fuel needed to travel from a to b
    return manhattan(a, b) * FUEL_PER_CELL
}

export function nearestReachableStation(vehicle: Vehicle, stations: Point[]): Point | null { // find the nearest reachable gas station from the vehicle's current position'
    return stations
        .filter(
            s => fuelNeeded(vehicle.position, s) + SAFETY <= vehicle.fuel
        )
        .sort(
            (a, b) =>
                fuelNeeded(vehicle.position, a) -
                fuelNeeded(vehicle.position, b)
        )[0] ?? null
}

function canDoOrderSafely(vehicle: Vehicle, order: Order, stations: Point[]) { // check if the order can be safely completed by the vehicle
    const fuelToPickup = fuelNeeded(vehicle.position, order.pickup)
    const fuelToDeliver = fuelNeeded(order.pickup, order.delivery)
    const nearestStation = nearestReachableStation({...vehicle, position: order.delivery}, stations)

    if (!nearestStation) return false

    const fuelToStation = fuelNeeded(order.delivery, nearestStation)

    return (fuelToPickup + fuelToDeliver + fuelToStation + SAFETY) <= vehicle.fuel
}

function findBatch(vehicle: Vehicle, orders: Order[], stations: Point[]): Order[] { // find a batch of orders that can be safely completed by the vehicle

    const batch: Order[] = []
    const tempVehicle = {...vehicle}

    for (const o of orders.filter(o => o.status === "pending")) {
        if (tempVehicle.load + o.weight > tempVehicle.capacity) continue

        if (!canDoOrderSafely(tempVehicle, o, stations)) continue

        batch.push(o)
        tempVehicle.load += o.weight
        tempVehicle.position = o.delivery // giả lập
    }

    return batch
}

const ROWS = 45
const COLS = 45
const CELL_SIZE = 30
const WIDTH = COLS * CELL_SIZE
const HEIGHT = ROWS * CELL_SIZE
const AXIS_PADDING = 20
const CANVAS_WIDTH = WIDTH + AXIS_PADDING
const CANVAS_HEIGHT = HEIGHT + AXIS_PADDING

/* ================= DRAW ================= */

function drawStaticGrid(ctx: CanvasRenderingContext2D) { // draw the static grid
    ctx.save()
    for (let y = 0; y <= ROWS; y++) {
        const bold = y % 5 === 0
        ctx.strokeStyle = bold ? "#444" : "#bbb"
        ctx.lineWidth = bold ? 1 : 0.5

        ctx.beginPath()
        ctx.moveTo(0, y * CELL_SIZE)
        ctx.lineTo(WIDTH, y * CELL_SIZE)
        ctx.stroke()
    }

    for (let x = 0; x <= COLS; x++) {
        const bold = x % 5 === 0
        ctx.strokeStyle = bold ? "#444" : "#bbb"
        ctx.lineWidth = bold ? 1 : 0.5

        ctx.beginPath()
        ctx.moveTo(x * CELL_SIZE, 0)
        ctx.lineTo(x * CELL_SIZE, HEIGHT)
        ctx.stroke()
    }

    ctx.restore()
}

function drawTriangleCell(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color = "red"
) {
    const cx = x * size + size / 2
    const cy = y * size + size / 2
    const r = size * 0.4

    ctx.fillStyle = color
    ctx.beginPath()

    // đỉnh trên
    ctx.moveTo(cx, cy - r)

    // đáy trái
    ctx.lineTo(cx - r, cy + r)

    // đáy phải
    ctx.lineTo(cx + r, cy + r)

    ctx.closePath()
    ctx.fill()
}


function drawSymbols(ctx: CanvasRenderingContext2D, orders: Order[], gasStations: Point[], alpha = 0.7) { // draw the symbols on the grid
    ctx.save()
    ctx.globalAlpha = alpha


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
        drawTriangleCell(
            ctx,
            o.delivery.x,
            o.delivery.y,
            CELL_SIZE,
            "red"
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

function drawTrailCell(ctx: CanvasRenderingContext2D, p: Point, count: number) { // draw a trail cell with a count indicator
    ctx.fillStyle = `rgba(0,0,255,${Math.min(0.15 * count, 0.6)})`
    ctx.fillRect(
        p.x * CELL_SIZE,
        p.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
    )
}

type Direction = "up" | "down" | "left" | "right"

function getDirection(prev: Point, curr: Point): Direction {
    if (curr.x > prev.x) return "right"
    if (curr.x < prev.x) return "left"
    if (curr.y > prev.y) return "down"
    return "up"
}

function drawArrowLike(
    ctx: CanvasRenderingContext2D,
    curr: Point,
    dir: Direction
) {
    const cx = curr.x * CELL_SIZE + CELL_SIZE / 2
    const cy = curr.y * CELL_SIZE + CELL_SIZE / 2

    const bodyLen = CELL_SIZE * 0.35
    const bodyW = CELL_SIZE * 0.15
    const headLen = CELL_SIZE * 0.25

    ctx.fillStyle = "red"
    ctx.beginPath()

    if (dir === "right") {
        // thân ->
        ctx.fillRect(cx - bodyLen, cy - bodyW / 2, bodyLen, bodyW)

        // đầu >
        ctx.moveTo(cx + headLen, cy)
        ctx.lineTo(cx, cy - headLen)
        ctx.lineTo(cx, cy + headLen)
    }

    if (dir === "left") {
        ctx.fillRect(cx, cy - bodyW / 2, bodyLen, bodyW)
        ctx.moveTo(cx - headLen, cy)
        ctx.lineTo(cx, cy - headLen)
        ctx.lineTo(cx, cy + headLen)
    }

    if (dir === "up") {
        ctx.fillRect(cx - bodyW / 2, cy, bodyW, bodyLen)
        ctx.moveTo(cx, cy - headLen)
        ctx.lineTo(cx - headLen, cy)
        ctx.lineTo(cx + headLen, cy)
    }

    if (dir === "down") {
        ctx.fillRect(cx - bodyW / 2, cy - bodyLen, bodyW, bodyLen)
        ctx.moveTo(cx, cy + headLen)
        ctx.lineTo(cx - headLen, cy)
        ctx.lineTo(cx + headLen, cy)
    }

    ctx.closePath()
    ctx.fill()
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

        const dir = getDirection(prev, curr)
        drawArrowLike(ctx, curr, dir)
    } else {
        // frame đầu
        ctx.fillStyle = "red"
        ctx.fillRect(
            curr.x * CELL_SIZE + 1,
            curr.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        )
    }
}

function drawCellIndex(ctx: CanvasRenderingContext2D, alpha = 0.7) { // draw the cell indices on the grid
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font = "10px Arial"
    ctx.fillStyle = "#333"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const index = y * COLS + x + 1

            ctx.fillText(
                index.toString(),
                x * CELL_SIZE + CELL_SIZE / 2,
                y * CELL_SIZE + CELL_SIZE / 2
            )
        }
    }

    ctx.restore()
}

function drawAxes(ctx: CanvasRenderingContext2D) {
    ctx.save()

    ctx.font = "12px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Trục X (cột) – trên cùng
    for (let x = 0; x < COLS; x++) {
        ctx.fillText(
            x.toString(),
            x * CELL_SIZE + CELL_SIZE / 2,
            -10
        )
    }

    // Trục Y (hàng) – bên trái
    ctx.textAlign = "right"
    for (let y = 0; y < ROWS; y++) {
        ctx.fillText(
            y.toString(),
            -6,
            y * CELL_SIZE + CELL_SIZE / 2
        )
    }

    ctx.restore()
}

function drawStopMarker(
    ctx: CanvasRenderingContext2D,
    p: Point,
) {
    const cx = p.x * CELL_SIZE + CELL_SIZE / 2
    const cy = p.y * CELL_SIZE + CELL_SIZE / 2

    ctx.save()

    ctx.fillStyle = "limegreen"
    ctx.beginPath()
    ctx.arc(cx, cy, CELL_SIZE * 0.25, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
}


export type LogEvent =
    | { type: "move"; from: Point; to: Point }
    | { type: "pickup"; orderId: number; at: Point }
    | { type: "delivery"; orderId: number; at: Point }
    | { type: "refuel"; at: Point }
    | { type: "return"; at: Point }

function moveAlongPath(
    vehicle: Vehicle,
    path: Point[],
    logs: LogEvent[],
    stats: Stats
) {
    for (let i = 1; i < path.length; i++) {
        vehicle.fuel -= FUEL_PER_CELL
        stats.totalDistance += 1   // 👈 mỗi ô = 1 đơn vị

        logs.push({
            type: "move",
            from: path[i - 1],
            to: path[i],
        })

        vehicle.position = path[i]
    }
}

export function runScheduler(
    vehicle: Vehicle,
    orders: Order[],
    stations: Point[],
    rows: number,
    cols: number,
    depot: Point
): { logs: LogEvent[]; stats: Stats } {


    const logs: LogEvent[] = []
    const stats: Stats = {
        totalDistance: 0,
        refuelCount: 0
    }


    while (orders.some(o => o.status !== "delivered")) {

        /* ====== 1. TÌM BATCH ĐƠN ====== */
        const batch = findBatch(vehicle, orders, stations)

        /* ====== 2. KHÔNG CÓ BATCH → XỬ LÝ XĂNG / DEPOT ====== */
        if (batch.length === 0) {


            const station = nearestReachableStation(vehicle, stations)

            if (station) {
                const path = aStar(vehicle.position, station, rows, cols)
                moveAlongPath(vehicle, path, logs, stats)
                refuel(vehicle)
                stats.refuelCount += 1
                logs.push({type: "refuel", at: station})
                continue
            }

            // không tới được trạm → về depot
            const back = aStar(vehicle.position, depot, rows, cols)
            moveAlongPath(vehicle, back, logs, stats)
            vehicle.load = 0
            logs.push({type: "return", at: depot})
            continue
        }

        /* ====== 3. PICKUP TOÀN BỘ BATCH ====== */
        for (const order of batch) {
            const pathToPickup = aStar(vehicle.position, order.pickup, rows, cols)
            moveAlongPath(vehicle, pathToPickup, logs, stats)

            vehicle.load += order.weight
            order.status = "picked"

            logs.push({
                type: "pickup",
                orderId: order.id,
                at: order.pickup,
            })
        }

        /* ====== 4. DELIVERY TOÀN BỘ BATCH ====== */
        for (const order of batch) {
            const pathToDelivery = aStar(vehicle.position, order.delivery, rows, cols)
            moveAlongPath(vehicle, pathToDelivery, logs, stats)
            vehicle.load -= order.weight
            order.status = "delivered"

            logs.push({
                type: "delivery",
                orderId: order.id,
                at: order.delivery,
            })
        }
    }

    /* ====== 5. CUỐI CÙNG QUAY VỀ DEPOT ====== */
    const backHome = aStar(vehicle.position, depot, rows, cols)
    moveAlongPath(vehicle, backHome, logs, stats)
    logs.push({type: "return", at: depot})

    return {logs, stats}
}

export default function MatrixPageComponent() {
    const [finalStats, setFinalStats] = useState<Stats | null>(null)

    const gridRef = useRef<HTMLCanvasElement>(null)
    const trailRef = useRef<HTMLCanvasElement>(null)
    const vehicleRef = useRef<HTMLCanvasElement>(null)
    const markRef = useRef<HTMLCanvasElement>(null)

    const DEPOT: Point = {y: Math.floor(ROWS / 2), x: Math.floor(COLS / 2)}
    const orders: Order[] = [
        // {id: 1, pickup: {y: 40, x: 20}, delivery: {y: 43, x: 23}, weight: 10, status: "pending"},
        // {id: 6, pickup: {y: 23, x: 23}, delivery: {y: 43, x: 43}, weight: 10, status: "pending"},
        {id: 2, pickup: {y: 10, x: 10}, delivery: {y: 27, x: 42}, weight: 10, status: "pending"},
        {id: 3, pickup: {y: 33, x: 20}, delivery: {y: 17, x: 12}, weight: 10, status: "pending"},
        {id: 4, pickup: {y: 10, x: 30}, delivery: {y: 44, x: 1}, weight: 10, status: "pending"},
        {id: 5, pickup: {y: 10, x: 40}, delivery: {y: 1, x: 43}, weight: 5, status: "pending"}
    ]
    const gasStations: Point[] = [{x: 10, y: 20}, {x: 10, y: 14}, {x: 18, y: 20}, {x: 1, y: 14}]
    const vehicle: Vehicle = {
        position: DEPOT,
        fuel: 5,
        maxFuel: 10,
        capacity: 100,
        load: 0
    }

    useEffect(() => {
        const gridCtx = gridRef.current!.getContext("2d")!
        const trailCtx = trailRef.current!.getContext("2d")!
        const vehicleCtx = vehicleRef.current!.getContext("2d")!
        const markCtx = markRef.current!.getContext("2d")!
        markCtx.translate(AXIS_PADDING, AXIS_PADDING)

        gridCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        gridCtx.save()
        gridCtx.translate(AXIS_PADDING, AXIS_PADDING)

        drawStaticGrid(gridCtx)
        drawCellIndex(gridCtx)
        drawAxes(gridCtx)
        drawSymbols(gridCtx, orders, gasStations)

        trailCtx.clearRect(0, 0, WIDTH, HEIGHT)
        trailCtx.save()
        trailCtx.translate(AXIS_PADDING, AXIS_PADDING)

        vehicleCtx.translate(AXIS_PADDING, AXIS_PADDING)

        const {logs, stats} = runScheduler(vehicle, orders, gasStations, ROWS, COLS, DEPOT)

        let i = 0
        let prev: Point | null = null

        const interval = setInterval(() => {
            if (i >= logs.length) {
                clearInterval(interval)
                setFinalStats(stats)
                return
            }

            const event = logs[i]

            if (event.type === "move") {
                const curr = event.to
                drawTrailCell(trailCtx, curr, 1)
                drawVehicle(vehicleCtx, prev, curr)
                prev = curr
            }
            if (
                event.type === "pickup" ||
                event.type === "delivery" ||
                event.type === "refuel" ||
                event.type === "return"
            ) {
                drawStopMarker(markCtx, event.at)
            }

            i++
        }, 30)

        vehicleCtx.restore()
    }, [])

    return (
        <div
            className="relative border border-gray-700"
            style={{width: CANVAS_WIDTH, height: CANVAS_HEIGHT}}
        >
            <canvas
                ref={gridRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="absolute"
            />
            <canvas
                ref={trailRef}
                width={WIDTH + AXIS_PADDING}
                height={HEIGHT + AXIS_PADDING}
                className="absolute"
            />

            <canvas
                ref={vehicleRef}
                width={WIDTH + AXIS_PADDING}
                height={HEIGHT + AXIS_PADDING}
                className="absolute"
            />

            <canvas
                ref={markRef}
                width={WIDTH + AXIS_PADDING}
                height={HEIGHT + AXIS_PADDING}
                className="absolute"
            />
            {finalStats && (
                <div className="absolute bottom-2 right-2 bg-black/80 text-white p-3 rounded text-sm space-y-1">
                    <div>🚗 Tổng quãng đường: <b>{finalStats.totalDistance}</b> ô</div>
                    <div>⛽ Số lần đổ xăng: <b>{finalStats.refuelCount}</b></div>
                </div>
            )}


        </div>
    )
}