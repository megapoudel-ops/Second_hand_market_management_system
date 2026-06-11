import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Laptops from "../pages/Laptops";
import LaptopDetail from "../pages/LaptopDetail";
import Payments from "../pages/Payments";
import CreateListing from "../pages/CreateListing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Auth from "../pages/Auth";
import Books from "../pages/Books";
import BookDetail from "../pages/BookDetail";
import Cart from "../pages/Cart";
import Notifications from "../pages/Notifications";
import NotFound from "../pages/NotFound";
import Furniture from "../pages/Furniture";
import Profile from "../pages/Profile";
import AiColorPalette from "../pages/AIColorPalette";
import AIDamageDetection from "../pages/AIDamageDetection";
import AboutUs from "../pages/AboutUs";
import Messages from "../pages/Messages";
import SecuritySettings from "../pages/SecuritySettingspage";
import FAQChatbot from "../pages/FAQChatbot";
import MyListings from "../pages/MyListings";
import ListingDetail from "../pages/ListingDetail";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/laptops" element={<Laptops />} />
      <Route path="/laptops/:id" element={<LaptopDetail />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="/create-listing" element={<CreateListing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/books" element={<Books />} />
      <Route path="/books/:id" element={<BookDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/furniture" element={<Furniture />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/my-listings" element={<MyListings />} />
      <Route path="/listings/:id" element={<ListingDetail />} />
      <Route path="/ai-color-palette" element={<AiColorPalette />} />
      <Route path="/ai-damage-detection" element={<AIDamageDetection />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/faq" element={<FAQChatbot />} />
      <Route path="/settings/security" element={<SecuritySettings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}