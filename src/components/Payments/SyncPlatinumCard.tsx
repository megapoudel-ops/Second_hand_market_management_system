import { Button } from "../ui/button"

const SyncPlatinumCard = () => {
    return (
        <div className="w-full mt-6 bg-blue-100 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="size-18 bg-black rounded-md" />
                <div>
                    <h1 className="text-xl font-medium">Upgrade to Sync Platinum</h1>
                    <p className="text-neutral-800 text-xs">
                        Get 0% withdrawal fees and 2% cashback on every sync.
                    </p>
                </div>
            </div>

            <Button className="px-8 py-5 text-xs">
                Learn More
            </Button>
        </div>
    )
}

export default SyncPlatinumCard