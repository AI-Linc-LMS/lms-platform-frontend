export default function LeaderboardUI() {
    return (
      <div className="max-w-md mx-auto p-6 bg-gray-100 rounded-3xl">
        <div className="mb-4">
          <h1 className="text-4xl font-medium text-gray-800">Track Your Progress</h1>
          <p className="text-gray-500 text-xl mt-2">keep grinding and stay top on our leaderboard</p>
        </div>
  
        <div className="bg-white rounded-2xl overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-4 px-6 text-left text-gray-700 font-medium text-xl">Standing</th>
                <th className="py-4 px-6 text-left text-gray-700 font-medium text-xl">Name</th>
                <th className="py-4 px-6 text-left text-gray-700 font-medium text-xl">Course Name</th>
                <th className="py-4 px-6 text-right text-gray-700 font-medium text-xl">Marks</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-6 px-6 text-gray-600 text-xl">#1</td>
                <td className="py-6 px-6 text-gray-600 text-xl">Shane</td>
                <td className="py-6 px-6 text-gray-600 text-xl">UI/UX Designer</td>
                <td className="py-6 px-6 text-right text-gray-600 text-xl">1200</td>
              </tr>
              <tr className="border-b">
                <td className="py-6 px-6 text-gray-600 text-xl">#2</td>
                <td className="py-6 px-6 text-gray-600 text-xl">Wade</td>
                <td className="py-6 px-6 text-gray-600 text-xl">UI/UX Designer</td>
                <td className="py-6 px-6 text-right text-gray-600 text-xl">800</td>
              </tr>
              <tr className="border-b">
                <td className="py-6 px-6 text-gray-600 text-xl">#3</td>
                <td className="py-6 px-6 text-gray-600 text-xl">Darrell</td>
                <td className="py-6 px-6 text-gray-600 text-xl">UI/UX Designer</td>
                <td className="py-6 px-6 text-right text-gray-600 text-xl">765</td>
              </tr>
              <tr className="border-b">
                <td className="py-6 px-6 text-gray-600 text-xl">#4</td>
                <td className="py-6 px-6 text-gray-600 text-xl">Dustin</td>
                <td className="py-6 px-6 text-gray-600 text-xl">UI/UX Designer</td>
                <td className="py-6 px-6 text-right text-gray-600 text-xl">660</td>
              </tr>
              <tr className="border-b">
                <td className="py-6 px-6 text-gray-600 text-xl">#5</td>
                <td className="py-6 px-6 text-gray-600 text-xl">Marvin</td>
                <td className="py-6 px-6 text-gray-600 text-xl">UI/UX Designer</td>
                <td className="py-6 px-6 text-right text-gray-600 text-xl">520</td>
              </tr>
              <tr className="bg-blue-50">
                <td className="py-6 px-6 text-gray-600 text-xl">#8</td>
                <td className="py-6 px-6 text-gray-600 text-xl">You</td>
                <td className="py-6 px-6 text-gray-600 text-xl">UI/UX Designer</td>
                <td className="py-6 px-6 text-right text-gray-600 text-xl">358</td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div className="bg-gray-200 rounded-2xl p-4 flex items-start gap-4">
          <div className="bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm">i</span>
          </div>
          <p className="text-gray-500 text-lg">
            As you complete modules you will move top of the leaderboard and earn exciting rewards.
          </p>
        </div>
      </div>
    )
  }
  
  