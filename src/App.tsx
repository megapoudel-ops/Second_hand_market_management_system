import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/route";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { CartProvider } from "./context/CartContext";
import FloatingButton from "./components/FloatingButton";

function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="xl:w-7xl w-full mx-auto flex-1 flex flex-col w-full">
        <Navbar />
        <div className="flex-1">
          <AppRoutes />
        </div>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Layout />
        <FloatingButton />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;