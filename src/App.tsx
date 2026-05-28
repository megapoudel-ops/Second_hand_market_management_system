import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/route";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { CartProvider } from "./context/CartContext";
import FloatingButton from "./components/FloatingButton";

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="xl:w-7xl w-full mx-auto">
          <Navbar />
          <AppRoutes />
          <Footer />
        </div>
        <FloatingButton />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
