'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Link as ScrollLink } from 'react-scroll';
import { AiOutlineMenu } from 'react-icons/ai';

const Navbar = () => {
  const [menu, setMenu] = useState(false);

  const handleNav = () => {
    setMenu(!menu);
  };

  return (
    <div>
      <div className="flex flex-row justify-between p-5 md:px-32 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
        <div>
          <Link href="/" className="font-semibold text-2xl p-1 cursor-pointer">
            marketU
          </Link>
        </div>
        <nav className="hidden md:flex gap-5 font-medium p-1 cursor-pointer">
          <ScrollLink to="home" spy={true} smooth={true} duration={500} className="hover:text-purple-700">
            Home
          </ScrollLink>
          <ScrollLink to="Sobre" spy={true} smooth={true} duration={500} className="hover:text-purple-700">
            Sobre
          </ScrollLink>
          <ScrollLink to="Produtos" spy={true} smooth={true} duration={500} className="hover:text-purple-700">
            Produtos
          </ScrollLink>
          <ScrollLink to="Contacto" spy={true} smooth={true} duration={500} className="hover:text-purple-700">
            Contacte-nos
          </ScrollLink>
          <Link href="/login" className="hover:text-purple-700">
            Entrar
          </Link>
          <Link href="/signup" className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">
            Criar conta
          </Link>
        </nav>

        <div className="flex md:hidden" onClick={handleNav}>
          <div className="p-2">
            <AiOutlineMenu size={22} className="md:hidden cursor-pointer" />
          </div>
        </div>
      </div>

      <div
        className={`${
          menu ? 'translate-x-0 ' : 'translate-x-full'
        } md:hidden flex flex-col absolute bg-white left-0 top-20 font-medium text-2xl text-center pt-8 pb-4 gap-8 w-full h-fit transition-transform duration-300`}
      >
        <ScrollLink to="home" spy={true} smooth={true} duration={500} onClick={handleNav} className="hover:text-purple-700">
          Home
        </ScrollLink>
        <ScrollLink to="Sobre" spy={true} smooth={true} duration={500} onClick={handleNav} className="hover:text-purple-700">
          Sobre
        </ScrollLink>
        <ScrollLink to="Produtos" spy={true} smooth={true} duration={500} onClick={handleNav} className="hover:text-purple-700">
          Produtos
        </ScrollLink>
        <ScrollLink to="Contacto" spy={true} smooth={true} duration={500} onClick={handleNav} className="hover:text-purple-700">
          Contacte-nos
        </ScrollLink>
        <Link href="/login" onClick={handleNav} className="hover:text-purple-700">
          Entrar
        </Link>
        <Link
          href="/signup"
          onClick={handleNav}
          className="bg-purple-600 text-white px-3 py-1 rounded mx-4 hover:bg-purple-700"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
