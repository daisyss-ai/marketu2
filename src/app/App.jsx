import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./home/Home";
import Landing from "./landing/Landing";
import Enter from "./landing/Enter";
import Login from "./landing/Login";
import Signup from "./landing/Signup";
import Recover from "./landing/Recover";
import RequireAuth from "./components/RequireAuth";
import Profile from "./home/Profile";
import Sell from "./home/Sell";
import ProductPage from "./home/ProductPage";
import Recommendations from "./home/Recommendations";
import CategoriesPage from "./home/CategoriesPage";
import ChatPage from "./home/ChatPage";

function App() {
  console.log('App component rendering');
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route path="/enter" element={<Enter />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/recover" element={<Recover />} />
        <Route path="/landing" element={<Landing />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/sell"
          element={
            <RequireAuth>
              <Sell />
            </RequireAuth>
          }
        />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
