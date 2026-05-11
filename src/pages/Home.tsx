import HeroImage from "../assets/hero-image.jpg"
import FeatureItem from "../components/Home/FeatureItem"
import VerifiedImage from "../assets/verified.png"
import DeliveryImage from "../assets/delivery.png"
import SecureImage from "../assets/secure.png"
import RecycleImage from "../assets/recycle.png"
import SofaImage from "../assets/sofa.jpg"
import BooksImage from "../assets/books.png"
import LaptopImage from "../assets/laptop.png"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import ImageCard from "../components/Home/ImageCard"

const Home = () => {
  const FeatureImages = [
    { icon: VerifiedImage, alt: "15+ Point", title: "Quality Inspection" },
    { icon: DeliveryImage, alt: "48-Hour", title: "Fast Shipping" },
    { icon: SecureImage, alt: "Protected", title: "Secure Transactions" },
    { icon: RecycleImage, alt: "1.2M kg", title: "Waste Prevented" },
  ]

  return (
    <div className="w-full px-6 xl:px-0">

      {/* Hero + Features Wrapper */}
      <div className="flex flex-col gap-20 xl:min-h-screen xl:justify-center">

        {/* Hero Section */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-12 mt-10 xl:mt-0">

          {/* Left Content */}
          <div className="flex flex-col items-start gap-5 xl:w-1/2 w-full">
            <h3 className="text-(--primary-color) font-medium uppercase tracking-widest text-xs sm:text-sm">
              sustainable commerce
            </h3>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-semibold leading-tight">
              Give Tech and Home a{" "}
              <span className="text-(--primary-color)">
                Second
              </span>{" "}
              Life.
            </h1>

            <p className="text-neutral-600 text-sm sm:text-base max-w-xl leading-relaxed">
              A curated marketplace for pre-owned premium goods.
              Verified quality, fluid payments, and the efficiency
              of modern trade.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
              <Link
                to="/laptops"
                className="bg-green-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                Explore Marketplace
              </Link>

              <Link
                to="/"
                className="text-(--primary-color) text-sm font-medium flex items-center gap-2"
              >
                Learn More
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="xl:w-1/2 w-full flex justify-center">
            <img
              className="w-full h-72 sm:h-96 xl:h-128 object-cover rounded-3xl xl:rotate-3"
              src="https://images.unsplash.com/photo-1565630916779-e303be97b6f5?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Hero"
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 w-full">
          {FeatureImages.map((feature, index) => (
            <FeatureItem
              key={index}
              {...feature}
            />
          ))}
        </div>
      </div>

      {/* Shop By Category */}
      <div className="flex flex-col items-start gap-8 mt-20">

        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between w-full gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold">
              Shop By Category
            </h1>

            <h5 className="text-gray-600 text-sm sm:text-base mt-2">
              Expertly curated collections for your lifestyle.
            </h5>
          </div>

          <Link
            to="/categories"
            className="font-medium flex items-center gap-2 text-(--primary-color) text-sm"
          >
            View All Categories
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Category Cards */}
        <div className="flex flex-col xl:flex-row items-stretch gap-4 w-full">
          <ImageCard
            href="/laptops"
            title="Laptops"
            description="Performance meets value. MacBook, ThinkPad, and Dell Precision models."
            buttonText="Shop Now"
            image={LaptopImage}
            className="xl:w-2/3 w-full"
          />

          <ImageCard
            href="/books"
            title="Books"
            description="Timeless Knowledge."
            buttonText="Browse"
            image={BooksImage}
            className="xl:w-1/3 w-full"
          />
        </div>

        <ImageCard
          href="/furniture"
          title="Furniture"
          description="Designer pieces for the conscious home. Sofas, desks, and storage."
          buttonText="Shop Collection"
          image={SofaImage}
          className="w-full h-72 sm:h-96 mb-12"
        />
      </div>
    </div>
  )
}

export default Home