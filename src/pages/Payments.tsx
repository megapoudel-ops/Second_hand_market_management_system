import { ArrowDown, ArrowRight, ArrowUp, Building, Camera, CreditCardIcon, Landmark, Laptop, UserRound } from "lucide-react"
import Header from "../components/Header"
import PaymentCard from "../components/Payments/PaymentCard"
import PaymentIcon from "../components/Payments/PaymentIcon"
import { Link } from "react-router-dom"
import SyncPlatinumCard from "../components/Payments/SyncPlatinumCard"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table"

const Payments = () => {

    const transactions = [
        {
            id: 1,
            description: "MacBook Pro Sale #1240",
            type: "Credit",
            date: "May 24, 2024",
            amount: "+Rs. 1,200.00",
            status: "Completed",
            icon: Laptop,
        },
        {
            id: 2,
            description: "Vintage Camera Purchase",
            type: "Debit",
            date: "May 22, 2024",
            amount: "-Rs. 450.00",
            status: "Completed",
            icon: Camera,
        },
        {
            id: 3,
            description: "Bank Withdrawal",
            type: "Transfer",
            date: "May 20, 2024",
            amount: "-Rs. 1,000.00",
            status: "Pending",
            icon: Landmark,
        },
        {
            id: 4,
            description: "Deposit from Sarah J.",
            type: "Credit",
            date: "May 18, 2024",
            amount: "+Rs. 85.00",
            status: "Completed",
            icon: UserRound,
        },
    ];

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
                        <PaymentIcon
                            key={idx}
                            {...item}
                        />
                    ))}
                </div>
            </div>

            <div className="w-full flex items-center justify-between mt-24">
                <h5 className="font-medium text-xl">
                    Recent Transactions
                </h5>

                <Link to={'/categories'}
                    className="font-medium text-sm flex items-center gap-2 text-(--primary-color)"
                >
                    View All History
                    <ArrowRight className="size-4" />
                </Link>
            </div>

            {/* Table */}
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
                    {transactions.map((item, idx) => (
                        <TableRow key={idx}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-muted p-2">
                                        <item.icon className="h-4 w-4" />
                                    </div>

                                    <span>{item.description}</span>
                                </div>
                            </TableCell>

                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.date}</TableCell>

                            <TableCell
                                className={
                                    item.amount.startsWith("+")
                                        ? "text-emerald-600"
                                        : "text-red-500"
                                }
                            >
                                {item.amount}
                            </TableCell>

                            <TableCell className="text-right">{item.status}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <SyncPlatinumCard />
        </div>
    )
}

export default Payments