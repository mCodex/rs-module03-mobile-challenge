import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsFromAS = await AsyncStorage.getItem('@products');

      if (productsFromAS) {
        setProducts(JSON.parse(productsFromAS));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    if (products && products.length > 0) {
      AsyncStorage.setItem('@products', JSON.stringify(products));
    }
  }, [products]);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(p => p.id === id);

      const productsClone = [...products];

      productsClone[productIndex].quantity += 1;

      // await AsyncStorage.setItem('@products', JSON.stringify(productsClone));

      setProducts(productsClone);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(p => p.id === id);

      const productsClone = [...products];

      productsClone[productIndex].quantity -= 1;

      if (productsClone[productIndex].quantity === 0) {
        productsClone.splice(productIndex, 1);
      }

      // await AsyncStorage.setItem('@products', JSON.stringify(productsClone));

      setProducts(productsClone);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const checkIfProductAlreadyExists = products.find(
        p => p.id === product.id,
      );

      if (checkIfProductAlreadyExists) {
        await increment(product.id);
        return;
      }

      const updatedProducts = [
        ...products,
        {
          ...product,
          quantity: 1,
        },
      ];

      setProducts(updatedProducts);
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
