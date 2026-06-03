import { type LucideIcon } from "lucide-react";

type PaymentIconType = {
    icon: LucideIcon;
    title: string;
    subtitle: string;
}

const PaymentIcon = ({ icon: Icon, title, subtitle }: PaymentIconType) => {
    return (
        <div className="mt-12 flex flex-col items-center w-full">
            <div className="text-2xl text-(--primary-color) bg-blue-100 rounded-full p-3">
                <Icon />
            </div>
            <h3 className="text-xl font-medium mt-3">{title}</h3>
            <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div >
    )
}

export default PaymentIcon