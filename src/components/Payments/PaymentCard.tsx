import { Shield, BadgeCheck, Wallet } from "lucide-react";

export default function PaymentCard() {
    return (
        <div className="relative mt-8 w-xl overflow-hidden rounded-2xl bg-linear-to-br from-[#015c55] via-[#01675f] to-[#0b7b73] p-7 text-white shadow-2xl">

            {/* Glow */}
            <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-emerald-300/10 blur-3xl" />

            {/* Top Content */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs tracking-[0.2em] text-emerald-200/80 uppercase">
                        Current Balance
                    </p>

                    <h1 className="mt-2 text-5xl font-medium tracking-tight">
                        Rs. 1,200
                    </h1>
                </div>

                {/* Icon */}
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                    <Wallet className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Small Cards */}
            <div className="mt-10 flex gap-4">
                <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-100/70">
                        Pending
                    </p>

                    <h3 className="mt-1 text-xl font-medium">Rs. 142.00</h3>
                </div>

                <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-100/70">
                        Sync Credit
                    </p>

                    <h3 className="mt-1 text-xl font-medium">850 SC</h3>
                </div>
            </div>

            {/* Bottom */}
            <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-emerald-100/80">
                    Secured by Second Sync Vault™
                </p>

                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5">
                        <Shield className="h-5 w-5 text-white/90" />
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5">
                        <BadgeCheck className="h-5 w-5 text-white/90" />
                    </div>
                </div>
            </div>
        </div >
    );
}