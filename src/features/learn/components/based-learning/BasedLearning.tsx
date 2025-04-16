const BasedLearning = () => {
    return (
        <div className="flex flex-row items-center justify-between w-full my-4 ">
            <div>

                <h1 className="text-[#343A40] font-bold text-[22px] font-sans ">
                    Based On Your Learning
                </h1>
                <p className="text-[#6C757D] font-sans font-normal text-[18px]">
                    Based on your learnings we think your might like this courses below.
                </p>
            </div>
            <div>
                <button className="w-[95px] h-[55px] rounded-xl border border-[#2A8CB0] text-[15px] font-medium font-sans text-[#2A8CB0]">
                    See all
                </button>
            </div>

        </div>
    );
};

export default BasedLearning;