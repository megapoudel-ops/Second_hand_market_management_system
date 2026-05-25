import { useState } from "react";
import {
    BookOpen,
    Laptop,
    Sofa,
    UploadCloud
} from "lucide-react";

import Header from "../components/Header";

const CreateListing = () => {
    const [selectedCategory, setSelectedCategory] = useState("");

    const categories = [
        {
            title: "Laptops",
            description: "Computers, tablets, and tech accessories.",
            icon: Laptop,
        },
        {
            title: "Books",
            description: "Educational, fiction, and rare collections.",
            icon: BookOpen,
        },
        {
            title: "Furniture",
            description: "Home decor, tables, and office setups.",
            icon: Sofa,
        },
    ];

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="pt-12 pb-6">
                <Header
                    title="Create a New Listing"
                    subtitle= "Turn your pre-owned items into something new.  Follow the steps below to showcase your listing to the Second Sync community."
                           
                        
                  />          
                           
                        
                    
                
            </div>

            <div className="w-full space-y-8">

                {/* SECTION 1 */}
                <section className="rounded-2xl py-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-(--primary-color) text-xs font-semibold text-white">
                            1
                        </div>

                        <h2 className="text-xl font-semibold">
                            Choose a Category
                        </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 w-full">
                        {categories.map((item, index) => {
                            const Icon = item.icon;
                            const isSelected =
                                selectedCategory === item.title;

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() =>
                                        setSelectedCategory(item.title)
                                    }
                                    className={`rounded-xl border p-5 text-left transition-all duration-200
                                        
                                        ${isSelected
                                            ? "border-(--primary-color) bg-(--primary-color)/10 shadow-md"
                                            : "border-border hover:border-(--primary-color) hover:bg-(--primary-color)/5"
                                        }
                                    `}
                                >
                                    <Icon
                                        className={`mb-4 size-10
                                            
                                            ${isSelected
                                                ? "text-(--primary-color)"
                                                : "text-muted-foreground"
                                            }
                                        `}
                                    />

                                    <h3 className="font-medium">
                                        {item.title}
                                    </h3>

                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {item.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* SECTION 2 */}
                <section className="rounded-2xl py-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-(--primary-color) text-xs font-semibold text-white">
                            2
                        </div>

                        <h2 className="text-xl font-semibold">
                            Basic Information
                        </h2>
                    </div>

                    <div className="space-y-5">

                        {/* TITLE */}
                        <div>
                            <label className="mb-2 block text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                Listing Title
                            </label>

                            <input
                                type="text"
                                placeholder="e.g. MacBook Pro M1 2021 - Excellent Condition"
                                className="h-11 w-full rounded-lg border bg-background px-4 text-sm outline-none ring-0 transition focus:border-(--primary-color)"
                            />
                        </div>

                        {/* PRICE + CURRENCY */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                    Price ($)
                                </label>

                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-11 w-full rounded-lg border bg-background px-4 text-sm outline-none transition focus:border-(--primary-color)"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                    Currency
                                </label>

                                <select className="h-11 w-full rounded-lg border bg-background px-4 text-sm outline-none transition focus:border-(--primary-color)">
                                    <option>
                                        USD - United States Dollar
                                    </option>

                                    <option>
                                        EUR - Euro
                                    </option>

                                    <option>
                                        NPR - Nepalese Rupee
                                    </option>
                                </select>
                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        <div>
                            <label className="mb-2 block text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                Description
                            </label>

                            <textarea
                                rows={5}
                                placeholder="Describe your item's features, history, and why you are selling it..."
                                className="w-full rounded-lg border bg-background p-4 text-sm outline-none transition focus:border-(--primary-color)"
                            />
                        </div>
                    </div>
                </section>

                {/* SECTION 3 */}
                <section className="rounded-2xl py-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-(--primary-color) text-xs font-semibold text-white">
                            3
                        </div>

                        <h2 className="text-xl font-semibold">
                            Product Photography
                        </h2>
                    </div>

                    <div className="flex min-h-65 flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/20 p-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-(--primary-color)/10">
                            <UploadCloud className="h-7 w-7 text-(--primary-color)" />
                        </div>

                        <h3 className="font-medium">
                            Drag and drop photos here
                        </h3>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Or click to browse from your computer (Max 10 photos)
                        </p>

                        <button className="mt-6 rounded-lg border border-(--primary-color) px-5 py-2 text-sm font-medium text-(--primary-color) transition hover:bg-(--primary-color) hover:text-white">
                            Select Files
                        </button>
                    </div>
                </section>

                {/* SECTION 4 */}
                <section className="rounded-2xl py-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-(--primary-color) text-xs font-semibold text-white">
                            4
                        </div>

                        <h2 className="text-xl font-semibold">
                            Condition & Specifications
                        </h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 pb-6">

                        {/* LEFT SIDE */}
                        <div>
                            <label className="mb-3 block text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                Item Condition
                            </label>

                            <div className="space-y-3">
                                {[
                                    "Brand New",
                                    "Like New / Open Box",
                                    "Gently Used",
                                    "Well Loved",
                                ].map((condition, index) => (
                                    <label
                                        key={index}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition hover:border-(--primary-color) hover:bg-(--primary-color)/5"
                                    >
                                        <input
                                            type="radio"
                                            name="condition"
                                            className="h-4 w-4 accent-(--primary-color)"
                                            defaultChecked={index === 1}
                                        />

                                        <span className="text-sm font-medium">
                                            {condition}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT SIDE */}
                        <div className="space-y-5">

                            {/* YEAR */}
                            <div>
                                <label className="mb-2 block text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                    Year of Purchase
                                </label>

                                <input
                                    type="text"
                                    placeholder="e.g. 2022"
                                    className="h-11 w-full rounded-lg border bg-background px-4 text-sm outline-none transition focus:border-(--primary-color)"
                                />
                            </div>

                            {/* WARRANTY */}
                            <div>
                                <label className="mb-2 block text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                    Warranty Status
                                </label>

                                <select className="h-11 w-full rounded-lg border bg-background px-4 text-sm outline-none transition focus:border-(--primary-color)">
                                    <option>No warranty</option>

                                    <option>Under warranty</option>

                                    <option>Expired warranty</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <div className="flex flex-col gap-4 border-t pt-6 md:flex-row md:items-center md:justify-between">

                    <p className="text-sm text-muted-foreground">
                        By publishing, you agree to Second Sync’s Community Guidelines.
                    </p>

                    <div className="flex items-center gap-3">
                        <button className="rounded-lg border px-6 py-2.5 text-sm font-medium transition hover:bg-muted">
                            Save Draft
                        </button>

                        <button className="rounded-lg bg-(--primary-color) px-6 py-2.5 text-sm font-medium text-white shadow-md transition hover:opacity-90">
                            Publish Listing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateListing;