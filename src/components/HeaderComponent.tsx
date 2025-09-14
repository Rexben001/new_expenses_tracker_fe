export const HeaderComponent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2 w-full">
      {children}
    </div>
  );
};

