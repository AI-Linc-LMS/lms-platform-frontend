// import EnrolledLeaderBoard from "./EnrolledLeader";

const DashboardPieChart = () => {
    return (
        <div className="flex flex-col gap-4 items-center justify-center">
            <div className="w-[445px] rounded-3xl bg-[#EFF9FC] border border-[#80C9E0] p-4 shadow-sm">
                <h1 className="font-sans text-[18px] text-[#343A40]">Dashboard</h1>
                <p className="text-[#495057] font-normal text-[12px] font-sans">A simple overview of your status</p>
                <div className="w-full mx-auto h-[62px] bg-[#DEE2E6] rounded-xl flex flex-row items-center justify-center p-4  gap-4 mt-3">
                    <div>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5C12.1421 0.5 15.5 3.85786 15.5 8ZM8 12.3125C8.31065 12.3125 8.5625 12.0606 8.5625 11.75V7.25C8.5625 6.93935 8.31065 6.6875 8 6.6875C7.68935 6.6875 7.4375 6.93935 7.4375 7.25V11.75C7.4375 12.0606 7.68935 12.3125 8 12.3125ZM8 4.25C8.41423 4.25 8.75 4.58579 8.75 5C8.75 5.41421 8.41423 5.75 8 5.75C7.58577 5.75 7.25 5.41421 7.25 5C7.25 4.58579 7.58577 4.25 8 4.25Z" fill="#6C757D" />
                        </svg>

                    </div>
                    <div>
                        <p className="text-[10px] font-medium font-sans text-[#6C757D]">Check out this awesome visual that shows exactly how far you've come in your course! It's like a fun map of your progress!</p>
                    </div>

                </div>
            </div>
            {/* <EnrolledLeaderBoard/> */}
        </div>

    );
};

export default DashboardPieChart;