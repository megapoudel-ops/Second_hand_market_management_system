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
    <div className="w-full">
      <div className="h-screen flex flex-col justify-center gap-36">

        {/* Hero Section */}
        <div className='flex items-center justify-between w-full gap-12'>
          <div className="flex flex-col items-start gap-4">
            <h3 className="text-(--primary-color) font-medium uppercase tracking-widest text-sm">
              sustainable commerce
            </h3>
            <h1 className="text-4xl font-semibold">
              Give Tech and Home a <span className="text-(--primary-color)">Second</span> Life.
            </h1>
            <p className="text-neutral-600 text-sm">
              A curated marketplace for pre-owned premium goods. Verified quality, fluid payments, and the efficiency of modern trade.
            </p>
            <div className="flex items-center gap-2">
              <button></button>
            </div>
          </div>
          <div className="mt-12 w-1/2">
            <img
              className="w-full h-104 object-cover rounded-3xl rounded-r-none rotate-3"
              src={HeroImage}
              alt="Laptop Image"
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="flex items-center justify-between">
          {FeatureImages.map((feature, index) => (
            <FeatureItem
              key={index}
              {...feature}
            />
          ))}
        </div>
      </div>

      {/* Shop By Category */}
      <div className="flex flex-col items-start gap-6">
        <h1 className="text-3xl font-medium">Shop By Category</h1>
        <div className="flex items-center justify-between w-full text-sm">
          <h5 className="text-gray-600 -mt-5">
            Expertly curated collections for your lifestyle.
          </h5>

          <Link to={'/categories'}
            className="font-medium flex items-center gap-2 text-(--primary-color)"
          >
            View All Categories
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="flex items-center gap-4 w-full">
          <ImageCard
            href="/laptops"
            title="Laptops"
            description="Performance meets value. Macbook, ThinkPad, and Dell Precision models."
            buttonText="Shop Now"
            image={LaptopImage}
            className="w-2/3"
          />
          <ImageCard
            href="/books"
            title="Books"
            description="Timeless Knowledge."
            buttonText="Browse"
            image={BooksImage}
            className="w-1/3"
          />
        </div>

        <ImageCard
          href="/furniture"
          title="Furniture"
          description="Designer peices for the conscious home. Sofas, desks, and storage."
          buttonText="Shop Collection"
          image={SofaImage}
          className="w-full h-64 mb-18"
        />
      </div>
    </div>
  )
}

export default Home