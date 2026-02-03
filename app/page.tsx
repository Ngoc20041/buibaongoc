'use client'
import MatrixView from "@/components/matrix/MatrixView";
import {InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput} from "@/components/ui/input-group";
import {ArrowUp10, Search} from "lucide-react";
import {Card} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {useEffect, useState} from "react";

export default function Home() {
    const [n, setN] = useState('')
    const [m, setM] = useState('')

    return (
        <div className="flex flex-col min-h-screen items-center justify-center gap-6">
            <div className='flex gap-4'>
                <Card className="flex flex-col gap-4 p-5">
                    <div className="flex w-full flex-wrap justify-center gap-2">
                        <Badge variant="secondary">Nhập ma trân </Badge>
                        <Badge variant='default'>n * m</Badge>
                    </div>
                    <InputGroup className="max-w-xs">
                        <InputGroupInput placeholder="n" value={n} onChange={(e) => setN(e.target.value)}/>
                        <InputGroupAddon>
                            <ArrowUp10/>
                        </InputGroupAddon>
                    </InputGroup>
                    <InputGroup className="max-w-xs">
                        <InputGroupInput placeholder="m" value={m} onChange={(e) => setM(e.target.value)}/>
                        <InputGroupAddon>
                            <ArrowUp10/>
                        </InputGroupAddon>
                    </InputGroup>
                </Card>
                <Card className="flex flex-col gap-4 p-5">
                    <div className="flex w-full flex-wrap justify-center gap-2">
                        <Badge variant="secondary">Nhập ma trân </Badge>
                        <Badge variant='default'>n * m</Badge>
                    </div>
                    <InputGroup className="max-w-xs">
                        <InputGroupInput placeholder="n" value={n} onChange={(e) => setN(e.target.value)}/>
                        <InputGroupAddon>
                            <ArrowUp10/>
                        </InputGroupAddon>
                    </InputGroup>
                    <InputGroup className="max-w-xs">
                        <InputGroupInput placeholder="m" value={m} onChange={(e) => setM(e.target.value)}/>
                        <InputGroupAddon>
                            <ArrowUp10/>
                        </InputGroupAddon>
                    </InputGroup>
                </Card>
            </div>

            <p>Matrix</p>
            <div className="">
                <MatrixView n={Number(n) || 100} m={Number(m) || 100}/>
            </div>
        </div>
    );
}
