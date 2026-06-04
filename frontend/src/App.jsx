import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

import AuthModal from './components/Auth/AuthModal'
import AdminDashboardPage from './pages/Admin/AdminDashboardPage'
import HomePage from './pages/Home/HomePage'
import ProductDetailPage from './pages/ProductDetail/ProductDetailPage'
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

export default function App() {
	return (
		<>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/admin" element={<AdminDashboardPage />} />
					<Route path="/admin/dashboard" element={<AdminDashboardPage />} />
					<Route path="/product" element={<ProductDetailPage />} />
					<Route path="/product/:slug" element={<ProductDetailPage />} />
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
			</BrowserRouter>
			<ToastContainer position="top-right" autoClose={2500} closeOnClick pauseOnFocusLoss={false} />
		</>
	)
}
