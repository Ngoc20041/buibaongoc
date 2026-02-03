'use client'
import MatrixView from "@/components/matrix/MatrixView";
import {InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput} from "@/components/ui/input-group";
import {ArrowUp10, Search} from "lucide-react";
import {Card} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {useEffect, useState} from "react";
import {AppSidebar} from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {Separator} from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {Switch} from "@/components/ui/switch"
import {Button} from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"

export default function MatrixPage() {
    const [n, setN] = useState('')
    const [m, setM] = useState('')
    const [gas, setGas] = useState('')
    const [openSettingMatrix, setOpenSettingMatrix] = useState(false)
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "350px",
                } as React.CSSProperties
            }
        >
            <AppSidebar onOpenSettingMatrix={() => setOpenSettingMatrix(true)}/>
            <Dialog open={openSettingMatrix} onOpenChange={() => setOpenSettingMatrix(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle> Nhập ma trận n * m</DialogTitle>
                        <DialogDescription>
                            Mặc định 100 * 100
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2">
                        <Input
                            value={n}
                            onChange={(e) => setN(e.target.value)}
                        />
                        <p>n</p>
                        <span>*</span>
                        <p>m</p>
                        <Input
                            value={m}
                            onChange={(e) => setM(e.target.value)}
                        />
                    </div>
                    <div className='grid gap-5'>
                        <h2>Vị trí cây xăng</h2>
                        <div className="flex items-center gap-2">
                            <Input
                                value={gas}
                                onChange={(e) => setGas(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <DialogClose asChild>
                            <Button type="button">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <SidebarInset>
                <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4 z-50">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="#">All Inboxes</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block"/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Inbox</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <MatrixView n={Number(n) || 100} m={Number(m) || 100}/>
            </SidebarInset>
        </SidebarProvider>
    );
}
