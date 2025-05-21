import React, { createContext, useState } from "react";
import { toast } from "react-hot-toast";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const generateUniqueId = () => {
        //  unique ID based on the current timestamp and random number
        return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    };

    const addToCart = (item) => {
        // Add item to the cart and initialize isSelected to false, assign a unique _cartId
        setCartItems((prevItems) => [
            ...prevItems,
            { ...item, isSelected: false, _cartId: generateUniqueId() } // Use the unique ID
        ]);
        toast.success("Item added to Wish List!");
    };

    const removeFromCart = (cartId) => {
        // Remove item from cart by cartId
        setCartItems((prevItems) =>
            prevItems.filter((item) => item._cartId !== cartId)
        );
        toast.success("Item removed from Wish List!");
    };

    const toggleSelectItem = (cartId) => {
        // Toggle selected state of a single item based on _cartId
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item._cartId === cartId
                    ? { ...item, isSelected: !item.isSelected }
                    : item
            )
        );
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, toggleSelectItem }}>
            {children}
        </CartContext.Provider>
    );
};
