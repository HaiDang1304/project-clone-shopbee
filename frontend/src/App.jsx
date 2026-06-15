import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

import AuthModal from './components/Auth/AuthModal'
import FloatingChatButton from './components/FloatingChatButton/FloatingChatButton'
import { CartProvider } from './context/CartContext'
import AdminDashboardPage from './pages/Admin/AdminDashboardPage'
import CartPage from './pages/Cart/CartPage'
import CategoryPage from './pages/Category/CategoryPage'
import CheckoutPage from './pages/Checkout/CheckoutPage'
import HomePage from './pages/Home/HomePage'
import OrderSuccessPage from './pages/Checkout/OrderSuccessPage'
import ProductDetailPage from './pages/ProductDetail/ProductDetailPage'
import SearchPage from './pages/Search/SearchPage'
import ShopPage from './pages/Shop/ShopPage'
import VoucherCenterPage from './pages/Vouchers/VoucherCenterPage'
import LoadingPage from './pages/Loading/LoadingPage'
import MessagesPage from './pages/Messages/MessagesPage'
import AddressesPage from './pages/Account/AddressesPage'
import BankCardsPage from './pages/Account/BankCardsPage'
import ChangePasswordPage from './pages/Account/ChangePasswordPage'
import OrdersPage from './pages/Account/OrdersPage'
import ProfilePage from './pages/Account/ProfilePage'
import SellerChannelPage from './pages/Account/SellerChannelPage'

function AuthModalRoute({ mode }) {
	const navigate = useNavigate()
	const location = useLocation()
	const params = new URLSearchParams(location.search)
	const redirectParam = params.get('redirect')
	const redirectTo = redirectParam?.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/'

	return (
		<>
			<HomePage />
			<AuthModal
				open
				initialMode={mode}
				initialEmail={params.get('email') || ''}
				onClose={() => navigate(redirectTo)}
			/>
		</>
	)
}

function ChatboxGate() {
	const { pathname } = useLocation()
	const hiddenOnDashboard = pathname === '/admin' || pathname.startsWith('/admin/dashboard') || pathname.startsWith('/seller/dashboard') || pathname.startsWith('/messages')

	return hiddenOnDashboard ? null : <FloatingChatButton />
}

function TimedLoadingOverlay() {
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setLoading(false)
		}, 650)

		return () => window.clearTimeout(timer)
	}, [])

	return loading ? <LoadingPage text="Đang mở ShopBee..." /> : null
}

function RouteLoadingOverlay() {
	const location = useLocation()
	const pathSegments = location.pathname.split('/').filter(Boolean)
	const routeGroupKey = pathSegments[0] || '/'

	return <TimedLoadingOverlay key={routeGroupKey} />
}

export default function App() {
	return (
		<>
			<BrowserRouter>
				<CartProvider>
					<RouteLoadingOverlay />
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/admin" element={<AdminDashboardPage />} />
						<Route path="/admin/dashboard" element={<AdminDashboardPage />} />
						<Route path="/product" element={<ProductDetailPage />} />
						<Route path="/product/:slug" element={<ProductDetailPage />} />
						<Route path="/category/:slug" element={<CategoryPage />} />
						<Route path="/search" element={<SearchPage />} />
						<Route path="/shop/:slug" element={<ShopPage />} />
						<Route path="/vouchers" element={<VoucherCenterPage />} />
						<Route path="/messages" element={<MessagesPage />} />
						<Route path="/cart" element={<CartPage />} />
						<Route path="/checkout" element={<CheckoutPage />} />
						<Route path="/order-success" element={<OrderSuccessPage />} />
						<Route path="/profile" element={<ProfilePage />} />
						<Route path="/account/bank-cards" element={<BankCardsPage />} />
						<Route path="/account/addresses" element={<AddressesPage />} />
						<Route path="/account/password" element={<ChangePasswordPage />} />
						<Route path="/account/seller" element={<SellerChannelPage />} />
						<Route path="/seller/dashboard" element={<SellerChannelPage standalone />} />
						<Route path="/orders" element={<OrdersPage />} />
						<Route path="/login" element={<AuthModalRoute mode="login" />} />
						<Route path="/register" element={<AuthModalRoute mode="register" />} />
						<Route path="/verify-email" element={<AuthModalRoute mode="verify" />} />
					</Routes>
					<ChatboxGate />
				</CartProvider>
			</BrowserRouter>
			<ToastContainer position="top-right" autoClose={2500} closeOnClick pauseOnFocusLoss={false} />
		</>
	)
}
