import React from 'react'

const ProdutCat = () => {
  return (
    <div>
        <div className="flex gap-4  md:justify-center py-4 px-4  items-center">
          {["Default", "Eletrónicos", "Moda", "Casa", "Lazer", "Outros"].map((cat, index) => (
            <button 
              key={index}
              className={`${
                index === 0 ? "bg-[#FF7A7A]" : "bg-[#FF7A7A] opacity-90"
              } text-white px-5 py-2 rounded-full text-sm font-medium cursor-pointer active:scale-95 transition-transform `}
            >
              {cat}
            </button>
          ))}
        </div>
      
      </div>
  )
}

export default ProdutCat