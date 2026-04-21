import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/lib/types'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, packing?: string, customPrice?: number) => void
  removeItem: (productId: string, packing?: string) => void
  updateQuantity: (productId: string, packing: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalAmount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, packing = '500g', customPrice) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id && i.packing === packing)
          if (existing) {
            return {
              items: state.items.map((i) =>
                (i.product.id === product.id && i.packing === packing)
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          let basePrice = product.price_customer
          if (packing === '10Kg' && product.price_10kg) basePrice = product.price_10kg
          if (packing === '30Kg' && product.price_30kg) basePrice = product.price_30kg
          
          return {
            items: [...state.items, { product, packing, quantity: 1, custom_price: customPrice ?? basePrice }],
          }
        })
      },

      removeItem: (productId, packing = '500g') => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === productId && i.packing === packing)
          if (existing && existing.quantity > 1) {
            return {
              items: state.items.map((i) =>
                (i.product.id === productId && i.packing === packing)
                  ? { ...i, quantity: i.quantity - 1 }
                  : i
              ),
            }
          }
          return {
            items: state.items.filter((i) => !(i.product.id === productId && i.packing === packing)),
          }
        })
      },

      updateQuantity: (productId, packing, quantity) => {
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((i) => !(i.product.id === productId && i.packing === packing)),
          }))
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            (i.product.id === productId && i.packing === packing) ? { ...i, quantity } : i
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
