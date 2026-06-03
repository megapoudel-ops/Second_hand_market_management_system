type FeatureItemProps = {
  icon: string;
  title: string;
  alt: string;
};

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, alt }) => {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <img
        src={icon}
        alt={title}
        className="w-8 h-8 object-contain"
      />
      <h3 className="text-2xl">{alt}</h3>
      <p className="text-gray-500 text-sm">{title}</p>
    </div>
  );
};

export default FeatureItem;