import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  addCartItem,
  clearCart as clearCartRequest,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../lib/cart'
import { getAuthUser, subscribeAuth } from '../lib/auth'
import { CartContext } from './cartContextCore'

const emptyCart = { id: null, items: [], totals: { quantity: 0, amount: 0 } }

function normalizeCart(cart) {
  const items = Array.isArray(cart?.items)
    ? cart.items.map((item) => ({
        ...item,
        id: Number(item.id),
        productId: Number(item.productId),
        variantId: item.variantId == null ? null : Number(item.variantId),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        stock: Number(item.stock || 0),
        lineTotal: Number(item.lineTotal || Number(item.quantity || 0) * Number(item.unitPrice || 0)),
        selectedOptions: item.selectedOptions || {},
      }))
    : []

  return {
    id: cart?.id || null,
    items,
    totals: {
      quantity: Number(cart?.totals?.quantity ?? items.reduce((sum, item) => sum + item.quantity, 0)),
      amount: Number(cart?.totals?.amount ?? items.reduce((sum, item) => sum + item.lineTotal, 0)),
    },
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(emptyCart)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authUser, setAuthUser] = useState(() => getAuthUser())

  useEffect(() => subscribeAuth(setAuthUser), [])

  const loadCart = useCallback(async () => {
    if (!getAuthUser()) {
      setCart(emptyCart)
      setError('')
      return emptyCart
    }

    setLoading(true)
    try {
      const nextCart = normalizeCart(await getCart())
      setCart(nextCart)
      setError('')
      return nextCart
    } catch (err) {
      if (err.status === 401) {
        setCart(emptyCart)
      }
      setError(err.message || 'Không tải được giỏ hàng')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function syncCart() {
      await Promise.resolve()
      if (!active) return

      if (!getAuthUser()) {
        setCart(emptyCart)
        setError('')
        return
      }

      setLoading(true)
      try {
        const nextCart = normalizeCart(await getCart())
        if (active) {
          setCart(nextCart)
          setError('')
        }
      } catch (err) {
        if (active) {
          if (err.status === 401) setCart(emptyCart)
          setError(err.message || 'Không tải được giỏ hàng')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    syncCart()

    return () => {
      active = false
    }
  }, [authUser])

  const addToCart = useCallback(async (item) => {
    setLoading(true)
    try {
      const nextCart = normalizeCart(await addCartItem(item))
      setCart(nextCart)
      setError('')
      return nextCart
    } catch (err) {
      setError(err.message || 'Không thêm được vào giỏ hàng')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const changeCartItem = useCallback(async (itemId, quantity) => {
    setLoading(true)
    try {
      const nextCart = normalizeCart(await updateCartItem(itemId, quantity))
      setCart(nextCart)
      setError('')
      return nextCart
    } catch (err) {
      setError(err.message || 'Không cập nhật được giỏ hàng')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const removeFromCart = useCallback(async (itemId) => {
    setLoading(true)
    try {
      const nextCart = normalizeCart(await removeCartItem(itemId))
      setCart(nextCart)
      setError('')
      return nextCart
    } catch (err) {
      setError(err.message || 'Không xóa được sản phẩm')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearCart = useCallback(async () => {
    setLoading(true)
    try {
      const nextCart = normalizeCart(await clearCartRequest())
      setCart(nextCart)
      setError('')
      return nextCart
    } catch (err) {
      setError(err.message || 'Không xóa được giỏ hàng')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      cart,
      cartItems: cart.items,
      cartCount: cart.totals.quantity,
      cartTotal: cart.totals.amount,
      loading,
      error,
      loadCart,
      addToCart,
      updateCartItem: changeCartItem,
      removeCartItem: removeFromCart,
      clearCart,
    }),
    [addToCart, cart, changeCartItem, clearCart, error, loadCart, loading, removeFromCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
