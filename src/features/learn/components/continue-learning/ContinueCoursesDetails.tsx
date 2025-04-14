import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import { CodeIcon, DocumentIcon, FAQIcon, VideoIcon } from "../../../../commonComponents/icons/learnIcons/CourseIcons";

const ContinueCoursesDetails = ({ progress = 20 }: { progress?: number }) => {
  return (
    <div className="flex flex-row gap-4 items-center justify-between">
      <div className="w-full border-[#80C9E0] rounded-[22px] border-[1px] bg-[#F8F9FA] p-4 mt-4">
        <div className="flex flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="font-bold text-[#343A40] text-[22px] font-sans">
              Data Analytics
            </h1>
            <p className="font-sans font-normal text-[18px] text-[#495057]">
              Lorem ipsum dolor sit amet.
            </p>
          </div>

          <div className="flex flex-row gap-3 items-center ">
            <div className="w-16 h-16 rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center gap-3">
              <VideoIcon />
              <p className="font-medium font-sans text-[13px] text-[#495057]">
                25/52
              </p>
            </div>
            <div className="w-16 h-16 rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center gap-3">
              <DocumentIcon />
              <p className="font-medium font-sans text-[13px] text-[#495057]">
                25/52
              </p>
            </div>
            <div className="w-16 h-16 rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center gap-3">
              <CodeIcon />
              <p className="font-medium font-sans text-[13px] text-[#495057]">25/54</p>
            </div>
            <div className="w-16 h-16 rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center gap-3">
              <FAQIcon />
              <p className="font-medium font-sans text-[13px] text-[#495057]">25/54</p>
            </div>
          </div>
        </div>
        <div className="w-[60px] h-[40px] rounded-xl bg-[#DEE2E6] flex  items-center justify-center my-4">
          <p className="font-sans font-medium text-[13px] text-[#343A40]">
            Pro
          </p>
        </div>
        <div className="w-full bg-[#e9eaec] rounded-xl h-[75px] flex flex-row items-center justify-between p-4 my-5">
          <div>
            <h1 className="font-sans font-medium text-[13px] text-[#343A40]">
              Module 12/28
            </h1>
            <p className="text-[13px] font-sans text-[#495057] font-normal">
              Introduction to data analytics{" "}
            </p>
          </div>
          <div>
            <h1 className="font-sans font-medium text-[13px] text-[#343A40] mb-2">
              {progress}/100 completed
            </h1>
            <div className="w-[320px] bg-gray-300 rounded-full h-2.5">
              <div
                className="bg-[#5FA564] h-2.5 rounded-full"
                style={{ width: `${progress}%` }} // Dynamically set the width based on progress
              ></div>
            </div>
          </div>
        </div>
        <PrimaryButton onClick={() => console.log("continue Button Clicked")}>
          Continue
        </PrimaryButton>
      </div>
      <div className="w-full border-[#80C9E0] rounded-[22px] border-[1px] bg-[#F8F9FA] p-4 mt-4">
        <div className="flex flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="font-bold text-[#343A40] text-[22px] font-sans">
              Introduction to UI / UX
            </h1>
            <p className="font-sans font-normal text-[18px] text-[#495057]">
              Lorem ipsum dolor sit amet.
            </p>
          </div>

          <div className="flex flex-row gap-3 items-center ">
            <div className="w-16 h-16 rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center gap-3">
              <VideoIcon />
              <p className="font-medium font-sans text-[13px] text-[#495057]">
                25/52
              </p>
            </div>
            <div className="w-16 h-16 rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center gap-3">
              <DocumentIcon />
              <p className="font-medium font-sans text-[13px] text-[#495057]">
                25/52
              </p>
            </div>
            <div className="w-16 h-16 rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center gap-3">
              <CodeIcon />
              <p className="font-medium font-sans text-[13px] text-[#495057]">25/54</p>
            </div>
            <div className="w-16 h-16 rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center gap-3">
              <FAQIcon />
              <p className="font-medium font-sans text-[13px] text-[#495057]">25/54</p>
            </div>
          </div>
        </div>
        <div className="w-[95px] h-[40px] rounded-xl bg-[#DEE2E6] flex  items-center justify-center my-4">
          <p className="font-sans font-medium text-[13px] text-[#343A40]">
            Beginner
          </p>
        </div>
        <div className="w-full bg-[#e9eaec] rounded-xl h-[75px] flex flex-row items-center justify-between p-4 my-5">
          <div>
            <h1 className="font-sans font-medium text-[13px] text-[#343A40]">
              Module 12/28
            </h1>
            <p className="text-[13px] font-sans text-[#495057] font-normal">
              Introduction to data analytics{" "}
            </p>
          </div>
          <div>
            <h1 className="font-sans font-medium text-[13px] text-[#343A40] mb-2">
              {progress}/100 completed
            </h1>
            <div className="w-[320px] bg-gray-300 rounded-full h-2.5">
              <div
                className="bg-[#5FA564] h-2.5 rounded-full"
                style={{ width: `${progress}%` }} // Dynamically set the width based on progress
              ></div>
            </div>
          </div>
        </div>
        <PrimaryButton onClick={() => console.log("continue Button Clicked")}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
};

export default ContinueCoursesDetails;
