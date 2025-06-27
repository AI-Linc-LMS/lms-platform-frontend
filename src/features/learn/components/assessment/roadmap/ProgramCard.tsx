import PaymentCardSection from "./PaymentCard";
import cube from "../../../../../assets/roadmap/rectangle.png";
import triangle from "../../../../../assets/roadmap/triangle.png";
import { ScholarshipRedemptionData } from "../types/assessmentTypes";

const GreenTick: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    className="inline-block align-middle"
  >
    <circle cx="10" cy="10" r="10" fill="#22c55e" />
    <path
      d="M6 10.5l3 3 5-5"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProgramCard: React.FC<{
  redeemData: ScholarshipRedemptionData;
  clientId: number;
  assessmentId: string;
}> = ({ redeemData, clientId, assessmentId }) => (
  <div className="w-full flex flex-col gap-8 my-10">
    {/* Nanodegree Card */}
    <div className="flex flex-col md:flex-row items-center bg-gradient-to-br from-[#f8fcfc] to-[#eafff6] rounded-3xl px-8 shadow-sm border border-gray-200">
      <div className="flex-1 min-w-[300px]">
        <div className="">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold mb-2">
            Your Learning Hub
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-[#264D64] mb-4">
          AI Linc Nanodegree Program
        </h2>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="video">
              🎥
            </span>{" "}
            Video Lectures on AI, MERN & More
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="quiz">
              ❓
            </span>{" "}
            Auto-evaluated Quizzes & Coding Tests
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="articles">
              📄
            </span>{" "}
            Curated Articles & Case Studies
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="progress">
              📈
            </span>{" "}
            Track Your Progress in Real-Time
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="career">
              💼
            </span>{" "}
            Career Support + Weekly Live Mentorship
          </li>
        </ul>
        <div className="flex flex-col md:flex-row gap-4 mt-4 text-sm">
          <button className="bg-[#255C79] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow hover:bg-[#1a4a5f] transition-colors">
            🚀 21-Day No-Code AI Sprint
          </button>
          <button className="bg-[#0e7490] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow hover:bg-[#155e75] transition-colors">
            🟢 90-Day Work Experience
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center mt-8 md:mt-0">
        <div className="relative left-20 top-4">
          <img
            src={cube}
            alt="Cube"
            className="w-104 h-104 object-contain rounded-2xl"
          />
        </div>
      </div>
    </div>
    {/* Career Launchpad Card */}
    <div className="flex flex-col md:flex-row items-center bg-gradient-to-br from-[#fffbe6] to-[#fffde6] rounded-3xl px-8 shadow-sm border border-gray-200">
      <div className="flex-1 min-w-[300px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-semibold">
            Mentorship · Referrals · Career-Ready
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-[#264D64] mb-4">
          AI Linc Flagship Career Launchpad
        </h2>
        <div className="mb-2">
          <span className="inline-block px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold mb-2">
            Everything in Nanodegree
          </span>
        </div>
        <ul className="space-y-2 mb-6 mt-2">
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="referrals">
              🌐
            </span>{" "}
            Get Referrals to Top Companies (Google, Amazon, etc.)
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="resume">
              🧑‍💼
            </span>{" "}
            AI + Mentor-Led Resume Reviews
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="portfolio">
              💼
            </span>{" "}
            Build a Winning Tech Portfolio
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="interviews">
              📝
            </span>{" "}
            Behavioral & Technical Mock Interviews
          </li>
        </ul>
        <div className="flex flex-col md:flex-row gap-4 mt-4 text-sm">
          <button className="bg-yellow-700 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow hover:bg-yellow-600 transition-colors">
            🧑‍💻 21-Day Guided No-Code Build
          </button>
          <button className="bg-yellow-700 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow hover:bg-yellow-800 transition-colors">
            ✅ 90-Day MAANG PM Work Experience
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center mt-8 md:mt-0">
        <div className="relative left-10 top-5">
          <img
            src={triangle}
            alt="Yellow Shape"
            className="w-94 h-94 object-contain"
          />
        </div>
      </div>
    </div>
    {/* Comparison Table */}
    <h3 className="text-2xl font-bold text-center text-[#14212B] mt-16">
      Let's Compare both the Program
    </h3>
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 overflow-x-auto mt-4">
      <table className="w-full text-left text-sm border-collap">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-1 font-semibold text-gray-700 border-b border-r border-gray-200">
              Features
            </th>
            <th className="px-6 py-1 font-semibold text-gray-700 border-b border-r border-gray-200">
              AI Linc Nanodegree Program
            </th>
            <th className="px-6 py-1 font-semibold text-gray-700 border-b border-gray-200">
              AI Linc Flagship Career Launchpad
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-80">
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              All Platform Content (videos, quizzes, etc.)
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Auto-evaluated Assignments & Reports
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              21-Day No-Code Build
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              90-Day Guided Work Experience
            </td>
            <td className="px-6 py-1 items-center gap-1 border-gray-200">
              <GreenTick />
              <span className="font-semibold text-xs ml-1 border-gray-200">
                (Led by tech pro)
              </span>
            </td>
            <td className="px-6 py-1 border-l gap-1 border-gray-200">
              <GreenTick />
              <span className="font-semibold text-xs ml-1 border-gray-200">
                (Led by MAANG PM)
              </span>
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Weekly Mentor Session
            </td>
            <td className="px-6 py-1 border-r gap-1 border-gray-200">
              <GreenTick />
              <span className="font-semibold text-xs ml-1 ">(1 per week)</span>
            </td>
            <td className="px-6 py-1 flex items-center gap-1 border-gray-200">
              <GreenTick />
              <span className="font-semibold text-xs ml-1">
                (Multiple per week with Experts)
              </span>
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Lifetime Platform Access
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              AI Job Portal Access
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              AI Resume Review
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Portfolio Support
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Direct Hiring Partner Referrals
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Live Sessions by MAANG Professionals
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr>
            <td className="px-6 py-1 border-r border-gray-200">
              Mock Interview Prep
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    {/* How to Choose Section */}
    <div className="w-full flex flex-col md:flex-row mt-10 mb-2 px-45 gap-6">
      <div className="md:items-start">
        <h4 className="text-lg font-bold text-[#14212B] mb-2">
          How to Choose?
        </h4>
      </div>
      <div className="flex-1 bg-green-50 rounded-2xl p-6 flex flex-col items-center md:items-start border border-green-100">
        <span className="text-xl font-bold text-green-700 mb-1">
          Go for Nanodegree
        </span>
        <span className="text-gray-700">
          If you want structured learning + real experience at your own pace.
        </span>
      </div>
      <div className="flex-1 bg-yellow-50 rounded-2xl p-6 flex flex-col items-center md:items-start border border-yellow-100">
        <span className="text-xl font-bold text-yellow-700 mb-1">
          Go for Flagship
        </span>
        <span className="text-gray-700">
          If you're ready to be placed, mentored by top tech leaders, and Need
          personal branding
        </span>
      </div>
    </div>
    <PaymentCardSection
      redeemData={redeemData as ScholarshipRedemptionData}
      clientId={clientId}
      assessmentId={assessmentId}
    />
  </div>
);

export default ProgramCard;
