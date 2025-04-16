interface CategoryBadgeProps {
  category: string;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const width = category === 'Pro' ? 'w-[60px]' : 'w-[95px]';
  
  return (
    <div className={`${width} h-[40px] rounded-xl bg-[#DEE2E6] flex items-center justify-center`}>
      <p className="font-sans font-medium text-[13px] text-[#343A40]">
        {category}
      </p>
    </div>
  );
};

export default CategoryBadge; 