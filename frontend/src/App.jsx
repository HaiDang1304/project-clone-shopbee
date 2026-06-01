import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import AuthModal from './components/Auth/AuthModal'
import HomePage from './pages/Home/HomePage'
import ProductDetailPage from './pages/ProductDetail/ProductDetailPage'

function AuthModalRoute({ mode }) {
	const navigate = useNavigate()
	const location = useLocation()
	const params = new URLSearchParams(location.search)

	return (
		<>
			<HomePage />
			<AuthModal
				open
				initialMode={mode}
				initialEmail={params.get('email') || ''}
				onClose={() => navigate('/')}
			/>
		</>
	)
}

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/product" element={<ProductDetailPage />} />
				<Route path="/product/:slug" element={<ProductDetailPage />} />
				<Route path="/login" element={<AuthModalRoute mode="login" />} />
				<Route path="/register" element={<AuthModalRoute mode="register" />} />
				<Route path="/verify-email" element={<AuthModalRoute mode="verify" />} />
			</Routes>
		</BrowserRouter>
	)
}
