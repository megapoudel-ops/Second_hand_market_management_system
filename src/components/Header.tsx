interface HeaderProps {
    title: string;
    subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
    return (
        <header className="text-left">
            <h1 className="text-4xl font-semibold">{title}</h1>
            <h2 className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: subtitle }} />
        </header>
    );
};

export default Header;