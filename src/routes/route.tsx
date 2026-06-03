import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Laptops from "../pages/Laptops";
import Payments from "../pages/Payments";
import CreateListing from "../pages/CreateListing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Books from "../pages/Books";
import Cart from "../pages/Cart";
import Notifications from "../pages/Notifications";
import NotFound from "../pages/NotFound";
import Furniture from "../pages/Furniture";
import Profile from "../pages/Profile";
import AiColorPalette from "../pages/AIColorPalette";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/laptops" element={<Laptops />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="/create-listing" element={<CreateListing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/books" element={<Books />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/furniture" element={<Furniture />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/ai-color-palette" element={<AiColorPalette />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
