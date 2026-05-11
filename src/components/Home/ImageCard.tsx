import { Link } from "react-router-dom";

type CategoryCardProps = {
  title: string;
  description: string;
  buttonText: string;
  image: string;
  className?: string;
  href?: string;
};

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  description,
  buttonText,
  image,
  href,
  className
}) => {
  return (
    <div
      className={`relative rounded-xl overflow-hidden h-56 flex items-center p-6 text-white ${className}`}
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 max-w-md">
        <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-gray-200 mt-1">{description}</p>

        <button className="mt-4 cursor-pointer bg-white text-black text-sm px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition">
          <Link to={href || "#"}>{buttonText}</Link>
        </button>
      </div>
    </div>
  );
};

export default CategoryCard;