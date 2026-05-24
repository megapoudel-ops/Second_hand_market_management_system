import { ArrowDown, ArrowRight, ArrowUp, Building, CreditCardIcon, Laptop } from "lucide-react"
import Header from "../components/Header"
import PaymentCard from "../components/Payments/PaymentCard"
import PaymentIcon from "../components/Payments/PaymentIcon"
import { Link } from "react-router-dom"
import SyncPlatinumCard from "../components/Payments/SyncPlatinumCard"
import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table"

const API_KEY = "pk_test_demo1234567890abcdef"
const PAYMENT_URL = import.meta.env.VITE_PAYMENT_API_URL

const Payments = () => {
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${PAYMENT_URL}/api/payments`, {
            headers: { "X-API-Key": API_KEY }
        })
            .then(res => res.json())
            .then(data => {
                if (data.data) setTransactions(data.data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const PaymentIcons = [
        { icon: ArrowDown, title: "Receive Money", subtitle: "Show QR code or link" },
        { icon: ArrowUp, title: "Send Money", subtitle: "To email or phone" },
        { icon: CreditCardIcon, title: "Deposit", subtitle: "Add from bank or card" },
        { icon: Building, title: "Withdraw", subtitle: "To your local bank" }
    ]

    return (
        <div className="my-12">
            <Header
                title="Wallet Dashboard"
                subtitle="Manage your funds, deposits, and digital assets securely."
            />

            <div className="w-full flex items-center justify-between gap-8">
                <PaymentCard />
                <div className="w-[calc(100%-36rem)] grid grid-cols-2">
                    {PaymentIcons.map((item, idx) => (
                        <PaymentIcon key={idx} {...item} />
                    ))}
                </div>
            </div>

            <div className="w-full flex items-center justify-between mt-24">
                <h5 className="font-medium text-xl">Recent Transactions</h5>
                <Link to={'/categories'}
                    className="font-medium text-sm flex items-center gap-2 text-(--primary-color)"
                >
                    View All History
                    <ArrowRight className="size-4" />
                </Link>
            </div>

            <Table className="my-6">
                <TableHeader>
                    <TableRow>
                        <TableHead className="pl-0">Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right pr-0">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                        </TableRow>
                    ) : transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">No transactions found</TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((item, idx) => (
                            <TableRow key={idx}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-full bg-muted p-2">
                                            <Laptop className="h-4 w-4" />
                                        </div>
                                        <span>{item.description || item.id}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{item.type || "Payment"}</TableCell>
                                <TableCell>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}</TableCell>
                                <TableCell className={item.amount > 0 ? "text-emerald-600" : "text-red-500"}>
                                    {item.amount > 0 ? "+" : ""}Rs. {item.amount}
                                </TableCell>
                                <TableCell className="text-right">{item.status}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <SyncPlatinumCard />
        </div>
    )
}

export default Payments