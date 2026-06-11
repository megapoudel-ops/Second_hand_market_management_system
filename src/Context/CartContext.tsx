import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type CartItem = {
    id: number | string;
    title: string;
    description: string;
    price: string;
    image: string;
    quantity: number;
};

type CartContextType = {
    cart: CartItem[];
    addToCart: (product: Omit<CartItem, "quantity">) => void;
    removeFromCart: (id: number | string) => void;
    updateQuantity: (id: number | string, quantity: number) => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = (product: Omit<CartItem, "quantity">) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id: number | string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: number | string, quantity: number) => {
        if (quantity < 1) return;
        setCart(prev =>
            prev.map(item =>
                item.id === id ? { ...item, quantity } : item
            )
        );
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used inside CartProvider");
    return context;
}
