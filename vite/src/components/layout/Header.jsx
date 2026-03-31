import React from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingCart, ChevronDown } from 'lucide-react'
import logo from '../../assets/marketu-logo.png'

const Header = () => {
  return (
    <div>
      <div className="w-full h-[0.5cm] bg-[#4B187C]" />
      <header className="w-full bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-row items-center justify-between gap-4 text-gray-900">
          {/* logo + text */}
          <Link to="/home" className="flex items-center gap-2 min-w-fit">
            <img src={logo} alt="marketU" className="h-8" />
            <span className="font-bold text-2xl text-[#4B187C]">marketU</span>
          </Link>

          {/* primary links (desktop only) */}
          <nav className="hidden md:flex items-center gap-6 font-medium">
            <button className="flex items-center gap-1 hover:underline">
              Categorias <ChevronDown className="w-4 h-4" />
            </button>
           
          </nav>

          {/* search input */}
          <div className="w-full max-w-xl focus-within:max-w-3xl mx-auto bg-gray-100 rounded-full py-2 px-6 border border-gray-200 transition-all duration-300 flex items-center gap-2">
            <Search className="text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="w-full bg-transparent outline-none text-sm text-gray-600 placeholder:text-gray-400"
            />
          </div>

          {/* user actions */}
          <div className="flex items-center md:flex gap-5">
            <Link to="/profile" className="text-sm hover:text-gray-900 text-gray-600">
              Meu Perfil
            </Link>
            <Link
              to="/sell"
              className="bg-[#4B187C] text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-[#3E1367]"
            >
              Vender
            </Link>
            <ShoppingCart className="w-6 h-6 text-gray-700 cursor-pointer hover:text-gray-900" />
          </div>
        </div>
      </header>
    </div>
  )
}

export default Header