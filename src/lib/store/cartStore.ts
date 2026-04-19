import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/lib/types'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, customPrice?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalAmount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, customPrice) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          return {
            items: [...state.items, { product, quantity: 1, custom_price: customPrice }],
          }
        })
      },

      removeItem: (productId) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === productId)
          if (existing && existing.quantity > 1) {
            return {
              items: state.items.map((i) =>
                i.product.id === productId
                  ? { ...i, quantity: i.quantity - 1 }
                  : i
              ),
            }
          }
          return {
            items: state.items.filter((i) => i.product.id !== productId),
          }
        })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((i) => i.product.id !== productId),
          }))
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      getTotalAmount: () => {
        return get().items.reduce((sum, i) => {
          const price = i.custom_price ?? i.product.price_customer
          return sum + price * i.quantity
        }, 0)
      },
    }),
    {
      name: 'apurti-cart',
    }
  )
)
