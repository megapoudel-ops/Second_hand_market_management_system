import { Link } from 'react-router-dom';

const AboutUs = () => {
  const books = [
    {
      id: 1,
      title: "Atomic Habits",
      image: "https://cultivatewhatmatters.com/cdn/shop/articles/atomic-habits.jpg?v=1624827508",
    },
    {
      id: 2,
      title: "The Art of Seduction",
      image: "https://static-01.daraz.com.np/p/8e2dd76b6e94043075c53a7fca216779.jpg",
    },
    {
      id: 3,
      title: "The Art Of War",
      image: "https://www.bookgeeks.in/wp-content/uploads/2022/11/The-Art-of-War-by-Sun-Tzu-Book.jpg",
    },
    {
      id: 4,
      title: "It Starts With US",
      image: "https://udreview.com/wp-content/uploads/2023/10/it-starts-with-us-EMILY-MATEJA-1024x683.jpeg",
    },
  ];

  const laptops = [
    {
      id: 1,
      title: 'MacBook Pro 14" M3',
      image: "https://sm.mashable.com/mashable_sea/review/m/m3-macbook/m3-macbook-pro-14-inch-review-why-you-should-buy-this-apple_r785.jpg",
    },
    {
      id: 2,
      title: "Dell XPS 15 9530",
      image: "https://sm.pcmag.com/t/pcmag_au/review/d/dell-xps-1/dell-xps-15-9530-2023_6h7m.1920.jpg",
    },
    {
      id: 3,
      title: "ASUS ROG Zephyrus G14",
      image: "https://www.pcworld.com/wp-content/uploads/2025/04/G14_edited1.jpg?quality=50&strip=all",
    },
    {
      id: 4,
      title: "Lenovo ThinkPad X1 Carbon",
      image: "https://cdn.mos.cms.futurecdn.net/NEjTSZHivorAaAwbqtf3pf.jpg",
    },
  ];

  const furniture = [
    {
      id: 1,
      title: "Aeron-Style Task Chair",
      image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Scandi Oak Workstation",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 3,
      title: "Helix Brass Floor Lamp",
      image: "https://images.squarespace-cdn.com/content/v1/65cabb74f8143c0156bd41ce/6567cdd4-09c3-4386-b508-c95cfe6dad8f/Helix+Floor+Pink_20130729444_extended+background-web.jpg",
    },
    {
      id: 4,
      title: "Orbital Side Table",
      image: "https://tomschneider.co.uk/cdn/shop/files/Orbitbedside_table_Walnut_tom_schneider-04_7dee3cef-25e5-4063-b6d1-7858656d82b8.jpg?v=1723189476",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Second Sync is your trusted marketplace for pre-owned electronics, books, and furniture. 
            We believe in giving quality products a second life while providing affordable options to our customers.
          </p>
        </div>
      </div>

      {/* Books Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Premium Books</h2>
            <Link to="/books" className="text-blue-600 hover:text-blue-800 font-semibold">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {books.map((book) => (
              <div key={book.id} className="group cursor-pointer">
                <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-700 font-medium truncate">{book.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Laptops Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Premium Laptops</h2>
            <Link to="/laptops" className="text-blue-600 hover:text-blue-800 font-semibold">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {laptops.map((laptop) => (
              <div key={laptop.id} className="group cursor-pointer">
                <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                  <img
                    src={laptop.image}
                    alt={laptop.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-700 font-medium truncate">{laptop.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Furniture Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Premium Furniture</h2>
            <Link to="/furniture" className="text-blue-600 hover:text-blue-800 font-semibold">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {furniture.map((item) => (
              <div key={item.id} className="group cursor-pointer">
                <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-700 font-medium truncate">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Find Your Next Great Deal?</h2>
          <p className="text-gray-600 mb-6">Explore our collection and save on quality pre-owned items.</p>
          <Link
            to="/laptops"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
